/** Project onto the intersection of the support reach disks, including near-taut cables. */
export function tether(point, a, ra, b, rb) {
  const x = point.x,
    y = point.y;
  if (!a.pinned && !b.pinned) return;
  if (!a.pinned) {
    [a, b] = [b, a];
    [ra, rb] = [rb, ra];
  }
  const ax = a.homeX,
    ay = a.homeY,
    bx = b.homeX,
    by = b.homeY;
  const da = Math.hypot(x - ax, y - ay),
    db = Math.hypot(x - bx, y - by);
  if (da <= ra && (!b.pinned || db <= rb)) return;
  const qa = Math.min(1, ra / Math.max(da, 1e-12));
  const x1 = ax + (x - ax) * qa,
    y1 = ay + (y - ay) * qa;
  if (!b.pinned || Math.hypot(x1 - bx, y1 - by) <= rb) {
    point.x = x1;
    point.y = y1;
    return;
  }
  const qb = Math.min(1, rb / Math.max(db, 1e-12));
  const x2 = bx + (x - bx) * qb,
    y2 = by + (y - by) * qb;
  if (Math.hypot(x2 - ax, y2 - ay) <= ra) {
    point.x = x2;
    point.y = y2;
    return;
  }
  const dx = bx - ax,
    dy = by - ay,
    d = Math.hypot(dx, dy);
  if (d < 1e-12) {
    point.x = x1;
    point.y = y1;
    return;
  }
  const along = (ra * ra - rb * rb + d * d) / (2 * d),
    h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const cx = ax + (dx / d) * along,
    cy = ay + (dy / d) * along;
  const side = (x - cx) * -dy + (y - cy) * dx < 0 ? -1 : 1;
  point.x = cx - ((side * dy) / d) * h;
  point.y = cy + ((side * dx) / d) * h;
}
