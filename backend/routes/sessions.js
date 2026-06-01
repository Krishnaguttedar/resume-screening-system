const express = require('express');
const { query } = require('../utils/db');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

// ── POST /api/sessions ────────────────────────────────────────────────────────
// Create a new screening session
router.post('/', async (_req, res) => {
  const result = await query(
    `INSERT INTO sessions (status) VALUES ('pending') RETURNING *`
  );
  res.status(201).json({ session: result.rows[0] });
});

// ── GET /api/sessions/:id ─────────────────────────────────────────────────────
// Get session details + candidate count
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const sessionRes = await query(
    `SELECT * FROM sessions WHERE id = $1`, [id]
  );
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const countRes = await query(
    `SELECT COUNT(*) FROM candidates WHERE session_id = $1`, [id]
  );

  res.json({
    session: sessionRes.rows[0],
    candidateCount: parseInt(countRes.rows[0].count),
  });
});

// ── POST /api/sessions/:id/jd ─────────────────────────────────────────────────
// Set or update the Job Description for a session
router.post('/:id/jd', async (req, res) => {
  const { id } = req.params;
  const { jdText, jdFilename } = req.body;

  if (!jdText || !jdText.trim()) {
    throw createError(400, 'jdText is required');
  }

  const sessionRes = await query(`SELECT id FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const result = await query(
    `UPDATE sessions
     SET jd_text = $1, jd_filename = $2, status = 'pending', updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [jdText.trim(), jdFilename || null, id]
  );

  res.json({ session: result.rows[0] });
});

// ── GET /api/sessions/:id/results ─────────────────────────────────────────────
// Get all ranked candidates for a session
router.get('/:id/results', async (req, res) => {
  const { id } = req.params;
  const { search, sort = 'desc' } = req.query;

  const sessionRes = await query(`SELECT * FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const sortDir = sort === 'asc' ? 'ASC' : 'DESC';

  let sql = `
    SELECT id, file_name, candidate_name, score, rank,
           summary, matching_skills, missing_skills, score_breakdown
    FROM candidates
    WHERE session_id = $1
  `;
  const params = [id];

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    sql += ` AND (LOWER(candidate_name) LIKE $${params.length}
                  OR LOWER(file_name) LIKE $${params.length})`;
  }

  sql += ` ORDER BY score ${sortDir}, candidate_name ASC`;

  const candidatesRes = await query(sql, params);

  res.json({
    session: sessionRes.rows[0],
    candidates: candidatesRes.rows,
  });
});

// ── GET /api/sessions/:id/export ──────────────────────────────────────────────
// Export results as CSV
router.get('/:id/export', async (req, res) => {
  const { id } = req.params;

  const sessionRes = await query(`SELECT * FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  const candidatesRes = await query(
    `SELECT rank, candidate_name, file_name, score,
            matching_skills, missing_skills, summary
     FROM candidates
     WHERE session_id = $1
     ORDER BY rank ASC`,
    [id]
  );

  const rows = [
    ['Rank', 'Candidate Name', 'File', 'Score', 'Match Level',
     'Matching Skills', 'Missing Skills', 'Summary'],
    ...candidatesRes.rows.map((c) => [
      c.rank,
      c.candidate_name,
      c.file_name,
      c.score,
      scoreLabel(c.score),
      (c.matching_skills || []).join('; '),
      (c.missing_skills  || []).join('; '),
      (c.summary || '').replace(/"/g, '""'),
    ]),
  ];

  const csv = rows
    .map((row) => row.map((v) => `"${v}"`).join(','))
    .join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="candidates-${id}.csv"`);
  res.send(csv);
});

// ── DELETE /api/sessions/:id ──────────────────────────────────────────────────
// Delete session, candidates, and uploaded files
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const fs   = require('fs');
  const path = require('path');

  const sessionRes = await query(`SELECT id FROM sessions WHERE id = $1`, [id]);
  if (!sessionRes.rows.length) throw createError(404, 'Session not found');

  // Delete files from disk
  const uploadsDir = path.join(__dirname, '..', 'uploads', id);
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
  }

  // Cascade deletes candidates too (via FK)
  await query(`DELETE FROM sessions WHERE id = $1`, [id]);

  res.json({ deleted: true });
});

function scoreLabel(score) {
  if (score >= 75) return 'Strong Match';
  if (score >= 50) return 'Moderate Match';
  return 'Weak Match';
}

module.exports = router;
