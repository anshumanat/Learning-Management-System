const payuConfig = require("../config/payu")
const Course = require("../models/Course")
const crypto = require("crypto")
const User = require("../models/User")
const mailSender = require("../utils/mailSender")
const mongoose = require("mongoose")
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail")
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail")
const CourseProgress = require("../models/CourseProgress")

// Helper to generate PayU hash
function generatePayUHash(params, salt) {
  // Correct PayU hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  const hashString = [
    params.key,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    '', '', '', '', '', // udf1-udf5
    '', '', '', '', '', // udf6-udf10
    salt
  ].join('|');
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

// Capture the payment and initiate the PayU order
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user.id;
  if (!courses || courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" });
  }

  let total_amount = 0;
  let productinfo = [];
  let firstCourse = null;

  for (const course_id of courses) {
    let course;
    try {
      course = await Course.findById(course_id);
      if (!course) {
        return res.status(200).json({ success: false, message: "Could not find the Course" });
      }
      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(200).json({ success: false, message: "Student is already Enrolled" });
      }
      total_amount += course.price;
      productinfo.push(course.courseName);
      if (!firstCourse) firstCourse = course;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Prepare PayU params
  const txnid = 'txn_' + Date.now();
  const user = await User.findById(userId);
  const surl = process.env.PAYU_SUCCESS_URL || "NOT_SET";
  const furl = process.env.PAYU_FAILURE_URL || "NOT_SET";
  const payuParams = {
    key: payuConfig.merchantKey,
    txnid,
    amount: total_amount.toFixed(2),
    productinfo: productinfo.join(", "),
    firstname: user.firstName,
    email: user.email,
    phone: user.contactNumber || '9999999999', // Ensure phone is always present
    surl, // Always include
    furl, // Always include
  };
  payuParams.hash = generatePayUHash(payuParams, payuConfig.merchantSalt);

  // Send params to frontend to submit to PayU, including baseUrl and surl/furl for debug
  res.json({
    success: true,
    data: { ...payuParams, baseUrl: payuConfig.baseUrl + "/_payment", surl, furl },
  });
};

// verify the payment (PayU will POST to your surl/furl)
exports.verifyPayment = async (req, res) => {
  // PayU sends many params, including posted_hash
  const {
    key, txnid, amount, productinfo, firstname, email, status, hash,
    mihpayid, payuMoneyId, ...rest
  } = req.body;
  // Recreate hash sequence for response: salt|status|||||||||||email|firstname|productinfo|amount|txnid|key
  const hashString = [
    payuConfig.merchantSalt,
    status,
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    key
  ].join('|');
  const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

  if (expectedHash !== hash) {
    return res.status(400).json({ success: false, message: "Payment hash mismatch" });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ success: false, message: "User not found" });
  }

  // Enroll student in courses (you may want to pass course IDs via udf fields or productinfo)
  // For demo, enroll in all courses with productinfo names
  const courseNames = productinfo.split(", ");
  for (const name of courseNames) {
    const course = await Course.findOne({ courseName: name });
    if (course && !course.studentsEnrolled.includes(user._id)) {
      await Course.findByIdAndUpdate(course._id, { $push: { studentsEnrolled: user._id } });
      await User.findByIdAndUpdate(user._id, { $push: { courses: course._id } });
    }
  }

  // Optionally send success email
  try {
    await mailSender(
      user.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${user.firstName} ${user.lastName}`,
        amount,
        txnid,
        mihpayid
      )
    );
  } catch (error) {
    console.log("error in sending mail", error);
  }

  res.status(200).json({ success: true, message: "Payment Verified" });
};

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}

// Send Payment Success Email (for manual trigger or legacy support)
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount, email } = req.body;
  // You may want to get user by email or from req.user
  let user = req.user;
  if (!user && email) {
    user = await User.findOne({ email });
  }
  if (!orderId || !paymentId || !amount || !user) {
    return res.status(400).json({ success: false, message: "Please provide all the details" });
  }
  try {
    await mailSender(
      user.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${user.firstName} ${user.lastName}`,
        amount,
        orderId,
        paymentId
      )
    );
    res.status(200).json({ success: true, message: "Payment success email sent" });
  } catch (error) {
    console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    res.status(500).json({ success: false, message: "Could not send email" });
  }
};