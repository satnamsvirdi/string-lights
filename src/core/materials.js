import { svgNode } from './svg.js';
const BULB_OUTLINES = {
  rice: 'M0 3C-5 3-4.4 13.2 0 18C4.4 13.2 5 3 0 3Z',
  round: 'M0 3a6.4 6.4 0 1 0 0 12.8a6.4 6.4 0 1 0 0-12.8Z',
  led: 'M-3.6 15V7a3.6 3.6 0 0 1 7.2 0v8Z',
  heart: 'M0 6C-3-1-11 2-9 9C-8 13-3 17 0 20C3 17 8 13 9 9C11 2 3-1 0 6Z',
  crystal: 'M0 3 5.7 8.5 4 14 0 19 -4 14 -5.7 8.5Z',
  flower: 'M0 5C-7-6-12 4-5 8C-17 9-10 19-3 13C-2 24 7 22 5 13C16 18 17 7 7 7C14-2 2-6 0 5Z',
};
const FLOWER_PETAL =
  'M0 10.7C-1.4 9.4-4.2 7-3.6 4.9C-2.9 1.5 2.9 1.5 3.6 4.9C4.2 7 1.4 9.4 0 10.7Z';
const HEART_FILAMENT =
  'M-.9 5.5V9.2C-4.5 5.5-7.4 9.3-4.5 12.2L0 16.5L4.5 12.2C7.4 9.3 4.5 5.5 .9 9.2V5.5';
