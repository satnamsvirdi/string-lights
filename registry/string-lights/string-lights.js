// src/core/utils.js
var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s += 1831565813;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// src/core/options.js
var palettes = /* @__PURE__ */ Object.freeze({
  multicolor: /* @__PURE__ */ Object.freeze([
    "#ff3158",
    "#ffc329",
    "#35f269",
    "#4385ff",
    "#ff46bd",
    "#ffffff"
  ]),
  electric: /* @__PURE__ */ Object.freeze(["#ff102c", "#16ff38", "#233dff", "#ffe600", "#e9f5ff"]),
  warm: /* @__PURE__ */ Object.freeze(["#ffd080"]),
  white: /* @__PURE__ */ Object.freeze(["#ffffff"]),
  tricolor: /* @__PURE__ */ Object.freeze(["#ff9438", "#ffffff", "#32df75"])
});
var layouts = /* @__PURE__ */ Object.freeze(["roofline", "curtain", "draped", "border"]);
var shapes = /* @__PURE__ */ Object.freeze([
  "rice",
  "round",
  "crystal",
  "flower",
  "led",
  "heart"
]);
var modes = /* @__PURE__ */ Object.freeze([
  "static",
  "blink",
  "chase",
  "wave",
  "alternate",
  "pairs",
  "double",
  "steps",
  "bounce",
  "fade"
]);
var defaults = /* @__PURE__ */ Object.freeze({
  layout: "roofline",
  shape: "rice",
  colors: "multicolor",
  mode: "fade",
  animated: true,
  spacing: 28,
  size: 1,
  sag: 48,
  anchorCount: 0,
  speed: 1,
  glow: 0.65,
  glitter: false,
  dimBase: false,
  breeze: true,
  wind: 1,
  interactive: true,
  collisions: true,
  seed: 7,
  paused: false,
  pagePosition: "fixed",
  patternOrder: "fixed",
  patternInterval: 10,
  patternSequence: /* @__PURE__ */ Object.freeze(["blink", "chase", "wave", "fade"])
});
function normalizeOptions(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new TypeError("options must be an object.");
  const o = { ...defaults };
  for (const [key, value] of Object.entries(input)) {
    if (Object.hasOwn(defaults, key) && value !== void 0) o[key] = value;
  }
  for (const [key, list] of [
    ["layout", layouts],
    ["mode", modes],
    ["patternOrder", ["fixed", "cycle", "random"]],
    ["pagePosition", ["fixed", "absolute"]]
  ]) {
    if (!list.includes(o[key])) throw new TypeError(`Unknown ${key}: ${o[key]}`);
  }
  if (Array.isArray(o.shape)) {
    if (!o.shape.length || o.shape.some((shape) => !shapes.includes(shape)))
      throw new TypeError("shape must be a bulb name or a nonempty array of bulb names.");
    o.shape = [...o.shape];
  } else if (!shapes.includes(o.shape)) throw new TypeError(`Unknown shape: ${o.shape}`);
  if (!Array.isArray(o.patternSequence) || !o.patternSequence.length || o.patternSequence.some((mode) => !modes.includes(mode)) || new Set(o.patternSequence).size !== o.patternSequence.length)
    throw new TypeError("patternSequence must be a nonempty array of distinct pattern names.");
  o.patternSequence = [...o.patternSequence];
  o.colors = typeof o.colors === "string" ? palettes[o.colors] : o.colors;
  if (!Array.isArray(o.colors) || !o.colors.length || o.colors.some((c) => typeof c !== "string" || !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c))) {
    throw new TypeError(
      "colors must be a palette name or a nonempty array of #RGB / #RRGGBB colors."
    );
  }
  o.colors = [...o.colors];
  for (const [key, min, max] of [
    ["spacing", 16, 100],
    ["size", 0.5, 2.5],
    ["sag", 0, 140],
    ["speed", 0.2, 2],
    ["glow", 0, 1],
    ["wind", 0, 2],
    ["patternInterval", 1, 3600]
  ]) {
    if (!Number.isFinite(o[key])) throw new TypeError(`${key} must be finite.`);
    o[key] = clamp(o[key], min, max);
  }
  if (!Number.isFinite(o.seed)) throw new TypeError("seed must be finite.");
  if (!Number.isInteger(o.anchorCount) || o.anchorCount < 0 || o.anchorCount > 12)
    throw new TypeError("anchorCount must be an integer from 0 to 12 (0 uses the layout default).");
  for (const key of [
    "glitter",
    "dimBase",
    "breeze",
    "interactive",
    "paused",
    "animated",
    "collisions"
  ]) {
    if (typeof o[key] !== "boolean") throw new TypeError(`${key} must be boolean.`);
  }
  return o;
}

// src/core/presets.js
function preset(name, description, input) {
  const options = { ...normalizeOptions(input), colors: input.colors || "multicolor" };
  for (const value of Object.values(options)) if (Array.isArray(value)) Object.freeze(value);
  return Object.freeze({ name, description, options: Object.freeze(options) });
}
var stringLightsPresets = /* @__PURE__ */ Object.freeze({
  festive: /* @__PURE__ */ preset(
    "Diwali rainbow",
    "Colorful rice bulbs with white accents and shuffled lighting patterns.",
    {
      layout: "roofline",
      shape: "rice",
      colors: "multicolor",
      size: 1.2,
      dimBase: true,
      patternOrder: "random",
      patternInterval: 8
    }
  ),
  classic: /* @__PURE__ */ preset(
    "Classic electric",
    "Traditional multicolor LED strings with a running chase.",
    {
      layout: "curtain",
      shape: "led",
      colors: "electric",
      mode: "chase",
      spacing: 24,
      size: 1.2,
      dimBase: true
    }
  ),
  warm: /* @__PURE__ */ preset(
    "Warm gathering",
    "Layered amber rice lights with a steady, gentle glow.",
    {
      layout: "draped",
      shape: "rice",
      colors: "warm",
      mode: "static",
      spacing: 32,
      glow: 0.55
    }
  ),
  white: /* @__PURE__ */ preset(
    "White snowfall",
    "White crystal curtain lights with a slow fade.",
    {
      layout: "curtain",
      shape: "crystal",
      colors: "white",
      mode: "fade",
      speed: 0.6,
      spacing: 36,
      glow: 0.5
    }
  ),
  flowers: /* @__PURE__ */ preset(
    "Flower garland",
    "Colorful glass flowers framing a card with a soft wave.",
    {
      layout: "border",
      shape: "flower",
      colors: "multicolor",
      mode: "wave",
      spacing: 40,
      size: 1.3,
      speed: 0.7
    }
  ),
  crystal: /* @__PURE__ */ preset(
    "Crystal sparkle",
    "Amber crystal and round bulbs with glitter and a changing rhythm.",
    {
      layout: "roofline",
      shape: ["crystal", "round"],
      colors: "warm",
      glitter: true,
      spacing: 36,
      patternOrder: "cycle",
      patternInterval: 12,
      patternSequence: ["fade", "wave", "static"]
    }
  ),
  tricolor: /* @__PURE__ */ preset(
    "Tricolor celebration",
    "Saffron, white, and green round bulbs in a traveling chase.",
    {
      layout: "roofline",
      shape: "round",
      colors: "tricolor",
      mode: "chase",
      spacing: 30,
      size: 1.2
    }
  ),
  mixed: /* @__PURE__ */ preset(
    "Mixed celebration",
    "Every bulb shape, rainbow colors, glitter, and shuffled patterns.",
    {
      layout: "draped",
      shape: ["rice", "round", "crystal", "flower", "led"],
      colors: "multicolor",
      spacing: 36,
      size: 1.2,
      glitter: true,
      dimBase: true,
      patternOrder: "random",
      patternInterval: 6
    }
  )
});

// src/core/spacing.js
var envelopes = {
  flower: [-13, -4, 14, 23],
  round: [-7, -2, 7, 17],
  heart: [-10, -2, 10, 21],
  crystal: [-6, -2, 6, 20]
};
var bulbEnvelope = (shape) => envelopes[shape] || [-4, -2, 4, 19];
function sampleChain(wires, spacing, limit) {
  const slots = [];
  let distance = 0, next = spacing / 2;
  for (let wire = 0; wire < wires.length; wire++) {
    const points = wires[wire];
    for (let i = 1; i < points.length && slots.length < limit; i++) {
      const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= distance + length && slots.length < limit) {
        const t = (next - distance) / Math.max(length, 1e-12);
        slots.push({
          wire,
          segment: i - 1,
          t,
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          mobility: a.mobility + (b.mobility - a.mobility) * t
        });
        next += spacing;
      }
      distance += length;
    }
  }
  return slots;
}
function fitSpacing(wires, options, limit) {
  if (!limit) return [];
  const bounds = (Array.isArray(options.shape) ? options.shape : [options.shape]).map(bulbEnvelope);
  const width = (Math.max(...bounds.map((b) => b[2])) - Math.min(...bounds.map((b) => b[0]))) * options.size + 6;
  const height = (Math.max(...bounds.map((b) => b[3])) - Math.min(...bounds.map((b) => b[1]))) * options.size + 6;
  const length = wires.reduce(
    (sum, points) => sum + points.slice(1).reduce((total, p, i) => total + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0),
    0
  );
  const sample = (count2) => sampleChain(wires, length / count2, count2);
  const fits = (slots) => {
    for (let i = 0; i < slots.length; i++)
      for (let j = i + 1; j < slots.length && slots[j].x - slots[i].x < width - 1e-7; j++)
        if (Math.abs(slots[j].y - slots[i].y) < height - 1e-7) return false;
    return true;
  };
  const count = Math.min(limit, Math.max(1, Math.floor(length / options.spacing)));
  const initial = sample(count);
  if (fits(initial)) return initial;
  let low = 1, high = count - 1, best = sample(1);
  while (low <= high) {
    const middle = Math.floor((low + high) / 2), slots = sample(middle);
    if (fits(slots)) {
      best = slots;
      low = middle + 1;
    } else high = middle - 1;
  }
  return best;
}

