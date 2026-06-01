# ResumeRank AI — Resume Screening & Candidate Ranking

A full-stack web application that automates resume screening by comparing uploaded resumes against a Job Description, generating match scores (0–100), and ranking candidates from highest to lowest fit.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js 14 (React), Tailwind CSS  |
| Backend    | Node.js + Express                 |
| Database   | PostgreSQL                        |
| AI         | Anthropic Claude API              |
| File Parse | pdf-parse, mammoth (DOCX)         |
| Deploy     | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
resume-ranker/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Next.js pages + API routes
│   │   ├── styles/         # Global CSS
│   │   └── utils/          # Helper functions
│   ├── .env.local          # Frontend env vars
│   └── package.json
│
├── backend/                # Express API server
│   ├── routes/             # API route handlers
│   ├── middleware/         # Auth, error, upload middleware
│   ├── utils/              # DB, AI, parser utilities
│   ├── uploads/            # Temp file storage
│   ├── .env                # Backend env vars
│   └── package.json
│
├── database/
│   └── schema.sql          # PostgreSQL schema
│
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Anthropic API key

---

### 1. Database Setup

```bash
psql -U postgres
CREATE DATABASE resumerank;
\c resumerank
\i database/schema.sql
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/resumerank
ANTHROPIC_API_KEY=sk-ant-your-key-here
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
```

```bash
npm run dev
```

Backend runs on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs on **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| POST   | `/api/sessions`                 | Create new screening session   |
| POST   | `/api/sessions/:id/resumes`     | Upload resumes to session      |
| POST   | `/api/sessions/:id/jd`          | Set Job Description            |
| POST   | `/api/sessions/:id/analyze`     | Trigger AI analysis            |
| GET    | `/api/sessions/:id/results`     | Get ranked candidates          |
| GET    | `/api/sessions/:id/export`      | Export results as CSV          |
| DELETE | `/api/sessions/:id`             | Delete session + files         |

---

## Scoring Algorithm

Each resume is scored on 4 factors:

| Factor              | Weight | Description                              |
|---------------------|--------|------------------------------------------|
| Skills Match        | 30%    | Overlap between resume skills and JD     |
| Experience Relevance| 30%    | Years and domain relevance               |
| Education Alignment | 20%    | Degree level and field match             |
| Keyword Similarity  | 20%    | NLP keyword overlap with JD text         |

Final score = weighted sum (0–100)

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```
Set env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

### Backend → Render
1. Connect GitHub repo to Render
2. Set root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all `.env` variables in Render dashboard

### Database → Render PostgreSQL
1. Create a PostgreSQL instance on Render
2. Copy the connection string to `DATABASE_URL`
3. Run `schema.sql` via Render's PSQL shell

---

## Architecture Overview

```
Browser (Next.js)
      │
      │  REST API calls
      ▼
Express Server (Node.js)
      │
      ├── Multer → File Upload (PDF/DOC/DOCX)
      │
      ├── pdf-parse / mammoth → Text Extraction
      │
      ├── Anthropic Claude API → AI Scoring
      │        (skills, experience, education, keywords)
      │
      └── PostgreSQL → Store sessions, candidates, scores
```

---

## Assumptions

1. Resumes are text-based PDFs (scanned image PDFs may extract poorly)
2. One session = one JD + multiple resumes
3. Sessions are ephemeral — no user authentication required
4. File size limit: 10MB per file
5. Max resumes per session: 50
6. Claude `claude-sonnet-4-20250514` used for scoring
