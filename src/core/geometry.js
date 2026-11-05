import { normalizeOptions } from './options.js';
import { random } from './utils.js';
const MAX_BULBS = 600;
const MAX_WIRE_SEGMENTS = 128;
/** Pure geometry, also useful for custom renderers. Coordinates are CSS pixels. */
export function createGeometry(width, height, input = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height))
    throw new TypeError('Geometry dimensions must be finite.');
  if (width > 1_000_000 || height > 1_000_000)
    throw new RangeError('Geometry dimensions cannot exceed 1,000,000 CSS pixels.');
  const o = normalizeOptions(input),
    rand = random(o.seed),
    wires = [],
    freeEnds = new Set(),
    bulbs = [];
  if (!(width > 0 && height > 0)) return { wires, bulbs };
  const add = (points, angle = 0, freeEnd = false) => {
    const wire = wires.length;
    wires.push(points);
    if (freeEnd) freeEnds.add(wire);
    let distance = 0,
      next = o.spacing * 0.5;
    for (let i = 1; i < points.length && bulbs.length < MAX_BULBS; i++) {
      const a = points[i - 1],
        b = points[i],
        length = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= distance + length && bulbs.length < MAX_BULBS) {
        const t = (next - distance) / Math.max(length, 0.001);
        bulbs.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          mobility: a.mobility + (b.mobility - a.mobility) * t,
          wire,
          segment: i - 1,
          t,
          angle,
          shape: Array.isArray(o.shape) ? o.shape[bulbs.length % o.shape.length] : o.shape,
          color: o.colors[bulbs.length % o.colors.length],
          phase: rand(),
          group: bulbs.length % 4,
        });
        next += o.spacing;
      }
      distance += length;
    }
  };
  const swag = (y, waves = 2, sag = o.sag) => {
    // Continue a half-span beyond both edges: no exposed cable ends in the viewport.
    const span = width / waves,
      depth = Math.min(sag, height * 0.25);
    let lo = span / 40,
      hi = Math.max((span * span) / Math.max(depth, 0.001), span);
    for (let i = 0; i < 50; i++) {
      const a = (lo + hi) / 2;
      if (a * (Math.cosh(span / (2 * a)) - 1) > depth) lo = a;
      else hi = a;
    }
    const a = hi;
    for (let k = -1; k < waves; k++) {
      const left = (k + 0.5) * span,
        n = Math.min(MAX_WIRE_SEGMENTS, Math.max(16, Math.ceil(span / 12)));
      add(
        Array.from({ length: n + 1 }, (_, i) => {
          const u = i / n,
            x = left + span * u;
          return {
            x,
            y:
              y +
              (depth === 0
                ? 0
                : a * (Math.cosh(span / (2 * a)) - Math.cosh((x - left - span / 2) / a))),
            mobility: Math.sin(Math.PI * u),
          };
        }),
      );
    }
  };
  if (o.layout === 'roofline') swag(12);
  if (o.layout === 'draped') for (let row = 0; row < 3; row++) swag(12 + row * 38, 3, o.sag * 0.65);
  if (o.layout === 'curtain') {
    swag(12, 2, o.sag);
    // Attach drops midway between the bulbs that actually fit on the header.
    const headerWires = [...wires];
    const headerBulbs = clearBulbOverlaps(bulbs, o).sort((a, b) => a.x - b.x);
    for (let i = 0; i + 1 < headerBulbs.length; i += 2) {
      const x = (headerBulbs[i].x + headerBulbs[i + 1].x) / 2;
      if (x < 10 || x > width - 10) continue;
      const header = headerWires.find((points) => x >= points[0].x && x <= points.at(-1).x);
      const segment = header.findIndex((point, j) => j > 0 && point.x >= x);
      const a = header[segment - 1],
        b = header[segment];
      const y = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
      const length = Math.max(20, (height - 40) * (0.4 + rand() * 0.6));
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil(length / 12)));
      add(
        Array.from({ length: n + 1 }, (_, j) => ({
          x,
          y: y + (length * j) / n,
          mobility: (j / n) ** 2,
          ...(j === 0
            ? {
                attachment: {
                  wire: headerWires.indexOf(header),
                  segment: segment - 1,
                  t: (x - a.x) / (b.x - a.x),
                },
              }
            : {}),
        })),
        0,
        true,
      );
    }
  }
  if (o.layout === 'border') {
    swag(12, 2, o.sag);
    for (const x of [8, width - 8]) {
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil((height + 40) / 12)));
      add(
        Array.from({ length: n + 1 }, (_, i) => ({
          x,
          y: -20 + ((height + 40) * i) / n,
          mobility: (i / n) ** 2,
        })),
        x < width / 2 ? -90 : 90,
        true,
      );
    }
  }
  const accepted = clearBulbOverlaps(bulbs, o);
  const byWire = new Map();
  for (const bulb of accepted) {
    if (!byWire.has(bulb.wire)) byWire.set(bulb.wire, []);
    byWire.get(bulb.wire).push(bulb);
  }
  // Trim after overlap removal: a skipped terminal bulb must not leave a bare cable tail.
  for (const index of freeEnds) {
    const mounted = byWire.get(index) || [];
    const last = mounted.at(-1),
      points = wires[index];
    if (!last) {
      points.length = 0;
      continue;
    }
    const segment = last.segment,
      t = last.t;
    const mobility = last.mobility;
    if (t > 1e-8) {
      points.splice(segment + 1, points.length, { x: last.x, y: last.y, mobility });
      for (const bulb of mounted) if (bulb.segment === segment) bulb.t /= t;
    } else {
      points.length = segment + 1;
      for (const bulb of mounted)
        if (bulb.segment === segment) {
          bulb.segment--;
          bulb.t = 1;
        }
    }
    for (const point of points) point.mobility /= mobility;
    for (const bulb of mounted) bulb.mobility /= mobility;
  }
  const indices = new Map();
  const visibleWires = wires.filter((points, index) => {
    if (points.length < 2) return false;
    indices.set(index, indices.size);
    return true;
  });
  for (const bulb of accepted) bulb.wire = indices.get(bulb.wire);
  for (const wire of visibleWires)
    if (wire[0].attachment) wire[0].attachment.wire = indices.get(wire[0].attachment.wire);
  return { wires: visibleWires, bulbs: accepted };
}
function clearBulbOverlaps(bulbs, o) {
  // Compare physical envelopes, including sockets and mounting rotation. Halos may overlap.
  const accepted = [],
    cells = new Map();
  const cellSize = 64;
  for (const bulb of bulbs) {
    // Retry a crowded shape at the next attachment rather than omitting it from the mix.
    if (Array.isArray(o.shape)) bulb.shape = o.shape[accepted.length % o.shape.length];
    const envelope =
      bulb.shape === 'flower'
        ? [-13, -4, 14, 23]
        : bulb.shape === 'round'
          ? [-7, -2, 7, 17]
          : bulb.shape === 'crystal'
            ? [-6, -2, 6, 20]
            : [-4, -2, 4, 19];
    const radians = (bulb.angle * Math.PI) / 180,
      cos = Math.cos(radians),
      sin = Math.sin(radians);
    const corners = [
      [envelope[0], envelope[1]],
      [envelope[0], envelope[3]],
      [envelope[2], envelope[1]],
      [envelope[2], envelope[3]],
    ].map(([x, y]) => ({
      x: bulb.x + (x * cos - y * sin) * o.size,
      y: bulb.y + (x * sin + y * cos) * o.size,
    }));
    const gap = 3;
    const bounds = {
      left: Math.min(...corners.map((p) => p.x)) - gap,
      right: Math.max(...corners.map((p) => p.x)) + gap,
      top: Math.min(...corners.map((p) => p.y)) - gap,
      bottom: Math.max(...corners.map((p) => p.y)) + gap,
    };
    const keys = [];
    const neighbors = new Set();
    for (
      let x = Math.floor(bounds.left / cellSize);
      x <= Math.floor(bounds.right / cellSize);
      x++
    ) {
      for (
        let y = Math.floor(bounds.top / cellSize);
        y <= Math.floor(bounds.bottom / cellSize);
        y++
      ) {
        const key = `${x}:${y}`;
        keys.push(key);
        for (const other of cells.get(key) || []) neighbors.add(other);
      }
    }
    if (
      [...neighbors].some(
        (other) =>
          bounds.left < other.right &&
          bounds.right > other.left &&
          bounds.top < other.bottom &&
          bounds.bottom > other.top,
      )
    )
      continue;
    bulb.color = o.colors[accepted.length % o.colors.length];
    bulb.group = accepted.length % 4;
    for (const key of keys) {
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(bounds);
    }
    accepted.push(bulb);
  }
  return accepted;
}
