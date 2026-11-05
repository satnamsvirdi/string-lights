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
var shapes = /* @__PURE__ */ Object.freeze(["rice", "round", "crystal", "flower", "led"]);
var modes = /* @__PURE__ */ Object.freeze(["static", "blink", "chase", "twinkle", "wave"]);
var defaults = /* @__PURE__ */ Object.freeze({
  layout: "roofline",
  shape: "rice",
  colors: "multicolor",
  mode: "static",
  spacing: 28,
  size: 1,
  sag: 48,
  speed: 1,
  glow: 0.65,
  glitter: false,
  dimBase: false,
  breeze: true,
  wind: 1,
  interactive: true,
  seed: 7,
  paused: false,
  patternOrder: "fixed",
  patternInterval: 10,
  patternSequence: /* @__PURE__ */ Object.freeze(["blink", "chase", "wave", "twinkle"])
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
    ["patternOrder", ["fixed", "cycle", "random"]]
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
  for (const key of ["glitter", "dimBase", "breeze", "interactive", "paused"]) {
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
    "White crystal curtain lights with a slow twinkle.",
    {
      layout: "curtain",
      shape: "crystal",
      colors: "white",
      mode: "twinkle",
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
      patternSequence: ["twinkle", "wave", "static"]
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

// src/core/geometry.js
var MAX_BULBS = 600;
var MAX_WIRE_SEGMENTS = 128;
function createGeometry(width, height, input = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height))
    throw new TypeError("Geometry dimensions must be finite.");
  if (width > 1e6 || height > 1e6)
    throw new RangeError("Geometry dimensions cannot exceed 1,000,000 CSS pixels.");
  const o = normalizeOptions(input), rand = random(o.seed), wires = [], bulbs = [];
  if (!(width > 0 && height > 0)) return { wires, bulbs };
  const add = (points, angle = 0) => {
    const wire = wires.length;
    wires.push(points);
    let distance = 0, next = o.spacing * 0.5;
    for (let i = 1; i < points.length && bulbs.length < MAX_BULBS; i++) {
      const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= distance + length && bulbs.length < MAX_BULBS) {
        const t = (next - distance) / Math.max(length, 1e-3);
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
          group: bulbs.length % 4
        });
        next += o.spacing;
      }
      distance += length;
    }
  };
  const swag = (y, waves = 2, sag = o.sag) => {
    const span = width / waves, depth = Math.min(sag, height * 0.25);
    let lo = span / 40, hi = Math.max(span * span / Math.max(depth, 1e-3), span);
    for (let i = 0; i < 50; i++) {
      const a2 = (lo + hi) / 2;
      if (a2 * (Math.cosh(span / (2 * a2)) - 1) > depth) lo = a2;
      else hi = a2;
    }
    const a = hi;
    for (let k = -1; k < waves; k++) {
      const left = (k + 0.5) * span, n = Math.min(MAX_WIRE_SEGMENTS, Math.max(16, Math.ceil(span / 12)));
      add(
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
  };
  if (o.layout === "roofline") swag(12);
  if (o.layout === "draped") for (let row = 0; row < 3; row++) swag(12 + row * 38, 3, o.sag * 0.65);
  if (o.layout === "curtain") {
    swag(12, 2, 3);
    const headerWires = [...wires];
    const headerBulbs = clearBulbOverlaps(bulbs, o).sort((a, b) => a.x - b.x);
    for (let i = 0; i + 1 < headerBulbs.length; i += 2) {
      const x = (headerBulbs[i].x + headerBulbs[i + 1].x) / 2;
      if (x < 10 || x > width - 10) continue;
      const header = headerWires.find((points) => x >= points[0].x && x <= points.at(-1).x);
      const segment = header.findIndex((point, j) => j > 0 && point.x >= x);
      const a = header[segment - 1], b = header[segment];
      const y = a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
      const length = Math.max(20, (height - 40) * (0.4 + rand() * 0.6));
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil(length / 12)));
      add(
        Array.from({ length: n + 1 }, (_, j) => ({
          x,
          y: y + length * j / n,
          mobility: (j / n) ** 2
        }))
      );
    }
  }
  if (o.layout === "border") {
    swag(12, 2, 8);
    for (const x of [8, width - 8]) {
      const n = Math.min(MAX_WIRE_SEGMENTS, Math.max(2, Math.ceil((height + 40) / 12)));
      add(
        Array.from({ length: n + 1 }, (_, i) => ({
          x,
          y: -20 + (height + 40) * i / n,
          mobility: (i / n) ** 2
        })),
        x < width / 2 ? -90 : 90
      );
    }
  }
  return { wires, bulbs: clearBulbOverlaps(bulbs, o) };
}
function clearBulbOverlaps(bulbs, o) {
  const accepted = [], cells = /* @__PURE__ */ new Map();
  const cellSize = 64;
  for (const bulb of bulbs) {
    if (Array.isArray(o.shape)) bulb.shape = o.shape[accepted.length % o.shape.length];
    const envelope = bulb.shape === "flower" ? [-13, -4, 14, 23] : bulb.shape === "round" ? [-7, -2, 7, 17] : bulb.shape === "crystal" ? [-6, -2, 6, 20] : [-4, -2, 4, 19];
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
      (other) => bounds.left < other.right && bounds.right > other.left && bounds.top < other.bottom && bounds.bottom > other.top
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

// src/core/physics.js
var PHYSICS_STEP = 1 / 120;
var GRAVITY = 980;
var CONSTRAINT_PASSES = 40;
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
  return { nodes, lengths, active: false, accumulator: 0, quietTime: 0, sleeping: false };
}
function ropeAttachment(rope, segment, t) {
  const a = rope.nodes[segment], b = rope.nodes[segment + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function stepRope(rope, dt, grab = null, wind = 0) {
  const { nodes, lengths } = rope;
  for (const p of nodes) {
    if (p.pinned) {
      p.x = p.homeX;
      p.y = p.homeY;
      continue;
    }
    const speed = Math.hypot(p.x - p.px, p.y - p.py) / dt;
    const damping = Math.exp(-(0.5 + 15e-4 * speed) * dt);
    const vx = (p.x - p.px) * damping, vy = (p.y - p.py) * damping;
    p.px = p.x;
    p.py = p.y;
    p.x += vx + wind * dt * dt;
    p.y += vy + GRAVITY * dt * dt;
  }
  function hold() {
    if (!grab) return;
    const a = nodes[grab.segment], b = nodes[grab.segment + 1], u = 1 - grab.t;
    const point = ropeAttachment(rope, grab.segment, grab.t);
    const weight = a.mass * u * u + b.mass * grab.t * grab.t;
    if (weight < 1e-8) return;
    a.x += (grab.x - point.x) * a.mass * u / weight;
    a.y += (grab.y - point.y) * a.mass * u / weight;
    b.x += (grab.x - point.x) * b.mass * grab.t / weight;
    b.y += (grab.y - point.y) * b.mass * grab.t / weight;
  }
  for (let pass = 0; pass < CONSTRAINT_PASSES; pass++) {
    hold();
    for (let k = 0; k < lengths.length; k++) {
      const i = pass % 2 ? lengths.length - 1 - k : k, a = nodes[i], b = nodes[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy), weight = a.mass + b.mass;
      if (!weight || !length) continue;
      const error = (length - lengths[i]) / length / weight;
      a.x += dx * error * a.mass;
      a.y += dy * error * a.mass;
      b.x -= dx * error * b.mass;
      b.y -= dy * error * b.mass;
    }
  }
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
    if (!strand.rope?.active) {
      strand.rope = createRope(
        strand.points.map((point) => ({
          ...point,
          x: point.x + strand.offset * point.mobility,
          y: point.y + strand.offset * 0.12 * point.mobility
        }))
      );
    }
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
    for (let i = 0; i < 12; i++)
      for (const [anchor, radius] of [
        [nodes[0], leftLength],
        [nodes.at(-1), total - leftLength]
      ]) {
        if (!anchor.pinned) continue;
        const dx2 = state.drag.x - anchor.homeX, dy2 = state.drag.y - anchor.homeY, distance = Math.hypot(dx2, dy2);
        if (distance > radius) {
          state.drag.x = anchor.homeX + dx2 * radius / distance;
          state.drag.y = anchor.homeY + dy2 * radius / distance;
        }
      }
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
    if (patternTimer || state.destroyed || isInactive(state) || media.matches || state.options.patternOrder === "fixed" || state.options.patternSequence.length < 2)
      return;
    patternStarted = win.performance.now();
    patternTimer = win.setTimeout(() => {
      patternTimer = 0;
      if (state.destroyed) return;
      if (isInactive(state) || media.matches) {
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
    for (const [index, { light, bulb }] of state.bulbs.entries()) {
      if (mode === "static" || media.matches || !light.animate) continue;
      let frames, duration = 4e3 / state.options.speed, delay = 0;
      const low = state.options.dimBase ? 0.02 : 0.2;
      if (mode === "twinkle") {
        frames = [
          { opacity: 1 },
          { opacity: low, offset: 0.35 },
          { opacity: 0.75, offset: 0.5 },
          { opacity: state.options.dimBase ? 0.03 : 0.25, offset: 0.7 },
          { opacity: 1 }
        ];
        duration *= 1 + bulb.phase;
        delay = -bulb.phase * duration;
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
      if (isInactive(state) || media.matches || state.options.patternOrder === "fixed")
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
    for (const [i, strand] of state.strands.entries()) {
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
          stepRope(strand.rope, PHYSICS_STEP, held ? state.drag : null, wind);
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
      strand.changed = Math.abs(strand.offset) + Math.abs(strand.velocity) > 2e-3 || strand.dirty;
      if (strand.changed) {
        const d = pathFor(strand.points, strand.offset);
        strand.paths.forEach((p) => p.setAttribute("d", d));
        strand.dirty = false;
      }
    }
    for (const { node, bulb } of state.bulbs) {
      const strand = state.strands[bulb.wire], shift = strand.offset * bulb.mobility;
      if (!strand.changed) continue;
      const point = strand.rope?.active ? ropeAttachment(strand.rope, bulb.segment, bulb.t) : { x: bulb.x + shift, y: bulb.y + shift * 0.12 };
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
  crystal: "M0 3 5.7 8.5 4 14 0 19 -4 14 -5.7 8.5Z",
  flower: "M0 5C-7-6-12 4-5 8C-17 9-10 19-3 13C-2 24 7 22 5 13C16 18 17 7 7 7C14-2 2-6 0 5Z"
};
var FLOWER_PETAL = "M0 10.7C-1.4 9.4-4.2 7-3.6 4.9C-2.9 1.5 2.9 1.5 3.6 4.9C4.2 7 1.4 9.4 0 10.7Z";
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
      d: "M-1.1 5.2V11Q0 13 1.1 11V5.2",
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
      d: "M-0.7 5.5V11Q0 12.2 0.7 11V5.5",
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
        d: "M-1.6 4.5Q-3.2 8-1.5 12",
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

// src/core/renderer.js
function renderScene(state) {
  const { doc, win, svg, host, page, id, media, options } = state;
  const root = doc.createDocumentFragment();
  state.strands = [];
  state.bulbs = [];
  const w = page ? win.innerWidth : host.clientWidth, h = page ? win.innerHeight : host.clientHeight;
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
  "wind"
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
  if (!page) retainHost(host, win);
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
    const width = page ? win.innerWidth : host.clientWidth;
    const height = page ? win.innerHeight : host.clientHeight;
    if (width === state.width && height === state.height) return;
    resizeFrame = win.requestAnimationFrame(() => {
      resizeFrame = 0;
      render();
    });
  }
  const observer = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(resize) : null;
  observer?.observe(host);
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
    visibility?.disconnect();
    if (needsWindowResize) win.removeEventListener("resize", resize);
    media.removeEventListener("change", render);
    doc.removeEventListener("visibilitychange", sync);
    svg.remove();
    state.strands = [];
    state.bulbs = [];
    if (!page) releaseHost(host);
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
      if (programChanged) lighting.apply();
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
  const group = svgNode(doc, "g", { transform: "translate(0 18) rotate(180)" }, svg);
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
