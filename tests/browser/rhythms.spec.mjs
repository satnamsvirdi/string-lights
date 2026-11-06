import { test, expect } from '@playwright/test';

test('new channel rhythms render synchronized beats and honor live speed, pause and reduced motion', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights('#host', { mode: 'alternate', breeze: false, paused: true });
  });
  for (const [mode, time, expected] of [
    ['alternate', 100, [1, 0.04, 1, 0.04]],
    ['alternate', 700, [0.04, 1, 0.04, 1]],
    ['pairs', 100, [1, 1, 0.04, 0.04]],
    ['double', 250, [0.04, 0.04, 0.04, 0.04]],
    ['double', 400, [1, 0.04, 1, 0.04]],
    ['steps', 740, [0.04, 0.04, 1, 0.04]],
    ['bounce', 1540, [0.04, 0.04, 1, 0.04]],
    ['fade', 0, [1, 0.3, 0.04, 0.3]],
  ]) {
    const levels = await page.evaluate(
      async ({ mode, time }) => {
        lights.update({ mode });
        const nodes = [...lights.element.querySelectorAll('[data-bulb]')];
        nodes.forEach((node) => (node.getAnimations()[0].currentTime = time));
        await new Promise(requestAnimationFrame);
        return nodes.slice(0, 4).map((node) => Number(window.getComputedStyle(node).opacity));
      },
      { mode, time },
    );
    levels.forEach((level, i) => expect(level).toBeCloseTo(expected[i], 3));
  }
  await page.evaluate(() => lights.update({ paused: false, mode: 'pairs' }));
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).every((a) => a.playState === 'running'),
      ),
    )
    .toBe(true);
  const origins = await page.evaluate(() =>
    lights.element.getAnimations({ subtree: true }).map((a) => a.startTime),
  );
  expect(new Set(origins).size).toBe(1);
  await page.evaluate(() => lights.update({ speed: 2 }));
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).every((a) => a.playbackRate === 2),
      ),
    )
    .toBe(true);
  await page.evaluate(() => lights.update({ animated: false }));
  expect(await page.evaluate(() => lights.element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.evaluate(() => lights.update({ animated: true }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect
    .poll(() => page.evaluate(() => lights.element.getAnimations({ subtree: true }).length))
    .toBe(0);
});

test('new modes participate in cycle and random program switching', async ({ page }) => {
  await page.goto('/');
  await page.clock.install();
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights('#host', {
      breeze: false,
      patternOrder: 'cycle',
      patternInterval: 1,
      patternSequence: ['alternate', 'pairs', 'double'],
    });
  });
  expect(await page.evaluate(() => lights.pattern)).toBe('alternate');
  await page.clock.runFor(1050);
  expect(await page.evaluate(() => lights.pattern)).toBe('pairs');
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => lights.pattern)).toBe('double');
  await page.evaluate(() =>
    lights.update({
      patternOrder: 'random',
      patternSequence: ['steps', 'bounce', 'fade'],
    }),
  );
  const seen = new Set([await page.evaluate(() => lights.pattern)]);
  for (let i = 0; i < 2; i++) {
    await page.clock.runFor(1000);
    seen.add(await page.evaluate(() => lights.pattern));
  }
  expect(seen.size).toBe(3);
});
