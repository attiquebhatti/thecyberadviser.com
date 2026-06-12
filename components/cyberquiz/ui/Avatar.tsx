'use client';

interface AvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

const GRADIENTS: [string, string][] = [
  ['#7c3aed', '#a855f7'], ['#06b6d4', '#0284c7'], ['#5b21b6', '#7c3aed'],
  ['#0e7490', '#06b6d4'], ['#4f46e5', '#7c3aed'], ['#7c3aed', '#06b6d4'],
  ['#6d28d9', '#4f46e5'], ['#0891b2', '#7c3aed'],
];

function getInitials(seed: string): string {
  if (!seed) return '?';
  const name = seed.includes('@') ? seed.split('@')[0] : seed;
  const parts = name.split(/[\s._\-+]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function CQAvatar({ seed, size = 40, className = '' }: AvatarProps) {
  const initials = getInitials(seed);
  const [from, to] = getGradient(seed);
  return (
    <div
      className={`rounded-full flex items-center justify-center select-none shrink-0 font-bold ${className}`}
      style={{
        width: size, height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: Math.round(size * 0.38), color: '#ffffff',
        boxShadow: `0 2px 8px ${from}40`, letterSpacing: '0.03em',
      }}
      title={seed}
    >
      {initials}
    </div>
  );
}
