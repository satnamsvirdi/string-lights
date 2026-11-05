import { createGeometry } from './geometry.js';
import { svgNode } from './svg.js';
import { materialDefinitions, bulbArtwork } from './materials.js';
import { pathFor } from './paths.js';
export function renderScene(state) {
  const { doc, win, svg, host, page, id, media, options } = state;
  const root = doc.createDocumentFragment();
  state.strands = [];
  state.bulbs = [];
  const w = page ? win.innerWidth : host.clientWidth,
    h = page ? win.innerHeight : host.clientHeight;
  state.width = w;
  state.height = h;
  svg.setAttribute('viewBox', `0 0 ${Math.max(1, w)} ${Math.max(1, h)}`);
  const defs = svgNode(doc, 'defs', {}, root);
  const bulbShapes = Array.isArray(options.shape) ? [...new Set(options.shape)] : [options.shape];
  materialDefinitions(doc, defs, id, options.colors, bulbShapes);
  const materials = new Map(
    bulbShapes.map((shape) => {
      return [shape, { id, options: { ...options, shape } }];
    }),
  );
  const { wires, bulbs } = createGeometry(w, h, options);
  for (const wire of wires) {
    const d = pathFor(wire);
    const paths = [
      svgNode(
        doc,
        'path',
        { d, fill: 'none', stroke: '#142c21', 'stroke-width': '2', 'stroke-linejoin': 'round' },
        root,
      ),
      svgNode(doc, 'path', { d, fill: 'none', stroke: '#68805b', 'stroke-width': '.55' }, root),
    ];
    const strand = { points: wire, paths, offset: 0, velocity: 0, rope: null, dirty: true };
    state.strands.push(strand);
    if (options.interactive && !media.matches) {
      const hit = svgNode(
        doc,
        'path',
        {
          d,
          fill: 'none',
          stroke: 'transparent',
          'stroke-width': 14,
          'data-string-wire': state.strands.length - 1,
        },
        root,
      );
      Object.assign(hit.style, { pointerEvents: 'stroke', cursor: 'grab', touchAction: 'none' });
      paths.push(hit);
    }
  }
  bulbs.forEach((b, index) => {
    const group = svgNode(
      doc,
      'g',
      {
        transform: `translate(${b.x} ${b.y}) rotate(${b.angle}) scale(${options.size})`,
        color: b.color,
      },
      root,
    );
    group.dataset.shape = b.shape;
    if (options.interactive && !media.matches) {
      Object.assign(group.style, { pointerEvents: 'all', cursor: 'grab', touchAction: 'none' });
      group.dataset.stringBulb = String(index);
    }
    const material = materials.get(b.shape);
    const light = bulbArtwork(doc, group, material.id, index, material.options);
    state.bulbs.push({ node: group, bulb: b, light });
  });
  svg.replaceChildren(root);
}
