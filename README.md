# String Lights

[Try the live demo on CodePen](https://codepen.io/editor/Pika-Singh/pen/01a1ac4c-1207-7c55-b921-f3d81af5a2f2)

Connected string rows keep an even distance between bulbs across supports. `spacing` is the minimum distance along the wire; a row widens uniformly when larger bulbs need clearance.

Set `anchorCount` to choose 1–12 evenly spaced top attachment points, independently of `sag`. Use `0` (default) for the layout's original count: two on roofline, border, and curtain headers; three per draped row. For example, `lights.update({ anchorCount: 4, sag: 60 })` creates four top supports.

Strands respond softly to contact by default. Set `collisions: false` to disable contact within an instance. Border and curtain headers honor `sag`. Scrollable component decorations cover their content; fixed page decorations fit the viewport without including its scrollbar.

Decorative festival, Christmas, and Diwali string lights for JavaScript and React. Glass bulbs, white and multicolor palettes, eight presets, independent lighting programs, and strings you can grab and release into a gravity-driven swing.

The core has no runtime dependencies. Both packages are ESM with TypeScript declarations and tree shaking. React 18 and 19 are supported. Offscreen decorations pause, reduced motion produces steady lights, and equivalent options preserve the existing SVG and animations.

## Try the editor

Use Node 22 or 24:

```sh
npm ci
npm run dev
```

Open [localhost:8770](http://127.0.0.1:8770). Choose a preset, mix bulbs, edit an independent string, or preview the selected configuration across the page. The editor exports JavaScript configurations.

## JavaScript

```js
import { createStringLights, stringLightsPresets } from 'string-lights';

const lights = createStringLights('#celebration', {
  ...stringLightsPresets.festive.options,
  spacing: 32,
});

lights.update({ speed: 1.4 });
// When removing the target:
lights.destroy();
```

Give the target a height or `min-height`. Use `document.body` for a fixed viewport overlay. Content stays clickable between the wires and bulbs.

Lights gently fade by default. Turn light animation off and on from any event handler without losing the selected pattern:

```js
lights.update({ animated: false }); // Steady bulbs; breeze is controlled separately.
lights.update({ animated: true }); // Resume the selected lighting pattern.

// Attach lights to the document so they scroll with the page:
const pageLights = createStringLights(document.body, { pagePosition: 'absolute' });
// Use pagePosition: 'fixed' to keep them on screen (the default).
```

## React

```tsx
import { StringLights } from 'string-lights-react';
import { stringLightsPresets } from 'string-lights';

export function Celebration() {
  return (
    <StringLights options={stringLightsPresets.white.options} style={{ minHeight: 320 }}>
      <h2>Celebrate together</h2>
    </StringLights>
  );
}
```

Set `fullPage` for a viewport decoration. The component accepts div attributes, `className`, `style`, and children. Static positioning becomes relative to keep the decoration inside its component without changing normal document flow. Absolute, fixed, sticky, and relative positioning are preserved. The SVG mounts after hydration and is isolated from React-owned children. Import `StringLightsProps` and `StringOptions` as types.

For a settings checkbox or click handler, control `animated` with React state. This also works with scrolling page lights:

```tsx
'use client';
import { useState } from 'react';
import { StringLights } from 'string-lights-react';

export function LightSettings() {
  const [animated, setAnimated] = useState(true);
  return (
    <>
      <button aria-pressed={animated} onClick={() => setAnimated((value) => !value)}>
        Animate lights
      </button>
      <StringLights fullPage options={{ animated, pagePosition: 'absolute' }} />
    </>
  );
}
```

Reduced-motion preferences still take priority. `pause()`/`play()` stop and resume both lighting and physical motion; `animated` changes only bulb lighting.

## Install and distribute

Install the public npm packages with `npm install string-lights` for JavaScript or `npm install string-lights-react` for React. Local tarballs are also supported as described in [PACKAGING.md](PACKAGING.md). A separate [shadcn source distribution](PACKAGING.md#copyable-shadcn-component) installs the editable component and local engine without either npm package.

## Quality and releases

```sh
npx playwright install chromium firefox webkit
npm run check
npm run version:auto
```

Checks cover lint, strict component/consumer types, geometry and physics, installed tarballs, SSR, tree shaking, bundle budgets, browser lifecycle, pointer interactions, and idle motion. CI runs Chromium, Firefox, and WebKit on Node 22/React 18 and Node 24/React 19. Local browser execution needs the platform runtimes required by Playwright; the Linux CI installs its browser dependencies explicitly.

Conventional Commits drive automatic semantic versioning and changelogs through Release Please. Both packages and their dependency range version together. See [RELEASING.md](RELEASING.md).

- [API and options](StringLights.md)
- [Architecture](ARCHITECTURE.md)
- [Performance and limits](PERFORMANCE.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

Licensed under [MIT](LICENSE).

### Light rhythms

Keep the existing `static`, `blink`, `chase` and `wave` modes, or choose a synchronized controller rhythm:

| Mode        | Rhythm at speed 1                                                        |
| ----------- | ------------------------------------------------------------------------ |
| `alternate` | Odd/even bulbs take turns every 600ms: 1-2-1-2.                          |
| `pairs`     | Adjacent pairs take turns every 600ms: 1-1-2-2.                          |
| `double`    | Two 180ms flashes per channel, with a pause before the other answers.    |
| `steps`     | Four channels advance every 320ms.                                       |
| `bounce`    | Four channels run forward and back, holding slightly longer at the ends. |
| `fade`      | Four channels overlap in a gentle 2.4-second wave.                       |

```js
lights.update({ mode: 'pairs' });
// All modes also work in patternSequence with patternOrder: 'cycle' or 'random'.
```

`speed`, `dimBase`, `animated` and `paused` apply to all rhythms. Reduced motion keeps them steady.

Twinkle has been removed in 0.3.0. The default mode is `fade`. The preview names `double-beat`, `stepped-chase` and `crossfade` are now `double`, `steps` and `fade`.

Curtain strands use equal cable lengths; their bottom offsets follow the header sag. Connected rows fit uniformly spaced bulbs across supports without skipping individual bulbs.
