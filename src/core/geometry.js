import { normalizeOptions } from './options.js';
import { random } from './utils.js';
import { sampleChain, fitSpacing, bulbEnvelope } from './spacing.js';
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
  const addBulb = (slot, angle) =>
    bulbs.push({
      ...slot,
      angle,
      shape: Array.isArray(o.shape) ? o.shape[bulbs.length % o.shape.length] : o.shape,
      color: o.colors[bulbs.length % o.colors.length],
      phase: rand(),
      group: bulbs.length % 4,
    });
  const add = (points, angle = 0, freeEnd = false) => {
    const wire = wires.length;
    wires.push(points);
    if (freeEnd) freeEnds.add(wire);
    for (const slot of sampleChain([points], o.spacing, MAX_BULBS - bulbs.length))
      addBulb({ ...slot, wire }, angle);
  };
  const swag = (y, waves = o.anchorCount || 2, sag = o.sag) => {
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
    const row = [];
    for (let k = -1; k < waves; k++) {
      const left = (k + 0.5) * span,
        n = Math.min(MAX_WIRE_SEGMENTS, Math.max(16, Math.ceil(span / 12)));
      row.push(
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
    const start = wires.length;
    wires.push(...row);
    for (const slot of fitSpacing(row, o, MAX_BULBS - bulbs.length))
      addBulb({ ...slot, wire: start + slot.wire }, 0);
  };
  if (o.layout === 'roofline') swag(12);
  if (o.layout === 'draped')
    for (let row = 0; row < 3; row++) swag(12 + row * 38, o.anchorCount || 3, o.sag * 0.65);
  if (o.layout === 'curtain') {
    swag(12);
    // Attach drops midway between the bulbs that actually fit on the header.
    const headerWires = [...wires];
    const headerBulbs = clearBulbOverlaps(bulbs, o).sort((a, b) => a.x - b.x);
    const anchors = [];
    for (let i = 0; i + 1 < headerBulbs.length; i += 2) {
      const x = (headerBulbs[i].x + headerBulbs[i + 1].x) / 2;
      if (x < 10 || x > width - 10) continue;
      const header = headerWires.find((points) => x >= points[0].x && x <= points.at(-1).x);
      const segment = header.findIndex((point, j) => j > 0 && point.x >= x);
      const a = header[segment - 1],
        b = header[segment];
      const t = (x - a.x) / (b.x - a.x);
      anchors.push({
        x,
        y: a.y + (b.y - a.y) * t,
        attachment: { wire: headerWires.indexOf(header), segment: segment - 1, t },
      });
    }
    if (anchors.length) {
      // Equal cable lengths follow the header's sag. Share the bulb budget across every drop.
      const length = Math.min(
        Math.max(20, height - 40 - Math.max(...anchors.map((p) => p.y))),
        Math.floor((MAX_BULBS - bulbs.length) / anchors.length) * o.spacing,
      );
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil(length / 12)));
      if (length > 0)
        for (const { x, y, attachment } of anchors) {
          add(
            Array.from({ length: n + 1 }, (_, j) => ({
              x,
              y: y + (length * j) / n,
              mobility: (j / n) ** 2,
              ...(j === 0 ? { attachment } : {}),
            })),
            0,
            true,
          );
        }
    }
  }
  if (o.layout === 'border') {
    swag(12);
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
    const envelope = bulbEnvelope(bulb.shape);
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
          bounds.left < other.right - 1e-7 &&
          bounds.right > other.left + 1e-7 &&
          bounds.top < other.bottom - 1e-7 &&
          bounds.bottom > other.top + 1e-7,
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
