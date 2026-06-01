-- ResumeRank AI — PostgreSQL Schema
-- Run: psql -U postgres -d resumerank -f schema.sql

-- Sessions table: one session = one JD + N resumes
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'analyzing', 'done', 'error')),
  jd_text       TEXT,
  jd_filename   VARCHAR(255)
);

-- Candidates table: one row per uploaded resume
CREATE TABLE IF NOT EXISTS candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  file_name       VARCHAR(255) NOT NULL,
  file_path       VARCHAR(512),
  resume_text     TEXT,
  candidate_name  VARCHAR(255),
  score           INTEGER CHECK (score BETWEEN 0 AND 100),
  rank            INTEGER,
  summary         TEXT,
  matching_skills JSONB DEFAULT '[]',
  missing_skills  JSONB DEFAULT '[]',
  score_breakdown JSONB DEFAULT '{}',
  raw_ai_response JSONB
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_candidates_session  ON candidates(session_id);
CREATE INDEX IF NOT EXISTS idx_candidates_score    ON candidates(session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created    ON sessions(created_at DESC);

-- Auto-update updated_at on sessions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
