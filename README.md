# AI Learning Buddy 🎓🤖
### *AI-Powered Course Generator & Learning Buddy*
*A production-ready, full-stack educational web application built for final-year Computer Science portfolio evaluation.*

---

## 🌟 Executive Overview

**AI Learning Buddy** is a responsive web application that turns any user-defined topic into a comprehensive, personalized educational roadmap. Designed with a **modular monolithic architecture**, the platform integrates generative AI, relational database persistence, video recommendations, comprehension testing, and real-time tutoring into a cohesive learner experience.

### Key Capabilities
- **AI Course Outline Generation**: Generates sequential modules, lessons, time budgets, and a capstone assessment using OpenAI structured JSON outputs validated with strict **Zod** schemas.
- **On-Demand Lesson Engine**: Generates comprehensive reading lessons on-demand with practical code snippets, analogies, real-world industry applications, and 3–5 key takeaways. Lesson content is cached in the relational database to prevent redundant API calls.
- **5-Question Comprehension Quizzes**: Dynamically tests conceptual and practical understanding directly from lesson material. Answer keys are strictly protected on the backend; all scoring is evaluated server-side.
- **YouTube Data API v3 Recommendations**: Recommends up to 3 educational video tutorials per lesson with thumbnail and channel metadata, cached in PostgreSQL.
- **Interactive AI Tutor**: In-lesson contextual chatbot allowing learners to ask clarifying questions and follow-ups adapted to their chosen skill level.
- **Verifiable Progress Tracking**: Real-time course completion percentages, quiz attempt records, recent activity feed, and 1-click "Resume Learning" from the last accessed lesson.

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    Client["React + TypeScript + Vite + Tailwind CSS"]
    Server["Node.js + Express + TypeScript Modular Monolith"]
    DB[("PostgreSQL / SQLite with Prisma ORM")]
    OpenAI["OpenAI API (Structured JSON / GPT-4o-mini)"]
    YouTube["YouTube Data API v3"]

    Client -->|JWT in HTTP-only Cookie / Bearer| Server
    Server -->|ORM Queries & Migrations| DB
    Server -->|Strict Zod Schema Prompting| OpenAI
    Server -->|Search & Metadata Query| YouTube
```

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Fast HMR, type safety, modular component hierarchy |
| **Styling** | Tailwind CSS, Lucide Icons | Clean educational SaaS design with responsive dark mode and glassmorphism |
| **Backend** | Node.js, Express, TypeScript | Modular monolithic architecture, high-throughput asynchronous I/O |
| **Database** | PostgreSQL / SQLite | Normalized relational schema with cascade relations and indexes |
| **ORM** | Prisma ORM | Type-safe queries, automated migrations, dual PostgreSQL/SQLite schema |
| **Authentication** | JWT + bcrypt (10 rounds) | Secure password hashing, HTTP-only cookie + Bearer token support |
| **AI Integration** | OpenAI API + Zod Validation | Strict schema enforcement, retry mechanism on validation failure |
| **Video Engine** | YouTube Data API v3 | Official Google endpoints with database query caching |
| **Security** | Helmet, CORS, Rate Limiting | Protected against brute-force and AI generation quota abuse |

---

## 🗄️ Database Schema Design

The relational schema is defined via Prisma in `server/prisma/schema.prisma`:

```mermaid
erDiagram
    User ||--o{ Course : creates
    User ||--o{ LessonProgress : tracks
    User ||--o{ QuizAttempt : submits
    User ||--o{ ChatMessage : sends
    Course ||--|{ Module : contains
    Module ||--|{ Lesson : contains
    Lesson ||--o{ LessonProgress : records
    Lesson ||--o{ Quiz : has
    Lesson ||--o{ ChatMessage : contexts
    Quiz ||--|{ QuizAttempt : records
```

### Models Summary
1. **User**: Credentials, password hash, role, timestamps.
2. **Course**: Topic, skill level (`Beginner`, `Intermediate`, `Advanced`), duration in days, daily study minutes, learning goal, prerequisites, learning objectives, final capstone project, generation status (`generating`, `completed`, `failed`).
3. **Module**: Logical grouping with sequential order, title, and description.
4. **Lesson**: Title, objectives, estimated reading minutes, generated markdown content (cached in DB).
5. **LessonProgress**: Scoped `(userId, lessonId)` unique record with completion flag and `lastAccessedAt` timestamp.
6. **Quiz**: 5 questions with options and explanation.
7. **QuizAttempt**: Stores user answers, server-calculated score, pass/fail status, and timestamp.
8. **ChatMessage**: Scoped to user and lesson for in-context tutoring and history resets.
9. **YouTubeVideoCache**: Caches search queries and video lists to protect YouTube API quotas.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- **Node.js**: v18+ or v20+ LTS
- **npm**: v9+

### 1. Repository Structure
```
ai-learning-buddy/
├── client/              # React frontend (Vite + Tailwind CSS)
├── server/              # Express + TypeScript backend (Prisma)
│   ├── prisma/          # Schema and database seed scripts
│   ├── src/             # Modular controllers, services, middleware
├── docker-compose.yml   # Production PostgreSQL container config
└── README.md
```

### 2. Environment Variables Setup
Create `server/.env` (a template is provided in `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (Default uses zero-config SQLite; or use PostgreSQL connection string)
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET=super_secure_jwt_secret_key_minimum_32_characters

# OpenAI API Key (Optional: application includes pedagogical fallback if key is empty)
OPENAI_API_KEY=your_openai_api_key_here

# YouTube Data API v3 Key (Optional: application includes curated fallback if key is empty)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### 3. Installation & Database Initialization
From the project root:
```bash
# Install backend dependencies & initialize DB
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts

# Install frontend dependencies
cd ../client
npm install
```

### 4. Running Locally
Run the server and client concurrently:
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Credentials (1-Click Login)
For easy review and presentation:
- **Email**: `demo@ailearningbuddy.com`
- **Password**: `Password123!`
- *Or simply click the green **"Demo Login"** button on the Login page.*

---

## 🐳 Docker PostgreSQL (Optional)
If you wish to run PostgreSQL instead of local SQLite:
```bash
# Start PostgreSQL container
docker compose up -d

# Switch DATABASE_URL in server/.env to:
# DATABASE_URL="postgresql://postgres:password123@localhost:5432/ai_learning_buddy?schema=public"

# Deploy schema to PostgreSQL
cd server
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

---

## 🛡️ Software Engineering Highlights

1. **Defensive AI Engineering**:
   - OpenAI responses are requested strictly in JSON mode.
   - Outputs are validated against Zod schemas.
   - If an AI response fails validation, the server retries up to 2 times. If retries fail or if an API key is not yet configured, the system uses an intelligent **Pedagogical Dynamic Generator** to guarantee that the user never sees a broken course.
2. **Server-Side Security**:
   - Quizzes are never evaluated on the client. The frontend receives only questions and options with answer keys stripped out.
   - Passwords hashed using `bcryptjs` with salt round 10.
   - Rate limiting applied to `/api/auth/*` (30 req / 15 min) and `/api/courses/generate` (20 req / min).
3. **Idempotency & Duplicate Prevention**:
   - The backend checks for duplicate course submissions within a 15-second window to prevent double-billing or accidental multi-clicks.
4. **On-Demand Lesson Generation**:
   - Lessons are generated when first clicked and persisted in the database so that subsequent visits are instant and consume zero additional AI tokens.
