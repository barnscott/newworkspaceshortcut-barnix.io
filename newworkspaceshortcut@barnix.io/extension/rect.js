// Plain {x, y, width, height} rect helpers. No Shell imports, so tests can load them.

export function plainRect(r) {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

export function sameRect(a, b) {
  return !!a && !!b &&
    a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}
