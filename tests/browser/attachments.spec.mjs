import { test, expect } from '@playwright/test';

test('curtain drops stay tied to the dragged header and remain connected after release', async ({
  page,
}) => {
  await page.goto('/');
  const start = await page.evaluate(async () => {
    const { createStringLights, createGeometry } = await import('/core.js');
    const options = { layout: 'curtain', breeze: false, animated: false, collisions: false };
    window.lights = createStringLights('#host', options);
    const geometry = createGeometry(600, 400, options);
    const wire = geometry.wires.findIndex((w) => w[0].attachment && w[0].x > 200 && w[0].x < 400);
    const joint = geometry.wires[wire][0].attachment;
    const candidates = geometry.bulbs
      .map((b, index) => ({ ...b, index }))
      .filter((b) => b.wire === joint.wire);
    const bulb = candidates.sort(
      (a, b) =>
        Math.abs(a.x - geometry.wires[wire][0].x) - Math.abs(b.x - geometry.wires[wire][0].x),
    )[0];
    window.connection = { wire, joint };
    window.gap = () => {
      const path = (index) => lights.element.querySelector(`[data-string-wire="${index}"]`);
      const values = path(joint.wire)
        .getAttribute('d')
        .match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)
        .map(Number);
      const vertex = (i) =>
        i === 0
          ? { x: values[0], y: values[1] }
          : { x: values[2 + (i - 1) * 6 + 4], y: values[2 + (i - 1) * 6 + 5] };
      const a = vertex(joint.segment),
        b = vertex(joint.segment + 1);
      const root = path(wire).getPointAtLength(0);
      return Math.hypot(root.x - a.x - (b.x - a.x) * joint.t, root.y - a.y - (b.y - a.y) * joint.t);
    };
    const node = lights.element.querySelector(`[data-string-bulb="${bulb.index}"]`);
    const p = new DOMPoint(0, 9).matrixTransform(node.getScreenCTM());
    return { x: p.x, y: p.y, rootY: geometry.wires[wire][0].y };
  });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 8, start.y - 25, { steps: 12 });
  await expect.poll(() => page.evaluate(() => window.gap())).toBeLessThan(0.1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          lights.element
            .querySelector(`[data-string-wire="${window.connection.wire}"]`)
            .getPointAtLength(0).y,
      ),
    )
    .toBeLessThan(start.rootY - 5);
  await page.mouse.up();
  const worst = await page.evaluate(async () => {
    let worst = 0;
    for (let i = 0; i < 60; i++) {
      await new Promise(requestAnimationFrame);
      worst = Math.max(worst, window.gap());
    }
    return worst;
  });
  expect(worst).toBeLessThan(0.1);
});
