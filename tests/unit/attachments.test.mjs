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

test('a small header pull does not amplify into a whipping drop while held', () => {
  const strands = createGeometry(800, 400, { layout: 'curtain' }).wires.map((points) => ({
    points,
    offset: 0,
  }));
  const drop = strands.find((s) => s.points[0].attachment && s.points[0].x > 300);
  const joint = drop.points[0].attachment,
    parent = strands[joint.wire];
  activateStrand(parent);
  const base = ropeAttachment(parent.rope, joint.segment, joint.t);
  let displacement = 0;
  for (let frame = 0; frame < 120; frame++) {
    const progress = Math.min(frame / 20, 1);
    const grab = {
      segment: joint.segment,
      t: joint.t,
      x: base.x - 12 * progress,
      y: base.y - 20 * progress,
    };
    for (let step = 0; step < 2; step++) stepRope(parent.rope, 1 / 120, grab);
    followAttachment(drop, strands);
    for (let step = 0; step < 2; step++) stepRope(drop.rope, 1 / 120, null, 0, true);
    displacement = Math.max(displacement, ...drop.rope.nodes.map((n) => Math.abs(n.x - n.homeX)));
    assert.equal(drop.rope.nodes[0].px, drop.rope.nodes[0].x);
  }
  assert.ok(displacement < 14, `12px pull produced ${displacement}px displacement`);
  const normal = globalThis.structuredClone(drop.rope),
    explicit = globalThis.structuredClone(drop.rope);
  for (let step = 0; step < 240; step++) {
    stepRope(normal, 1 / 120);
    stepRope(explicit, 1 / 120, null, 0, false);
  }
  assert.deepEqual(normal.nodes, explicit.nodes, 'release uses the existing free motion path');
});

test('curtain drops share one cable length and follow header sag, including the global bulb limit', () => {
  for (const [width, height, spacing, sag] of [
    [800, 400, 28, 0],
    [1200, 1400, 34, 140],
    [2400, 4000, 16, 100],
  ]) {
    const g = createGeometry(width, height, { layout: 'curtain', spacing, sag, breeze: false });
    const drops = g.wires.filter((p) => p[0].attachment);
    assert.ok(drops.length > 3);
    const lengths = drops.map((p) => p.at(-1).y - p[0].y);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) < 1e-6, `${width}: ${lengths}`);
    assert.ok(g.bulbs.length <= 600);
    for (const points of drops) {
      const end = points.at(-1);
      assert.ok(end.y < height);
      const mounted = g.bulbs.filter((b) => b.wire === g.wires.indexOf(points));
      assert.ok(Math.abs(mounted.at(-1).y - end.y) < 1e-6);
      assert.ok(Math.abs(end.y - drops[0].at(-1).y - (points[0].y - drops[0][0].y)) < 1e-6);
    }
    const other = createGeometry(width, height, { layout: 'curtain', spacing, sag, seed: 19 });
    const otherLengths = other.wires.filter((p) => p[0].attachment).map((p) => p.at(-1).y - p[0].y);
    assert.ok(otherLengths.every((length) => Math.abs(length - lengths[0]) < 1e-6));
  }
});
