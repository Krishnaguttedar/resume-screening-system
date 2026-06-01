import { scoreColor } from '../utils/score';

export default function ScoreRing({ score, size = 72 }) {
  const stroke = 5;
  const r      = (size / 2) - stroke - 2;
  const circ   = 2 * Math.PI * r;
  const dash   = ((score ?? 0) / 100) * circ;
  const color  = scoreColor(score ?? 0);
  const cx     = size / 2;
  const cy     = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#1e1e35"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Score text */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size <= 56 ? 13 : 16}
        fontWeight="700"
        fontFamily="'Syne', sans-serif"
      >
        {score ?? '--'}
      </text>
    </svg>
  );
}
