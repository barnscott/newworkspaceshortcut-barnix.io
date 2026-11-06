// Monitor choice for Focus Changer, on plain {x, y, width, height} rects.
// No Shell imports, so tests/test-focus.js can load it.

const VERTICAL = new Set(['focus-changer-up', 'focus-changer-down']);

// Gap from the active monitor's edge to g, or -1 when g is not wholly beyond it.
function gapBeyond(direction, a, g) {
  let d;
  switch (direction) {
    case 'focus-changer-up':   d = a.y - (g.y + g.height); break;
    case 'focus-changer-down': d = g.y - (a.y + a.height); break;
    case 'focus-changer-left': d = a.x - (g.x + g.width); break;
    default:                   d = g.x - (a.x + a.width); break;
  }
  return d >= 0 ? d : -1;
}

// Index into monitors, or null. Prefers Mutter's neighbours (shared edge,
// overlapping span), then the rest beyond that edge; nearest `along` first.
// https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/backends/meta-logical-monitor.c#L319
export function pickAdjacentMonitor(direction, activeIndex, monitors, along) {
  const a = monitors[activeIndex];
  if (!a) return null;
  const vertical = VERTICAL.has(direction);
  const lo = g => vertical ? g.x : g.y;
  const hi = g => vertical ? g.x + g.width : g.y + g.height;
  let best = null;
  let bestKey = null;

  monitors.forEach((g, i) => {
    if (i === activeIndex) return;
    const gap = gapBeyond(direction, a, g);
    if (gap < 0) return;
    const neighbour = gap === 0 && hi(g) > lo(a) && lo(g) < hi(a);
    const offset = along < lo(g) ? lo(g) - along : along > hi(g) ? along - hi(g) : 0;
    const key = [neighbour ? 0 : 1, offset, gap];
    if (!bestKey || compareKeys(key, bestKey) < 0) { best = i; bestKey = key; }
  });
  return best;
}

function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}
