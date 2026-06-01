CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'pending',
  jd_text TEXT,
  jd_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_path TEXT,
  resume_text TEXT,
  candidate_name VARCHAR(255),
  score INTEGER,
  rank INTEGER,
  summary TEXT,
  matching_skills JSONB,
  missing_skills JSONB,
  score_breakdown JSONB,
  raw_ai_response JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
