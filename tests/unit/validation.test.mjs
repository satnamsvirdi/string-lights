import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOptions,
  palettes,
  layouts,
  shapes,
  modes,
  createGeometry,
} from '../../src/core/index.js';
test('runtime flags and invalid geometry dimensions fail clearly', () => {
  for (const input of [
    null,
    [],
    1,
    'white',
    { paused: 'false' },
    { glitter: 1 },
    { breeze: null },
    { interactive: 'yes' },
  ])
    assert.throws(() => normalizeOptions(input), TypeError);
  for (const width of [NaN, Infinity, -Infinity])
    assert.throws(() => createGeometry(width, 300), TypeError);
  assert.throws(() => createGeometry(1_000_001, 300), RangeError);
});
test('exported shared palettes and enum collections are immutable', () => {
  for (const values of [palettes.white, layouts, shapes, modes])
    assert.throws(() => values.push('invalid'), TypeError);
});
test('undefined optional values use defaults and unknown keys do not trigger instance changes', () => {
  assert.equal(normalizeOptions({ size: undefined }).size, 1);
  assert.equal(Object.hasOwn(normalizeOptions({ unknown: 'value' }), 'unknown'), false);
});
test('large sections bound cable sampling and bulb counts', () => {
  for (const layout of layouts) {
    const geometry = createGeometry(10_000, 100_000, { layout });
    assert.ok(geometry.bulbs.length <= 600);
    assert.ok(geometry.wires.every((wire) => wire.length <= 129));
  }
});
