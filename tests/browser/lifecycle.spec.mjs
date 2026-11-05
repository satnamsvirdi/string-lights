import { test, expect } from '@playwright/test';

async function mount(page, options = {}) {
  await page.goto('/');
  await page.evaluate(async (options) => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(document.getElementById('host'), {
      breeze: false,
      mode: 'blink',
      ...options,
    });
  }, options);
}

test('equivalent updates retain DOM, animation identity, and live speed', async ({ page }) => {
  await mount(page, { shape: ['rice', 'round'] });
  const result = await page.evaluate(async () => {
    const first = lights.element.querySelector('[data-shape]');
    const animation = lights.element.getAnimations({ subtree: true })[0];
    for (let i = 0; i < 30; i++)
      lights.update({ shape: ['rice', 'round'], mode: 'blink', breeze: false });
    for (let i = 0; i < 30; i++) lights.update({ speed: i % 2 ? 1 : 1.1 });
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    return {
      sameBulb: first === lights.element.querySelector('[data-shape]'),
      sameAnimation: lights.element.getAnimations({ subtree: true }).includes(animation),
      rate: animation.playbackRate,
    };
  });
  expect(result).toEqual({ sameBulb: true, sameAnimation: true, rate: 1 });
});

test('resize is coalesced and ignores unchanged dimensions', async ({ page }) => {
  await mount(page);
  const result = await page.evaluate(async () => {
    const first = lights.element.firstElementChild;
    for (let i = 0; i < 30; i++) dispatchEvent(new Event('resize'));
    await new Promise((r) => setTimeout(r, 80));
    const stable = first === lights.element.firstElementChild;
    let rebuilds = 0;
    const observer = new MutationObserver((records) => {
      rebuilds += records.filter(
        (r) => r.target === lights.element && r.type === 'childList',
      ).length;
    });
    observer.observe(lights.element, { childList: true });
    const host = document.getElementById('host');
    host.style.width = '640px';
    host.style.width = '680px';
    host.style.width = '700px';
    const deadline = performance.now() + 4000;
    while (lights.element.viewBox.baseVal.width !== 700 && performance.now() < deadline)
      await new Promise((r) => setTimeout(r, 30));
    observer.disconnect();
    return { stable, rebuilds, width: lights.element.viewBox.baseVal.width };
  });
  expect(result).toEqual({ stable: true, rebuilds: 1, width: 700 });
});

test('offscreen suspends animations, pattern clock, and RAF; reentry resumes', async ({ page }) => {
  await mount(page, {
    breeze: true,
    patternOrder: 'cycle',
    patternInterval: 1,
    patternSequence: ['blink', 'wave'],
  });
  await page.evaluate(() => {
    document.getElementById('host').style.marginTop = '2000px';
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).every((a) => a.playState === 'paused'),
      ),
    )
    .toBe(true);
  const result = await page.evaluate(async () => {
    const pattern = lights.pattern;
    let calls = 0;
    const original = requestAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      calls++;
      return original(fn);
    };
    await new Promise((r) => setTimeout(r, 1200));
    window.requestAnimationFrame = original;
    return { calls, pattern, same: lights.pattern === pattern };
  });
  expect(result.calls).toBe(0);
  expect(result.same).toBe(true);
  await page.evaluate(() => {
    document.getElementById('host').style.marginTop = '0';
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).some((a) => a.playState === 'running'),
      ),
    )
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => lights.pattern), { timeout: 2500 })
    .not.toBe(result.pattern);
});

test('reduced motion is static and disables grabbing and program switching', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, {
    patternOrder: 'cycle',
    patternInterval: 1,
    patternSequence: ['blink', 'wave'],
    breeze: true,
  });
  expect(await page.evaluate(() => lights.element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.locator('[data-string-wire]').count()).toBe(0);
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => lights.pattern)).toBe('blink');
});

test('pause, independent controllers, host restoration, and idempotent teardown', async ({
  page,
}) => {
  await mount(page);
  const result = await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    const host = document.getElementById('host');
    const second = createStringLights(host, { mode: 'chase', breeze: false });
    lights.pause();
    const independent =
      lights.element.getAnimations({ subtree: true }).every((a) => a.playState === 'paused') &&
      second.element.getAnimations({ subtree: true }).some((a) => a.playState === 'running');
    lights.destroy();
    lights.destroy();
    const retained = host.style.position === 'relative';
    second.destroy();
    return {
      independent,
      retained,
      restored: host.style.position === '',
      remaining: document.querySelectorAll('[data-string]').length,
    };
  });
  expect(result).toEqual({ independent: true, retained: true, restored: true, remaining: 0 });
  await page.locator('#content').click();
});

test('React StrictMode and parent text rerenders preserve the decoration', async ({ page }) => {
  await page.goto('/');
  await page.addScriptTag({ url: '/react.js', type: 'module' });
  await expect(page.locator('[data-string]')).toHaveCount(1);
  await expect
    .poll(() => page.locator('[data-string]').evaluate((svg) => svg.viewBox.baseVal.width))
    .toBe(320);
  const result = await page.evaluate(async () => {
    const svg = document.querySelector('[data-string]');
    const bulb = svg.querySelector('[data-shape]');
    const animation = svg.getAnimations({ subtree: true })[0];
    for (let i = 0; i < 30; i++) window.rerender();
    await new Promise((r) => setTimeout(r, 50));
    return {
      svg: svg === document.querySelector('[data-string]'),
      bulb: bulb === svg.querySelector('[data-shape]'),
      animation: svg.getAnimations({ subtree: true }).includes(animation),
    };
  });
  expect(result).toEqual({ svg: true, bulb: true, animation: true });
  await page.evaluate(() => window.fullPage());
  await expect(page.locator('[data-string]')).toHaveCount(1);
  expect(await page.locator('[data-string]').evaluate((svg) => svg.style.position)).toBe('fixed');
  await page.evaluate(() => window.unmount());
  await expect(page.locator('[data-string]')).toHaveCount(0);
});
