const envelopes = {
  flower: [-13, -4, 14, 23],
  round: [-7, -2, 7, 17],
  heart: [-10, -2, 10, 21],
  crystal: [-6, -2, 6, 20],
};
export const bulbEnvelope = (shape) => envelopes[shape] || [-4, -2, 4, 19];

/** Keep one arc-length phase across all connected spans. */
export function sampleChain(wires, spacing, limit) {
  const slots = [];
  let distance = 0,
    next = spacing / 2;
  for (let wire = 0; wire < wires.length; wire++) {
    const points = wires[wire];
    for (let i = 1; i < points.length && slots.length < limit; i++) {
      const a = points[i - 1],
        b = points[i],
        length = Math.hypot(b.x - a.x, b.y - a.y);
      while (next <= distance + length && slots.length < limit) {
        const t = (next - distance) / Math.max(length, 1e-12);
        slots.push({
          wire,
          segment: i - 1,
          t,
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          mobility: a.mobility + (b.mobility - a.mobility) * t,
        });
        next += spacing;
      }
      distance += length;
    }
  }
  return slots;
}

/** Fit the entire row at an even pitch instead of deleting crowded individual bulbs. */
export function fitSpacing(wires, options, limit) {
  if (!limit) return [];
  const bounds = (Array.isArray(options.shape) ? options.shape : [options.shape]).map(bulbEnvelope);
  const width =
    (Math.max(...bounds.map((b) => b[2])) - Math.min(...bounds.map((b) => b[0]))) * options.size +
    6;
  const height =
    (Math.max(...bounds.map((b) => b[3])) - Math.min(...bounds.map((b) => b[1]))) * options.size +
    6;
  const length = wires.reduce(
    (sum, points) =>
      sum +
      points
        .slice(1)
        .reduce((total, p, i) => total + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0),
    0,
  );
  const sample = (count) => sampleChain(wires, length / count, count);
  const fits = (slots) => {
    for (let i = 0; i < slots.length; i++)
      for (let j = i + 1; j < slots.length && slots[j].x - slots[i].x < width - 1e-7; j++)
        if (Math.abs(slots[j].y - slots[i].y) < height - 1e-7) return false;
    return true;
  };
  const count = Math.min(limit, Math.max(1, Math.floor(length / options.spacing)));
  const initial = sample(count);
  if (fits(initial)) return initial;
  let low = 1,
    high = count - 1,
    best = sample(1);
  // At most ten trials for the global 600-bulb limit.
  while (low <= high) {
    const middle = Math.floor((low + high) / 2),
      slots = sample(middle);
    if (fits(slots)) {
      best = slots;
      low = middle + 1;
    } else high = middle - 1;
  }
  return best;
}
