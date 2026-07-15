# 🚀 AI-Based Online Exam Automation System

![Hero Image](https://via.placeholder.com/1200x400/0070f3/ffffff?text=AI+Exam+Portal) <!-- Replace with a real screenshot of your app -->

A comprehensive, AI-powered online examination portal designed to streamline the assessment process for both educators and students. Built with a modern tech stack (React, Node.js, PostgreSQL/SQLite, and Ollama LLaMA3), this platform automates exam creation, question generation from syllabi, securely conducts exams, and provides instant evaluation.

**[Live Demo](#) | [Frontend Source](./frontend) | [Backend Source](./backend)**

---

## ✨ Key Features

### 🎓 For Teachers & Admins
- **AI Question Generation:** Automatically generate MCQ and Subjective questions directly from a PDF syllabus using LLaMA 3.
- **Exam Management:** Create, configure, and publish exams with strict time limits.
- **Comprehensive Analytics:** Dashboard with insights on student performance, average scores, and class trends.
- **Syllabus Library:** Upload and manage course syllabi seamlessly.

### 📚 For Students
- **Real-Time Exam Interface:** A secure, intuitive interface with a live countdown timer.
- **Instant Results & Feedback:** Immediate grading for MCQs and AI-assisted evaluation for subjective answers.
- **Performance History:** Review past attempts, see correct answers, and understand mistakes.

---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express.js, Axios, Bcrypt, JsonWebToken (JWT)
- **Database:** PostgreSQL (Production) / SQLite (Local Development)
- **AI/LLM:** Ollama (LLaMA 3) running locally or via cloud
- **Deployment:** Vercel (Frontend), Render (Backend), Neon (Database)

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.ai/) installed locally (with the `llama3` model pulled: `ollama run llama3`)

### 1. Clone the repository
```bash
git clone https://github.com/abhilash96012/ai-exam-portal.git
cd ai-exam-portal
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy env example and configure if necessary
cp .env.example .env

# Initialize the SQLite database and seed default users
npm run db:init
npm run db:seed

# Start the backend server
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Copy env example
cp .env.example .env

# Start the Vite development server
npm run dev
```

### 4. Default Login Credentials
- **Teacher:** `mahadev1@gmail.com` / `123456789`
- **Student:** `alice@example.com` / `student123`
- **Admin:** `admin@gmail.com` / `admin123`

---

## ☁️ Deployment Guide (Free Tier)

This project is configured to be easily deployed on free hosting tiers using **Vercel**, **Render**, and **Neon**.

### Step 1: Database Deployment (Neon.tech)
1. Create a free account at [Neon.tech](https://neon.tech/).
2. Create a new project and select PostgreSQL as the database.
3. Copy the **Connection String** (it looks like `postgresql://user:password@endpoint.neon.tech/dbname?sslmode=require`).

### Step 2: Backend Deployment (Render.com)
1. Push this repository to your GitHub account.
2. Create a free account at [Render.com](https://render.com/).
3. Click **New +** > **Web Service**.
4. Connect your GitHub repository.
5. Configuration:
   - **Name:** `ai-exam-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Paste the Neon URL from Step 1)*
   - `FRONTEND_URL`: *(Leave blank for now, we will update it in Step 3)*
   - `JWT_SECRET`: *(Generate a secure random string)*
7. Click **Create Web Service**. Render will automatically build and deploy your backend. Copy the backend URL (e.g., `https://ai-exam-backend.onrender.com`).

### Step 3: Frontend Deployment (Vercel)
1. Create a free account at [Vercel.com](https://vercel.com/).
2. Click **Add New...** > **Project** and import your GitHub repository.
3. Configuration:
   - **Root Directory:** Edit and select `frontend`.
   - **Framework Preset:** Vite
4. Add Environment Variables:
   - `VITE_API_URL`: `https://ai-exam-backend.onrender.com/api` *(Replace with your Render URL from Step 2)*
5. Click **Deploy**. Vercel will automatically build and deploy your frontend. Copy the live frontend URL.

### Step 4: Finalize CORS Configuration
1. Go back to your **Render** dashboard for the backend.
2. Update the `FRONTEND_URL` environment variable to your live Vercel URL (e.g., `https://ai-exam-portal.vercel.app`).
3. Render will automatically restart your backend to apply the changes.

*(Note: GitHub Actions are not strictly required because Vercel and Render both feature automatic native integration. Any pushes to your `main` branch will automatically trigger deployments on both platforms.)*

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/abhilash96012/ai-exam-portal/issues).

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.
