# Resume Screening and Candidate Ranking System

## Overview

A web application that allows recruiters to upload multiple resumes and a job description, automatically analyzes candidate profiles, calculates suitability scores, and ranks candidates based on job requirements.

## Features

- Upload multiple resumes (PDF/DOCX)
- Upload Job Description
- Resume text extraction
- Candidate scoring and ranking
- Skills matching
- Experience analysis
- Education matching
- Keyword similarity calculation
- Ranked candidate dashboard

## Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Multer
- pdf-parse
- Mammoth

### Database
- PostgreSQL

## Project Structure

```
resume-ranker/
├── frontend/
├── backend/
├── database/
└── README.md
```

## Setup Instructions

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Candidate Scoring Method

The candidate score is calculated using:

- Skills Match: 40%
- Experience Match: 30%
- Education Match: 15%
- Keyword Similarity: 15%

Final score is used to rank candidates from highest to lowest suitability.

## Assumptions

- Resumes are uploaded in PDF or DOCX format.
- Job description is provided as text.
- Candidate ranking is based on extracted resume information.

## Deliverables

- Complete Source Code
- GitHub Repository
- Deployed Application URL
- Documentation

## Author

Krishna R
B.Tech CSE
Parul University
