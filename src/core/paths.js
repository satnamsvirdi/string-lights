export function pathFor(points, displacement = 0, dx = 0, dy = 0) {
  const p = points.map((point) => ({
    x: point.x + (displacement + dx) * (point.mobility ?? 0),
    y: point.y + (displacement * 0.12 + dy) * (point.mobility ?? 0),
  }));
  let d = `M${p[0].x},${p[0].y}`;
  // Interpolating cubic segments remove visible corners without moving attachment points.
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)],
      b = p[i],
      c = p[i + 1],
      e = p[Math.min(p.length - 1, i + 2)];
    d += ` C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`;
  }
  return d;
}
