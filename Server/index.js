const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {auth} = require("./middlewares/auth");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

//database connect
database.connect();
//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin:"http://localhost:3000",
		credentials:true,
		allowedHeaders: ["Content-Type", "Authorization"], // <-- add Authorization here
	})
)

app.use(
	fileUpload({
		useTempFiles:true,
		tempFileDir:"/tmp",
	})
)
//cloudinary connection
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile",auth, profileRoutes);
// Public course routes (no auth)
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment",auth, paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);

//default route

app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running....'
	});
});

//extra code addded for running get as localhost/4000/api/v1 was not running
app.get("/api/v1", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to the API v1 root",
  });
});






app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})