import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeometry } from '../../src/core/geometry.js';
import { activateStrand, followAttachment } from '../../src/core/attachments.js';
import { stepRope, ropeAttachment } from '../../src/core/physics.js';

test('curtain ties track the moving header during dragging and release without changing drop lengths', () => {
  const { wires } = createGeometry(800, 400, { layout: 'curtain' });
  const strands = wires.map((points) => ({ points, offset: 0, velocity: 0 }));
  const drop = strands.find((s) => s.points[0].attachment);
  const joint = drop.points[0].attachment,
    parent = strands[joint.wire];
  activateStrand(parent);
  const p = ropeAttachment(parent.rope, joint.segment, joint.t);
  const grab = { segment: joint.segment, t: joint.t, x: p.x + 15, y: p.y - 20 };
  let lengths;
  for (let i = 0; i < 500; i++) {
    stepRope(parent.rope, 1 / 120, i < 120 ? grab : null);
    followAttachment(drop, strands);
    lengths ||= [...drop.rope.lengths];
    stepRope(drop.rope, 1 / 120);
    const anchor = ropeAttachment(parent.rope, joint.segment, joint.t);
    assert.ok(Math.hypot(drop.rope.nodes[0].x - anchor.x, drop.rope.nodes[0].y - anchor.y) < 1e-8);
    assert.deepEqual(drop.rope.lengths, lengths);
    assert.ok(drop.rope.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));
  }
});

test('breeze ties move even before either strand has been dragged', () => {
  const strands = createGeometry(800, 400, { layout: 'curtain' }).wires.map((points) => ({
    points,
    offset: 0,
  }));
  const drop = strands.find((s) => s.points[0].attachment);
  strands[drop.points[0].attachment.wire].offset = 5;
  followAttachment(drop, strands);
  assert.ok(Math.abs(drop.anchorX) > 0);
  assert.ok(Math.abs(drop.anchorY) > 0);
  assert.equal(drop.rope, undefined);
  activateStrand(drop);
  followAttachment(drop, strands);
  assert.ok(Math.abs(drop.rope.nodes[0].x - drop.points[0].x - drop.anchorX) < 1e-8);
});
