import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGeometry,
  createRope,
  stepRope,
  ropeAttachment,
  layouts,
} from '../../src/core/index.js';
import { tether } from '../../src/core/tether.js';

test('near-taut and straight cables stay within their physical support reach', () => {
  for (const sag of [0, 0.1, 3]) {
    const rope = createRope(createGeometry(3000, 500, { sag }).wires[1]);
    for (let i = 0; i < 1200; i++) stepRope(rope, 1 / 120);
    assert.ok(Math.max(...rope.nodes.map((n) => Math.hypot(n.x - n.homeX, n.y - n.homeY))) < 1.2);
    assert.ok(rope.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));
  }
});

test('a maximum pull is clamped exactly to both support reach disks', () => {
  const a = { pinned: true, homeX: 0, homeY: 0 },
    b = { pinned: true, homeX: 100, homeY: 0 };
  for (const [ra, rb] of [
    [50, 50],
    [55, 55],
    [40, 70],
  ])
    for (const [x, y] of [
      [50, -100],
      [400, 300],
      [-50, 60],
    ]) {
      const point = { x, y };
      tether(point, a, ra, b, rb);
      assert.ok(Math.hypot(point.x, point.y) <= ra + 1e-8);
      assert.ok(Math.hypot(point.x - 100, point.y) <= rb + 1e-8);
    }
});

test('wide cables preserve their original resting sag without accumulating stretch', () => {
  for (const width of [600, 1200, 2468, 10000]) {
    const { wires } = createGeometry(width, 400, { layout: 'draped', breeze: false });
    const rope = createRope(wires[1]);
    for (let i = 0; i < 1800; i++) stepRope(rope, 1 / 120);
    const error = Math.max(...rope.nodes.map((p) => Math.hypot(p.x - p.homeX, p.y - p.homeY)));
    assert.ok(error < 0.15, `width ${width}: resting curve drift ${error}`);
  }
});

test('a wide drape settles back after repeated local drags without changing its cable lengths', () => {
  const rope = createRope(createGeometry(2468, 400, { layout: 'draped' }).wires[1]);
  const segment = Math.floor(rope.lengths.length / 2),
    t = 0.4;
  for (let drag = 0; drag < 3; drag++) {
    const p = ropeAttachment(rope, segment, t);
    const grab = { segment, t, x: p.x + 30, y: p.y - 22 };
    for (let i = 0; i < 120; i++) stepRope(rope, 1 / 120, grab);
    assert.ok(
      Math.hypot(
        ropeAttachment(rope, segment, t).x - grab.x,
        ropeAttachment(rope, segment, t).y - grab.y,
      ) < 1,
    );
    for (let i = 0; i < 1800; i++) stepRope(rope, 1 / 120);
    assert.ok(Math.max(...rope.nodes.map((n) => Math.hypot(n.x - n.homeX, n.y - n.homeY))) < 1);
    for (let i = 0; i < rope.lengths.length; i++)
      assert.ok(
        Math.abs(
          Math.hypot(rope.nodes[i + 1].x - rope.nodes[i].x, rope.nodes[i + 1].y - rope.nodes[i].y) -
            rope.lengths[i],
        ) < 0.001,
      );
  }
});

test('all free wire tips end exactly at the final accepted bulb, including overlap removal', () => {
  for (const layout of layouts)
    for (const shape of ['rice', 'flower', 'round', 'crystal', 'led'])
      for (const spacing of [16, 28, 75, 100]) {
        const geometry = createGeometry(700, 400, { layout, shape, spacing, size: 2.5 });
        geometry.wires.forEach((wire, index) => {
          if (wire.at(-1).mobility < 1e-6) return;
          const bulbs = geometry.bulbs.filter((b) => b.wire === index),
            last = bulbs.at(-1);
          assert.ok(last, `${layout}: no bare hanging cable`);
          assert.equal(wire.at(-1).x, last.x);
          assert.equal(wire.at(-1).y, last.y);
          for (const bulb of bulbs) {
            const a = wire[bulb.segment],
              b = wire[bulb.segment + 1];
            assert.ok(b && Number.isFinite(bulb.t));
            assert.ok(
              Math.hypot(a.x + (b.x - a.x) * bulb.t - bulb.x, a.y + (b.y - a.y) * bulb.t - bulb.y) <
                1e-6,
            );
          }
        });
      }
});
