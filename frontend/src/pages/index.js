import { useState, useCallback } from 'react';
import Head from 'next/head';

import StepBar       from '../components/StepBar';
import FileDropZone  from '../components/FileDropZone';
import CandidateCard from '../components/CandidateCard';
import StatBar       from '../components/StatBar';

import {
  createSession,
  setJobDescription,
  uploadResumes,
  analyzeSession,
  exportCSVUrl,
  deleteResume,
} from '../utils/api';

const STEPS = { UPLOAD: 0, JD: 1, RESULTS: 2 };

export default function Home() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [step,       setStep]       = useState(STEPS.UPLOAD);
  const [sessionId,  setSessionId]  = useState(null);

  // Step 0
  const [files,      setFiles]      = useState([]);        // File[] local
  const [uploaded,   setUploaded]   = useState([]);        // DB rows after upload
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);

  // Step 1
  const [jdText,     setJdText]     = useState('');
  const [jdFile,     setJdFile]     = useState(null);

  // Step 2
  const [analyzing,  setAnalyzing]  = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [search,     setSearch]     = useState('');
  const [sortDir,    setSortDir]    = useState('desc');

  const [error,      setError]      = useState('');

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearError = () => setError('');

  // ── Step 0: Resume upload ─────────────────────────────────────────────────
  const handleResumeFiles = useCallback((newFiles) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
    clearError();
  }, []);

  const removeLocalFile = (name) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUploadResumes = async () => {
    if (!files.length) { setError('Please add at least one resume.'); return; }
    clearError();
    setUploading(true);

    try {
      // Create session on first upload
      let sid = sessionId;
      if (!sid) {
        const session = await createSession();
        sid = session.id;
        setSessionId(sid);
      }

      const result = await uploadResumes(sid, files, setUploadPct);
      setUploaded(result.candidates);
      setStep(STEPS.JD);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setUploading(false);
    setUploadPct(0);
  };

  // ── Step 1: Job Description ───────────────────────────────────────────────
  const handleJdFile = async (jdFiles) => {
    const file = jdFiles[0];
    setJdFile(file);
    const text = await file.text().catch(() => '');
    setJdText(text);
    clearError();
  };

  const handleAnalyze = async () => {
    if (!jdText.trim()) { setError('Please enter or upload a Job Description.'); return; }
    clearError();
    setAnalyzing(true);

    try {
      await setJobDescription(sessionId, jdText, jdFile?.name || null);
      const result = await analyzeSession(sessionId);
      const sorted = [...result.candidates].sort(
        (a, b) => sortDir === 'desc' ? b.score - a.score : a.score - b.score
      );
      setCandidates(sorted);
      setStep(STEPS.RESULTS);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setAnalyzing(false);
  };

  // ── Step 2: Results ───────────────────────────────────────────────────────
  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.candidate_name || '').toLowerCase().includes(q) ||
      (c.file_name       || '').toLowerCase().includes(q)
    );
  });

  const sortedCandidates = [...filtered].sort((a, b) =>
    sortDir === 'desc' ? b.score - a.score : a.score - b.score
  );

  const handleNewAnalysis = () => {
    setStep(STEPS.UPLOAD);
    setSessionId(null);
    setFiles([]);
    setUploaded([]);
    setJdText('');
    setJdFile(null);
    setCandidates([]);
    setSearch('');
    clearError();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>ResumeRank AI — Candidate Screening</title>
        <meta name="description" content="AI-powered resume screening and candidate ranking" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
      </Head>

      {/* ── Noise texture overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accentHi flex items-center justify-center text-sm">
              ⚡
            </div>
            <span className="font-display font-bold text-white text-base tracking-tight">ResumeRank AI</span>
          </div>

          {step === STEPS.RESULTS && (
            <div className="flex gap-2">
              <button onClick={handleNewAnalysis} className="btn-secondary text-sm py-2 px-4">
                ← New Analysis
              </button>
              <a
                href={exportCSVUrl(sessionId)}
                download
                className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </a>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-3xl mx-auto px-5 py-12">

        {/* ─── Setup steps (0 + 1) ─────────────────────────────────────────── */}
        {step !== STEPS.RESULTS && (
          <>
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight mb-3">
                Resume Screening &<br />
                <span className="bg-gradient-to-r from-accent to-accentHi bg-clip-text text-transparent">
                  Candidate Ranking
                </span>
              </h1>
              <p className="text-white/40 text-base max-w-sm mx-auto leading-relaxed">
                Upload resumes and a job description. AI scores and ranks every candidate in seconds.
              </p>
            </div>

            <StepBar current={step} />

            {/* ── STEP 0: Upload Resumes ── */}
            {step === STEPS.UPLOAD && (
              <div className="space-y-5 animate-fade-up">
                <FileDropZone
                  onFiles={handleResumeFiles}
                  multiple
                  label="Upload Resumes"
                  hint="PDF, DOC, DOCX · Multiple files supported"
                  icon="📄"
                />

                {files.length > 0 && (
                  <div className="card p-4">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">
                      {files.length} file{files.length !== 1 ? 's' : ''} queued
                    </p>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {files.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center justify-between bg-surface rounded-xl px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">📄</span>
                            <span className="text-white/70 text-sm truncate">{f.name}</span>
                            <span className="text-white/20 text-xs flex-shrink-0">
                              {(f.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => removeLocalFile(f.name)}
                            className="text-white/20 hover:text-red transition-colors ml-3 flex-shrink-0 text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>Uploading...</span><span>{uploadPct}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accentHi rounded-full transition-all duration-300"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-red text-sm text-center">{error}</p>}

                <button
                  onClick={handleUploadResumes}
                  disabled={uploading || !files.length}
                  className="btn-primary w-full py-3.5 text-base"
                >
                  {uploading ? 'Uploading...' : `Continue → Add Job Description`}
                </button>
              </div>
            )}

            {/* ── STEP 1: Job Description ── */}
            {step === STEPS.JD && (
              <div className="space-y-5 animate-fade-up">
                <div>
                  <label className="block text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
                    Paste Job Description
                  </label>
                  <textarea
                    value={jdText}
                    onChange={(e) => { setJdText(e.target.value); clearError(); }}
                    placeholder="Paste the full job description here — include required skills, experience, responsibilities…"
                    rows={10}
                    className="input w-full resize-y text-sm leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-white/25 text-xs">or upload document</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <FileDropZone
                  onFiles={handleJdFile}
                  multiple={false}
                  label="Upload JD Document"
                  hint="PDF, DOC, DOCX, TXT"
                  icon="📋"
                />

                {jdFile && (
                  <p className="text-green text-sm text-center">
                    ✓ Loaded from: {jdFile.name}
                  </p>
                )}

                {error && <p className="text-red text-sm text-center">{error}</p>}

                {analyzing && (
                  <div className="card p-5 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                    <p className="text-white/60 text-sm">Analyzing {uploaded.length} resume{uploaded.length !== 1 ? 's' : ''} with AI…</p>
                    <p className="text-white/25 text-xs">This may take 15–45 seconds</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(STEPS.UPLOAD)} className="btn-secondary flex-1">
                    ← Back
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="btn-primary flex-[2] py-3.5"
                  >
                    {analyzing ? 'Analyzing…' : '⚡ Analyze & Rank Candidates'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── STEP 2: Results ──────────────────────────────────────────────── */}
        {step === STEPS.RESULTS && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <h2 className="font-display font-extrabold text-3xl text-white mb-1">Ranked Candidates</h2>
              <p className="text-white/30 text-sm">Click any candidate to expand score details</p>
            </div>

            {/* Stats */}
            <StatBar candidates={candidates} />

            {/* Controls */}
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates…"
                  className="input w-full pl-9 py-2.5 text-sm"
                />
              </div>
              <button
                onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                className="btn-secondary px-4 flex items-center gap-1.5 text-sm"
              >
                Score
                <span className="font-mono text-accent">{sortDir === 'desc' ? '↓' : '↑'}</span>
              </button>
            </div>

            {/* Candidate list */}
            <div className="space-y-3">
              {sortedCandidates.map((c, i) => (
                <CandidateCard key={c.id || i} candidate={c} animDelay={i * 60} />
              ))}
              {sortedCandidates.length === 0 && (
                <div className="card p-12 text-center text-white/25 text-sm">
                  No candidates match your search.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