export function materialDefinitions(doc, defs, id, colors, shape) {
  const shapes = Array.isArray(shape) ? shape : [shape];
  const gradient = (type, name, attributes, stops) => {
    const node = svgNode(doc, type, { id: `${id}-${name}`, ...attributes }, defs);
    stops.forEach(([offset, color, opacity = 1]) =>
      svgNode(doc, 'stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, node),
    );
  };
  gradient('linearGradient', 'socket', { x1: '0%', x2: '100%' }, [
    [0, '#06150f'],
    [0.18, '#174c30'],
    [0.32, '#578963'],
    [0.43, '#214e36'],
    [0.82, '#10291f'],
    [1, '#030e0a'],
  ]);
  gradient('linearGradient', 'reflection', { x1: '0%', y1: '0%', x2: '100%', y2: '35%' }, [
    [0, '#fff', 0.02],
    [0.23, '#fff', 0.65],
    [0.37, '#fff', 0.08],
    [0.72, '#fff', 0],
    [1, '#fff', 0.3],
  ]);
  for (const bulbShape of shapes) {
    const clip = svgNode(
      doc,
      'clipPath',
      { id: `${id}-${bulbShape}-glass-clip`, clipPathUnits: 'userSpaceOnUse' },
      defs,
    );
    if (bulbShape === 'flower') {
      for (let petal = 0; petal < 5; petal++)
        svgNode(doc, 'path', { d: FLOWER_PETAL, transform: `rotate(${petal * 72} 0 12)` }, clip);
    } else svgNode(doc, 'path', { d: BULB_OUTLINES[bulbShape] }, clip);
  }
  colors.forEach((color, i) => {
    gradient('radialGradient', `halo-${i}`, {}, [
      [0, color, 0.65],
      [0.22, color, 0.3],
      [0.6, color, 0.08],
      [1, color, 0],
    ]);
    gradient('linearGradient', `glass-${i}`, { x1: '0%', y1: '0%', x2: '100%', y2: '15%' }, [
      [0, '#030811', 0.9],
      [0.13, color, 0.72],
      [0.28, '#fff', 0.66],
      [0.4, color, 0.35],
      [0.66, color, 0.62],
      [0.86, '#020510', 0.88],
      [1, color, 0.9],
    ]);
    gradient('radialGradient', `fire-${i}`, { cx: '42%', cy: '64%', r: '68%' }, [
      [0, '#fffce7', 0.98],
      [0.16, '#fff', 0.85],
      [0.34, color, 0.9],
      [0.7, color, 0.24],
      [1, color, 0],
    ]);
    gradient('linearGradient', `rim-${i}`, { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }, [
      [0, '#fff', 0.95],
      [0.3, color, 0.9],
      [0.6, color, 0.15],
      [1, '#fff', 0.6],
    ]);
    if (shapes.includes('flower')) {
      gradient('radialGradient', `petal-${i}`, { cx: '30%', cy: '25%', r: '90%' }, [
        [0, '#fff', 0.42],
        [0.2, color, 0.55],
        [0.6, color, 0.26],
        [0.9, color, 0.58],
        [1, '#170b20', 0.75],
      ]);
      gradient('radialGradient', `petal-light-${i}`, { cx: '50%', cy: '100%', r: '100%' }, [
        [0, '#fff5dc', 0.85],
        [0.2, color, 0.7],
        [0.65, color, 0.08],
        [1, color, 0],
      ]);
    }
  });
}
export function bulbArtwork(doc, parent, id, index, options) {
  if (options.shape === 'flower') return flowerArtwork(doc, parent, id, index, options);
  const colorIndex = index % options.colors.length,
    color = options.colors[colorIndex],
    outline = BULB_OUTLINES[options.shape];
  const url = (name) => `url(#${id}-${name === 'glass-clip' ? options.shape + '-' : ''}${name})`;
  const glass = (attrs) => svgNode(doc, 'path', { d: outline, ...attrs }, parent);
  // Keep the plastic shell visible when the filament dims.
  glass({
    fill: url(`glass-${colorIndex}`),
    stroke: url(`rim-${colorIndex}`),
    'stroke-width': 0.38,
  });
  const light = svgNode(doc, 'g', { 'data-bulb': index }, parent);
  if (options.glow)
    svgNode(
      doc,
      'ellipse',
      { cx: 0, cy: 10, rx: 20, ry: 24, fill: url(`halo-${colorIndex}`), opacity: options.glow },
      light,
    );
  svgNode(doc, 'path', { d: outline, fill: url(`fire-${colorIndex}`) }, light);
  // The filament is inside the envelope, rather than painted across its surface.
  svgNode(
    doc,
    'path',
    {
      d: options.shape === 'heart' ? HEART_FILAMENT : 'M-1.1 5.2V11Q0 13 1.1 11V5.2',
      fill: 'none',
      stroke: color,
      'stroke-width': 1.5,
      'stroke-opacity': 0.8,
    },
    light,
  );
  svgNode(
    doc,
    'path',
    {
      d: options.shape === 'heart' ? HEART_FILAMENT : 'M-0.7 5.5V11Q0 12.2 0.7 11V5.5',
      fill: 'none',
      stroke: '#fffbe8',
      'stroke-width': 0.5,
      'stroke-linecap': 'round',
    },
    light,
  );
  if (options.shape === 'crystal') {
    const facets = [
      ['M0 3-2 9-5.7 8.5Z', '#fff', 0.38],
      ['M0 3 2 9-2 9Z', color, 0.3],
      ['M0 3 5.7 8.5 2 9Z', '#fff', 0.16],
      ['M-5.7 8.5-2 9 0 19-4 14Z', '#fff', 0.13],
      ['M-2 9 2 9 0 19Z', '#fff', 0.35],
      ['M2 9 5.7 8.5 4 14 0 19Z', color, 0.4],
    ];
    facets.forEach(([d, fill, opacity]) =>
      svgNode(
        doc,
        'path',
        { d, fill, opacity, stroke: '#fff', 'stroke-width': 0.12, 'stroke-opacity': 0.6 },
        parent,
      ),
    );
  }
  glass({ fill: url('reflection'), 'fill-opacity': 0.5, 'pointer-events': 'none' });
  if (options.shape === 'round')
    svgNode(
      doc,
      'path',
      {
        d: 'M-4 5Q-6 9-3.8 11.5',
        fill: 'none',
        stroke: '#fff',
        'stroke-opacity': 0.85,
        'stroke-width': 0.65,
        'stroke-linecap': 'round',
      },
      parent,
    );
  else if (options.shape !== 'crystal')
    svgNode(
      doc,
      'path',
      {
        d:
          options.shape === 'heart'
            ? 'M-6.8 5.2C-8 7.8-6 10.9-3.8 13.5'
            : 'M-1.6 4.5Q-3.2 8-1.5 12',
        fill: 'none',
        stroke: '#fff',
        'stroke-opacity': 0.75,
        'stroke-width': 0.45,
        'stroke-linecap': 'round',
      },
      parent,
    );
  if (options.glitter) {
    const flecks = svgNode(doc, 'g', { 'clip-path': url('glass-clip') }, light);
    for (let j = 0; j < 22; j++)
      svgNode(
        doc,
        'circle',
        {
          cx: Math.sin(j * 12.3) * 4,
          cy: 3 + ((j * 7.37) % 15),
          r: j % 3 === 0 ? 0.24 : 0.12,
          fill: j % 2 ? '#fff6c2' : color,
          opacity: 0.5 + (j % 3) * 0.2,
        },
        flecks,
      );
    if (index % 5 === 0)
      svgNode(
        doc,
        'path',
        { d: 'M6 1 6.6 5.4 11 6 6.6 6.6 6 11 5.4 6.6 1 6 5.4 5.4Z', fill: '#fffbe9', opacity: 0.9 },
        light,
      );
  }
  // Molded socket, collar, seam, and a small reflected edge catch.
  socketArtwork(doc, parent, url);
  return dimBaseMaterial(doc, parent, light, options);
}
function flowerArtwork(doc, parent, id, index, options) {
  const colorIndex = index % options.colors.length,
    color = options.colors[colorIndex];
  const url = (name) => `url(#${id}-${name === 'glass-clip' ? options.shape + '-' : ''}${name})`;
  svgNode(
    doc,
    'path',
    {
      d: 'M-1 1V9M1 1V9',
      fill: 'none',
      stroke: '#9da786',
      'stroke-opacity': 0.65,
      'stroke-width': 0.35,
    },
    parent,
  );
  // Five separate molded petals; highlights stay inside their own glass envelopes.
  for (let petal = 0; petal < 5; petal++) {
    const group = svgNode(
      doc,
      'g',
      { 'data-flower-petal': petal, transform: `rotate(${petal * 72} 0 12)` },
      parent,
    );
    svgNode(
      doc,
      'path',
      {
        d: FLOWER_PETAL,
        fill: url(`petal-${colorIndex}`),
        stroke: color,
        'stroke-opacity': 0.8,
        'stroke-width': 0.3,
      },
      group,
    );
    svgNode(
      doc,
      'path',
      {
        d: 'M-2.6 5.7C-3 3.7-1.9 2.9-.7 2.8',
        fill: 'none',
        stroke: '#fff',
        'stroke-opacity': 0.65,
        'stroke-width': 0.35,
        'stroke-linecap': 'round',
      },
      group,
    );
    svgNode(
      doc,
      'path',
      {
        d: 'M0 9.5Q-1.1 6.8-.4 5.8',
        fill: 'none',
        stroke: color,
        'stroke-opacity': 0.65,
        'stroke-width': 0.3,
      },
      group,
    );
  }
  const light = svgNode(doc, 'g', { 'data-bulb': index }, parent);
  if (options.glow)
    svgNode(
      doc,
      'ellipse',
      { cx: 0, cy: 12, rx: 18, ry: 19, fill: url(`halo-${colorIndex}`), opacity: options.glow },
      light,
    );
  for (let petal = 0; petal < 5; petal++)
    svgNode(
      doc,
      'path',
      {
        d: FLOWER_PETAL,
        transform: `rotate(${petal * 72} 0 12)`,
        fill: url(`petal-light-${colorIndex}`),
        'fill-opacity': 0.65,
      },
      light,
    );
  // One small LED lens replaces the stacked filament loops in the previous flower.
  svgNode(
    doc,
    'circle',
    { cx: 0, cy: 12, r: 2.1, fill: url(`glass-${colorIndex}`), stroke: color, 'stroke-width': 0.4 },
    parent,
  );
  svgNode(doc, 'circle', { cx: 0, cy: 12, r: 1.55, fill: url(`fire-${colorIndex}`) }, light);
  svgNode(doc, 'circle', { cx: -0.2, cy: 11.7, r: 0.6, fill: '#fff9e9' }, light);
  if (options.glitter) {
    const flecks = svgNode(doc, 'g', { 'clip-path': url('glass-clip') }, light);
    for (let j = 0; j < 20; j++)
      svgNode(
        doc,
        'circle',
        {
          cx: Math.sin(j * 8.1) * 9,
          cy: 3 + ((j * 4.17) % 18),
          r: 0.15,
          fill: '#fff4dd',
          opacity: 0.75,
        },
        flecks,
      );
  }
  // Preserve the existing socket material and connection point.
  socketArtwork(doc, parent, url);
  return dimBaseMaterial(doc, parent, light, options);
}
function socketArtwork(doc, parent, url) {
  svgNode(
    doc,
    'path',
    {
      d: 'M-2.8-1.2-2.4 4Q0 5 2.4 4L2.8-1.2Z',
      fill: url('socket'),
      stroke: '#07190e',
      'stroke-width': 0.35,
    },
    parent,
  );
  svgNode(
    doc,
    'ellipse',
    { cx: 0, cy: -1.2, rx: 2.8, ry: 0.7, fill: '#2f6040', stroke: '#83a174', 'stroke-width': 0.2 },
    parent,
  );
  svgNode(
    doc,
    'path',
    {
      d: 'M-2.5 0.5Q0 1.3 2.5 0.5M-2.3 2.9Q0 3.5 2.3 2.9',
      fill: 'none',
      stroke: '#0c2517',
      'stroke-width': 0.35,
    },
    parent,
  );
  svgNode(
    doc,
    'path',
    { d: 'M-1.9-.3-1.6 3.4', stroke: '#9cba8e', 'stroke-opacity': 0.4, 'stroke-width': 0.25 },
    parent,
  );
}
function dimBaseMaterial(doc, parent, light, options) {
  if (!options.dimBase) return light;
  // Keep the wire connection and socket unchanged; dim only the unlit glass material.
  const material = [...parent.children].slice(0, -4).filter((node) => node !== light);
  const base = svgNode(doc, 'g', { opacity: 0.12, 'data-string-base': 'dim' });
  parent.insertBefore(base, parent.firstChild);
  base.append(...material);
  return light;
}
