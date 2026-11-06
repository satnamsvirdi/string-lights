# string-lights

Dependency-free, tree-shakable ESM Diwali string lights. Includes TypeScript declarations. Modern browsers need SVG, Web Animations, ResizeObserver, and pointer events. SSR imports are safe; create lights after mounting a DOM target.

```js
import { createStringLights, stringLightsPresets } from 'string-lights';

const lights = createStringLights('#celebration', {
  ...stringLightsPresets.festive.options,
  spacing: 32,
});
lights.update({ speed: 1.5 });
// When removing your target:
lights.destroy();
```

Give the target a height or `min-height`. Pass `document.body` for a fixed full-page overlay. Each controller has `element`, `pattern`, `update`, `pause`, `play`, and `destroy`. Equivalent updates do no DOM work. Speed edits retain animation phase. Offscreen instances suspend animation, physics frames, and pattern timers. Reduced motion renders steady bulbs.

Layouts: `roofline`, `curtain`, `draped`, `border`. Shapes: `rice`, `round`, `crystal`, `flower`, `led`, `heart`, or an array mixing them. Modes: `static`, `blink`, `chase`, `wave`, `alternate`, `pairs`, `double`, `steps`, `bounce`, `fade`. Palettes: `multicolor`, `electric`, `warm`, `white`, `tricolor`, or hex colors. `patternOrder` supports `fixed`, `cycle`, and `random`; set `patternSequence` and `patternInterval` in seconds. `breeze`, `interactive`, `glitter`, and `dimBase` are optional controls. See the declarations for the complete API.

Named exports allow bundlers to remove unused presets, previews, and renderer code. No global stylesheet, framework, or runtime dependency. ESM only. Licensed under MIT; the license is included in the package.

Gentle fading (`fade`) is enabled by default. Use `lights.update({ animated: false })` for steady bulbs, then `animated: true` to restore the chosen pattern. This is safe in settings and click handlers and does not remount geometry. Breeze remains separately configurable.

For page lights that move with scrolling, use `createStringLights(document.body, { pagePosition: 'absolute' })`. The default `pagePosition: 'fixed'` stays on screen. Document overlays track page growth and shrinkage. All free wire tips end at their final bulb.

`twinkle` was removed in 0.3.0. Replace it with `fade` in both `mode` and `patternSequence`. Curtain drops have equal cable lengths, and bulbs keep uniform spacing along connected curves.
