const express = require('express');
const path    = require('path');
const fs      = require('fs');

const { query }         = require('../utils/db');
const { extractText }   = require('../utils/parser');
const { scoreResumes }  = require('../utils/ai');
const { createUploader } = require('../middleware/upload');
const { createError }   = require('../middleware/errorHandler');

const router = express.Router();

// ── POST /api/sessions/:id/resumes ────────────────────────────────────────────
// Upload one or more resume files to a session
router.post('/:id/resumes', async (req, res) => {
  const { id } = req.params;

  // Verify session exists
  const sessionRes = await query(`SELECT id, status FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  // Dynamically create uploader scoped to this session's directory
  const upload = createUploader(id);
  const uploadMiddleware = upload.array('resumes', 50);

  await new Promise((resolve, reject) => {
    uploadMiddleware(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (!req.files || req.files.length === 0) {
    throw createError(400, 'No files uploaded. Send files in the "resumes" field.');
  }

  // Parse text from each file and insert into DB
  const inserted = [];
  for (const file of req.files) {
    const text = await extractText(file.path, file.mimetype);

    const result = await query(
      `INSERT INTO candidates (session_id, file_name, file_path, resume_text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, file_name, created_at`,
      [id, file.originalname, file.path, text]
    );
    inserted.push(result.rows[0]);
  }

  res.status(201).json({
    uploaded: inserted.length,
    candidates: inserted,
  });
});

// ── GET /api/sessions/:id/resumes ─────────────────────────────────────────────
// List all resumes uploaded to a session (before analysis)
router.get('/:id/resumes', async (req, res) => {
  const { id } = req.params;

  const sessionRes = await query(`SELECT id FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const result = await query(
    `SELECT id, file_name, candidate_name, score, created_at
     FROM candidates
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  res.json({ candidates: result.rows });
});

// ── DELETE /api/sessions/:id/resumes/:cid ─────────────────────────────────────
// Remove a single resume from a session
router.delete('/:id/resumes/:cid', async (req, res) => {
  const { id, cid } = req.params;

  const result = await query(
    `DELETE FROM candidates WHERE id = $1 AND session_id = $2 RETURNING file_path`,
    [cid, id]
  );

  if (!result.rows.length) throw createError(404, 'Candidate not found in this session');

  // Remove file from disk
  const filePath = result.rows[0].file_path;
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ deleted: true });
});

// ── POST /api/sessions/:id/analyze ───────────────────────────────────────────
// Trigger AI analysis for all resumes in the session
router.post('/:id/analyze', async (req, res) => {
  const { id } = req.params;

  // Validate session
  const sessionRes = await query(`SELECT * FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const session = sessionRes.rows[0];
  if (!session.jd_text) {
    throw createError(400, 'Job description must be set before running analysis.');
  }

  // Get all resumes
  const resumesRes = await query(
    `SELECT id, file_name, resume_text FROM candidates WHERE session_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  if (!resumesRes.rows.length) {
    throw createError(400, 'No resumes uploaded to this session.');
  }

  // Mark session as analyzing
  await query(
    `UPDATE sessions SET status = 'analyzing', updated_at = NOW() WHERE id = $1`,
    [id]
  );

  try {
    const resumeInputs = resumesRes.rows.map((r) => ({
      fileName: r.file_name,
      text:     r.resume_text || '',
      dbId:     r.id,
    }));

    // Call Claude API
    const scores = await scoreResumes(resumeInputs, session.jd_text);

    // Sort by score descending to assign ranks
    const sorted = [...scores].sort((a, b) => b.score - a.score);

    // Persist scores to DB
    for (let i = 0; i < sorted.length; i++) {
      const s    = sorted[i];
      const rank = i + 1;

      // Match back to DB row by fileName
      const dbRow = resumeInputs.find((r) => r.fileName === s.fileName);
      if (!dbRow) continue;

      await query(
        `UPDATE candidates
         SET candidate_name  = $1,
             score           = $2,
             rank            = $3,
             summary         = $4,
             matching_skills = $5,
             missing_skills  = $6,
             score_breakdown = $7,
             raw_ai_response = $8
         WHERE id = $9`,
        [
          s.candidateName,
          s.score,
          rank,
          s.summary,
          JSON.stringify(s.matchingSkills),
          JSON.stringify(s.missingSkills),
          JSON.stringify(s.scoreBreakdown),
          JSON.stringify(s.rawAiResponse),
          dbRow.dbId,
        ]
      );
    }

    // Mark session as done
    await query(
      `UPDATE sessions SET status = 'done', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Return results immediately
    const resultsRes = await query(
      `SELECT id, file_name, candidate_name, score, rank,
              summary, matching_skills, missing_skills, score_breakdown
       FROM candidates
       WHERE session_id = $1
       ORDER BY rank ASC`,
      [id]
    );

    res.json({
      analyzed: resultsRes.rows.length,
      candidates: resultsRes.rows,
    });
  } catch (err) {
    // Mark session as errored
    await query(
      `UPDATE sessions SET status = 'error', updated_at = NOW() WHERE id = $1`,
      [id]
    );
    throw err;
  }
});

module.exports = router;
