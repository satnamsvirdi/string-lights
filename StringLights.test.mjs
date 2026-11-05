import test from 'node:test';
import assert from 'node:assert/strict';
const {
  normalizeOptions,
  createGeometry,
  palettes,
  layouts,
  breezeForce,
  createRope,
  stepRope,
  ropeAttachment,
  releaseRope,
  stringLightsPresets,
} = await import('./StringLights.js');
test('presets produce usable independent options and cannot be mutated', () => {
  for (const preset of Object.values(stringLightsPresets)) {
    assert.ok(preset.name && preset.description);
    assert.ok(createGeometry(600, 320, preset.options).bulbs.length > 0);
    const a = normalizeOptions(preset.options),
      b = normalizeOptions(preset.options);
    a.colors.push('#000');
    a.patternSequence.reverse();
    if (Array.isArray(a.shape)) a.shape.push('rice');
    assert.deepEqual(b, normalizeOptions(preset.options));
    assert.throws(() => {
      preset.options.size = 2;
    }, TypeError);
    assert.throws(() => preset.options.patternSequence.push('static'), TypeError);
  }
});
test('curtain drops attach halfway between adjacent header bulbs across densities and shapes', () => {
  for (const width of [180, 390, 720, 1440])
    for (const spacing of [16, 28, 70, 100]) {
      for (const shape of ['rice', 'flower', 'crystal', ['flower', 'rice', 'round']])
        for (const size of [0.5, 1.2, 2.5]) {
          const { wires, bulbs } = createGeometry(width, 400, {
            layout: 'curtain',
            spacing,
            shape,
            size,
          });
          const header = wires.filter((points) => points[0].x !== points.at(-1).x);
          const topBulbs = bulbs
            .filter((bulb) => bulb.wire < header.length)
            .sort((a, b) => a.x - b.x);
          for (const drop of wires.slice(header.length)) {
            const root = drop[0];
            const rightIndex = topBulbs.findIndex((bulb) => bulb.x > root.x);
            assert.ok(rightIndex > 0, 'drop has bulbs on both sides');
            assert.ok(
              Math.abs(root.x - (topBulbs[rightIndex - 1].x + topBulbs[rightIndex].x) / 2) < 1e-8,
            );
            const wire = header.find(
              (points) => root.x >= points[0].x && root.x <= points.at(-1).x,
            );
            const j = wire.findIndex((p, i) => i > 0 && p.x >= root.x),
              a = wire[j - 1],
              b = wire[j];
            assert.ok(
              Math.abs(root.y - (a.y + ((b.y - a.y) * (root.x - a.x)) / (b.x - a.x))) < 1e-8,
            );
          }
        }
    }
});
test('white palette and mixed white are available without mutating presets', () => {
  assert.ok(palettes.multicolor.includes('#ffffff'));
  const o = normalizeOptions({ colors: 'white' });
  o.colors.push('#000');
  assert.deepEqual(palettes.white, ['#ffffff']);
});
test('invalid inputs reject and finite values clamp', () => {
  for (const o of [
    { colors: [] },
    { colors: ['red'] },
    { mode: 'oops' },
    { shape: 'oops' },
    { speed: NaN },
    { seed: Infinity },
  ])
    assert.throws(() => normalizeOptions(o), TypeError);
  assert.equal(normalizeOptions({ spacing: 0, speed: 100 }).spacing, 16);
  assert.equal(normalizeOptions({ speed: 100 }).speed, 2);
});
test('all layouts create bounded, deterministic, distinct geometry', () => {
  const results = layouts.map((layout) => {
    const a = createGeometry(720, 400, { layout });
    assert.deepEqual(a, createGeometry(720, 400, { layout }));
    assert.ok(a.bulbs.length > 10 && a.bulbs.length <= 600);
    assert.ok(a.bulbs.every((b) => Number.isFinite(b.x) && Number.isFinite(b.y)));
    return JSON.stringify(a.wires);
  });
  assert.equal(new Set(results).size, layouts.length);
  assert.equal(createGeometry(0, 0).bulbs.length, 0);
  assert.ok(createGeometry(10000, 10000, { layout: 'curtain', spacing: 16 }).bulbs.length <= 600);
  assert.notDeepEqual(createGeometry(500, 300, { seed: 1 }), createGeometry(500, 300, { seed: 2 }));
});

