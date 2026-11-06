import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const budgets = JSON.parse(
  await readFile(new URL('../../performance-budgets.json', import.meta.url), 'utf8'),
);

test('300 equivalent updates stay within the CPU budget without DOM mutations', async ({
  page,
}) => {
  await page.goto('/');
  const measured = await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    const options = {
      layout: 'curtain',
      breeze: false,
      shape: ['rice', 'round', 'crystal'],
      mode: 'fade',
    };
    const lights = createStringLights(document.getElementById('host'), options);
    let mutations = 0;
    const observer = new MutationObserver((records) => (mutations += records.length));
    observer.observe(lights.element, { subtree: true, childList: true, attributes: true });
    const start = performance.now();
    for (let i = 0; i < 300; i++) lights.update({ ...options, shape: [...options.shape] });
    const elapsed = performance.now() - start;
    await new Promise(window.requestAnimationFrame);
    observer.disconnect();
    lights.destroy();
    return { elapsed, mutations };
  });
  expect(measured.mutations).toBe(0);
  expect(measured.elapsed).toBeLessThan(budgets.equivalentUpdatesMs);
  await test.info().attach('equivalent-updates', {
    body: JSON.stringify(measured),
    contentType: 'application/json',
  });
});

test('a page of independent decorations animates only visible sections', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    document.body.replaceChildren();
    window.instances = [];
    for (let i = 0; i < 12; i++) {
      const host = document.createElement('section');
      host.style.cssText = 'width:600px;height:300px';
      document.body.append(host);
      window.instances.push(
        createStringLights(host, { breeze: true, mode: 'wave', shape: ['rice', 'round'] }),
      );
    }
  });
  const correct = () =>
    page.evaluate(() =>
      window.instances.every((lights) => {
        const rect = lights.element.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < innerHeight;
        const animations = lights.element.getAnimations({ subtree: true });
        return visible
          ? animations.some((a) => a.playState === 'running')
          : animations.every((a) => a.playState === 'paused');
      }),
    );
  await expect.poll(correct).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 2000));
  await expect.poll(correct).toBe(true);
  await page.evaluate(() => window.instances.forEach((lights) => lights.destroy()));
  await expect(page.locator('[data-string]')).toHaveCount(0);
});
