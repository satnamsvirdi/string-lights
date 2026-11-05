import { tether } from './tether.js';
export const PHYSICS_STEP = 1 / 120;
const GRAVITY = 980;
const SOLVERS = new WeakMap();
const TAUT = new WeakSet();
function constrainLengths(rope, grab, predictor = false) {
  const { nodes, lengths } = rope,
    count = lengths.length;
  let work = SOLVERS.get(rope);
  if (!work) {
    work = Array.from({ length: 10 }, (_, i) => new Float64Array(count + (i >= 7 ? 1 : 0)));
    for (let i = 0; i < count; i++) work[9][i + 1] = work[9][i] + lengths[i];
    SOLVERS.set(rope, work);
  }
  const [nx, ny, upper, rhs, lambda, bx, by, deltaX, deltaY] = work;
  const segment = grab?.segment ?? -2,
    t = grab?.t ?? 0,
    u = 1 - t;
  const ma = nodes[segment]?.mass ?? 0,
    mb = nodes[segment + 1]?.mass ?? 0;
  const coupling = (i) =>
    i === segment - 1 ? ma * u : i === segment ? mb * t - ma * u : i === segment + 1 ? -mb * t : 0;
  let error = 0,
    energy = 0;
  for (let i = 0; i < count; i++) {
    const a = nodes[i],
      b = nodes[i + 1],
      dx = predictor ? b.px - a.px : b.x - a.x,
      dy = predictor ? b.py - a.py : b.y - a.y;
    const distance = Math.max(1e-14, Math.hypot(dx, dy));
    nx[i] = dx / distance;
    ny[i] = dy / distance;
    const residual = lengths[i] - Math.hypot(b.x - a.x, b.y - a.y);
    rhs[i] = predictor
      ? lengths[i] - distance - nx[i] * (b.x - a.x - dx) - ny[i] * (b.y - a.y - dy)
      : residual;
    error = Math.max(error, Math.abs(residual));
    energy += residual * residual;
    if (grab) {
      const c = coupling(i);
      bx[i] = nx[i] * c;
      by[i] = ny[i] * c;
    }
  }
  if (grab) {
    const p = ropeAttachment(rope, segment, t);
    error = Math.max(error, Math.hypot(grab.x - p.x, grab.y - p.y));
    energy += (grab.x - p.x) ** 2 + (grab.y - p.y) ** 2;
  }
  if (error < 1e-11) return;
  // Solve the coupled distance constraints together: tension crosses the whole chain in one pass.
  // The Jacobian system is tridiagonal because only neighboring segments share a node.
  for (let i = 0; i < count; i++) {
    const lower = i ? -nodes[i].mass * (nx[i] * nx[i - 1] + ny[i] * ny[i - 1]) : 0;
    const diagonal = Math.max(
      1e-14,
      nodes[i].mass + nodes[i + 1].mass + 1e-14 - lower * (upper[i - 1] || 0),
    );
    upper[i] =
      i + 1 < count ? (-nodes[i + 1].mass * (nx[i] * nx[i + 1] + ny[i] * ny[i + 1])) / diagonal : 0;
    rhs[i] = (rhs[i] - lower * (rhs[i - 1] || 0)) / diagonal;
    if (grab) {
      bx[i] = (bx[i] - lower * (bx[i - 1] || 0)) / diagonal;
      by[i] = (by[i] - lower * (by[i - 1] || 0)) / diagonal;
    }
  }
  for (let i = count - 1; i >= 0; i--) {
    lambda[i] = rhs[i] - upper[i] * (lambda[i + 1] || 0);
    if (grab) {
      bx[i] -= upper[i] * (bx[i + 1] || 0);
      by[i] -= upper[i] * (by[i + 1] || 0);
    }
  }
  let handX = 0,
    handY = 0;
  if (grab && ma * u * u + mb * t * t > 1e-8) {
    const point = ropeAttachment(rope, segment, t);
    let xx = ma * u * u + mb * t * t + 1e-14,
      yy = xx,
      xy = 0;
    let rx = grab.x - point.x,
      ry = grab.y - point.y;
    // A two-coordinate Schur complement couples the held attachment to the cable solve.
    for (let i = Math.max(0, segment - 1); i < Math.min(count, segment + 2); i++) {
      const x = nx[i] * coupling(i),
        y = ny[i] * coupling(i);
      xx -= x * bx[i];
      yy -= y * by[i];
      xy -= x * by[i];
      rx -= x * lambda[i];
      ry -= y * lambda[i];
    }
    const determinant = Math.max(1e-16, xx * yy - xy * xy);
    handX = (rx * yy - ry * xy) / determinant;
    handY = (ry * xx - rx * xy) / determinant;
    for (let i = 0; i < count; i++) lambda[i] -= bx[i] * handX + by[i] * handY;
  }
  for (let i = 0; i < nodes.length; i++) {
    const p = nodes[i];
    const hand = i === segment ? u : i === segment + 1 ? t : 0;
    deltaX[i] =
      p.mass *
      ((i ? nx[i - 1] * lambda[i - 1] : 0) - (i < count ? nx[i] * lambda[i] : 0) + hand * handX);
    deltaY[i] =
      p.mass *
      ((i ? ny[i - 1] * lambda[i - 1] : 0) - (i < count ? ny[i] * lambda[i] : 0) + hand * handY);
  }
  // Safeguard Newton steps near a taut configuration instead of flipping the cable through a fold.
  let scale = 1;
  for (let attempt = 0; !grab && attempt < 18; attempt++) {
    let next = 0;
    for (let i = 0; i < count; i++) {
      const a = nodes[i],
        b = nodes[i + 1];
      const d =
        Math.hypot(
          b.x - a.x + scale * (deltaX[i + 1] - deltaX[i]),
          b.y - a.y + scale * (deltaY[i + 1] - deltaY[i]),
        ) - lengths[i];
      next += d * d;
    }
    if (grab) {
      const p = ropeAttachment(rope, segment, t);
      next +=
        (p.x + scale * (deltaX[segment] * u + deltaX[segment + 1] * t) - grab.x) ** 2 +
        (p.y + scale * (deltaY[segment] * u + deltaY[segment + 1] * t) - grab.y) ** 2;
    }
    if (next <= energy + 1e-16) break;
    scale *= 0.5;
  }
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].x += scale * deltaX[i];
    nodes[i].y += scale * deltaY[i];
    if (!grab && !nodes[i].pinned)
      tether(nodes[i], nodes[0], work[9][i], nodes.at(-1), work[9][count] - work[9][i]);
  }
}
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
  const rope = { nodes, lengths, active: false, accumulator: 0, quietTime: 0, sleeping: false };
  if (
    nodes[0]?.pinned &&
    nodes.at(-1)?.pinned &&
    Math.abs(
      lengths.reduce((sum, length) => sum + length, 0) -
        Math.hypot(nodes.at(-1).x - nodes[0].x, nodes.at(-1).y - nodes[0].y),
    ) < 1e-8
  )
    TAUT.add(rope);
  return rope;
}
export function ropeAttachment(rope, segment, t) {
  const a = rope.nodes[segment],
    b = rope.nodes[segment + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
/** One fixed simulation step; grab is a point along a segment, not a strand-wide offset. */
export function stepRope(rope, dt, grab = null, wind = 0) {
  const { nodes } = rope;
  if (TAUT.has(rope)) {
    for (const p of nodes) {
      p.x = p.px = p.homeX;
      p.y = p.py = p.homeY;
    }
    return;
  }
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
  // Newton projection preserves cable length without iteration-dependent stretch on wide spans.
  if (!grab) constrainLengths(rope, null, true);
  for (let pass = 0; pass < (grab ? 12 : 6); pass++) constrainLengths(rope, grab);
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
