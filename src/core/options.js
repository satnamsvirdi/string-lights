export const palettes = /* @__PURE__ */ Object.freeze({
  multicolor: /* @__PURE__ */ Object.freeze([
    '#ff3158',
    '#ffc329',
    '#35f269',
    '#4385ff',
    '#ff46bd',
    '#ffffff',
  ]),
  electric: /* @__PURE__ */ Object.freeze(['#ff102c', '#16ff38', '#233dff', '#ffe600', '#e9f5ff']),
  warm: /* @__PURE__ */ Object.freeze(['#ffd080']),
  white: /* @__PURE__ */ Object.freeze(['#ffffff']),
  tricolor: /* @__PURE__ */ Object.freeze(['#ff9438', '#ffffff', '#32df75']),
});
export const layouts = /* @__PURE__ */ Object.freeze(['roofline', 'curtain', 'draped', 'border']);
export const shapes = /* @__PURE__ */ Object.freeze([
  'rice',
  'round',
  'crystal',
  'flower',
  'led',
  'heart',
]);
export const modes = /* @__PURE__ */ Object.freeze([
  'static',
  'blink',
  'chase',
  'wave',
  'alternate',
  'pairs',
  'double',
  'steps',
  'bounce',
  'fade',
]);

import { clamp } from './utils.js';
const defaults = /* @__PURE__ */ Object.freeze({
  layout: 'roofline',
  shape: 'rice',
  colors: 'multicolor',
  mode: 'fade',
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
  pagePosition: 'fixed',
  patternOrder: 'fixed',
  patternInterval: 10,
  patternSequence: /* @__PURE__ */ Object.freeze(['blink', 'chase', 'wave', 'fade']),
});
export function normalizeOptions(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new TypeError('options must be an object.');
  const o = { ...defaults };
  for (const [key, value] of Object.entries(input)) {
    if (Object.hasOwn(defaults, key) && value !== undefined) o[key] = value;
  }
  for (const [key, list] of [
    ['layout', layouts],
    ['mode', modes],
    ['patternOrder', ['fixed', 'cycle', 'random']],
    ['pagePosition', ['fixed', 'absolute']],
  ]) {
    if (!list.includes(o[key])) throw new TypeError(`Unknown ${key}: ${o[key]}`);
  }
  if (Array.isArray(o.shape)) {
    if (!o.shape.length || o.shape.some((shape) => !shapes.includes(shape)))
      throw new TypeError('shape must be a bulb name or a nonempty array of bulb names.');
    o.shape = [...o.shape];
  } else if (!shapes.includes(o.shape)) throw new TypeError(`Unknown shape: ${o.shape}`);
  if (
    !Array.isArray(o.patternSequence) ||
    !o.patternSequence.length ||
    o.patternSequence.some((mode) => !modes.includes(mode)) ||
    new Set(o.patternSequence).size !== o.patternSequence.length
  )
    throw new TypeError('patternSequence must be a nonempty array of distinct pattern names.');
  o.patternSequence = [...o.patternSequence];
  o.colors = typeof o.colors === 'string' ? palettes[o.colors] : o.colors;
  if (
    !Array.isArray(o.colors) ||
    !o.colors.length ||
    o.colors.some((c) => typeof c !== 'string' || !/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(c))
  ) {
    throw new TypeError(
      'colors must be a palette name or a nonempty array of #RGB / #RRGGBB colors.',
    );
  }
  o.colors = [...o.colors];
  for (const [key, min, max] of [
    ['spacing', 16, 100],
    ['size', 0.5, 2.5],
    ['sag', 0, 140],
    ['speed', 0.2, 2],
    ['glow', 0, 1],
    ['wind', 0, 2],
    ['patternInterval', 1, 3600],
  ]) {
    if (!Number.isFinite(o[key])) throw new TypeError(`${key} must be finite.`);
    o[key] = clamp(o[key], min, max);
  }
  if (!Number.isFinite(o.seed)) throw new TypeError('seed must be finite.');
  if (!Number.isInteger(o.anchorCount) || o.anchorCount < 0 || o.anchorCount > 12)
    throw new TypeError('anchorCount must be an integer from 0 to 12 (0 uses the layout default).');
  for (const key of [
    'glitter',
    'dimBase',
    'breeze',
    'interactive',
    'paused',
    'animated',
    'collisions',
  ]) {
    if (typeof o[key] !== 'boolean') throw new TypeError(`${key} must be boolean.`);
  }
  return o;
}
