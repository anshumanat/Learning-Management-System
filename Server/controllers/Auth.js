const bcrypt = require("bcrypt")
const User = require("../models/User")
const OTP = require("../models/OTP")
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")
require("dotenv").config()


// Signup Controller for Registering USers

exports.signup = async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body
    // Check if All Details are there or not
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      })
    }
    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      })
    }

    // Find the most recent OTP for the email
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
    console.log(response)
    if (response.length === 0) {
      // OTP not found for the email
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      })
    } else if (otp !== response[0].otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    let approved = accountType === "Instructor" ? false : true;


    // Create the Additional Profile For User
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    })
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType: accountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: "",
    })

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    })
  }
}

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body
    let forwardedFor = req.header("X-Forwarded-For");
    let myIP = forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;
    console.log("IP of User", myIP);

    // Check if email or password is missing
    if (!email || !password) {
      // Return 400 Bad Request status code with error message
      return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      })
    }

    // Find user with provided email
    const user = await User.findOne({ email }).populate("additionalDetails")

    // If user not found with provided email
    if (!user) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      })
    }

    // Generate JWT token and Compare Password
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user._id, accountType: user.accountType},
        process.env.JWT_SECRET,
        {
          expiresIn: "24h",
        }
      )

      // Save token to user document in database
      user.token = token
      user.password = undefined
      // Set cookie for token and return success response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      }
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      })
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      })
    }
  } catch (error) {
    console.error(error)
    // Return 500 Internal Server Error status code with error message
    return res.status(500).json({
      success: false,
      message: `Login Failure Please Try Again`,
    })
  }
}
// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await User.findOne({ email })
    // to be used in case of signup

    // If user found with provided email
    if (checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      })
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    })
    const result = await OTP.findOne({ otp: otp })
    console.log("Result is Generate OTP Func")
    console.log("OTP", otp)
    console.log("Result", result)
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      })
      result = await OTP.findOne({ otp: otp })
    }
    const otpPayload = { email, otp }
    const otpBody = await OTP.create(otpPayload)
    console.log("OTP Body", otpBody)
    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id)

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    )
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" })
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10)
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    )

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      )
      console.log("Email sent successfully:", emailResponse.response)
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error)
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    })
  }
}







// const User  = require("../models/User");
// const OTP = require("../models/OTP");
// const otpGenerator = require("otp-generator");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();


// //sendOTP
// exports.sendOTP = async (req,res) =>{
    
//     try{
//         //fetch email from req body
//     const {email} = req.body;

//     //check if user already exist
//     const checkUserPresent = await User.findOne({email});

//     //if user already exist , then return a response
//     if(checkUserPresent){
//         return res.status(401).json({
//             success:false,
//             message:"User already registered",
//         })
//     }

//     //generate otp
//      var otp = otpGenerator.generate(6,{
//         upperCaseAlphabets:false,
//         lowerCaseAlphabets:false,
//         specialChars:false,
//      });
//      console.log("OTP generated: ",otp);
     
//      //check unique otp or not
//      let result = await OTP.findOne({otp: otp});

//      while(result){
//          otp = otpGenerator.generate(6,{
//            upperCaseAlphabets:false,
//            lowerCaseAlphabets:false,
//            specialChars:false,
//          });
//          result = await OTP.findOne({otp: otp});
//      }
//       const otpPayload = {email,otp};


//       //create an entry for OTP
//       const otpBody = await OTP.create(otpPayload);
//       console.log(otpBody);

//       //return response successful
//       res.status(200).json({
//         success:true,
//         message:"OTP Sent Successfully",
//         otp,
//       })


//     }

//     catch(error){
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:error.message,
//         })
//     }
// };


// //signup
// exports.signUp = async (req,res)=>{

   
//     try{
//        //data fetch from request ki body
//        const{
//            firstName,
//            lastName,
//            email,
//            password,
//            confirmPassword,
//            accountType,
//            contactNumber,
//            otp
//        } = req.body;
//        //validte karlo
//        if(!firstName || !lastName || !password || !confirmPassword || !otp){
//            return res.status(403).json({
//                success:false,
//                message:"All fields are required",
//            })
//        }
//        //2 password jo hain unko match krlo
//        if(password !== confirmPassword){
//            return res.status(400).json({
//                success:false,
//                message:"Password and ConfirmPassword value does not match, Please try again",
//            })
//        }
   
