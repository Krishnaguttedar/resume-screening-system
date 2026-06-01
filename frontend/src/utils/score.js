export function scoreColor(score) {
  if (score >= 75) return '#34d399';   // green
  if (score >= 50) return '#fbbf24';   // amber
  return '#f87171';                    // red
}

export function scoreLabel(score) {
  if (score >= 75) return 'Strong Match';
  if (score >= 50) return 'Moderate Match';
  return 'Weak Match';
}

export function scoreBgClass(score) {
  if (score >= 75) return 'tag-green';
  if (score >= 50) return 'tag-amber';
  return 'tag-red';
}

export function rankEmoji(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