test('catenary hangs between fixed supports, with arc-spaced gravity-aligned bulbs', () => {
  const { wires, bulbs } = createGeometry(800, 400, { layout: 'roofline', sag: 60, spacing: 28 });
  assert.ok(wires[0][0].x < 0);
  assert.ok(wires.at(-1).at(-1).x > 800);
  for (const points of wires) {
    assert.ok(Math.abs(points[0].y - 12) < 1e-6);
    assert.ok(Math.abs(points.at(-1).y - 12) < 1e-6);
    assert.ok(Math.abs(points[Math.floor(points.length / 2)].y - 72) < 0.1);
    assert.equal(points[0].mobility, 0);
    assert.ok(Math.abs(points.at(-1).mobility) < 1e-10);
    for (let i = 1; i < points.length; i++) assert.ok(points[i].x > points[i - 1].x);
  }
  assert.ok(bulbs.every((b) => b.angle === 0 && b.mobility >= 0 && b.mobility <= 1));
  const curtain = createGeometry(600, 400, { layout: 'curtain' });
  const vertical = curtain.wires.at(-1);
  assert.equal(vertical[0].mobility, 0);
  assert.equal(vertical.at(-1).mobility, 1);
});
test('breeze includes quiet intervals and wind inputs validate', () => {
  assert.equal(breezeForce(10), 0);
  assert.equal(breezeForce(18), 0);
  assert.notEqual(breezeForce(2), 0);
  assert.equal(normalizeOptions({ wind: 10 }).wind, 2);
  assert.throws(() => normalizeOptions({ wind: NaN }), TypeError);
});

test('border sides face inward while top and curtain bulbs hang down', () => {
  const { bulbs } = createGeometry(600, 320, { layout: 'border' });
  const left = bulbs.filter((b) => b.x === 8),
    right = bulbs.filter((b) => b.x === 592);
  assert.ok(left.length > 0 && right.length > 0);
  assert.ok(left.every((b) => b.angle === -90));
  assert.ok(right.every((b) => b.angle === 90));
  assert.ok(bulbs.filter((b) => b.x !== 8 && b.x !== 592).every((b) => b.angle === 0));
  assert.ok(createGeometry(600, 320, { layout: 'curtain' }).bulbs.every((b) => b.angle === 0));
});

test('junctions keep physical bulb cores separate across layouts and scales', () => {
  for (const layout of layouts)
    for (const shape of ['rice', 'round', 'crystal', 'flower', 'led'])
      for (const size of [1, 2.5]) {
        const { bulbs } = createGeometry(280, 180, { layout, shape, size, spacing: 16 });
        // A small rectangle within each glass envelope, excluding its soft glow.
        const boxes = bulbs.map((b) => {
          const a = (b.angle * Math.PI) / 180,
            corners = [
              [-2.5, 4],
              [-2.5, 14],
              [2.5, 4],
              [2.5, 14],
            ].map(([x, y]) => [
              b.x + (x * Math.cos(a) - y * Math.sin(a)) * size,
              b.y + (x * Math.sin(a) + y * Math.cos(a)) * size,
            ]);
          return {
            left: Math.min(...corners.map((p) => p[0])),
            right: Math.max(...corners.map((p) => p[0])),
            top: Math.min(...corners.map((p) => p[1])),
            bottom: Math.max(...corners.map((p) => p[1])),
          };
        });
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i],
              b = boxes[j];
            assert.ok(
              !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top),
              `${layout}/${shape}/${size}: bulbs ${i},${j}`,
            );
          }
      }
});

test('local lower-rope grab follows the held point and keeps top support fixed', () => {
  const points = Array.from({ length: 21 }, (_, i) => ({ x: 0, y: i * 10, mobility: i / 20 }));
  const rope = createRope(points),
    grab = { segment: 17, t: 0.5, x: 65, y: 145 };
  for (let i = 0; i < 240; i++) stepRope(rope, 1 / 120, grab);
  const held = ropeAttachment(rope, 17, 0.5);
  assert.ok(Math.hypot(held.x - 65, held.y - 145) < 2, 'grab tracks selected lower segment');
  assert.equal(rope.nodes[0].x, 0);
  assert.equal(rope.nodes[0].y, 0);
  assert.ok(rope.nodes[5].x < held.x * 0.65, 'upper section does not move as one modal curve');
  const freeBefore = rope.nodes.at(-1).y;
  for (let i = 0; i < 1200; i++) stepRope(rope, 1 / 120);
  assert.ok(rope.nodes.at(-1).y > freeBefore, 'gravity drops the released tail');
  assert.ok(Math.abs(rope.nodes.at(-1).x) < 2, 'released tail settles under its support');
  assert.ok(rope.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));
});
test('rope tension preserves lengths and fixed supports after an off-center pull', () => {
  const { wires } = createGeometry(600, 320, { layout: 'roofline' }),
    rope = createRope(wires[1]);
  const p = ropeAttachment(rope, 5, 0.3),
    grab = { segment: 5, t: 0.3, x: p.x - 10, y: p.y - 25 };
  for (let i = 0; i < 360; i++) stepRope(rope, 1 / 120, grab);
  for (const node of [rope.nodes[0], rope.nodes.at(-1)]) {
    assert.equal(node.x, node.homeX);
    assert.equal(node.y, node.homeY);
  }
  for (let i = 0; i < rope.lengths.length; i++) {
    const a = rope.nodes[i],
      b = rope.nodes[i + 1];
    assert.ok(
      Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - rope.lengths[i]) < 1,
      'segment does not stretch freely',
    );
  }
});

