let confetti: ((opts: Record<string, unknown>) => void) | null = null;

async function getConfetti() {
  if (!confetti) {
    const mod = await import('canvas-confetti');
    confetti = mod.default as (opts: Record<string, unknown>) => void;
  }
  return confetti;
}

export async function celebrateCorrect() {
  const fire = await getConfetti();
  fire({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ['#6bd348', '#06b6d4', '#22c55e'] });
}

export async function celebrateWin() {
  const fire = await getConfetti();
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  const count = 200;
  const origin = { x: 0.5, y: 0.5 };
  fire({ ...defaults, particleCount: Math.ceil(count * 0.25), origin: { x: 0.2, y: 0.5 } });
  setTimeout(() => fire({ ...defaults, particleCount: Math.ceil(count * 0.25), origin: { x: 0.8, y: 0.5 } }), 150);
  setTimeout(() => fire({ ...defaults, particleCount: Math.ceil(count * 0.5), origin }), 300);
}
