import { test, expect } from '@playwright/test';

test('scrolling page overlays align with the document even when the body has margins and padding', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    Object.assign(document.body.style, { margin: '24px', padding: '16px' });
    document.getElementById('host').style.height = '1800px';
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(document.body, {
      pagePosition: 'absolute',
      animated: false,
      breeze: false,
    });
  });
  const position = await page.evaluate(() => {
    const box = lights.element.getBoundingClientRect();
    return {
      x: box.left,
      y: box.top,
      width: box.width,
      viewport: document.documentElement.clientWidth,
    };
  });
  expect(position.x).toBe(0);
  expect(position.y).toBe(0);
  expect(position.width).toBe(position.viewport);
  await page.evaluate(() => window.scrollTo(0, 300));
  expect(await page.evaluate(() => lights.element.getBoundingClientRect().top)).toBe(-300);
});

test('subtle twinkle is the default and a click handler can disable and restore it without remounting', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights('#host', { breeze: false });
    window.bulb = lights.element.querySelector('[data-shape]');
    let animated = true;
    document.getElementById('content').onclick = () =>
      lights.update({ animated: (animated = !animated) });
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).some((a) => a.playState === 'running'),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => lights.pattern)).toBe('twinkle');
  await page.locator('#content').click();
  expect(await page.evaluate(() => lights.element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(
    await page.evaluate(() => window.bulb === lights.element.querySelector('[data-shape]')),
  ).toBe(true);
  await page.locator('#content').click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        lights.element.getAnimations({ subtree: true }).some((a) => a.playState === 'running'),
      ),
    )
    .toBe(true);
});

test('disabled animation holds the selected program instead of cycling invisibly', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights('#host', {
      animated: false,
      breeze: false,
      patternOrder: 'cycle',
      patternInterval: 1,
      patternSequence: ['blink', 'wave'],
    });
  });
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => lights.pattern)).toBe('blink');
  expect(await page.evaluate(() => lights.element.getAnimations({ subtree: true }).length)).toBe(0);
  await page.evaluate(() => lights.update({ animated: true }));
  await expect.poll(() => page.evaluate(() => lights.pattern), { timeout: 2500 }).toBe('wave');
});

test('document overlays scroll, track growing and shrinking pages, and coexist with fixed overlays', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const spacer = document.createElement('div');
    spacer.id = 'spacer';
    spacer.style.height = '1800px';
    document.body.append(spacer);
    const { createStringLights } = await import('/core.js');
    window.first = createStringLights(document.body, {
      pagePosition: 'absolute',
      animated: false,
      breeze: false,
    });
    window.second = createStringLights(document.body, {
      pagePosition: 'absolute',
      animated: false,
      breeze: false,
    });
    window.fixed = createStringLights(document.body, { animated: false, breeze: false });
  });
  await expect
    .poll(() => page.evaluate(() => window.first.element.viewBox.baseVal.height))
    .toBe(2200);
  await page.evaluate(() => window.scrollTo(0, 600));
  expect(await page.evaluate(() => window.first.element.getBoundingClientRect().top)).toBe(-600);
  expect(await page.evaluate(() => window.fixed.element.getBoundingClientRect().top)).toBe(0);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.getElementById('spacer').style.height = '2600px';
  });
  await expect
    .poll(() => page.evaluate(() => window.first.element.viewBox.baseVal.height))
    .toBe(3000);
  await expect
    .poll(() => page.evaluate(() => window.second.element.viewBox.baseVal.height))
    .toBe(3000);
  await page.evaluate(() => (document.getElementById('spacer').style.height = '50px'));
  await expect
    .poll(() => page.evaluate(() => window.first.element.viewBox.baseVal.height))
    .toBe(await page.evaluate(() => innerHeight));
  await expect
    .poll(() => page.evaluate(() => window.second.element.viewBox.baseVal.height))
    .toBe(await page.evaluate(() => innerHeight));
  await page.evaluate(() => {
    window.first.destroy();
    window.second.destroy();
    window.fixed.destroy();
  });
  expect(await page.evaluate(() => document.body.style.position)).toBe('');
});

test('a scrolling overlay can switch to fixed placement and restore body positioning', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    document.getElementById('host').style.height = '2400px';
    const { createStringLights } = await import('/core.js');
    window.lights = createStringLights(document.body, {
      pagePosition: 'absolute',
      breeze: false,
      animated: false,
    });
    window.scrollTo(0, 500);
  });
  expect(await page.evaluate(() => lights.element.getBoundingClientRect().top)).toBe(-500);
  await page.evaluate(() => lights.update({ pagePosition: 'fixed' }));
  expect(await page.evaluate(() => lights.element.getBoundingClientRect().top)).toBe(0);
  expect(await page.evaluate(() => document.body.style.position)).toBe('');
  expect(await page.evaluate(() => lights.element.viewBox.baseVal.height)).toBe(
    await page.evaluate(() => innerHeight),
  );
});
