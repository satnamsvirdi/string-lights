import { normalizeOptions } from './options.js';
import { svgNode, nextId } from './svg.js';
import { materialDefinitions, bulbArtwork } from './materials.js';
/** Enlarged specimen rendered with exactly the same materials as live strings. */
export function createBulbPreview(input = {}) {
  const options = normalizeOptions(input),
    doc = document,
    id = nextId('string-material');
  if (Array.isArray(options.shape)) options.shape = options.shape[0];
  const svg = svgNode(doc, 'svg', {
    viewBox: '-23 -16 46 48',
    role: 'img',
    'aria-label': `${options.shape} glass bulb`,
  });
  const defs = svgNode(doc, 'defs', {}, svg);
  materialDefinitions(doc, defs, id, options.colors, options.shape);
  const group = svgNode(
    doc,
    'g',
    { transform: options.shape === 'heart' ? 'translate(0 -2)' : 'translate(0 18) rotate(180)' },
    svg,
  );
  bulbArtwork(doc, group, id, 0, options);
  return svg;
}