test('mixed bulb arrays and pattern programs validate and remain isolated', () => {
  const shape = ['rice', 'round', 'flower'],
    sequence = ['blink', 'wave', 'chase'];
  const a = normalizeOptions({
    shape,
    patternSequence: sequence,
    patternOrder: 'random',
    patternInterval: 3,
  });
  a.shape.push('led');
  a.patternSequence.push('twinkle');
  assert.deepEqual(shape, ['rice', 'round', 'flower']);
  assert.deepEqual(sequence, ['blink', 'wave', 'chase']);
  for (const options of [
    { shape: [] },
    { shape: ['bad'] },
    { patternOrder: 'bad' },
    { patternSequence: [] },
    { patternSequence: ['bad'] },
    { patternSequence: ['blink', 'blink'] },
    { patternInterval: NaN },
  ])
    assert.throws(() => normalizeOptions(options), TypeError);
  assert.equal(normalizeOptions({ patternInterval: 0 }).patternInterval, 1);
  assert.equal(normalizeOptions({ patternInterval: 10000 }).patternInterval, 3600);
  const geometry = createGeometry(800, 400, { shape });
  assert.deepEqual(new Set(geometry.bulbs.map((b) => b.shape)), new Set(shape));
  assert.ok(geometry.bulbs.every((bulb, index) => bulb.shape === shape[index % shape.length]));
  assert.ok(
    geometry.bulbs.every(
      (bulb, index) =>
        bulb.group === index % 4 &&
        bulb.color === palettes.multicolor[index % palettes.multicolor.length],
    ),
  );
  assert.deepEqual(geometry, createGeometry(800, 400, { shape }));
});

test('released cable drops, overshoots its resting line, and loses swing energy gradually', () => {
  const rope = createRope([
    { x: 0, y: 0, mobility: 0 },
    { x: 120, y: 120, mobility: 1 },
  ]);
  releaseRope(rope, { segment: 0, t: 1 }, { x: 0, y: 0 });
  const start = { x: rope.nodes[1].x, y: rope.nodes[1].y };
  stepRope(rope, 1 / 120);
  assert.ok(rope.nodes[1].y > start.y, 'gravity starts the downward movement');
  assert.ok(
    Math.hypot(rope.nodes[1].x - start.x, rope.nodes[1].y - start.y) < 1,
    'release does not snap',
  );
  let minimumX = Infinity,
    crossings = 0,
    side = 1,
    maxLengthError = 0;
  for (let i = 0; i < 720; i++) {
    stepRope(rope, 1 / 120);
    const p = rope.nodes[1];
    minimumX = Math.min(minimumX, p.x);
    const nextSide = p.x > 2 ? 1 : p.x < -2 ? -1 : side;
    if (nextSide !== side) {
      crossings++;
      side = nextSide;
    }
    maxLengthError = Math.max(maxLengthError, Math.abs(Math.hypot(p.x, p.y) - rope.lengths[0]));
  }
  assert.ok(minimumX < -15, 'swing visibly crosses past the resting line');
  assert.ok(minimumX > -start.x, 'air resistance reduces the first opposite swing');
  assert.ok(crossings >= 2, 'motion oscillates rather than easing toward a target');
  assert.ok(maxLengthError < 0.01, 'cable remains inextensible');
  for (let i = 0; i < 2880; i++) stepRope(rope, 1 / 120);
  assert.ok(
    Math.abs(rope.nodes[1].x) < 0.2,
    'eventually settles below the anchor, not at its original angled pose',
  );
});
test('release transfers flick velocity locally without changing any positions', () => {
  const rope = createRope(
    Array.from({ length: 21 }, (_, i) => ({ x: 0, y: i * 10, mobility: i / 20 })),
  );
  const grab = { segment: 17, t: 0.4 },
    pose = rope.nodes.map((p) => ({ x: p.x, y: p.y }));
  releaseRope(rope, grab, { x: 180, y: -60 });
  assert.deepEqual(
    rope.nodes.map((p) => ({ x: p.x, y: p.y })),
    pose,
  );
  const a = rope.nodes[17],
    b = rope.nodes[18];
  assert.ok(Math.abs(((a.x - a.px) * 0.6 + (b.x - b.px) * 0.4) * 120 - 180) < 1e-8);
  assert.ok(Math.abs(((a.y - a.py) * 0.6 + (b.y - b.py) * 0.4) * 120 + 60) < 1e-8);
  assert.equal(rope.nodes[0].px, 0);
  assert.equal(rope.nodes[0].py, 0);
  const pendulum = createRope([
    { x: 0, y: 0, mobility: 0 },
    { x: 0, y: 180, mobility: 1 },
  ]);
  releaseRope(pendulum, { segment: 0, t: 1 }, { x: 180, y: 0 });
  stepRope(pendulum, 1 / 120);
  assert.ok(pendulum.nodes[1].x > 1, 'release retains forward flick momentum');
});
