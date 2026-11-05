# String lights

Dependency-free SVG Diwali string lights for JavaScript and React. Mix bulb shapes, create independently controlled strings, and run fixed, ordered, or shuffled lighting programs. Serve ES modules over HTTP rather than opening the HTML through `file://`.

For npm tarballs, typed package imports, and the copyable shadcn component, see [distribution instructions](PACKAGING.md).

## JavaScript: independent strings

```js
import { createStringLights } from './StringLights.js';

const balcony = createStringLights('#balcony', {
  layout: 'roofline',
  shape: ['rice', 'round', 'flower'],
  colors: 'multicolor',
  dimBase: true,
  patternOrder: 'random',
  patternInterval: 8,
  patternSequence: ['blink', 'chase', 'wave', 'twinkle'],
  seed: 17,
});

const doorway = createStringLights('#doorway', {
  layout: 'border',
  shape: ['crystal', 'round'],
  colors: 'white',
  patternOrder: 'cycle',
  patternInterval: 12,
  patternSequence: ['wave', 'twinkle', 'blink'],
});

balcony.pause(); // Doorway continues independently.
balcony.play(); // Resumes the remaining pattern interval.
doorway.update({ colors: 'warm' });
console.log(doorway.pattern); // Current selected lighting pattern.

// Destroy each controller when removing its target.
// balcony.destroy(); doorway.destroy();
```

Each target needs a size; give empty sections a `min-height`. Use `createStringLights(document.body, options)` for a fixed full-viewport overlay. Element targets use their own dimensions. Multiple instances have independent options, geometry, clocks, seeds, and lifecycle. Instances can share a host, but intersection clearance is calculated within each instance.

Equivalent updates are ignored, including equivalent arrays. Speed, lighting program, pause, and wind edits retain the bulb DOM; geometry/material edits rebuild that instance. Component instances pause when outside the viewport and resume when visible. See [performance measurements](PERFORMANCE.md).

## Ready-made presets

The editor offers eight presets: Diwali rainbow, Classic electric, Warm gathering, White snowfall, Flower garland, Crystal sparkle, Tricolor celebration, and Mixed celebration. Choose a preset, then **Apply** to update the selected string or **Add preset** to create an independent string. Applying preserves the selected string's name, seed, and pause state. All controls remain editable.

Presets are also available to JavaScript and React integrations:

```js
import { createStringLights, stringLightsPresets } from './StringLights.js';

const lights = createStringLights('#balcony', {
  ...stringLightsPresets.festive.options,
  size: 1.4,
  patternInterval: 15,
});
// React: <StringLights options={stringLightsPresets.white.options} />
```

Keys: `festive`, `classic`, `warm`, `white`, `flowers`, `crystal`, `tricolor`, `mixed`. Each entry has `name`, `description`, and a complete `options` object. Presets and their arrays are frozen; spread their options to override values. Instances copy arrays so edits stay independent.

## React

```jsx
import { StringLights } from 'string-lights-react';

function Celebration() {
  return (
    <>
      <StringLights
        options={{
          layout: 'roofline',
          shape: ['rice', 'flower'],
          colors: 'multicolor',
          patternOrder: 'random',
          patternInterval: 8,
          patternSequence: ['blink', 'wave', 'twinkle'],
          seed: 17,
        }}
        style={{ minHeight: 320 }}
      >
        <h2>Balcony lights</h2>
      </StringLights>
      <StringLights
        options={{ layout: 'border', colors: 'white', mode: 'wave' }}
        style={{ minHeight: 240 }}
      >
        <h2>A separate rhythm</h2>
      </StringLights>
    </>
  );
}
```

Use `fullPage` for a viewport decoration. The wrapper forwards div attributes, `className`, and `style`. It creates the renderer in an effect and destroys it on unmount, including scheduled pattern switches. Immutable options update that component's instance. Server rendering produces the content wrapper without accessing browser globals; Strict Mode mount/cleanup is supported.

## Options

