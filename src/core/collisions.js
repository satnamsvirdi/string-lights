import { activateStrand } from './attachments.js';

/** Soft, inelastic strand contact. No bounce or positional teleporting. */
export function collideStrands(strands, held, dt) {
  const cells = new Map();
  // Build contacts only while an interacted rope moves; untouched decorations stay idle.
  const moving = strands.filter((s) => s.rope?.active && !s.rope.sleeping);
  if (!moving.length) return;
  for (const strand of strands) {
    const points = strand.rope?.active ? strand.rope.nodes : strand.points;
    for (let index = 0; index < points.length; index++) {
      const p = points[index];
      const key = `${Math.floor(p.x / 12)},${Math.floor(p.y / 12)}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push({ strand, index, p });
    }
  }
  for (const strand of moving) {
    for (const p of strand.rope.nodes) {
      if (p.pinned) continue;
      const cx = Math.floor(p.x / 12),
        cy = Math.floor(p.y / 12);
      for (let x = cx - 1; x <= cx + 1; x++)
        for (let y = cy - 1; y <= cy + 1; y++) {
          for (const other of cells.get(`${x},${y}`) || []) {
            if (other.strand === strand) continue;
            const dx = p.x - other.p.x,
              dy = p.y - other.p.y;
            const distance = Math.hypot(dx, dy);
            if (distance >= 8 || distance < 1e-6) continue;
            const original = other.strand.points[other.index];
            // Shared supports and designed junctions are connections, not collisions.
            if (Math.hypot(p.homeX - original.x, p.homeY - original.y) < 12) continue;
            activateStrand(other.strand);
            const q = other.strand.rope.nodes[other.index];
            const impulse = Math.min(0.08, (8 - distance) * dt * 2);
            if (strand !== held) {
              p.px -= (dx / distance) * impulse;
              p.py -= (dy / distance) * impulse;
            }
            if (!q.pinned && other.strand !== held) {
              q.px += (dx / distance) * impulse;
              q.py += (dy / distance) * impulse;
              other.strand.rope.sleeping = false;
              other.strand.rope.quietTime = 0;
            }
          }
        }
    }
  }
}
