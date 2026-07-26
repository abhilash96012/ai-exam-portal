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
- **Backend:** Java 17, Spring Boot 3, Spring Security, Spring Data JPA, Hibernate, JWT
- **Database:** PostgreSQL (Production) / SQLite3 (Local Development)
- **AI/LLM Engine:** Ollama (LLaMA 3)
- **Deployment & DevOps:** Docker Compose, Nginx, GitHub Actions CI/CD (GHCR)

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

---

## 🐳 Docker & GitHub Actions Deployment (Recommended)

This project includes a complete Docker Compose environment that orchestrates **PostgreSQL**, **Backend API**, **Frontend UI (Nginx)**, **Ollama AI Service**, and an **Auto-Pull Helper** that downloads the AI model (`llama3`) automatically.

### 🚀 One-Command Deployment with Docker Compose

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhilash96012/ai-exam-portal.git
   cd ai-exam-portal
   ```

2. **Start all services (Frontend, Backend, Postgres, Ollama):**
   ```bash
   docker compose up -d
   ```

   *The `ollama-init` service will automatically detect and pull the `llama3` model into Ollama on startup.*

3. **Access the application:**
   - **Frontend App:** [http://localhost](http://localhost)
   - **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
   - **Ollama AI Endpoint:** [http://localhost:11434](http://localhost:11434)

---

## ⚡ GitHub CI/CD & Container Registry (GHCR)

Every push to the `main` or `master` branch triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which:
1. Validates and builds the Frontend React & Backend Express code.
2. Packages production Docker images.
3. Automatically publishes tagged images to **GitHub Container Registry (GHCR)**:
   - `ghcr.io/<your-github-username>/ai-exam-portal-frontend:latest`
   - `ghcr.io/<your-github-username>/ai-exam-portal-backend:latest`

---

## ☁️ Cloud Deployment Options (Vercel / Render / Neon)

For serverless/cloud hosting (free tier):

### 1. Database Setup (Neon.tech)
- Create a PostgreSQL database on [Neon.tech](https://neon.tech/) and copy the `DATABASE_URL`.

### 2. Backend Deployment (Render.com)
- Connect repository to [Render.com](https://render.com/).
- Set root directory to `backend`, build command `npm install`, start command `npm start`.
- Environment Variables: `NODE_ENV=production`, `DATABASE_URL=<Neon_URL>`, `JWT_SECRET=<Secret>`, `OLLAMA_API_URL=<Your_Ollama_Endpoint_or_Cloud_LLM>`.

### 3. Frontend Deployment (Vercel)
- Connect repository to [Vercel.com](https://vercel.com/).
- Set root directory to `frontend`, framework preset `Vite`.
- Environment Variable: `VITE_API_URL=https://<your-render-backend>.onrender.com/api`.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/abhilash96012/ai-exam-portal/issues).

## 📝 License
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

