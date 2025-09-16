````markdown
# 🎥 Focus & Object Detection in Video Interviews

## 📌 Project Overview
This project is a **Video Proctoring & Focus Detection System** designed for online interviews.  
It ensures candidate integrity by monitoring **focus, suspicious activities, and object detection** in real time.

The system uses **AI models** (`BlazeFace`, `Coco-SSD`, `Pose Detection`) to track candidate behavior and detect prohibited items such as **phones, books, or notes**.  
All events are logged with timestamps, stored in a backend database, and summarized in a **Proctoring Report**.

---

## 🚀 Features
- ✅ Candidate interview sessions with **video recording**
- ✅ Store recordings securely in the backend
- ✅ **Real-time focus & suspicious event detection**:
  - Detect when the candidate is **looking away**
  - Detect if **no face is present for >10 sec**
  - Detect if candidate is **not looking at the screen for >5 sec**
  - Detect **multiple faces in the frame**
- ✅ **Object detection** for:
  - Mobile phones  
  - Books / paper notes  
  - Extra electronic devices
- ✅ **Event logging with timestamps**
- ✅ Store logs in **MongoDB / MySQL / Firebase**
- ✅ API to fetch **focus + object detection reports**
- ✅ **Proctoring Report Generation** with:
  - Candidate Name
  - Interview Duration
  - Number of times focus lost
  - Suspicious events (multiple faces, absence, phone/notes detected)
  - **Final Integrity Score = 100 – deductions**

---

## 🛠️ Tech Stack
### Frontend
- React.js  
- TensorFlow.js (`BlazeFace`, `Coco-SSD`, `Pose Detection`)  
- Tailwind CSS  
- Socket.IO (real-time events)  

### Backend
- Node.js + Express.js  
- MongoDB (via Mongoose)  
- Socket.IO  
- PDFKit (for report generation)  

---

## 📂 Project Structure
```bash
/frontend   → React.js frontend with AI detection
/backend    → Node.js + Express backend with MongoDB
````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/BalramApply/video-proctoring-system.git
cd video-proctoring-system
```

### 2️⃣ Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start backend:

```bash
npm run dev
```

---

### 3️⃣ Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm start
```

---

## ▶️ Usage

1. Start both **frontend** (`localhost:3000`) and **backend** (`localhost:5000`) servers.
2. Candidate joins the interview session.
3. System records video and monitors focus in **real time**.
4. Suspicious events are logged:

   * Looking away
   * No face detected
   * Multiple faces detected
   * Phone/Books detected
5. After interview:

   * **Logs + Reports** are stored in database
   * Generate a **PDF Proctoring Report**

---

## 📊 Example Proctoring Report

```
Candidate: John Doe
Interview Duration: 45 mins
Focus Lost: 3 times
Suspicious Events:
 - No Face Detected (12s)
 - Mobile Phone Detected (1 time)
Integrity Score: 85/100
```

---

## 📡 API Endpoints

### Interview Routes

* `POST /api/interviews/start` → Start an interview
* `POST /api/interviews/:id/end` → End an interview
* `GET /api/interviews/:id` → Get interview by ID
* `GET /api/interviews` → Get all interviews (requires authentication)

### Detection & Logging

* `POST /api/detections/log` → Log a detection event
* `GET /api/detections/:interviewId` → Get detections for a specific interview

### Reports

* `GET /api/reports/:interviewId` → Generate proctoring report

---

## 🧑‍💻 Scripts

### Frontend

* `npm start` → Start development server
* `npm build` → Build for production
* `npm test` → Run tests

### Backend

* `npm run dev` → Start dev server with nodemon
* `npm run prod` → Start production server
* `npm test` → Run tests

---

## 🔮 Future Enhancements

* 🔐 Candidate authentication with OTP/email verification
* 📡 Cloud storage for recordings
* 🤖 Advanced ML models for cheat detection
* 📊 Analytics dashboard for admins

---

## 👨‍💻 Author

Developed by **Balram Patel** 🚀
Feel free to contribute & raise issues!

---

```
