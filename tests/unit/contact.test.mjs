import test from 'node:test';
import assert from 'node:assert/strict';
import { collideStrands } from '../../src/core/collisions.js';
import { createRope } from '../../src/core/physics.js';
import { createGeometry } from '../../src/core/geometry.js';
import { normalizeOptions } from '../../src/core/options.js';

test('soft contact wakes a neighboring strand without teleporting either cable', () => {
  const points = (x) => [
    { x, y: 0, mobility: 0 },
    { x, y: 20, mobility: 1 },
  ];
  const a = { points: points(0), rope: createRope(points(0)) };
  const b = { points: points(20), rope: null };
  a.rope.active = true;
  a.rope.nodes[1].x = 16;
  const before = a.rope.nodes[1].x;
  collideStrands([a, b], a, 1 / 120);
  assert.equal(a.rope.nodes[1].x, before);
  assert.equal(b.rope.nodes[1].x, 20);
  assert.ok(b.rope.active && !b.rope.sleeping);
  assert.ok(Math.abs(b.rope.nodes[1].px - 20) > 0);
  assert.ok(Math.abs(b.rope.nodes[1].px - 20) < 0.08);
  assert.equal(normalizeOptions().collisions, true);
  assert.equal(normalizeOptions({ collisions: false }).collisions, false);
});

test('border and curtain headers honor the configured sag', () => {
  for (const layout of ['border', 'curtain']) {
    const shallow = createGeometry(800, 400, { layout, sag: 4 }).wires[1];
    const deep = createGeometry(800, 400, { layout, sag: 48 }).wires[1];
    assert.ok(Math.max(...deep.map((p) => p.y)) > Math.max(...shallow.map((p) => p.y)) + 40);
  }
});
