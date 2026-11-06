# String Lights performance

## Current release gates

`npm run check` measures packed artifacts against `performance-budgets.json`. The renderer is approximately 13.9 KB gzip, geometry-only imports approximately 3.5 KB, bulb preview approximately 3.7 KB, and the React wrapper approximately 0.4 KB excluding its core dependency and React peer. The exact current measurements are generated in `artifacts/string-bundle-sizes.json`; gzip size depends slightly on the tool/runtime version. Renderer/geometry budgets are now 14.0 KB/3.5 KB to cover the coupled cable solver, safeguarded near-taut constraints, terminal-wire clipping, and document-overlay measurement. Scroll-container measurement, soft contact, and drag stabilization bring the renderer to approximately 13.9 KB gzip without runtime dependencies.

Browser checks enforce that 300 equivalent option updates stay below a generous 500 ms CPU budget and make zero DOM mutations. They also cover a page of 12 decorations: only sections with a nonzero visible intersection animate, and scrolling resumes/pauses the appropriate instances. Separate tests assert zero animation-frame requests during quiet breeze periods, immediate wake on a grab, and complete offscreen suspension of frames, animation, and pattern timers. These behavioral gates are more stable than asserting a universal FPS on shared CI hardware.

The current implementation additionally:

- Shares palette and socket gradients across all bulb shapes within an instance.
- Allocates rope particles only on the first grab and uses one delegated pointer listener per instance.
- Uses a spatial index for resting bulb clearance.
- Builds SVG scenes in a document fragment before attaching them.
- Caps each wire at 128 sampled segments and each instance at 600 bulbs. Geometry rejects non-finite dimensions or dimensions above 1,000,000 CSS pixels.
- Uses timers to sleep through quiet gust intervals and preserves the visible-time breeze phase across pauses.
- Keeps material IDs unique across separate bundled copies and shares host-position ownership correctly.
- Relies on element ResizeObserver notifications instead of adding a window resize listener for every component when that API is available.
- Solves coupled cable-length constraints with a linear-time tridiagonal solve instead of allowing local constraint passes to stretch wide spans. Scratch arrays are reused per active rope. A 2,468px draped fixture that formerly drifted about 38px at rest now stays within 0.15px; repeated drags settle within 1px without a return tween.
- Ends free wires at the final accepted bulb and removes empty dangling strands after overlap filtering.
- Measures scrolling page overlays without counting their own height, including multiple layers and shrinking content.

## Historical before/after comparison

Measured in local headless Chrome on November 3, 2026. This is a comparison on one machine, not a universal frame-rate guarantee. Fixture: 1200 × 600 curtain, 306 bulbs, 5,035 SVG descendants, mixed rice/round/crystal bulbs, animated lights, breeze disabled while measuring updates.

| Operation                                          |                          Before |                                           After |
| -------------------------------------------------- | ------------------------------: | ----------------------------------------------: |
| 30 equivalent options updates                      | 5,170 ms, replaced SVG children |                       0.8 ms, retained children |
| 30 alternating speed updates                       | 4,842 ms, replaced SVG children | 4.9 ms, retained children and animation objects |
| 30 resize events with unchanged dimensions         |                   Rebuilt bulbs |                                  Retained bulbs |
| Running light animations after scrolling offscreen |                             306 |                                               0 |

Optimizations:

- Compare normalized option values, including array contents, before touching the DOM. New inline React option objects do not rebuild equivalent lights.
- Update animation playback rate for speed edits. Mode/program changes replace lighting animations while retaining geometry and active ropes.
- Pause Web Animations, breeze/rope frames, and pattern timers outside the viewport. Reentry resumes the remaining program interval. Hidden documents and reduced motion retain their existing pause behavior.
- Coalesce real size changes into one animation frame and ignore resize events that leave the target dimensions unchanged.
- Remove a per-frame particle-speed array allocation.
- Isolate the imperative SVG from React children so child reconciliation cannot remove it. Skip the redundant initial React options update.

Verification included geometry/physics tests, real mouse release and flicks, SSR, and React StrictMode with 30 parent renders that changed text and recreated inline option arrays. Bulb DOM, animation identity, and a single mounted instance survived those renders.

Geometry/material edits still rebuild their instance. Large SVG installations still cost memory, paint, and animation work while visible. The renderer caps an instance at 600 bulbs; use wider spacing or disable breeze when decorating many visible sections. Intersections are cleared at rest, not collision-simulated during dragging. Existing bulb artwork and gravity behavior are preserved.

Curtain attachment tracking adds explicit header ties and moving pin constraints, while unmanipulated drops keep their idle scheduling.

The heart bulb adds approximately 0.15 KB gzip for its glass shell and filament; uniform row fitting adds approximately 0.4 KB gzip. The renderer budget is 14.0 KB. Fitting is bounded by 600 bulbs and ten search trials and runs only when geometry changes.

Six synchronized channel rhythms add approximately 0.45 KB gzip to the renderer. They use opacity-only Web Animations, one shared timeline origin per program and no animation-frame loop. Geometry-only and unused imports exclude the rhythm runtime.
