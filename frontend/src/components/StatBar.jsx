import { scoreColor } from '../utils/score';

export default function StatBar({ candidates }) {
  if (!candidates?.length) return null;

  const total    = candidates.length;
  const avg      = Math.round(candidates.reduce((s, c) => s + c.score, 0) / total);
  const strong   = candidates.filter((c) => c.score >= 75).length;
  const moderate = candidates.filter((c) => c.score >= 50 && c.score < 75).length;
  const weak     = candidates.filter((c) => c.score < 50).length;

  const stats = [
    { label: 'Total Candidates', value: total,    icon: '👥', color: '#e2e2f0' },
    { label: 'Average Score',    value: avg,       icon: '📊', color: scoreColor(avg) },
    { label: 'Strong Matches',   value: strong,    icon: '✅', color: '#34d399' },
    { label: 'Moderate',         value: moderate,  icon: '⚡', color: '#fbbf24' },
    { label: 'Weak Matches',     value: weak,      icon: '⚠️', color: '#f87171' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="card p-4 text-center">
          <div className="text-xl mb-1">{s.icon}</div>
          <div className="font-display font-bold text-2xl" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="text-white/30 text-[11px] mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
