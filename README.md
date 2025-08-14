# 📚 StudyNotion – Learning Management System  

StudyNotion is a fully functional **Learning Management System (LMS)** designed to provide a seamless platform for students to learn online and for instructors to share their knowledge. Built with the **MERN stack**, StudyNotion delivers a modern, responsive, and robust e-learning experience.  

---

## 🚀 Features  

### 👩🎓 For Students  
- **Browse & Enroll** in courses  
- **Watch videos** and access course resources  
- **Track progress** and course completion  
- **Secure Payment Gateway** for course purchase  

### 👨🏫 For Instructors  
- **Create and manage courses** (upload videos, PDFs, and assignments)  
- Monitor student engagement and progress  
- Edit or delete courses anytime  

### 🔒 Security & User Management  
- **JWT-based Authentication**  
- **Role-based Access Control** (Student/Instructor/Admin)  
- Secure password handling with bcrypt  

---

## 🛠️ Tech Stack  

**Frontend:**  
- React.js  
- Redux Toolkit  
- Tailwind CSS  

**Backend:**  
- Node.js  
- Express.js  
- MongoDB  

**Other Tools & Integrations:**  
- JWT Authentication  
- Cloudinary (for media storage)  
- Razorpay/Stripe (for payments)  

---

## 📂 Project Structure  
```
StudyNotion/
│
├── client/                # React frontend
│   ├── src/
│   ├── public/
│
├── server/                # Express backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│
└── README.md
```

---

## ⚡ Getting Started  

### Prerequisites  
- Node.js & npm  
- MongoDB  
- Cloudinary account (for media)  
- Razorpay/Stripe account (for payments)  

### Installation  
1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/studynotion.git
   cd studynotion
   ```

2. **Install dependencies for frontend & backend**
   ```
   cd client && npm install
   cd ../server && npm install
   ```

3. **Setup environment variables**  
   Create a `.env` file in `server/`:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   PAYMENT_KEY=your_payment_key
   PAYMENT_SECRET=your_payment_secret
   ```

4. **Run the app**
   ```
   # Start backend
   cd server && npm run dev  

   # Start frontend
   cd client && npm start
   ```

---

## 📸 Screenshots  
<img width="1819" height="878" alt="image" src="https://github.com/user-attachments/assets/f6109468-6a75-4a72-92bd-43d642cc431b" />
 

---

## 🌟 Future Enhancements  
- AI-based course recommendations  
- Advanced analytics dashboard for instructors  
- Mobile app version  

---

## 🤝 Contribution  
1. Fork the repo  
2. Create a new branch  
3. Commit your changes  
4. Push to your branch and create a Pull Request  

---

## 📜 License  
This project is licensed under the **MIT License** – feel free to use and modify it.  
```

*** 
