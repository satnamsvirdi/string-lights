import { test, expect } from '@playwright/test';
test('separate engine copies have unique material IDs and all shapes resolve their gradients', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const first = await import('/core.js');
    const second = await import('/core.js?copy=second');
    const host = document.getElementById('host');
    const a = first.createStringLights(host, {
      shape: ['rice', 'round', 'flower', 'crystal', 'led', 'heart'],
      breeze: false,
      glitter: true,
      dimBase: true,
    });
    const b = second.createStringLights(host, { colors: 'white', breeze: false });
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    const unique = new Set(ids).size === ids.length;
    const refs = [...document.querySelectorAll('[fill],[stroke],[clip-path]')].flatMap((node) =>
      [...node.attributes]
        .map((attribute) => attribute.value)
        .flatMap((value) => [...value.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1])),
    );
    const resolved = refs.every((id) => document.getElementById(id));
    const shapes = [
      ...new Set([...a.element.querySelectorAll('[data-shape]')].map((node) => node.dataset.shape)),
    ];
    const petals = a.element.querySelectorAll('[data-flower-petal]').length;
    const sharedSocket = a.element.querySelectorAll('linearGradient[id$="-socket"]').length === 1;
    a.destroy();
    const hostRetained = host.style.position === 'relative';
    b.destroy();
    const hostRestored = host.style.position === '';
    return { unique, resolved, shapes, petals, hostRetained, hostRestored, sharedSocket };
  });
  expect(result.unique).toBe(true);
  expect(result.resolved).toBe(true);
  expect(result.hostRetained).toBe(true);
  expect(result.hostRestored).toBe(true);
  expect(result.sharedSocket).toBe(true);
  expect(result.shapes.sort()).toEqual(['crystal', 'flower', 'heart', 'led', 'rice', 'round']);
  expect(result.petals).toBeGreaterThan(0);
  expect(result.petals % 5).toBe(0);
});

test('heart glass, glitter and dimmed materials render with an upright specimen', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createStringLights, createBulbPreview } = await import('/core.js');
    const lights = createStringLights('#host', {
      shape: 'heart',
      colors: ['#ff6b9d'],
      glitter: true,
      dimBase: true,
      breeze: false,
    });
    const preview = createBulbPreview({ shape: 'heart', colors: ['#ff6b9d'], glitter: true });
    document.body.append(preview);
    const heart = lights.element.querySelector('[data-shape="heart"]');
    const clip = [...lights.element.querySelectorAll('clipPath')].find((node) =>
      node.id.endsWith('-heart-glass-clip'),
    );
    const shell = clip.querySelector('path');
    return {
      width: shell.getBBox().width,
      height: shell.getBBox().height,
      dim: !!heart.querySelector('[data-string-base="dim"]'),
      flecks: heart.querySelectorAll('circle').length,
      shape: preview.getAttribute('aria-label'),
      upright: !preview.querySelector('g').getAttribute('transform').includes('180'),
      count: lights.element.querySelectorAll('[data-shape="heart"]').length,
    };
  });
  expect(result.width).toBeGreaterThan(16);
  expect(result.height).toBeGreaterThan(16);
  expect(result.dim).toBe(true);
  expect(result.flecks).toBeGreaterThan(10);
  expect(result.shape).toBe('heart glass bulb');
  expect(result.upright).toBe(true);
  expect(result.count).toBeGreaterThan(0);
});
