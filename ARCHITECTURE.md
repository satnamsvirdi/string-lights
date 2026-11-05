# Architecture

`src/core/index.js` is the JavaScript API. `StringLights.js` is a browser-compatible source entry that reexports it. The published bundle is built from these modules:

| Module                  | Responsibility                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `options`               | Shared palettes, defaults, input validation, and independent normalized values |
| `presets`               | Immutable starting configurations                                              |
| `geometry`              | Catenaries, bulb attachment points, and spatially indexed resting clearance    |
| `physics`               | Fixed-step rope constraints, gravity, and release momentum                     |
| `materials` / `preview` | Glass artwork, shared socket drawing, and standalone bulb previews             |
| `lighting`              | Web Animations and active-time pattern scheduling                              |
| `motion` / `breeze`     | Visible rope/breeze frames, sleep, and quiet-period wakeups                    |
| `interaction`           | Delegated pointer input, exact local grabs, and release                        |
| `renderer` / `paths`    | SVG scene construction and smooth cable paths                                  |
| `controller`            | Instance ownership, option routing, resize/visibility, and teardown            |

Each instance owns its state and resources. Modules share that instance state instead of global animation state. One delegated pointer listener serves every bulb on an instance. Rope particles are allocated when a strand is first grabbed. Scene creation happens in a document fragment before attaching it to the SVG. Materials share palette gradients across shapes within an instance and use one socket implementation for every bulb shape. A non-enumerable symbol on the host tracks position ownership across separately bundled engine copies; the last owner removes it during teardown.

`src/react/StringLights.tsx` is the canonical React component. It uses refs for the imperative controller and separates its decoration host from React-owned children. The build compiles JavaScript and generates its declarations with TypeScript. The shadcn build transforms only import specifiers through the TypeScript AST, preserving the same component implementation and types.

Generated outputs include package `dist` folders, package license copies, registry source and payloads, and bundle-size measurements. Source maps include the original modules. CI checks registry/source parity after regeneration. Core declarations live in `packages/string-lights-core/index.d.ts`; consumer type tests and installed-package tests exercise that contract.
