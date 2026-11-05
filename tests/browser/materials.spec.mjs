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
      shape: ['rice', 'round', 'flower', 'crystal', 'led'],
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
  expect(result.shapes.sort()).toEqual(['crystal', 'flower', 'led', 'rice', 'round']);
  expect(result.petals).toBeGreaterThan(0);
  expect(result.petals % 5).toBe(0);
});