| Option            | Default                                 | Values                                                                                                                                              |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout`          | `roofline`                              | `roofline`, `curtain`, `draped`, `border`                                                                                                           |
| `shape`           | `rice`                                  | `rice`, `round`, `crystal`, `flower`, `led`, or a nonempty array of these shapes                                                                    |
| `colors`          | `multicolor`                            | `multicolor` (includes white), `electric` (photo-inspired red/green/blue/yellow/cool white), `white`, `warm`, `tricolor`, or an array of hex colors |
| `mode`            | `static`                                | `static`, `blink`, `chase`, `twinkle`, `wave`; used with a fixed pattern                                                                            |
| `patternOrder`    | `fixed`                                 | `fixed`, `cycle`, `random`                                                                                                                          |
| `patternInterval` | `10`                                    | Seconds between pattern changes, clamped to 1–3600                                                                                                  |
| `patternSequence` | `['blink', 'chase', 'wave', 'twinkle']` | A nonempty array of distinct valid pattern names; can include `static`                                                                              |
| `dimBase`         | `false`                                 | Darken idle glass and deepen animation dim phases                                                                                                   |
| `glitter`         | `false`                                 | Flecks inside the glass and occasional star glints                                                                                                  |
| `spacing`         | `28`                                    | Requested attachment spacing in CSS pixels, clamped to 16–100                                                                                       |
| `size`            | `1`                                     | Bulb scale, clamped to 0.5–2.5                                                                                                                      |
| `sag`             | `48`                                    | Swag depth in CSS pixels, clamped to 0–140 and fitted to target height                                                                              |
| `speed`           | `1`                                     | Lighting-animation speed multiplier, clamped to 0.2–2                                                                                               |
| `glow`            | `0.65`                                  | Halo opacity, clamped to 0–1; zero disables halos                                                                                                   |
| `breeze`          | `true`                                  | Occasional gentle wind, independent of lighting mode                                                                                                |
| `wind`            | `1`                                     | Wind strength, clamped to 0–2                                                                                                                       |
| `interactive`     | `true`                                  | Mouse, pen, and touch grabs on bulbs and wires                                                                                                      |
| `seed`            | `7`                                     | Finite number for repeatable geometry, twinkle timing, and pattern shuffle                                                                          |
| `paused`          | `false`                                 | Freeze lighting, wind, rope motion, and the pattern clock                                                                                           |

Color arrays accept `#RGB` and `#RRGGBB`. Shape arrays repeat in their supplied order; repeated entries can weight a mix. Shapes that cannot fit at an attachment are retried at the next available position rather than silently disappearing from the mix. All shapes retain their individual glass artwork. Clearance accounts for shape, socket, mounting angle, and size. Soft halos can blend. Dense strings and intersections can have gaps; at most 600 bulbs are generated per instance.

Unknown enums, invalid colors, empty/invalid arrays, duplicate pattern names, and nonfinite numeric values throw `TypeError`. Numeric ranges clamp. Input arrays are copied so independently configured instances do not share mutable arrays.

## Pattern programs

- `fixed` keeps `mode` until explicitly updated.
- `cycle` starts with the first `patternSequence` entry, then visits the supplied order at each interval and wraps around.
- `random` starts with the first entry, then shuffles through the remaining entries before a new round. Every selected pattern appears once per round; the boundary between rounds cannot immediately repeat a pattern. A one-entry program stays on that pattern.

The interval counts active, visible seconds. Pause, a hidden document, and reduced motion suspend switching. Resume continues the remaining interval. Changing `mode`, `patternOrder`, `patternSequence`, `patternInterval`, or `seed` starts a fresh program for that instance. Resize and material-only updates preserve its selected pattern and remaining interval.

A scheduled switch replaces only lighting animations. It keeps the SVG geometry, glass materials, rope state, and any active pointer grab intact.

```js
lights.update({
  patternOrder: 'cycle',
  patternInterval: 5,
  patternSequence: ['wave', 'chase', 'twinkle'],
});

lights.element.addEventListener('stringpatternchange', (event) => {
  console.log(event.detail.mode);
});
```

`controller.pattern` reads the selected pattern. `stringpatternchange` fires on the SVG when the selected pattern changes; resizing does not emit a false pattern change. Under reduced motion the selected pattern remains recorded while lights render steadily.

## Lifecycle and placement

The controller exposes `element`, `pattern`, `update(partialOptions)`, `pause()`, `play()`, and `destroy()`. Updates validate before replacing existing options. Destroy is idempotent: it removes the overlay, cancels native animations and scheduled pattern changes, disconnects observers, and removes window/document listeners. The last instance on a shared host restores any `position` style changed by the library.

The overlay clips its own wires, bulbs, and halos without changing the host's overflow. Default `z-index` is 10; adjust `controller.element.style.zIndex` if your host's stacking context needs a different layer. Interactive lights receive pointer input only on bulb/wire hit regions. Empty overlay areas pass clicks and scrolling through to content. Set `interactive: false` for complete passthrough.