// src/core/geometry.js
var MAX_BULBS = 600;
var MAX_WIRE_SEGMENTS = 128;
function createGeometry(width, height, input = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height))
    throw new TypeError("Geometry dimensions must be finite.");
  if (width > 1e6 || height > 1e6)
    throw new RangeError("Geometry dimensions cannot exceed 1,000,000 CSS pixels.");
  const o = normalizeOptions(input), rand = random(o.seed), wires = [], freeEnds = /* @__PURE__ */ new Set(), bulbs = [];
  if (!(width > 0 && height > 0)) return { wires, bulbs };
  const addBulb = (slot, angle) => bulbs.push({
    ...slot,
    angle,
    shape: Array.isArray(o.shape) ? o.shape[bulbs.length % o.shape.length] : o.shape,
    color: o.colors[bulbs.length % o.colors.length],
    phase: rand(),
    group: bulbs.length % 4
  });
  const add = (points, angle = 0, freeEnd = false) => {
    const wire = wires.length;
    wires.push(points);
    if (freeEnd) freeEnds.add(wire);
    for (const slot of sampleChain([points], o.spacing, MAX_BULBS - bulbs.length))
      addBulb({ ...slot, wire }, angle);
  };
  const swag = (y, waves = o.anchorCount || 2, sag = o.sag) => {
    const span = width / waves, depth = Math.min(sag, height * 0.25);
    let lo = span / 40, hi = Math.max(span * span / Math.max(depth, 1e-3), span);
    for (let i = 0; i < 50; i++) {
      const a2 = (lo + hi) / 2;
      if (a2 * (Math.cosh(span / (2 * a2)) - 1) > depth) lo = a2;
      else hi = a2;
    }
    const a = hi;
    const row = [];
    for (let k = -1; k < waves; k++) {
      const left = (k + 0.5) * span, n = Math.min(MAX_WIRE_SEGMENTS, Math.max(16, Math.ceil(span / 12)));
      row.push(
        Array.from({ length: n + 1 }, (_, i) => {
          const u = i / n, x = left + span * u;
          return {
            x,
            y: y + (depth === 0 ? 0 : a * (Math.cosh(span / (2 * a)) - Math.cosh((x - left - span / 2) / a))),
            mobility: Math.sin(Math.PI * u)
          };
        })
      );
    }
    const start = wires.length;
    wires.push(...row);
    for (const slot of fitSpacing(row, o, MAX_BULBS - bulbs.length))
      addBulb({ ...slot, wire: start + slot.wire }, 0);
  };
  if (o.layout === "roofline") swag(12);
  if (o.layout === "draped")
    for (let row = 0; row < 3; row++) swag(12 + row * 38, o.anchorCount || 3, o.sag * 0.65);
  if (o.layout === "curtain") {
    swag(12);
    const headerWires = [...wires];
    const headerBulbs = clearBulbOverlaps(bulbs, o).sort((a, b) => a.x - b.x);
    const anchors = [];
    for (let i = 0; i + 1 < headerBulbs.length; i += 2) {
      const x = (headerBulbs[i].x + headerBulbs[i + 1].x) / 2;
      if (x < 10 || x > width - 10) continue;
      const header = headerWires.find((points) => x >= points[0].x && x <= points.at(-1).x);
      const segment = header.findIndex((point, j) => j > 0 && point.x >= x);
      const a = header[segment - 1], b = header[segment];
      const t = (x - a.x) / (b.x - a.x);
      anchors.push({
        x,
        y: a.y + (b.y - a.y) * t,
        attachment: { wire: headerWires.indexOf(header), segment: segment - 1, t }
      });
    }
    if (anchors.length) {
      const length = Math.min(
        Math.max(20, height - 40 - Math.max(...anchors.map((p) => p.y))),
        Math.floor((MAX_BULBS - bulbs.length) / anchors.length) * o.spacing
      );
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil(length / 12)));
      if (length > 0)
        for (const { x, y, attachment } of anchors) {
          add(
            Array.from({ length: n + 1 }, (_, j) => ({
              x,
              y: y + length * j / n,
              mobility: (j / n) ** 2,
              ...j === 0 ? { attachment } : {}
            })),
            0,
            true
          );
        }
    }
  }
  if (o.layout === "border") {
    swag(12);
    for (const x of [8, width - 8]) {
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil((height + 40) / 12)));
      add(
        Array.from({ length: n + 1 }, (_, i) => ({
          x,
          y: -20 + (height + 40) * i / n,
          mobility: (i / n) ** 2
        })),
        x < width / 2 ? -90 : 90,
        true
      );
    }
  }
  const accepted = clearBulbOverlaps(bulbs, o);
  const byWire = /* @__PURE__ */ new Map();
  for (const bulb of accepted) {
    if (!byWire.has(bulb.wire)) byWire.set(bulb.wire, []);
    byWire.get(bulb.wire).push(bulb);
  }
  for (const index of freeEnds) {
    const mounted = byWire.get(index) || [];
    const last = mounted.at(-1), points = wires[index];
    if (!last) {
      points.length = 0;
      continue;
    }
    const segment = last.segment, t = last.t;
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
  const indices = /* @__PURE__ */ new Map();
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
  const accepted = [], cells = /* @__PURE__ */ new Map();
  const cellSize = 64;
  for (const bulb of bulbs) {
    if (Array.isArray(o.shape)) bulb.shape = o.shape[accepted.length % o.shape.length];
    const envelope = bulbEnvelope(bulb.shape);
    const radians = bulb.angle * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
    const corners = [
      [envelope[0], envelope[1]],
      [envelope[0], envelope[3]],
      [envelope[2], envelope[1]],
      [envelope[2], envelope[3]]
    ].map(([x, y]) => ({
      x: bulb.x + (x * cos - y * sin) * o.size,
      y: bulb.y + (x * sin + y * cos) * o.size
    }));
    const gap = 3;
    const bounds = {
      left: Math.min(...corners.map((p) => p.x)) - gap,
      right: Math.max(...corners.map((p) => p.x)) + gap,
      top: Math.min(...corners.map((p) => p.y)) - gap,
      bottom: Math.max(...corners.map((p) => p.y)) + gap
    };
    const keys = [];
    const neighbors = /* @__PURE__ */ new Set();
    for (let x = Math.floor(bounds.left / cellSize); x <= Math.floor(bounds.right / cellSize); x++) {
      for (let y = Math.floor(bounds.top / cellSize); y <= Math.floor(bounds.bottom / cellSize); y++) {
        const key = `${x}:${y}`;
        keys.push(key);
        for (const other of cells.get(key) || []) neighbors.add(other);
      }
    }
    if ([...neighbors].some(
      (other) => bounds.left < other.right - 1e-7 && bounds.right > other.left + 1e-7 && bounds.top < other.bottom - 1e-7 && bounds.bottom > other.top + 1e-7
    ))
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

// src/core/svg.js
var NS = "http://www.w3.org/2000/svg";
var serial = 0;
function nextId(prefix) {
  const namespace = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${namespace}-${++serial}`;
}
function svgNode(doc, tag, attrs = {}, parent) {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  parent?.append(n);
  return n;
}

// src/core/tether.js
function tether(point, a, ra, b, rb) {
  const x = point.x, y = point.y;
  if (!a.pinned && !b.pinned) return;
  if (!a.pinned) {
    [a, b] = [b, a];
    [ra, rb] = [rb, ra];
  }
  const ax = a.homeX, ay = a.homeY, bx = b.homeX, by = b.homeY;
  const da = Math.hypot(x - ax, y - ay), db = Math.hypot(x - bx, y - by);
  if (da <= ra && (!b.pinned || db <= rb)) return;
  const qa = Math.min(1, ra / Math.max(da, 1e-12));
  const x1 = ax + (x - ax) * qa, y1 = ay + (y - ay) * qa;
  if (!b.pinned || Math.hypot(x1 - bx, y1 - by) <= rb) {
    point.x = x1;
    point.y = y1;
    return;
  }
  const qb = Math.min(1, rb / Math.max(db, 1e-12));
  const x2 = bx + (x - bx) * qb, y2 = by + (y - by) * qb;
  if (Math.hypot(x2 - ax, y2 - ay) <= ra) {
    point.x = x2;
    point.y = y2;
    return;
  }
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  if (d < 1e-12) {
    point.x = x1;
    point.y = y1;
    return;
  }
  const along = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - along * along));
  const cx = ax + dx / d * along, cy = ay + dy / d * along;
  const side = (x - cx) * -dy + (y - cy) * dx < 0 ? -1 : 1;
  point.x = cx - side * dy / d * h;
  point.y = cy + side * dx / d * h;
}

// src/core/physics.js
var PHYSICS_STEP = 1 / 120;
var GRAVITY = 980;
var SOLVERS = /* @__PURE__ */ new WeakMap();
var TAUT = /* @__PURE__ */ new WeakSet();
function constrainLengths(rope, grab, predictor = false) {
  const { nodes, lengths } = rope, count = lengths.length;
  let work = SOLVERS.get(rope);
  if (!work) {
    work = Array.from({ length: 10 }, (_, i) => new Float64Array(count + (i >= 7 ? 1 : 0)));
    for (let i = 0; i < count; i++) work[9][i + 1] = work[9][i] + lengths[i];
    SOLVERS.set(rope, work);
  }
  const [nx, ny, upper, rhs, lambda, bx, by, deltaX, deltaY] = work;
  const segment = grab?.segment ?? -2, t = grab?.t ?? 0, u = 1 - t;
  const ma = nodes[segment]?.mass ?? 0, mb = nodes[segment + 1]?.mass ?? 0;
  const coupling = (i) => i === segment - 1 ? ma * u : i === segment ? mb * t - ma * u : i === segment + 1 ? -mb * t : 0;
  let error = 0, energy = 0;
  for (let i = 0; i < count; i++) {
    const a = nodes[i], b = nodes[i + 1], dx = predictor ? b.px - a.px : b.x - a.x, dy = predictor ? b.py - a.py : b.y - a.y;
    const distance = Math.max(1e-14, Math.hypot(dx, dy));
    nx[i] = dx / distance;
    ny[i] = dy / distance;
    const residual = lengths[i] - Math.hypot(b.x - a.x, b.y - a.y);
    rhs[i] = predictor ? lengths[i] - distance - nx[i] * (b.x - a.x - dx) - ny[i] * (b.y - a.y - dy) : residual;
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
  for (let i = 0; i < count; i++) {
    const lower = i ? -nodes[i].mass * (nx[i] * nx[i - 1] + ny[i] * ny[i - 1]) : 0;
    const diagonal = Math.max(
      1e-14,
      nodes[i].mass + nodes[i + 1].mass + (grab ? 0.01 : 1e-14) - lower * (upper[i - 1] || 0)
    );
    upper[i] = i + 1 < count ? -nodes[i + 1].mass * (nx[i] * nx[i + 1] + ny[i] * ny[i + 1]) / diagonal : 0;
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
  let handX = 0, handY = 0;
  if (grab && ma * u * u + mb * t * t > 1e-8) {
    const point = ropeAttachment(rope, segment, t);
    let xx = ma * u * u + mb * t * t + 1e-14, yy = xx, xy = 0;
    let rx = grab.x - point.x, ry = grab.y - point.y;
    for (let i = Math.max(0, segment - 1); i < Math.min(count, segment + 2); i++) {
      const x = nx[i] * coupling(i), y = ny[i] * coupling(i);
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
    deltaX[i] = p.mass * ((i ? nx[i - 1] * lambda[i - 1] : 0) - (i < count ? nx[i] * lambda[i] : 0) + hand * handX);
    deltaY[i] = p.mass * ((i ? ny[i - 1] * lambda[i - 1] : 0) - (i < count ? ny[i] * lambda[i] : 0) + hand * handY);
  }
  let scale = 1;
  for (let attempt = 0; !grab && attempt < 18; attempt++) {
    let next = 0;
    for (let i = 0; i < count; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const d = Math.hypot(
        b.x - a.x + scale * (deltaX[i + 1] - deltaX[i]),
        b.y - a.y + scale * (deltaY[i + 1] - deltaY[i])
      ) - lengths[i];
      next += d * d;
    }
    if (grab) {
      const p = ropeAttachment(rope, segment, t);
      next += (p.x + scale * (deltaX[segment] * u + deltaX[segment + 1] * t) - grab.x) ** 2 + (p.y + scale * (deltaY[segment] * u + deltaY[segment + 1] * t) - grab.y) ** 2;
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
function createRope(points) {
  const nodes = points.map((p) => ({
    x: p.x,
    y: p.y,
    px: p.x,
    py: p.y,
    homeX: p.x,
    homeY: p.y,
    pinned: p.mobility < 1e-6,
    mass: 0
  }));
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  nodes.forEach((n, i) => {
    n.mass = n.pinned ? 0 : 24 / Math.max(1, (lengths[i - 1] ?? lengths[0]) + (lengths[i] ?? lengths.at(-1)));
  });
  const rope = { nodes, lengths, active: false, accumulator: 0, quietTime: 0, sleeping: false };
  if (nodes[0]?.pinned && nodes.at(-1)?.pinned && Math.abs(
    lengths.reduce((sum, length) => sum + length, 0) - Math.hypot(nodes.at(-1).x - nodes[0].x, nodes.at(-1).y - nodes[0].y)
  ) < 1e-8)
    TAUT.add(rope);
  return rope;
}
function ropeAttachment(rope, segment, t) {
  const a = rope.nodes[segment], b = rope.nodes[segment + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function stepRope(rope, dt, grab = null, wind = 0, supportHeld = false) {
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
      p.px = p.x;
      p.py = p.y;
      p.x = p.homeX;
      p.y = p.homeY;
      continue;
    }
    const speed = Math.hypot(p.x - p.px, p.y - p.py) / dt;
    const damping = Math.exp(-((grab || supportHeld ? 12 : 0.8) + 15e-4 * speed) * dt);
    const vx = (p.x - p.px) * damping, vy = (p.y - p.py) * damping;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + wind * dt * dt;
    p.y += vy + GRAVITY * dt * dt;
  }
  if (!grab) constrainLengths(rope, null, true);
  for (let pass = 0; pass < (grab ? 12 : 6); pass++) constrainLengths(rope, grab);
}
function releaseRope(rope, grab, velocity) {
  const a = rope.nodes[grab.segment], b = rope.nodes[grab.segment + 1], u = 1 - grab.t, dt = PHYSICS_STEP;
  const weight = a.mass * u * u + b.mass * grab.t * grab.t;
  if (weight < 1e-8) return;
  const vx = ((a.x - a.px) * u + (b.x - b.px) * grab.t) / dt;
  const vy = ((a.y - a.py) * u + (b.y - b.py) * grab.t) / dt;
  for (const [p, influence] of [
    [a, a.mass * u / weight],
    [b, b.mass * grab.t / weight]
  ]) {
    p.px -= (velocity.x - vx) * influence * dt;
    p.py -= (velocity.y - vy) * influence * dt;
  }
  rope.sleeping = false;
  rope.quietTime = 0;
}

// src/core/attachments.js
function activateStrand(strand) {
  if (strand.rope?.active) return;
  const rope = createRope(strand.points);
  for (const [i, node] of rope.nodes.entries()) {
    const shift = (strand.offset || 0) * strand.points[i].mobility;
    node.x = node.px = node.homeX + shift + (strand.anchorX || 0);
    node.y = node.py = node.homeY + shift * 0.12 + (strand.anchorY || 0);
  }
  rope.active = true;
  strand.rope = rope;
}
function followAttachment(strand, strands) {
  const joint = strand.points[0].attachment;
  if (!joint) return;
  const parent = strands[joint.wire];
  const a = parent.points[joint.segment], b = parent.points[joint.segment + 1];
  const mobility = a.mobility + (b.mobility - a.mobility) * joint.t;
  const shift = parent.offset * mobility;
  const point = parent.rope?.active ? ropeAttachment(parent.rope, joint.segment, joint.t) : {
    x: a.x + (b.x - a.x) * joint.t + shift,
    y: a.y + (b.y - a.y) * joint.t + shift * 0.12
  };
  if (parent.rope?.active) activateStrand(strand);
  strand.anchorX = point.x - strand.points[0].x;
  strand.anchorY = point.y - strand.points[0].y;
  if (strand.rope?.active) {
    const root = strand.rope.nodes[0];
    if (Math.hypot(root.homeX - point.x, root.homeY - point.y) > 1e-8) {
      strand.rope.sleeping = false;
      strand.rope.quietTime = 0;
    }
    root.homeX = point.x;
    root.homeY = point.y;
  }
}

// src/core/interaction.js
function createInteraction(state) {
  const { svg, win, media } = state;
  function release(withMomentum = false) {
    if (!state.drag) return;
    if (withMomentum) {
      const age = (win.performance.now() - state.drag.motionTime) / 1e3;
      const fade = Math.exp(-Math.max(0, age - 0.05) / 0.06);
      releaseRope(state.drag.strand.rope, state.drag, {
        x: state.drag.velocityX * fade,
        y: state.drag.velocityY * fade
      });
    }
    const pointerId = state.drag.pointerId;
    state.drag = null;
    if (svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
    svg.style.cursor = "";
  }
  function pointerPosition(event) {
    const matrix = svg.getScreenCTM();
    return matrix ? new win.DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
  }
  function grab(event, strand, attachment) {
    if (state.drag || !state.options.interactive || state.options.paused || media.matches || event.button !== 0 || !event.isPrimary)
      return;
    const p = pointerPosition(event);
    if (!p) return;
    activateStrand(strand);
    followAttachment(strand, state.strands);
    if (!attachment) {
      let closest = Infinity;
      strand.rope.nodes.slice(0, -1).forEach((a, segment2) => {
        const b = strand.rope.nodes[segment2 + 1], dx = b.x - a.x, dy = b.y - a.y;
        const t2 = clamp(
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / Math.max(1e-3, dx * dx + dy * dy),
          0,
          1
        );
        const distance = Math.hypot(a.x + dx * t2 - p.x, a.y + dy * t2 - p.y);
        if (distance < closest) {
          closest = distance;
          attachment = { segment: segment2, t: t2 };
        }
      });
    }
    const { segment, t } = attachment, nodes = strand.rope.nodes;
    if (t < 0.01 && nodes[segment].pinned || t > 0.99 && nodes[segment + 1].pinned) return;
    const base = ropeAttachment(strand.rope, segment, t);
    event.preventDefault();
    event.stopPropagation();
    strand.rope.active = true;
    strand.rope.sleeping = false;
    strand.rope.quietTime = 0;
    const now = win.performance.now();
    state.drag = {
      strand,
      segment,
      t,
      pointerId: event.pointerId,
      start: p,
      base,
      x: base.x,
      y: base.y,
      velocityX: 0,
      velocityY: 0,
      sampleTime: now,
      motionTime: now
    };
    svg.setPointerCapture(event.pointerId);
    svg.style.cursor = "grabbing";
    state.sync();
  }
  function move(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    const p = pointerPosition(event);
    if (!p) return;
    event.preventDefault();
    const previousX = state.drag.x, previousY = state.drag.y;
    state.drag.x = state.drag.base.x + p.x - state.drag.start.x;
    state.drag.y = state.drag.base.y + p.y - state.drag.start.y;
    const { nodes, lengths } = state.drag.strand.rope;
    const leftLength = lengths.slice(0, state.drag.segment).reduce((a, b) => a + b, 0) + lengths[state.drag.segment] * state.drag.t;
    const total = lengths.reduce((a, b) => a + b, 0);
    tether(state.drag, nodes[0], leftLength, nodes.at(-1), total - leftLength);
    const homeA = nodes[state.drag.segment], homeB = nodes[state.drag.segment + 1];
    state.drag.x += (homeA.homeX + (homeB.homeX - homeA.homeX) * state.drag.t - state.drag.x) * 2e-3;
    state.drag.y += (homeA.homeY + (homeB.homeY - homeA.homeY) * state.drag.t - state.drag.y) * 2e-3;
    const now = win.performance.now(), dx = state.drag.x - previousX, dy = state.drag.y - previousY;
    if (Math.hypot(dx, dy) > 0.01) {
      const dt = clamp((now - state.drag.sampleTime) / 1e3, 1 / 240, 0.1);
      const blend = 1 - Math.exp(-dt / 0.035), scale = Math.min(1, 600 * dt / Math.hypot(dx, dy));
      state.drag.velocityX += (dx * scale / dt - state.drag.velocityX) * blend;
      state.drag.velocityY += (dy * scale / dt - state.drag.velocityY) * blend;
      state.drag.motionTime = now;
    }
    state.drag.sampleTime = now;
  }
  function endDrag(event) {
    if (state.drag && (event.pointerId === void 0 || event.pointerId === state.drag.pointerId)) {
      if (event.type === "pointerup") move(event);
      release(event.type === "pointerup");
      state.sync();
    }
  }
  function down(event) {
    if (!state.options.interactive) return;
    const hit = event.target.closest("[data-string-bulb], [data-string-wire]");
    if (!hit || !svg.contains(hit)) return;
    if (hit.hasAttribute("data-string-bulb")) {
      const b = state.bulbs[Number(hit.dataset.stringBulb)].bulb;
      grab(event, state.strands[b.wire], b);
    } else grab(event, state.strands[Number(hit.dataset.stringWire)]);
  }
  const listeners = [
    ["pointerdown", down],
    ["pointermove", move],
    ["pointerup", endDrag],
    ["pointercancel", endDrag],
    ["lostpointercapture", endDrag]
  ];
  listeners.forEach(([name, fn]) => svg.addEventListener(name, fn));
  win.addEventListener("blur", endDrag);
  return {
    release,
    dispose() {
      release();
      listeners.forEach(([name, fn]) => svg.removeEventListener(name, fn));
      win.removeEventListener("blur", endDrag);
    }
  };
}

// src/core/rhythms.js
var programs = {
  alternate: [
    [0, 600],
    [1, 600]
  ],
  pairs: [
    [0, 600],
    [1, 600]
  ],
  double: [
    [0, 180],
    [-1, 180],
    [0, 180],
    [-1, 420],
    [1, 180],
    [-1, 180],
    [1, 180],
    [-1, 420]
  ],
  steps: /* @__PURE__ */ [0, 1, 2, 3].map((channel) => [channel, 320]),
  bounce: /* @__PURE__ */ [0, 1, 2, 3, 2, 1].map((channel) => [
    channel,
    channel === 0 || channel === 3 ? 420 : 300
  ])
};
function rhythmFrames(mode, index, dimBase) {
  const low = dimBase ? 0.02 : 0.04;
  if (mode === "fade") {
    const channel2 = index % 4;
    const frames2 = [0, 1, 2, 3].map((step) => {
      const distance = Math.min((channel2 - step + 4) % 4, (step - channel2 + 4) % 4);
      return { offset: step / 4, opacity: distance === 0 ? 1 : distance === 1 ? 0.3 : low };
    });
    return { frames: [...frames2, { ...frames2[0], offset: 1 }], duration: 2400 };
  }
  const steps = programs[mode];
  if (!steps) return null;
  const channel = mode === "pairs" ? Math.floor(index / 2) % 2 : index % (mode === "alternate" || mode === "double" ? 2 : 4);
  const duration = steps.reduce((sum, [, time2]) => sum + time2, 0);
  const frames = [];
  let time = 0;
  steps.forEach(([active, hold], step) => {
    const opacity = active === channel ? 1 : low;
    const next = steps[(step + 1) % steps.length][0] === channel ? 1 : low;
    const edge = Math.min(35, hold * 0.12);
    frames.push(
      { offset: time / duration, opacity },
      { offset: (time + hold - edge) / duration, opacity },
      { offset: (time + hold) / duration, opacity: next }
    );
    time += hold;
  });
  return { frames, duration };
}

// src/core/state.js
var isInactive = (state) => state.destroyed || state.options.paused || state.doc.hidden || !state.visible || state.width === 0 || state.height === 0;

// src/core/lighting.js
function createLighting(state) {
  const { win, svg, media } = state;
  let animations = [], animationSpeed = state.options.speed;
  let patternIndex = 0, currentMode = state.options.mode, patternBag = [], patternTimer = 0, patternStarted = 0, patternRemaining = 0, patternRandom;
  function stopPatternClock() {
    if (!patternTimer) return;
    win.clearTimeout(patternTimer);
    patternTimer = 0;
    patternRemaining = Math.max(0, patternRemaining - (win.performance.now() - patternStarted));
  }
  function startPatternClock() {
    if (patternTimer || state.destroyed || isInactive(state) || media.matches || !state.options.animated || state.options.patternOrder === "fixed" || state.options.patternSequence.length < 2)
      return;
    patternStarted = win.performance.now();
    patternTimer = win.setTimeout(() => {
      patternTimer = 0;
      if (state.destroyed) return;
      if (isInactive(state) || media.matches || !state.options.animated) {
        patternRemaining = 0;
        return;
      }
      const sequence = state.options.patternSequence;
      if (state.options.patternOrder === "random" && sequence.length > 1) {
        if (!patternBag.length) patternBag = sequence.map((_, i) => i);
        const choices = patternBag.filter((i) => i !== patternIndex);
        patternIndex = choices[Math.floor(patternRandom() * choices.length)];
        patternBag.splice(patternBag.indexOf(patternIndex), 1);
      } else patternIndex = (patternIndex + 1) % sequence.length;
      patternRemaining = state.options.patternInterval * 1e3;
      applyPattern(sequence[patternIndex]);
      startPatternClock();
    }, patternRemaining);
  }
  function applyPattern(mode) {
    const changed = svg.dataset.pattern !== mode;
    currentMode = mode;
    animationSpeed = state.options.speed;
    animations.forEach((a) => a.cancel());
    animations = [];
    const origin = svg.ownerDocument.timeline.currentTime;
    for (const [index, { light, bulb }] of state.bulbs.entries()) {
      if (mode === "static" || !state.options.animated || media.matches || !light.animate) continue;
      let frames, duration = 4e3 / state.options.speed, delay = 0;
      const low = state.options.dimBase ? 0.02 : 0.2;
      const rhythm = rhythmFrames(mode, index, state.options.dimBase);
      if (rhythm) {
        frames = rhythm.frames;
        duration = rhythm.duration / state.options.speed;
      } else if (mode === "wave") {
        frames = [{ opacity: low }, { opacity: 1 }, { opacity: low }];
        delay = -index * 130;
      } else {
        frames = [{ opacity: 1 }, { opacity: state.options.dimBase ? 0.02 : 0.15 }, { opacity: 1 }];
        delay = mode === "chase" ? -bulb.group * duration / 4 : 0;
      }
      const animation = light.animate(frames, {
        duration,
        delay,
        iterations: Infinity,
        easing: "linear"
      });
      if (rhythm && origin !== null) animation.startTime = origin;
      if (isInactive(state)) animation.pause();
      animations.push(animation);
    }
    svg.dataset.pattern = mode;
    if (changed)
      svg.dispatchEvent(new win.CustomEvent("stringpatternchange", { detail: { mode } }));
  }
  function resetProgram() {
    stopPatternClock();
    patternIndex = 0;
    patternRemaining = state.options.patternInterval * 1e3;
    patternBag = state.options.patternSequence.map((_, i) => i).slice(1);
    currentMode = state.options.patternOrder === "fixed" ? state.options.mode : state.options.patternSequence[0];
    patternRandom = random(state.options.seed + 941);
  }
  function cancel() {
    stopPatternClock();
    animations.forEach((a) => a.cancel());
    animations = [];
  }
  resetProgram();
  return {
    get mode() {
      return currentMode;
    },
    apply: () => applyPattern(currentMode),
    resetProgram,
    cancel,
    updateSpeed() {
      animations.forEach((a) => a.updatePlaybackRate(state.options.speed / animationSpeed));
    },
    sync() {
      animations.forEach((a) => isInactive(state) ? a.pause() : a.play());
      if (isInactive(state) || media.matches || !state.options.animated || state.options.patternOrder === "fixed")
        stopPatternClock();
      else startPatternClock();
    }
  };
}

// src/core/breeze.js
function breezeForce(time, strand = 0) {
  const t = ((time - strand * 0.19) % 19 + 19) % 19;
  if (t > 6) return 0;
  return Math.sin(Math.PI * t / 6) ** 2 * (Math.sin(t * 1.2) + 0.35 * Math.sin(t * 2.3));
}
function breezeWait(time, strand = 0) {
  const phase = ((time - strand * 0.19) % 19 + 19) % 19;
  return phase <= 6 ? 0 : 19 - phase;
}

// src/core/paths.js
function pathFor(points, displacement = 0, dx = 0, dy = 0) {
  const p = points.map((point) => ({
    x: point.x + (displacement + dx) * (point.mobility ?? 0),
    y: point.y + (displacement * 0.12 + dy) * (point.mobility ?? 0)
  }));
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], e = p[Math.min(p.length - 1, i + 2)];
    d += ` C${b.x + (c.x - a.x) / 6},${b.y + (c.y - a.y) / 6} ${c.x - (e.x - b.x) / 6},${c.y - (e.y - b.y) / 6} ${c.x},${c.y}`;
  }
  return d;
}

// src/core/collisions.js
function collideStrands(strands, held, dt) {
  const cells = /* @__PURE__ */ new Map();
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
      const cx = Math.floor(p.x / 12), cy = Math.floor(p.y / 12);
      for (let x = cx - 1; x <= cx + 1; x++)
        for (let y = cy - 1; y <= cy + 1; y++) {
          for (const other of cells.get(`${x},${y}`) || []) {
            if (other.strand === strand) continue;
            const dx = p.x - other.p.x, dy = p.y - other.p.y;
            const distance = Math.hypot(dx, dy);
            if (distance >= 8 || distance < 1e-6) continue;
            const original = other.strand.points[other.index];
            if (Math.hypot(p.homeX - original.x, p.homeY - original.y) < 12) continue;
            activateStrand(other.strand);
            const q = other.strand.rope.nodes[other.index];
            const impulse = Math.min(0.08, (8 - distance) * dt * 2);
            if (strand !== held) {
              p.px -= dx / distance * impulse;
              p.py -= dy / distance * impulse;
            }
            if (!q.pinned && other.strand !== held) {
              q.px += dx / distance * impulse;
              q.py += dy / distance * impulse;
              other.strand.rope.sleeping = false;
              other.strand.rope.quietTime = 0;
            }
          }
        }
    }
  }
}

// src/core/motion.js
function createMotion(state) {
  const { win, media } = state;
  let frame = 0, wakeTimer = 0, lastTime = 0, windTime = 0;
  function moving() {
    return state.drag || state.strands.some(
      (strand) => strand.rope?.active ? !strand.rope.sleeping : Math.abs(strand.offset) + Math.abs(strand.velocity) > 2e-3
    );
  }
  function schedule() {
    if (frame || wakeTimer || isInactive(state) || media.matches) return;
    const breeze = state.options.breeze && state.options.wind && state.strands.length;
    let wait = Infinity;
    if (breeze)
      for (let i = 0; i < state.strands.length; i++) {
        wait = Math.min(wait, breezeWait(windTime, i));
        if (wait === 0) break;
      }
    if (moving() || wait === 0) frame = win.requestAnimationFrame(tick);
    else if (breeze)
      wakeTimer = win.setTimeout(() => {
        wakeTimer = 0;
        if (!isInactive(state)) frame = win.requestAnimationFrame(tick);
      }, wait * 1e3);
    else lastTime = 0;
  }
  function tick(now) {
    frame = 0;
    if (state.destroyed || isInactive(state)) return;
    if (media.matches) {
      state.refresh();
      return;
    }
    const elapsed = lastTime ? (now - lastTime) / 1e3 : 0;
    const dt = Math.min(elapsed, 0.1);
    lastTime = now;
    windTime += elapsed;
    if (state.options.collisions) collideStrands(state.strands, state.drag?.strand, dt);
    for (const [i, strand] of state.strands.entries()) {
      const oldX = strand.anchorX || 0, oldY = strand.anchorY || 0;
      followAttachment(strand, state.strands);
      const anchorMoved = oldX !== (strand.anchorX || 0) || oldY !== (strand.anchorY || 0);
      if (anchorMoved || strand.rope?.active && strand.anchorTransformed) {
        strand.paths.forEach(
          (p) => p.setAttribute(
            "transform",
            strand.rope?.active ? "" : `translate(${strand.anchorX || 0} ${strand.anchorY || 0})`
          )
        );
        strand.anchorTransformed = !strand.rope?.active;
      }
      if (strand.rope?.active) {
        const held = state.drag?.strand === strand, wind = state.options.breeze ? breezeForce(windTime, i) * state.options.wind * 12 : 0;
        if (held || Math.abs(wind) > 0.01) {
          strand.rope.sleeping = false;
          strand.rope.quietTime = 0;
        }
        if (strand.rope.sleeping) {
          strand.changed = false;
          continue;
        }
        strand.rope.accumulator += dt;
        while (strand.rope.accumulator >= PHYSICS_STEP) {
          const joint = strand.points[0].attachment;
          const supportHeld = joint && state.drag?.strand === state.strands[joint.wire];
          stepRope(strand.rope, PHYSICS_STEP, held ? state.drag : null, wind, supportHeld);
          strand.rope.accumulator -= PHYSICS_STEP;
        }
        let speed = 0;
        for (const p of strand.rope.nodes)
          speed = Math.max(speed, Math.hypot(p.x - p.px, p.y - p.py) / PHYSICS_STEP);
        strand.rope.quietTime = !held && speed < 0.3 && Math.abs(wind) < 0.01 ? strand.rope.quietTime + dt : 0;
        if (strand.rope.quietTime > 1) strand.rope.sleeping = true;
        strand.changed = true;
        const d = pathFor(strand.rope.nodes);
        strand.paths.forEach((p) => p.setAttribute("d", d));
        continue;
      }
      const force = state.options.breeze ? breezeForce(windTime, i) * state.options.wind * 13 : 0;
      strand.velocity += (force - 5 * strand.offset - 3.6 * strand.velocity) * dt;
      strand.offset += strand.velocity * dt;
      strand.changed = anchorMoved || Math.abs(strand.offset) + Math.abs(strand.velocity) > 2e-3 || strand.dirty;
      if (strand.changed) {
        const d = pathFor(strand.points, strand.offset);
        strand.paths.forEach((p) => p.setAttribute("d", d));
        strand.dirty = false;
      }
    }
    for (const { node, bulb } of state.bulbs) {
      const strand = state.strands[bulb.wire], shift = strand.offset * bulb.mobility;
      if (!strand.changed) continue;
      const point = strand.rope?.active ? ropeAttachment(strand.rope, bulb.segment, bulb.t) : {
        x: bulb.x + shift + (strand.anchorX || 0),
        y: bulb.y + shift * 0.12 + (strand.anchorY || 0)
      };
      let angle = bulb.angle;
      if (strand.rope?.active && bulb.angle) {
        const a = strand.rope.nodes[bulb.segment], b = strand.rope.nodes[bulb.segment + 1];
        const ra = strand.points[bulb.segment], rb = strand.points[bulb.segment + 1];
        angle += (Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(rb.y - ra.y, rb.x - ra.x)) * 180 / Math.PI;
      } else if (!strand.rope?.active)
        angle += clamp((-strand.offset * 0.7 - strand.velocity * 0.35) * bulb.mobility, -18, 18);
      node.setAttribute(
        "transform",
        `translate(${point.x} ${point.y}) rotate(${angle}) scale(${state.options.size})`
      );
    }
    schedule();
  }
  function sync() {
    const pause = isInactive(state);
    if (pause || media.matches) {
      state.release();
      stop();
    } else if (!(state.options.breeze && state.options.wind) && !moving()) stop();
    else {
      if (wakeTimer && moving()) {
        advanceIdleTime();
        win.clearTimeout(wakeTimer);
        wakeTimer = 0;
      }
      schedule();
    }
  }
  function stop() {
    if (wakeTimer) advanceIdleTime();
    win.cancelAnimationFrame(frame);
    win.clearTimeout(wakeTimer);
    wakeTimer = 0;
    frame = 0;
    lastTime = 0;
  }
  function advanceIdleTime() {
    const now = win.performance.now();
    if (lastTime) windTime += Math.max(0, (now - lastTime) / 1e3);
    lastTime = now;
  }
  return {
    sync,
    stop,
    reset() {
      stop();
      windTime = 0;
    }
  };
}

// src/core/materials.js
var BULB_OUTLINES = {
  rice: "M0 3C-5 3-4.4 13.2 0 18C4.4 13.2 5 3 0 3Z",
  round: "M0 3a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z",
  led: "M-3.6 15V7a3.6 3.6 0 0 1 7.2 0v8Z",
  heart: "M0 6C-3-1-11 2-9 9C-8 13-3 17 0 20C3 17 8 13 9 9C11 2 3-1 0 6Z",
  crystal: "M0 3 5.7 8.5 4 14 0 19 -4 14 -5.7 8.5Z",
  flower: "M0 5C-7-6-12 4-5 8C-17 9-10 19-3 13C-2 24 7 22 5 13C16 18 17 7 7 7C14-2 2-6 0 5Z"
};
var FLOWER_PETAL = "M0 10.7C-1.4 9.4-4.2 7-3.6 4.9C-2.9 1.5 2.9 1.5 3.6 4.9C4.2 7 1.4 9.4 0 10.7Z";
var HEART_FILAMENT = "M-.9 5.5V9.2C-4.5 5.5-7.4 9.3-4.5 12.2L0 16.5L4.5 12.2C7.4 9.3 4.5 5.5 .9 9.2V5.5";
function materialDefinitions(doc, defs, id, colors, shape) {
  const shapes2 = Array.isArray(shape) ? shape : [shape];
  const gradient = (type, name, attributes, stops) => {
    const node = svgNode(doc, type, { id: `${id}-${name}`, ...attributes }, defs);
    stops.forEach(
      ([offset, color, opacity = 1]) => svgNode(doc, "stop", { offset, "stop-color": color, "stop-opacity": opacity }, node)
    );
  };
  gradient("linearGradient", "socket", { x1: "0%", x2: "100%" }, [
    [0, "#06150f"],
    [0.18, "#174c30"],
    [0.32, "#578963"],
    [0.43, "#214e36"],
    [0.82, "#10291f"],
    [1, "#030e0a"]
  ]);
  gradient("linearGradient", "reflection", { x1: "0%", y1: "0%", x2: "100%", y2: "35%" }, [
    [0, "#fff", 0.02],
    [0.23, "#fff", 0.65],
    [0.37, "#fff", 0.08],
    [0.72, "#fff", 0],
    [1, "#fff", 0.3]
  ]);
  for (const bulbShape of shapes2) {
    const clip = svgNode(
      doc,
      "clipPath",
      { id: `${id}-${bulbShape}-glass-clip`, clipPathUnits: "userSpaceOnUse" },
      defs
    );
    if (bulbShape === "flower") {
      for (let petal = 0; petal < 5; petal++)
        svgNode(doc, "path", { d: FLOWER_PETAL, transform: `rotate(${petal * 72} 0 12)` }, clip);
    } else svgNode(doc, "path", { d: BULB_OUTLINES[bulbShape] }, clip);
  }
  colors.forEach((color, i) => {
    gradient("radialGradient", `halo-${i}`, {}, [
      [0, color, 0.65],
      [0.22, color, 0.3],
      [0.6, color, 0.08],
      [1, color, 0]
    ]);
    gradient("linearGradient", `glass-${i}`, { x1: "0%", y1: "0%", x2: "100%", y2: "15%" }, [
      [0, "#030811", 0.9],
      [0.13, color, 0.72],
      [0.28, "#fff", 0.66],
      [0.4, color, 0.35],
      [0.66, color, 0.62],
      [0.86, "#020510", 0.88],
      [1, color, 0.9]
    ]);
    gradient("radialGradient", `fire-${i}`, { cx: "42%", cy: "64%", r: "68%" }, [
      [0, "#fffce7", 0.98],
      [0.16, "#fff", 0.85],
      [0.34, color, 0.9],
      [0.7, color, 0.24],
      [1, color, 0]
    ]);
    gradient("linearGradient", `rim-${i}`, { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, [
      [0, "#fff", 0.95],
      [0.3, color, 0.9],
      [0.6, color, 0.15],
      [1, "#fff", 0.6]
    ]);
    if (shapes2.includes("flower")) {
      gradient("radialGradient", `petal-${i}`, { cx: "30%", cy: "25%", r: "90%" }, [
        [0, "#fff", 0.42],
        [0.2, color, 0.55],
        [0.6, color, 0.26],
        [0.9, color, 0.58],
        [1, "#170b20", 0.75]
      ]);
      gradient("radialGradient", `petal-light-${i}`, { cx: "50%", cy: "100%", r: "100%" }, [
        [0, "#fff5dc", 0.85],
        [0.2, color, 0.7],
        [0.65, color, 0.08],
        [1, color, 0]
      ]);
    }
  });
}
function bulbArtwork(doc, parent, id, index, options) {
  if (options.shape === "flower") return flowerArtwork(doc, parent, id, index, options);
  const colorIndex = index % options.colors.length, color = options.colors[colorIndex], outline = BULB_OUTLINES[options.shape];
  const url = (name) => `url(#${id}-${name === "glass-clip" ? options.shape + "-" : ""}${name})`;
  const glass = (attrs) => svgNode(doc, "path", { d: outline, ...attrs }, parent);
  glass({
    fill: url(`glass-${colorIndex}`),
    stroke: url(`rim-${colorIndex}`),
    "stroke-width": 0.38
  });
  const light = svgNode(doc, "g", { "data-bulb": index }, parent);
  if (options.glow)
    svgNode(
      doc,
      "ellipse",
      { cx: 0, cy: 10, rx: 20, ry: 24, fill: url(`halo-${colorIndex}`), opacity: options.glow },
      light
    );
  svgNode(doc, "path", { d: outline, fill: url(`fire-${colorIndex}`) }, light);
  svgNode(
    doc,
    "path",
    {
      d: options.shape === "heart" ? HEART_FILAMENT : "M-1.1 5.2V11Q0 13 1.1 11V5.2",
      fill: "none",
      stroke: color,
      "stroke-width": 1.5,
      "stroke-opacity": 0.8
    },
    light
  );
  svgNode(
    doc,
    "path",
    {
      d: options.shape === "heart" ? HEART_FILAMENT : "M-0.7 5.5V11Q0 12.2 0.7 11V5.5",
      fill: "none",
      stroke: "#fffbe8",
      "stroke-width": 0.5,
      "stroke-linecap": "round"
    },
    light
  );
  if (options.shape === "crystal") {
    const facets = [
      ["M0 3-2 9-5.7 8.5Z", "#fff", 0.38],
      ["M0 3 2 9-2 9Z", color, 0.3],
      ["M0 3 5.7 8.5 2 9Z", "#fff", 0.16],
      ["M-5.7 8.5-2 9 0 19-4 14Z", "#fff", 0.13],
      ["M-2 9 2 9 0 19Z", "#fff", 0.35],
      ["M2 9 5.7 8.5 4 14 0 19Z", color, 0.4]
    ];
    facets.forEach(
      ([d, fill, opacity]) => svgNode(
        doc,
        "path",
        { d, fill, opacity, stroke: "#fff", "stroke-width": 0.12, "stroke-opacity": 0.6 },
        parent
      )
    );
  }
  glass({ fill: url("reflection"), "fill-opacity": 0.5, "pointer-events": "none" });
  if (options.shape === "round")
    svgNode(
      doc,
      "path",
      {
        d: "M-4 5Q-6 9-3.8 11.5",
        fill: "none",
        stroke: "#fff",
        "stroke-opacity": 0.85,
        "stroke-width": 0.65,
        "stroke-linecap": "round"
      },
      parent
    );
  else if (options.shape !== "crystal")
    svgNode(
      doc,
      "path",
      {
        d: options.shape === "heart" ? "M-6.8 5.2C-8 7.8-6 10.9-3.8 13.5" : "M-1.6 4.5Q-3.2 8-1.5 12",
        fill: "none",
        stroke: "#fff",
        "stroke-opacity": 0.75,
        "stroke-width": 0.45,
        "stroke-linecap": "round"
      },
      parent
    );
  if (options.glitter) {
    const flecks = svgNode(doc, "g", { "clip-path": url("glass-clip") }, light);
    for (let j = 0; j < 22; j++)
      svgNode(
        doc,
        "circle",
        {
          cx: Math.sin(j * 12.3) * 4,
          cy: 3 + j * 7.37 % 15,
          r: j % 3 === 0 ? 0.24 : 0.12,
          fill: j % 2 ? "#fff6c2" : color,
          opacity: 0.5 + j % 3 * 0.2
        },
        flecks
      );
    if (index % 5 === 0)
      svgNode(
        doc,
        "path",
        { d: "M6 1 6.6 5.4 11 6 6.6 6.6 6 11 5.4 6.6 1 6 5.4 5.4Z", fill: "#fffbe9", opacity: 0.9 },
        light
      );
  }
  socketArtwork(doc, parent, url);
  return dimBaseMaterial(doc, parent, light, options);
}
function flowerArtwork(doc, parent, id, index, options) {
  const colorIndex = index % options.colors.length, color = options.colors[colorIndex];
  const url = (name) => `url(#${id}-${name === "glass-clip" ? options.shape + "-" : ""}${name})`;
  svgNode(
    doc,
    "path",
    {
      d: "M-1 1V9M1 1V9",
      fill: "none",
      stroke: "#9da786",
      "stroke-opacity": 0.65,
      "stroke-width": 0.35
    },
    parent
  );
  for (let petal = 0; petal < 5; petal++) {
    const group = svgNode(
      doc,
      "g",
      { "data-flower-petal": petal, transform: `rotate(${petal * 72} 0 12)` },
      parent
    );
    svgNode(
      doc,
      "path",
      {
        d: FLOWER_PETAL,
        fill: url(`petal-${colorIndex}`),
        stroke: color,
        "stroke-opacity": 0.8,
        "stroke-width": 0.3
      },
      group
    );
    svgNode(
      doc,
      "path",
      {
        d: "M-2.6 5.7C-3 3.7-1.9 2.9-.7 2.8",
        fill: "none",
        stroke: "#fff",
        "stroke-opacity": 0.65,
        "stroke-width": 0.35,
        "stroke-linecap": "round"
      },
      group
    );
    svgNode(
      doc,
      "path",
      {
        d: "M0 9.5Q-1.1 6.8-.4 5.8",
        fill: "none",
        stroke: color,
        "stroke-opacity": 0.65,
        "stroke-width": 0.3
      },
      group
    );
  }
  const light = svgNode(doc, "g", { "data-bulb": index }, parent);
  if (options.glow)
    svgNode(
      doc,
      "ellipse",
      { cx: 0, cy: 12, rx: 18, ry: 19, fill: url(`halo-${colorIndex}`), opacity: options.glow },
      light
    );
  for (let petal = 0; petal < 5; petal++)
    svgNode(
      doc,
      "path",
      {
        d: FLOWER_PETAL,
        transform: `rotate(${petal * 72} 0 12)`,
        fill: url(`petal-light-${colorIndex}`),
        "fill-opacity": 0.65
      },
      light
    );
  svgNode(
    doc,
    "circle",
    { cx: 0, cy: 12, r: 2.1, fill: url(`glass-${colorIndex}`), stroke: color, "stroke-width": 0.4 },
    parent
  );
  svgNode(doc, "circle", { cx: 0, cy: 12, r: 1.55, fill: url(`fire-${colorIndex}`) }, light);
  svgNode(doc, "circle", { cx: -0.2, cy: 11.7, r: 0.6, fill: "#fff9e9" }, light);
  if (options.glitter) {
    const flecks = svgNode(doc, "g", { "clip-path": url("glass-clip") }, light);
    for (let j = 0; j < 20; j++)
      svgNode(
        doc,
        "circle",
        {
          cx: Math.sin(j * 8.1) * 9,
          cy: 3 + j * 4.17 % 18,
          r: 0.15,
          fill: "#fff4dd",
          opacity: 0.75
        },
        flecks
      );
  }
  socketArtwork(doc, parent, url);
  return dimBaseMaterial(doc, parent, light, options);
}
function socketArtwork(doc, parent, url) {
  svgNode(
    doc,
    "path",
    {
      d: "M-2.8-1.2-2.4 4Q0 5 2.4 4L2.8-1.2Z",
      fill: url("socket"),
      stroke: "#07190e",
      "stroke-width": 0.35
    },
    parent
  );
  svgNode(
    doc,
    "ellipse",
    { cx: 0, cy: -1.2, rx: 2.8, ry: 0.7, fill: "#2f6040", stroke: "#83a174", "stroke-width": 0.2 },
    parent
  );
  svgNode(
    doc,
    "path",
    {
      d: "M-2.5 0.5Q0 1.3 2.5 0.5M-2.3 2.9Q0 3.5 2.3 2.9",
      fill: "none",
      stroke: "#0c2517",
      "stroke-width": 0.35
    },
    parent
  );
  svgNode(
    doc,
    "path",
    { d: "M-1.9-.3-1.6 3.4", stroke: "#9cba8e", "stroke-opacity": 0.4, "stroke-width": 0.25 },
    parent
  );
}
function dimBaseMaterial(doc, parent, light, options) {
  if (!options.dimBase) return light;
  const material = [...parent.children].slice(0, -4).filter((node) => node !== light);
  const base = svgNode(doc, "g", { opacity: 0.12, "data-string-base": "dim" });
  parent.insertBefore(base, parent.firstChild);
  base.append(...material);
  return light;
}

// src/core/dimensions.js
function dimensions({ page, options, win, host, doc }) {
  if (!page) {
    const scrolls = /^(auto|scroll)$/.test(win.getComputedStyle(host).overflowY);
    if (!scrolls) return [host.clientWidth, host.clientHeight];
    const height2 = withoutOverlays(
      host.querySelectorAll(":scope > svg[data-string]"),
      () => Math.max(host.clientHeight, host.scrollHeight)
    );
    return [host.clientWidth, height2];
  }
  if (options.pagePosition === "fixed")
    return [doc.documentElement.clientWidth || win.innerWidth, win.innerHeight];
  const height = withoutOverlays(
    doc.querySelectorAll('svg[data-string-page="absolute"]'),
    () => Math.max(win.innerHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight)
  );
  return [doc.documentElement.clientWidth || win.innerWidth, height];
}
function withoutOverlays(nodes, measure) {
  const overlays = [...nodes];
  const previous = overlays.map((overlay) => overlay.style.height);
  overlays.forEach((overlay) => {
    overlay.style.height = "0px";
  });
  const height = measure();
  overlays.forEach((overlay, i) => {
    overlay.style.height = previous[i];
  });
  return height;
}

// src/core/renderer.js
function renderScene(state) {
  const { doc, svg, page, id, media, options, host, win } = state;
  const root = doc.createDocumentFragment();
  state.strands = [];
  state.bulbs = [];
  if (page) svg.dataset.stringPage = options.pagePosition;
  const [w, h] = dimensions(state);
  if (!page) svg.style.height = `${h}px`;
  if (page)
    Object.assign(svg.style, {
      position: options.pagePosition,
      width: `${w}px`,
      height: `${h}px`,
      inset: "0 auto auto 0"
    });
  if (page && options.pagePosition === "absolute") {
    const rect = host.getBoundingClientRect();
    svg.style.left = `${-(rect.left + win.scrollX + host.clientLeft)}px`;
    svg.style.top = `${-(rect.top + win.scrollY + host.clientTop)}px`;
  }
  state.width = w;
  state.height = h;
  svg.setAttribute("viewBox", `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`);
  const defs = svgNode(doc, "defs", {}, root);
  const bulbShapes = Array.isArray(options.shape) ? [...new Set(options.shape)] : [options.shape];
  materialDefinitions(doc, defs, id, options.colors, bulbShapes);
  const materials = new Map(
    bulbShapes.map((shape) => {
      return [shape, { id, options: { ...options, shape } }];
    })
  );
  const { wires, bulbs } = createGeometry(w, h, options);
  for (const wire of wires) {
    const d = pathFor(wire);
    const paths = [
      svgNode(
        doc,
        "path",
        { d, fill: "none", stroke: "#142c21", "stroke-width": "2", "stroke-linejoin": "round" },
        root
      ),
      svgNode(doc, "path", { d, fill: "none", stroke: "#68805b", "stroke-width": ".55" }, root)
    ];
    const strand = { points: wire, paths, offset: 0, velocity: 0, rope: null, dirty: true };
    state.strands.push(strand);
    if (options.interactive && !media.matches) {
      const hit = svgNode(
        doc,
        "path",
        {
          d,
          fill: "none",
          stroke: "transparent",
          "stroke-width": 14,
          "data-string-wire": state.strands.length - 1
        },
        root
      );
      Object.assign(hit.style, { pointerEvents: "stroke", cursor: "grab", touchAction: "none" });
      paths.push(hit);
    }
  }
  bulbs.forEach((b, index) => {
    const group = svgNode(
      doc,
      "g",
      {
        transform: `translate(${b.x} ${b.y}) rotate(${b.angle}) scale(${options.size})`,
        color: b.color
      },
      root
    );
    group.dataset.shape = b.shape;
    if (options.interactive && !media.matches) {
      Object.assign(group.style, { pointerEvents: "all", cursor: "grab", touchAction: "none" });
      group.dataset.stringBulb = String(index);
    }
    const material = materials.get(b.shape);
    const light = bulbArtwork(doc, group, material.id, index, material.options);
    state.bulbs.push({ node: group, bulb: b, light });
  });
  svg.replaceChildren(root);
}

// src/core/controller.js
var hostRecordKey = /* @__PURE__ */ Symbol.for("string-lights.host-position.v1");
var programKeys = ["mode", "patternOrder", "patternInterval", "patternSequence", "seed"];
var liveKeys = /* @__PURE__ */ new Set([
  "mode",
  "speed",
  "patternOrder",
  "patternInterval",
  "patternSequence",
  "paused",
  "breeze",
  "wind",
  "animated",
  "collisions"
]);
function retainHost(host, win) {
  let record = host[hostRecordKey];
  if (!record) {
    record = {
      count: 0,
      position: host.style.position,
      changed: win.getComputedStyle(host).position === "static"
    };
    Object.defineProperty(host, hostRecordKey, { value: record, configurable: true });
  }
  if (record.changed) host.style.position = "relative";
  record.count++;
}
function releaseHost(host) {
  const record = host[hostRecordKey];
  if (--record.count !== 0) return;
  if (record.changed && host.style.position === "relative") host.style.position = record.position;
  delete host[hostRecordKey];
}
function changedKeys(previous, next) {
  return Object.keys(next).filter((key) => {
    const a = previous[key], b = next[key];
    return Array.isArray(a) && Array.isArray(b) ? a.length !== b.length || a.some((value, i) => value !== b[i]) : a !== b;
  });
}
function createStringLights(target, input = {}) {
  const host = typeof target === "string" ? document.querySelector(target) : target;
  if (!host?.ownerDocument?.defaultView || !host.style)
    throw new TypeError("A DOM element is required.");
  const options = normalizeOptions(input);
  const doc = host.ownerDocument, win = doc.defaultView;
  const page = host === doc.body || host === doc.documentElement;
  let retainedHost = false;
  const id = nextId("string");
  const svg = svgNode(
    doc,
    "svg",
    { "aria-hidden": "true", focusable: "false", "data-string": id },
    host
  );
  Object.assign(svg.style, {
    position: page ? "fixed" : "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    touchAction: "none",
    overflow: "hidden",
    clipPath: "inset(0)",
    zIndex: "10"
  });
  const media = win.matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    host,
    doc,
    win,
    page,
    id,
    svg,
    media,
    options,
    destroyed: false,
    visible: true,
    strands: [],
    bulbs: [],
    drag: null,
    width: -1,
    height: -1
  };
  const lighting = createLighting(state);
  const motion = createMotion(state);
  const interaction = createInteraction(state);
  let resizeFrame = 0;
  function sync() {
    lighting.sync();
    motion.sync();
  }
  function render() {
    if (state.destroyed) return;
    const retain = !page || state.options.pagePosition === "absolute";
    if (retain !== retainedHost) {
      if (retain) retainHost(host, win);
      else releaseHost(host);
      retainedHost = retain;
    }
    interaction.release();
    lighting.cancel();
    motion.reset();
    renderScene(state);
    lighting.apply();
    sync();
  }
  state.sync = sync;
  state.refresh = render;
  state.release = interaction.release;
  function resize() {
    if (state.destroyed || resizeFrame) return;
    const [width, height] = dimensions(state);
    if (width === state.width && height === state.height) return;
    resizeFrame = win.requestAnimationFrame(() => {
      resizeFrame = 0;
      render();
    });
  }
  const observer = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(resize) : null;
  observer?.observe(host);
  if (!page) host.addEventListener("scroll", resize, { passive: true });
  if (page) observer?.observe(doc.documentElement);
  const visibility = !page && typeof win.IntersectionObserver === "function" ? new win.IntersectionObserver(
    (entries) => {
      if (state.destroyed) return;
      const entry = entries.at(-1);
      const visible = entry.isIntersecting && entry.intersectionRatio > 0;
      if (visible !== state.visible) {
        state.visible = visible;
        sync();
      }
    },
    { threshold: [0, Number.EPSILON] }
  ) : null;
  visibility?.observe(host);
  const needsWindowResize = page || !observer;
  if (needsWindowResize) win.addEventListener("resize", resize);
  media.addEventListener("change", render);
  doc.addEventListener("visibilitychange", sync);
  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    interaction.dispose();
    lighting.cancel();
    motion.stop();
    win.cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    if (!page) host.removeEventListener("scroll", resize);
    visibility?.disconnect();
    if (needsWindowResize) win.removeEventListener("resize", resize);
    media.removeEventListener("change", render);
    doc.removeEventListener("visibilitychange", sync);
    svg.remove();
    state.strands = [];
    state.bulbs = [];
    if (retainedHost) releaseHost(host);
  }
  try {
    render();
  } catch (error) {
    destroy();
    throw error;
  }
  return {
    element: svg,
    get pattern() {
      return lighting.mode;
    },
    update(next = {}) {
      if (state.destroyed) return;
      const normalized = normalizeOptions({ ...state.options, ...next });
      const changed = changedKeys(state.options, normalized);
      if (!changed.length) return;
      state.options = normalized;
      const programChanged = programKeys.some((key) => changed.includes(key));
      if (programChanged) lighting.resetProgram();
      if (changed.some((key) => !liveKeys.has(key))) {
        render();
        return;
      }
      if (programChanged || changed.includes("animated")) lighting.apply();
      else if (changed.includes("speed")) lighting.updateSpeed();
      sync();
    },
    pause() {
      if (!state.destroyed) {
        state.options.paused = true;
        sync();
      }
    },
    play() {
      if (!state.destroyed) {
        state.options.paused = false;
        sync();
      }
    },
    destroy
  };
}

// src/core/preview.js
function createBulbPreview(input = {}) {
  const options = normalizeOptions(input), doc = document, id = nextId("string-material");
  if (Array.isArray(options.shape)) options.shape = options.shape[0];
  const svg = svgNode(doc, "svg", {
    viewBox: "-23 -16 46 48",
    role: "img",
    "aria-label": `${options.shape} glass bulb`
  });
  const defs = svgNode(doc, "defs", {}, svg);
  materialDefinitions(doc, defs, id, options.colors, options.shape);
  const group = svgNode(
    doc,
    "g",
    { transform: options.shape === "heart" ? "translate(0 -2)" : "translate(0 18) rotate(180)" },
    svg
  );
  bulbArtwork(doc, group, id, 0, options);
  return svg;
}
export {
  breezeForce,
  createBulbPreview,
  createGeometry,
  createRope,
  createStringLights,
  layouts,
  modes,
  normalizeOptions,
  palettes,
  releaseRope,
  ropeAttachment,
  shapes,
  stepRope,
  stringLightsPresets
};
