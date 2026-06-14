# Exam Automation Backend

A production-ready Node.js backend for the Hybrid AI-Based Online Exam Automation System.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: Ollama (Local LLM)
- **Automation**: n8n Webhook Integration

## Features

- ✅ Teacher & Student Authentication
- ✅ Role-based Access Control
- ✅ Exam Management (CRUD)
- ✅ AI Question Generation
- ✅ Syllabus Upload (PDF/TXT)
- ✅ Auto-evaluation
- ✅ Result Management
- ✅ n8n Automation Webhooks
- ✅ Rate Limiting
- ✅ Request Validation
- ✅ Centralized Error Handling
- ✅ Structured Logging

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=exam_automation
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secure_secret_key

# Ollama (optional)
OLLAMA_API_URL=http://localhost:11434/api/generate

# Frontend URL (for teacher invite links)
FRONTEND_URL=http://localhost:5173

# SMTP (optional, for teacher invites)
# Gmail example:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=youraddress@gmail.com
# SMTP_PASS=your_google_app_password
# SMTP_FROM=youraddress@gmail.com
```

### 3. Setup Database

Create the database:

```bash
createdb exam_automation
```

Run migrations:

```bash
npm run db:init
```

Seed sample data (optional):

```bash
npm run db:seed
```

### 4. Start Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | `/api/auth/register`         | Register new user        |
| POST   | `/api/auth/login`            | Login user               |
| POST   | `/api/auth/google`           | Google OAuth login       |
| GET    | `/api/auth/me`               | Get current user         |
| PUT    | `/api/auth/complete-profile` | Complete student profile |

### Exams (Teacher)

| Method | Endpoint                            | Description           |
| ------ | ----------------------------------- | --------------------- |
| POST   | `/api/exams`                        | Create exam           |
| GET    | `/api/exams`                        | Get all exams         |
| GET    | `/api/exams/:id`                    | Get exam by ID        |
| PUT    | `/api/exams/:id`                    | Update exam           |
| DELETE | `/api/exams/:id`                    | Delete exam           |
| POST   | `/api/exams/:id/publish`            | Publish exam          |
| POST   | `/api/exams/:id/syllabus`           | Upload syllabus       |
| POST   | `/api/exams/:id/generate-questions` | Generate AI questions |

### Questions (Teacher)

| Method | Endpoint              | Description               |
| ------ | --------------------- | ------------------------- |
| POST   | `/api/questions`      | Create question           |
| POST   | `/api/questions/bulk` | Create multiple questions |
| GET    | `/api/questions/:id`  | Get question              |
| PUT    | `/api/questions/:id`  | Update question           |
| DELETE | `/api/questions/:id`  | Delete question           |

### Student

| Method | Endpoint                           | Description         |
| ------ | ---------------------------------- | ------------------- |
| GET    | `/api/student/exams`               | Get available exams |
| POST   | `/api/student/exams/:id/start`     | Start exam          |
| POST   | `/api/student/attempts/:id/answer` | Save answer         |
| POST   | `/api/student/attempts/:id/submit` | Submit exam         |
| GET    | `/api/student/results`             | Get my results      |

### Health

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| GET    | `/api/health`          | Basic health check      |
| GET    | `/api/health/detailed` | Detailed service status |

## Folder Structure

```
backend/
├── config/           # Configuration files
│   ├── index.js      # Main config
│   └── database.js   # Database connection
├── controllers/      # Route handlers
├── middleware/       # Express middleware
├── models/           # Database models
├── routes/           # API routes
├── services/         # Business logic services
├── utils/            # Utility functions
├── database/         # SQL scripts
├── uploads/          # Uploaded files
├── app.js            # Express app setup
├── server.js         # Server entry point
└── package.json
```

## Test Credentials (after seeding)

| Role    | Email              | Password   |
| ------- | ------------------ | ---------- |
| Admin   | admin@gmail.com    | admin123   |
| Teacher | mahadev1@gmail.com | 123456789  |
| Student | alice@example.com  | student123 |

Note: the admin email/password can be overridden by setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` before running `npm run db:seed` or `node database/migrateAdminRole.js`.

## Requirements

- Node.js >= 18
- PostgreSQL >= 14
- Ollama (for AI features)
- n8n (for automation features)
