import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeometry } from '../../src/core/geometry.js';

function arcGaps(geometry, width, wireLimit = geometry.wires.length) {
  let distance = 0;
  const starts = geometry.wires.map((points) => {
    const start = distance;
    for (let i = 1; i < points.length; i++)
      distance += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    return start;
  });
  const positions = geometry.bulbs
    .filter((b) => b.wire < wireLimit && b.x >= 0 && b.x <= width)
    .map((b) => {
      const points = geometry.wires[b.wire];
      let at = starts[b.wire];
      for (let i = 0; i < b.segment; i++)
        at += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      return (
        at +
        Math.hypot(
          points[b.segment + 1].x - points[b.segment].x,
          points[b.segment + 1].y - points[b.segment].y,
        ) *
          b.t
      );
    });
  return positions.slice(1).map((position, i) => position - positions[i]);
}

test('steep heart rows have one uniform pitch instead of skipped bulbs and support gaps', () => {
  for (const width of [280, 700, 1000, 1400])
    for (const size of [0.5, 1, 1.3, 2.5])
      for (const sag of [0, 60, 140]) {
        const geometry = createGeometry(width, 600, { shape: 'heart', spacing: 34, size, sag });
        const gaps = arcGaps(geometry, width);
        if (!gaps.length) continue;
        assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1e-6, `${width}/${size}/${sag}: ${gaps}`);
        assert.ok(Math.min(...gaps) >= 34 - 1e-6);
      }
});

test('uniform spacing works for mixed bulb sizes and layout headers without touching envelope collisions', () => {
  for (const shape of ['rice', 'flower', ['rice', 'heart', 'flower']])
    for (const layout of ['roofline', 'border', 'curtain', 'draped']) {
      const geometry = createGeometry(1000, 600, {
        layout,
        shape,
        spacing: 16,
        size: 1.5,
        sag: 140,
      });
      const gaps = arcGaps(geometry, 1000, layout === 'draped' ? 4 : 3);
      assert.ok(gaps.length > 1);
      assert.ok(Math.max(...gaps) - Math.min(...gaps) < 1e-6, `${layout}/${shape}: ${gaps}`);
      assert.ok(geometry.bulbs.length <= 600);
    }
});

test('touching envelopes at exact numeric spacing do not lose bulbs to roundoff', () => {
  const gaps = arcGaps(createGeometry(1040, 400, { shape: 'heart', spacing: 26, sag: 0 }), 1040);
  assert.ok(gaps.length > 30);
  assert.ok(gaps.every((gap) => Math.abs(gap - 26) < 1e-6));
});
