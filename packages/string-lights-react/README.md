# string-lights-react

React wrapper for `string-lights`. Tree-shakable ESM with generated TypeScript declarations and a preserved `"use client"` boundary. React 18 and 19 are supported peers; the core renderer is a normal dependency and is not bundled twice.

```jsx
import { StringLights } from 'string-lights-react';
import { stringLightsPresets } from 'string-lights';

export function Celebration() {
  return (
    <StringLights options={stringLightsPresets.festive.options} style={{ minHeight: 320 }}>
      <h2>Happy Diwali</h2>
    </StringLights>
  );
}
```

Use `fullPage` for a fixed viewport overlay. The component also accepts normal div attributes, children, `className`, and `style`. Import `StringLightsProps` and `StringOptions` as types. SSR outputs only the content and an empty decoration host; effects mount the SVG in the browser. StrictMode cleanup is supported. Inline equivalent options retain existing bulb DOM and animations across parent renders. Children reconcile independently of the imperative SVG. Core options updates are partial; resetting options requires explicitly supplying the desired values.

The wrapper uses relative positioning for normal/static flow so lights stay inside the component. Absolute, fixed, sticky, and relative positioning are preserved.

Offscreen, hidden-tab, reduced-motion, and pause behavior comes from the core renderer. Licensed under MIT; the license is included in the package.

Lights gently fade by default. Settings and click handlers can control `options.animated` through React state; `false` displays steady bulbs without losing the selected pattern. For a document decoration that scrolls with the page, use `<StringLights fullPage options={{ pagePosition: 'absolute', animated }} />`. The default page position is fixed.

Use `options.shape: "heart"` for heart bulbs. Rhythm names are `alternate`, `pairs`, `double`, `steps`, `bounce` and `fade`; `static`, `blink`, `chase` and `wave` remain available. `twinkle` was removed in 0.3.0; replace it with `fade` in `mode` and `patternSequence`.
