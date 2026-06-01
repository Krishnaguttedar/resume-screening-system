import { useState } from 'react';
import ScoreRing from './ScoreRing';
import { scoreColor, scoreLabel, scoreBgClass, rankEmoji } from '../utils/score';

export default function CandidateCard({ candidate, animDelay = 0 }) {
  const [open, setOpen] = useState(false);

  const {
    rank,
    candidate_name,
    file_name,
    score,
    summary,
    matching_skills = [],
    missing_skills  = [],
    score_breakdown = {},
  } = candidate;

  const matchSkills = Array.isArray(matching_skills) ? matching_skills : JSON.parse(matching_skills || '[]');
  const missSkills  = Array.isArray(missing_skills)  ? missing_skills  : JSON.parse(missing_skills  || '[]');
  const breakdown   = typeof score_breakdown === 'object' ? score_breakdown : JSON.parse(score_breakdown || '{}');

  const breakdownItems = [
    { key: 'skillsMatch',         label: 'Skills Match',        weight: '30%' },
    { key: 'experienceRelevance', label: 'Experience',          weight: '30%' },
    { key: 'educationAlignment',  label: 'Education',           weight: '20%' },
    { key: 'keywordSimilarity',   label: 'Keyword Similarity',  weight: '20%' },
  ];

  return (
    <div
      className="candidate-card card overflow-hidden opacity-0 animate-fade-up"
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'forwards' }}
    >
      {/* ── Header Row ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors text-left"
      >
        {/* Rank */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          font-display font-bold text-sm
          ${rank <= 3
            ? 'bg-accent/15 text-accentHi border border-accent/30'
            : 'bg-surface text-white/40 border border-border'
          }
        `}>
          {rank <= 3 ? rankEmoji(rank) : `#${rank}`}
        </div>

        {/* Score ring */}
        <ScoreRing score={score} size={60} />

        {/* Name + label */}
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-white truncate text-base leading-tight mb-1">
            {candidate_name || 'Unknown Candidate'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={scoreBgClass(score)}>{scoreLabel(score)}</span>
            <span className="text-white/25 text-xs truncate">{file_name}</span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded Detail ── */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-5">

          {/* Score Breakdown */}
          <div>
            <h4 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">
              Score Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {breakdownItems.map(({ key, label, weight }) => {
                const val   = breakdown[key] ?? 0;
                const color = scoreColor(val);
                return (
                  <div key={key} className="bg-surface rounded-xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/50 text-xs">{label}</span>
                      <span className="text-white/25 text-[10px] font-mono">{weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${val}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color }}>{val}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-green text-[11px] font-semibold uppercase tracking-widest mb-2">
                ✓ Matching Skills
              </h4>
              {matchSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {matchSkills.map((s, i) => (
                    <span key={i} className="tag-green">{s}</span>
                  ))}
                </div>
              ) : (
                <span className="text-white/20 text-xs">None identified</span>
              )}
            </div>
            <div>
              <h4 className="text-red text-[11px] font-semibold uppercase tracking-widest mb-2">
                ✗ Missing Skills
              </h4>
              {missSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {missSkills.map((s, i) => (
                    <span key={i} className="tag-red">{s}</span>
                  ))}
                </div>
              ) : (
                <span className="text-white/20 text-xs">No gaps found</span>
              )}
            </div>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="bg-surface rounded-xl p-4">
              <h4 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-2">
                AI Assessment
              </h4>
              <p className="text-white/70 text-sm leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
