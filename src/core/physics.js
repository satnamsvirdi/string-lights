export const PHYSICS_STEP = 1 / 120;
const GRAVITY = 980;
const CONSTRAINT_PASSES = 40;
/** Position-based rope: local point constraints, pinned supports, gravity and inertia. */
export function createRope(points) {
  const nodes = points.map((p) => ({
    x: p.x,
    y: p.y,
    px: p.x,
    py: p.y,
    homeX: p.x,
    homeY: p.y,
    pinned: p.mobility < 1e-6,
    mass: 0,
  }));
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  nodes.forEach((n, i) => {
    n.mass = n.pinned
      ? 0
      : 24 / Math.max(1, (lengths[i - 1] ?? lengths[0]) + (lengths[i] ?? lengths.at(-1)));
  });
  return { nodes, lengths, active: false, accumulator: 0, quietTime: 0, sleeping: false };
}
export function ropeAttachment(rope, segment, t) {
  const a = rope.nodes[segment],
    b = rope.nodes[segment + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
/** One fixed simulation step; grab is a point along a segment, not a strand-wide offset. */
export function stepRope(rope, dt, grab = null, wind = 0) {
  const { nodes, lengths } = rope;
  for (const p of nodes) {
    if (p.pinned) {
      p.x = p.homeX;
      p.y = p.homeY;
      continue;
    }
    const speed = Math.hypot(p.x - p.px, p.y - p.py) / dt;
    const damping = Math.exp(-(0.5 + 0.0015 * speed) * dt);
    const vx = (p.x - p.px) * damping,
      vy = (p.y - p.py) * damping;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + wind * dt * dt;
    p.y += vy + GRAVITY * dt * dt;
  }
  function hold() {
    if (!grab) return;
    const a = nodes[grab.segment],
      b = nodes[grab.segment + 1],
      u = 1 - grab.t;
    const point = ropeAttachment(rope, grab.segment, grab.t);
    const weight = a.mass * u * u + b.mass * grab.t * grab.t;
    if (weight < 1e-8) return;
    a.x += ((grab.x - point.x) * a.mass * u) / weight;
    a.y += ((grab.y - point.y) * a.mass * u) / weight;
    b.x += ((grab.x - point.x) * b.mass * grab.t) / weight;
    b.y += ((grab.y - point.y) * b.mass * grab.t) / weight;
  }
  // Alternating sweeps avoid a directional bias and propagate tension to both supports.
  for (let pass = 0; pass < CONSTRAINT_PASSES; pass++) {
    hold();
    for (let k = 0; k < lengths.length; k++) {
      const i = pass % 2 ? lengths.length - 1 - k : k,
        a = nodes[i],
        b = nodes[i + 1];
      const dx = b.x - a.x,
        dy = b.y - a.y,
        length = Math.hypot(dx, dy),
        weight = a.mass + b.mass;
      if (!weight || !length) continue;
      const error = (length - lengths[i]) / length / weight;
      a.x += dx * error * a.mass;
      a.y += dy * error * a.mass;
      b.x -= dx * error * b.mass;
      b.y -= dy * error * b.mass;
    }
  }
}

/** Transfer the hand's release velocity at the held attachment without moving the rope's pose. */
export function releaseRope(rope, grab, velocity) {
  const a = rope.nodes[grab.segment],
    b = rope.nodes[grab.segment + 1],
    u = 1 - grab.t,
    dt = PHYSICS_STEP;
  const weight = a.mass * u * u + b.mass * grab.t * grab.t;
  if (weight < 1e-8) return;
  const vx = ((a.x - a.px) * u + (b.x - b.px) * grab.t) / dt;
  const vy = ((a.y - a.py) * u + (b.y - b.py) * grab.t) / dt;
  for (const [p, influence] of [
    [a, (a.mass * u) / weight],
    [b, (b.mass * grab.t) / weight],
  ]) {
    p.px -= (velocity.x - vx) * influence * dt;
    p.py -= (velocity.y - vy) * influence * dt;
  }
  rope.sleeping = false;
  rope.quietTime = 0;
}
