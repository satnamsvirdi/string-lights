import { test, expect } from '@playwright/test';

test('held header follows a downward reversal on the next frame without releasing', async ({
  page,
}) => {
  await page.goto('/');
  await page.clock.install();
  const start = await page.evaluate(async () => {
    const { createStringLights, createGeometry } = await import('/core.js');
    const options = { layout: 'curtain', breeze: false, animated: false, collisions: false };
    window.lights = createStringLights('#host', options);
    const geometry = createGeometry(600, 400, options);
    const index = geometry.bulbs.findIndex((b) => b.wire === 1 && b.x > 270 && b.x < 330);
    window.heldBulb = lights.element.querySelector(`[data-string-bulb="${index}"]`);
    const point = new DOMPoint(0, 9).matrixTransform(window.heldBulb.getScreenCTM());
    return { x: point.x, y: point.y, initialY: geometry.bulbs[index].y };
  });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 24);
  await page.clock.runFor(250);
  const raised = await page.evaluate(() => window.heldBulb.transform.baseVal.getItem(0).matrix.f);
  expect(raised).toBeLessThan(start.initialY - 20);
  await page.mouse.move(start.x, start.y);
  await page.clock.runFor(20);
  const lowered = await page.evaluate(() => window.heldBulb.transform.baseVal.getItem(0).matrix.f);
  expect(Math.abs(lowered - start.initialY)).toBeLessThan(0.5);
  await page.mouse.up();
});
