const jwt=require("jsonwebtoken");
require("dotenv").config();
const User=require("../models/User");


//auth
exports.auth=async(req,res,next)=>{
  try{
    //extract token
   
    const authHeader = req.header("Authorization");
    console.log("Raw Authorization header:", authHeader);
    console.log("process.env.JWT_SECRET:", process.env.JWT_SECRET);
    console.log("req.cookies:", req.cookies);
    const token = (req.cookies && req.cookies.token)
               || (req.body && req.body.token)
               || (req.header && req.header("Authorization") && req.header("Authorization").replace("Bearer ",""));
    console.log("Token received:", token); 

    //if token missing,then return response
    if(!token){
      return res.status(401).json({
        success:false,
        message:"Token is missing"
      });
    }
    
    //verify token
    try{
      console.log("BEFORE VERIFIYINH");
      const decode= jwt.verify(token,process.env.JWT_SECRET);
      console.log(decode);
      console.log("HERE WE DECODED");
      req.user=decode;
      next();
    }
    catch(err){
      //issue
      console.log('JWT VERIFY ERROR:', err);
      console.log('JWT VERIFY ERROR MESSAGE:', err.message);
      return res.status(401).json({
        success:false,
        message:"Token is invalid",
        error: err.message // include error message in response for debugging
      });
    }
    // Do not call next() if there was an error above
    return;

  }catch(err){
    console.log('OUTER AUTH MIDDLEWARE ERROR:', err);
    console.log('OUTER AUTH MIDDLEWARE ERROR MESSAGE:', err.message);
    return res.status(401).json({
      success:false,
      message:"Something went wrong while validating the token",
      error: err.message // include error message in response for debugging
    });
  }
}

//isStudent
exports.isStudent=async(req,res,next)=>{
  try{
    if(req.user.accountType!=="Student"){
      return res.status(401).json({
        success:false,
        message:"This is a protected route for students only"
      });
    }
    next();
  }catch(err){
    return res.status(500).json({
      success:false,
      message:"User role cannot be verified,please try again"
    })
  }
}

//isAdmin
exports.isAdmin=async(req,res,next)=>{
  try{
    if(req.user.accountType!=="Admin"){
      return res.status(401).json({
        success:false,
        message:"This is a protected route for Admin only"
      });
    }
    next();
  }catch(err){
    return res.status(500).json({
      success:false,
      message:"User role cannot be verified,please try again"
    })
  }
}

//isInstructor
exports.isInstructor=async(req,res,next)=>{
  try{
    if(req.user.accountType!=="Instructor"){
      return res.status(401).json({
        success:false,
        message:"This is a protected route for Instructor only"
      });
    }
    next();
  }catch(err){
    return res.status(500).json({
      success:false,
      message:"User role cannot be verified,please try again"
    })
  }
}