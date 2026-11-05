import { test, expect } from '@playwright/test';

test('mouse grabs the local attachment and releases into a decaying gravity swing', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(document.getElementById('host'), {
      layout: 'border',
      breeze: false,
    });
  });
  const start = await page.evaluate(() => {
    window.held = [...document.querySelectorAll('[data-string-bulb]')].find((node) => {
      const m = node.transform.baseVal.getItem(0).matrix;
      return m.e === 8 && m.f > 270 && m.f < 330;
    });
    const matrix = window.held.transform.baseVal.getItem(0).matrix;
    window.restX = matrix.e;
    const point = new DOMPoint(0, 9).matrixTransform(window.held.getScreenCTM());
    return { x: point.x, y: point.y };
  });
  await expect
    .poll(() =>
      page.evaluate(({ x, y }) => window.held.contains(document.elementFromPoint(x, y)), start),
    )
    .toBe(true);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 80, start.y - 60, { steps: 8 });
  await expect
    .poll(() => page.evaluate(() => window.held.transform.baseVal.getItem(0).matrix.e))
    .toBeGreaterThan(70);
  const held = await page.evaluate(() => ({
    x: window.held.transform.baseVal.getItem(0).matrix.e,
    y: window.held.transform.baseVal.getItem(0).matrix.f,
  }));
  expect(held.x).toBeGreaterThan(70);
  await page.mouse.up();
  const trace = await page.evaluate(async () => {
    const samples = [],
      start = performance.now();
    while (performance.now() - start < 6000) {
      const m = window.held.transform.baseVal.getItem(0).matrix;
      samples.push({ t: performance.now() - start, x: m.e - window.restX, y: m.f });
      await new Promise((r) => setTimeout(r, 30));
    }
    return samples;
  });
  expect(Math.abs(trace[0].x - (held.x - 8))).toBeLessThan(12);
  expect(trace.some((point) => point.y > held.y + 10)).toBe(true);
  expect(trace.some((point) => point.x < -4)).toBe(true);
  expect(
    Math.max(...trace.filter((point) => point.t > 4800).map((point) => Math.abs(point.x))),
  ).toBeLessThan(80);
});

test('one delegated pointer listener serves many bulbs and is removed on destroy', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    let added = 0,
      removed = 0;
    const add = SVGElement.prototype.addEventListener,
      remove = SVGElement.prototype.removeEventListener;
    SVGElement.prototype.addEventListener = function (name, ...args) {
      if (name === 'pointerdown') added++;
      return add.call(this, name, ...args);
    };
    SVGElement.prototype.removeEventListener = function (name, ...args) {
      if (name === 'pointerdown') removed++;
      return remove.call(this, name, ...args);
    };
    const { createStringLights } = await import('/core.js');
    const lights = createStringLights(document.getElementById('host'), {
      layout: 'curtain',
      breeze: false,
    });
    const bulbs = lights.element.querySelectorAll('[data-shape]').length;
    lights.destroy();
    SVGElement.prototype.addEventListener = add;
    SVGElement.prototype.removeEventListener = remove;
    return { added, removed, bulbs };
  });
  expect(result.added).toBe(1);
  expect(result.removed).toBe(1);
  expect(result.bulbs).toBeGreaterThan(40);
});

test('quiet breeze waits without RAF and grabbing wakes it immediately', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(document.getElementById('host'), {
      layout: 'roofline',
      breeze: true,
    });
  });
  await page.clock.runFor(15_000);
  const count = await page.evaluate(() => {
    window.frameRequests = 0;
    const raf = requestAnimationFrame;
    window.requestAnimationFrame = (fn) => {
      window.frameRequests++;
      return raf(fn);
    };
    return window.frameRequests;
  });
  expect(count).toBe(0);
  await page.clock.runFor(500);
  expect(await page.evaluate(() => window.frameRequests)).toBe(0);
  const point = await page.evaluate(() => {
    const node = [...document.querySelectorAll('[data-string-bulb]')].find((node) => {
      const m = node.transform.baseVal.getItem(0).matrix;
      return m.e > 180 && m.e < 300 && m.f > 20;
    });
    const p = new DOMPoint(0, 9).matrixTransform(node.getScreenCTM());
    return { x: p.x, y: p.y };
  });
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30, point.y + 40);
  await page.clock.runFor(200);
  expect(await page.evaluate(() => window.frameRequests)).toBeGreaterThan(0);
  await page.mouse.up();
});

test('narrow viewport fits and content remains clickable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(async () => {
    const host = document.getElementById('host');
    host.style.width = '100%';
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(host, { layout: 'border', breeze: false });
    document.getElementById('content').onclick = (e) => (e.currentTarget.textContent = 'Clicked');
  });
  await page.locator('#content').click();
  await expect(page.locator('#content')).toHaveText('Clicked');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
