const STEPS = ['Upload Resumes', 'Job Description', 'Analyze & Rank'];

export default function StepBar({ current }) {
  // current: 0, 1, 2
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              text-xs font-bold font-display transition-all duration-300
              ${i < current
                ? 'bg-accent text-white'
                : i === current
                  ? 'bg-accent text-white ring-2 ring-accentHi ring-offset-2 ring-offset-bg'
                  : 'bg-surface border border-border text-white/25'
              }
            `}>
              {i < current ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-[11px] whitespace-nowrap ${i <= current ? 'text-white/70' : 'text-white/20'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="w-12 sm:w-20 h-px mx-2 mb-5 transition-colors duration-300"
              style={{ background: i < current ? '#5b5bd6' : '#1e1e35' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
