const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a senior HR recruiter and technical screening specialist.
Your job is to evaluate resumes against a Job Description and return structured JSON scores.
Be objective, consistent, and nuanced — avoid inflated scores.
Always respond with valid JSON only. No markdown. No explanation outside JSON.`;

/**
 * Score a batch of resumes against a job description.
 *
 * @param {Array<{fileName: string, text: string}>} resumes
 * @param {string} jobDescription
 * @returns {Promise<Array>} Array of candidate score objects
 */
async function scoreResumes(resumes, jobDescription) {
  const resumeBlock = resumes
    .map((r, i) => `=== RESUME ${i + 1} | FILE: ${r.fileName} ===\n${r.text || '[empty — could not parse]'}`)
    .join('\n\n');

  const userPrompt = `
JOB DESCRIPTION:
${jobDescription}

RESUMES TO EVALUATE:
${resumeBlock}

Return a JSON array with one object per resume, in the same order as provided:
[
  {
    "fileName": "exact filename from input",
    "candidateName": "Full name extracted from resume, or 'Unknown' if not found",
    "score": <integer 0-100>,
    "scoreBreakdown": {
      "skillsMatch": <integer 0-100>,
      "experienceRelevance": <integer 0-100>,
      "educationAlignment": <integer 0-100>,
      "keywordSimilarity": <integer 0-100>
    },
    "matchingSkills": ["skill1", "skill2"],
    "missingSkills": ["skill3", "skill4"],
    "summary": "2-3 sentence professional assessment of this candidate's fit"
  }
]

Scoring rubric:
- skillsMatch (30%): How many required/preferred skills from the JD does the candidate have?
- experienceRelevance (30%): Is their work experience relevant to this role? Consider years, domain, seniority.
- educationAlignment (20%): Does their degree/field match what the JD asks for?
- keywordSimilarity (20%): How many key terms, technologies, and phrases from the JD appear in the resume?
- Final score = (skillsMatch * 0.30) + (experienceRelevance * 0.30) + (educationAlignment * 0.20) + (keywordSimilarity * 0.20)
- matchingSkills: list up to 8 specific skills/technologies the candidate has that the JD requires
- missingSkills: list up to 6 specific skills/technologies the JD requires that the candidate lacks
`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip markdown fences if model slips one in
  const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let results;
  try {
    results = JSON.parse(clean);
  } catch (e) {
    console.error('[ai] JSON parse failed. Raw response:', raw);
    throw new Error('AI returned invalid JSON. Please retry.');
  }

  if (!Array.isArray(results)) {
    throw new Error('AI response was not an array.');
  }

  // Validate + normalise each result
  return results.map((r) => ({
    fileName:         r.fileName         || 'unknown',
    candidateName:    r.candidateName    || 'Unknown',
    score:            clamp(Math.round(r.score ?? 0), 0, 100),
    scoreBreakdown: {
      skillsMatch:          clamp(Math.round(r.scoreBreakdown?.skillsMatch          ?? 0), 0, 100),
      experienceRelevance:  clamp(Math.round(r.scoreBreakdown?.experienceRelevance  ?? 0), 0, 100),
      educationAlignment:   clamp(Math.round(r.scoreBreakdown?.educationAlignment   ?? 0), 0, 100),
      keywordSimilarity:    clamp(Math.round(r.scoreBreakdown?.keywordSimilarity    ?? 0), 0, 100),
    },
    matchingSkills: Array.isArray(r.matchingSkills) ? r.matchingSkills.slice(0, 8) : [],
    missingSkills:  Array.isArray(r.missingSkills)  ? r.missingSkills.slice(0, 6)  : [],
    summary:        r.summary || '',
    rawAiResponse:  r,
  }));
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

module.exports = { scoreResumes };
