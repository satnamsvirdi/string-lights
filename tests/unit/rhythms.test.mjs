import test from 'node:test';
import assert from 'node:assert/strict';
import { rhythmFrames } from '../../src/core/rhythms.js';
import { normalizeOptions, modes } from '../../src/core/options.js';

const names = ['alternate', 'pairs', 'double', 'steps', 'bounce', 'fade'];
function opacity(mode, index, time) {
  const { frames, duration } = rhythmFrames(mode, index, false);
  const offset = time / duration;
  let i = 0;
  while (i + 1 < frames.length && frames[i + 1].offset <= offset) i++;
  const a = frames[i],
    b = frames[Math.min(i + 1, frames.length - 1)];
  const t = b.offset === a.offset ? 0 : (offset - a.offset) / (b.offset - a.offset);
  return a.opacity + (b.opacity - a.opacity) * t;
}
test('all controller rhythms validate in fixed, cycle and random programs while existing modes remain', () => {
  for (const mode of [...names, 'static', 'blink', 'chase', 'wave']) {
    assert.ok(modes.includes(mode));
    assert.equal(normalizeOptions({ mode }).mode, mode);
  }
  for (const patternOrder of ['cycle', 'random'])
    assert.deepEqual(
      normalizeOptions({ patternOrder, patternSequence: names }).patternSequence,
      names,
    );
});
test('electrical channels alternate, pair, double flash, chase and reverse on the specified beats', () => {
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => opacity('alternate', i, 100)),
    [1, 0.04, 1, 0.04],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => opacity('alternate', i, 700)),
    [0.04, 1, 0.04, 1],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => opacity('pairs', i, 100)),
    [1, 1, 0.04, 0.04],
  );
  for (const t of [50, 400]) assert.equal(opacity('double', 0, t), 1);
  for (const t of [250, 700]) assert.equal(opacity('double', 0, t), 0.04);
  assert.equal(opacity('double', 1, 1010), 1);
  for (const [i, t] of [
    [0, 100],
    [1, 420],
    [2, 740],
    [3, 1060],
  ])
    assert.equal(opacity('steps', i, t), 1);
  for (const [i, t] of [
    [0, 100],
    [1, 520],
    [2, 820],
    [3, 1120],
    [2, 1540],
    [1, 1840],
  ])
    assert.equal(opacity('bounce', i, t), 1);
});
test('program loops close without a jump; frames are bounded, channel-stable and support dim base', () => {
  for (const mode of names)
    for (let i = 0; i < 8; i++) {
      const { frames, duration } = rhythmFrames(mode, i, true);
      assert.ok(duration > 0);
      assert.equal(frames[0].opacity, frames.at(-1).opacity);
      assert.equal(frames[0].offset, 0);
      assert.equal(frames.at(-1).offset, 1);
      assert.ok(
        frames.every(
          (f, j) => f.opacity >= 0.02 && f.opacity <= 1 && (!j || f.offset >= frames[j - 1].offset),
        ),
      );
      assert.deepEqual(rhythmFrames(mode, i, true), rhythmFrames(mode, i + 4, true));
    }
  assert.deepEqual(
    [0, 1, 2, 3].map((i) => opacity('fade', i, 0)),
    [1, 0.3, 0.04, 0.3],
  );
  assert.equal(opacity('fade', 0, 300), 0.65);
  assert.equal(rhythmFrames('blink', 0, false), null);
});

test('removed mode names are rejected and gentle fade is the default', () => {
  assert.equal(normalizeOptions().mode, 'fade');
  for (const mode of ['twinkle', 'double-beat', 'stepped-chase', 'crossfade']) {
    assert.throws(() => normalizeOptions({ mode }), /Unknown mode/);
    assert.throws(() => normalizeOptions({ patternSequence: [mode] }), /patternSequence/);
  }
});
