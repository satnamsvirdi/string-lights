import { normalizeOptions } from './options.js';
function preset(name, description, input) {
  const options = { ...normalizeOptions(input), colors: input.colors || 'multicolor' };
  for (const value of Object.values(options)) if (Array.isArray(value)) Object.freeze(value);
  return Object.freeze({ name, description, options: Object.freeze(options) });
}
/** Complete, immutable starting points. Spread options to customize a preset. */
export const stringLightsPresets = /* @__PURE__ */ Object.freeze({
  festive: /* @__PURE__ */ preset(
    'Diwali rainbow',
    'Colorful rice bulbs with white accents and shuffled lighting patterns.',
    {
      layout: 'roofline',
      shape: 'rice',
      colors: 'multicolor',
      size: 1.2,
      dimBase: true,
      patternOrder: 'random',
      patternInterval: 8,
    },
  ),
  classic: /* @__PURE__ */ preset(
    'Classic electric',
    'Traditional multicolor LED strings with a running chase.',
    {
      layout: 'curtain',
      shape: 'led',
      colors: 'electric',
      mode: 'chase',
      spacing: 24,
      size: 1.2,
      dimBase: true,
    },
  ),
  warm: /* @__PURE__ */ preset(
    'Warm gathering',
    'Layered amber rice lights with a steady, gentle glow.',
    {
      layout: 'draped',
      shape: 'rice',
      colors: 'warm',
      mode: 'static',
      spacing: 32,
      glow: 0.55,
    },
  ),
  white: /* @__PURE__ */ preset(
    'White snowfall',
    'White crystal curtain lights with a slow fade.',
    {
      layout: 'curtain',
      shape: 'crystal',
      colors: 'white',
      mode: 'fade',
      speed: 0.6,
      spacing: 36,
      glow: 0.5,
    },
  ),
  flowers: /* @__PURE__ */ preset(
    'Flower garland',
    'Colorful glass flowers framing a card with a soft wave.',
    {
      layout: 'border',
      shape: 'flower',
      colors: 'multicolor',
      mode: 'wave',
      spacing: 40,
      size: 1.3,
      speed: 0.7,
    },
  ),
  crystal: /* @__PURE__ */ preset(
    'Crystal sparkle',
    'Amber crystal and round bulbs with glitter and a changing rhythm.',
    {
      layout: 'roofline',
      shape: ['crystal', 'round'],
      colors: 'warm',
      glitter: true,
      spacing: 36,
      patternOrder: 'cycle',
      patternInterval: 12,
      patternSequence: ['fade', 'wave', 'static'],
    },
  ),
  tricolor: /* @__PURE__ */ preset(
    'Tricolor celebration',
    'Saffron, white, and green round bulbs in a traveling chase.',
    {
      layout: 'roofline',
      shape: 'round',
      colors: 'tricolor',
      mode: 'chase',
      spacing: 30,
      size: 1.2,
    },
  ),
  mixed: /* @__PURE__ */ preset(
    'Mixed celebration',
    'Every bulb shape, rainbow colors, glitter, and shuffled patterns.',
    {
      layout: 'draped',
      shape: ['rice', 'round', 'crystal', 'flower', 'led'],
      colors: 'multicolor',
      spacing: 36,
      size: 1.2,
      glitter: true,
      dimBase: true,
      patternOrder: 'random',
      patternInterval: 6,
    },
  ),
});
