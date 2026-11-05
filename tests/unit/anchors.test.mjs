import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeometry } from '../../src/core/geometry.js';
import { normalizeOptions } from '../../src/core/options.js';

test('top support count is configurable while default layouts retain their geometry', () => {
  for (const layout of ['roofline', 'curtain', 'border', 'draped']) {
    assert.deepEqual(
      createGeometry(800, 400, { layout }),
      createGeometry(800, 400, { layout, anchorCount: 0 }),
    );
    for (const anchorCount of [1, 2, 4, 12]) {
      const { wires, bulbs } = createGeometry(800, 400, { layout, anchorCount, sag: 60 });
      const supports = new Set(
        wires
          .slice(0, anchorCount + 1)
          .flat()
          .filter((p) => p.mobility < 1e-6 && p.x >= 0 && p.x <= 800)
          .map((p) => p.x.toFixed(6)),
      );
      assert.equal(supports.size, anchorCount);
      assert.ok(bulbs.length <= 600);
      for (const wire of wires)
        if (wire[0].attachment) {
          const { wire: parent, segment, t } = wire[0].attachment;
          const a = wires[parent][segment],
            b = wires[parent][segment + 1];
          assert.ok(
            Math.hypot(wire[0].x - a.x - (b.x - a.x) * t, wire[0].y - a.y - (b.y - a.y) * t) < 1e-8,
          );
        }
    }
  }
});

test('invalid attachment counts fail clearly', () => {
  for (const anchorCount of [-1, 13, 1.5, NaN, Infinity, '2', null])
    assert.throws(() => normalizeOptions({ anchorCount }), /anchorCount/);
});