## Rope motion and accessibility

Untouched roofline and draped strings use smooth catenaries with a small occasional breeze sway. Each six-second gust is followed by quiet air in a nineteen-second cycle. Border side bulbs face inward; top bulbs face down.

Dragging activates a local position-based rope solver at fixed 1/120-second steps. The exact grabbed attachment follows the pointer, rather than warping the whole strand around its center. Gravity, inertia, damping, cable-length constraints, and pinned supports control its movement. Roofline/draped spans keep both supports; curtain and border side strands hang from their top anchor with free lower tails. Cable tension resists impossible pulls. Release transfers recent hand velocity to the grabbed attachment without changing any particle positions. Holding still before release removes that flick impulse. Gravity accelerates the strand downward, cable tension redirects it into a swing, and speed-dependent air resistance gradually removes energy. The strand can overshoot its resting line and reverse direction several times; there is no easing curve or force pulling free particles to their original coordinates. Resting ropes sleep only after sustained low velocity.

Pointer capture survives movement outside the hit area. Release, cancellation, lost capture, and blur release the strand. Resize/update/unmount cancel grabs safely. Pause freezes motion and releases the pointer. Rope motion is a lightweight 2D simulation; it does not simulate collisions during deliberate dragging.

Decorations are hidden from assistive technology and never receive keyboard focus. The drag interaction is decorative and exposes no keyboard-only content or task. Reduced motion disables wind, dragging, blink animation, and program switching. Hidden documents pause their animations and clocks. Consumers choosing animation should provide pause controls, as the demo does. To keep a decoration completely still, use `mode: 'static', patternOrder: 'fixed', breeze: false, interactive: false`.

## Glass materials and advanced helpers

Bulbs use shared SVG gradients, tinted glass, internal emitters, reflections, molded sockets, crystal facets, and optional glitter. Flowers have five separate petals and a small central LED. These are scalable 3D-style materials rather than WebGL or physically traced refraction. No raster downloads or per-bulb blur filters are required.

`dimBase: true` lowers idle glass to 12% opacity and animation troughs to 2% emission while retaining 100% peak emission. Sockets keep their original material. It defaults off. Static/reduced-motion fallback stays steadily lit.

`createBulbPreview(options)` returns an accessible enlarged SVG using the same materials as live strings. If `shape` is an array, the preview shows its first entry. It accesses `document` only when called. `createGeometry(width, height, options)` and `normalizeOptions(options)` are exported for custom rendering; geometry includes each bulb's shape and its wire segment attachment. `createRope(points)`, `ropeAttachment(rope, segment, t)`, `stepRope(rope, 1/120, grab, wind)`, and `releaseRope(rope, grab, velocity)` support deterministic custom simulation and tests.

## Demo and verification

Run `node string-preview.cjs` and open http://127.0.0.1:8770. Each card is an independent string. Select it from the menu or its Edit button. Add/remove/rename strings, mix shapes, choose palettes and layouts, select a fixed/cyclic/shuffled program and interval, pause one or all, and copy the full independent-instance configuration. The full-page button previews the selected string's configuration. Preview changes are session-only; copy the code to keep them.

Reusable Storybook examples are in `react/StringLights.stories.jsx`, including mixed shapes, timed programs, and independent instances. The standalone project uses `npm run dev` for its visual editor.

Checks: `node --test StringLights.test.mjs` and `npm --prefix react run build-storybook`. Twelve tests cover geometry, rope behavior, mixed shapes, input validation, array isolation, continuous release, pendulum overshoot, cable length during swing, and local flick momentum. Browser checks cover independent clocks, ordered/shuffled switching, pause/resume, destroy cleanup, reduced motion, mixed material references, add/remove/edit isolation, code export, full-page preview, responsive overflow, scheduled switching during a real mouse grab, gravity-driven release reversals with decaying amplitude, and retained momentum after a mouse flick. SSR and the production Storybook build pass. Desktop, tablet, and phone screenshots were inspected; the design inspector has zero failures. Enlarged material samples remain below the live editor previews.

Research references: [Sparkworld rice/string strings](https://www.sparkworldlights.com/en/collection/rice-lights), [Ahuja festival lights and waterfall curtains](https://ahujainternational.com/collections/festival-speical-lights). These inform the visual vocabulary, not claims of electrical simulation.