//        //check user already exist or not
//        const existingUser = await User.findOne({email});
//        if(existingUser){
//            return res.status(400).json({
//                success:false,
//                message:"User is already registered",
//            })
//        }
   
//        //find most resent OTP stored for the user
//        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
//        console.log(recentOtp);
//        //validate OTP
//        if(recentOtp.length==0){
//            //OTP mot found
//            return res.status(400).json({
//                success:false,
//                message:"OTP Found",
//            })
//        } else if(otp !==recentOtp[0].otp){
//            //Invalid Otp
//            return res.status(400).json({
//                success:false,
//                message:"OTP not matching",
//            })
//        }
   
   
   
//        //Hash password
//        const hashedPassword = await bcrypt.hash(password,10);
   
//        //entry create in DB
   
//        const profileDetails = await Profile.create({
//            gender:null,
//            dateOfBirth:null,
//            about:null,
//            contactNumber:null,
//        });
   
//        const user  = await User.create({
//            firstName,
//            lastName,
//            email,
//            contactNumber,
//            password:hashedPassword,
//            accountType,
//            additionalDetails:profileDetails._id,
//            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
//        })
   
//        //return res
//        return res.status(200).json({
//         success:true,
//         message:"user is Registered Successfully",
//         user,
//        })
//     }
//     catch(error){
//        console.log(error);
//        return res.status(500).json({
//            success:false,
//            message:"user cannot be registered. Please try again",
//        })
//     }
   
// }   

// //login
// exports.login = async (req,res)=>{
//     try{
//         //get data from req body
//         const {email,password} = req.body;
//         //validation data
//         if(!email || !password){
//             return res.status(403).json({
//                 success:false,
//                 message:"All fiels are required, please try again",
//             });
//         }
//         //user check exist or not  
//         const user = await User.findOne({email}).populate("additionalDetails");
//         if(!user){
//             return res.status(401).json({
//                 success:false,
//                 message:"User is not registered. Please signup first",
//             });
//         }
//         //generate JWT, after password matching
//         if(await bcrypt.compare(password,user.password)){
//             const payload = {
//                 email :user.email,
//                 id: user._id,
//                 role: user.accountType,
//             }
//             const token = jwt.sign(payload,process.env.JWT_SECRET,{
//                 expiresIn:"2h",
//             });
//             user.token = token;
//             user.password = undefined;
        
//         //create cookie and send response  
//         const options = {
//             expires:new Date(Date.now() + 3*24*60*60*1000),
//             httpOnly:true,
//         }
//         res.cookie("token",token, options).status(200).json({
//             success:true,
//             token,
//             user,
//             message:"Logged in Successfully",
//         })
//     }
//     else{
//         return res.status(401).json({
//             success:false,
//             message:"Password is incorrect",
//         })
//     }
// }
//     catch(error){
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             message:"Login Failure, Please try again",
//         });
//     }
// }

// //changePassword
// exports.changePassword = async (req, res) => {
//     try {
//         // get data from req body
//         const { oldPassword, newPassword, confirmPassword } = req.body;

//         // get user id from authenticated token (assumes middleware has set req.user)
//         const userId = req.user.id;

//         // get user from DB
//         const user = await User.findById(userId);

//         // get oldPassword, newPassword, confirmPassword
//         // validation
//         if (!oldPassword || !newPassword || !confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required",
//             });
//         }

//         // check old password is correct
//         const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
//         if (!isPasswordMatch) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Old password is incorrect",
//             });
//         }

//         // check if new and confirm password match
//         if (newPassword !== confirmPassword) {
//             return res.status(400).json({
//                 success: false,
//                 message: "New Password and Confirm Password do not match",
//             });
//         }

//         // update password in DB
//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         user.password = hashedPassword;
//         await user.save();

//         // send mail - Password updated (optional - here just logging for now)
//         console.log(`Password updated successfully for user ${user.email}`);

//         // return response
//         return res.status(200).json({
//             success: true,
//             message: "Password updated successfully",
//         });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success: false,
//             message: "Something went wrong while updating password",
//         });
//     }
// };



