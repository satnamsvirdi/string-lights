# Changelog

## [0.3.0](https://github.com/satnamsvirdi/string-lights/compare/v0.3.1...v0.3.0) (2026-11-06)


### ⚠ BREAKING CHANGES

* remove twinkle and use fade as the default. Replace twinkle in mode and patternSequence with fade.

### Features

* add light controls and fix rope release physics ([ab44e91](https://github.com/satnamsvirdi/string-lights/commit/ab44e915d65ebad6a2119a38f8bfb7b84df6476b))
* customize the number of string attachment points ([372cbbf](https://github.com/satnamsvirdi/string-lights/commit/372cbbf12ebce6bfb0dbe3dbe7534e8fef18016f))
* release heart bulbs and natural light rhythms ([b86d17a](https://github.com/satnamsvirdi/string-lights/commit/b86d17a5fcf2101e750282228365481a251503fd))


### Bug Fixes

* cover scrollable container content with lights ([5482bdf](https://github.com/satnamsvirdi/string-lights/commit/5482bdfbde87d0f7eeb8c665d9aa29fe50713c3d))
* damp attached drops only while their header is held ([5c72846](https://github.com/satnamsvirdi/string-lights/commit/5c728462cd3f0977a0427a2c29b401f94ab9048e))
* keep curtain drops attached to moving headers ([f644754](https://github.com/satnamsvirdi/string-lights/commit/f644754dcc3412515440fdc360783124e6cd0fa1))
* remove pointer lag when reversing a held string ([4d6feac](https://github.com/satnamsvirdi/string-lights/commit/4d6feac74d81c4b38304a474d1030e9f731711a6))
* stabilize dragging and restore full-width scrolling lights ([c915f35](https://github.com/satnamsvirdi/string-lights/commit/c915f350b04d54c8500c03a8a0aafc71a5d75a5a))

## 0.3.1 (2026-11-06)

- Correct the npm package READMEs to document heart bulbs, the new rhythm names, and Fade as the default.
- Document replacing the removed Twinkle mode in both `mode` and `patternSequence`.
- No runtime code changes from 0.3.0.

## 0.3.0 (2026-11-06)

### Breaking change

- Remove `twinkle`; use `fade` instead. `fade` is now the default mode. Replace `twinkle` in `mode` and `patternSequence` before upgrading.

### Features

- Add heart-shaped glass bulbs, heart filaments, mixed-shape support, glitter and previews.
- Add synchronized `alternate`, `pairs`, `double`, `steps`, `bounce` and `fade` rhythms. Speed, pause, dim base, reduced motion and timed/random switching work with every mode.

### Fixes

- Keep one uniform bulb pitch along connected curves and across supports. Fit wide bulbs across the whole row instead of creating skipped-bulb gaps.
- Give hanging curtain strands equal cable lengths that follow header sag. Share the bulb budget evenly so the last strand is not cut short.
- Preserve clearance at exact spacing despite floating-point rounding.

## 0.2.0

- Add `anchorCount` to customize the number of top attachment points without changing sag; zero retains layout defaults.
- Remove the held-pointer speed cap so a downward reversal follows the cursor immediately; retain cable reach limits and existing release dynamics.
- Prevent small header pulls from whipping attached drops: track moving support history correctly and apply held damping only until the pointer releases.
- Keep curtain drops tied to their header during drag, release, and breeze; move their pinned roots with the actual header attachment.
- Honor sag on border and curtain headers, damp held ropes, and keep slight slack at maximum pointer reach to avoid singular tension.
- Add default-on soft strand contact; set `collisions: false` to disable it.
- Measure React scroll containers directly and exclude browser scrollbars from fixed page overlay width.
- Size decorations to scrollable container content so lights remain visible after scrolling; exclude overlays when measuring shrinking content.
- Subtle twinkle is now the default; `animated` turns lighting on/off without losing its pattern or rebuilding the string.
- Add `pagePosition: 'absolute'` for document overlays that scroll and resize with page content; fixed overlays remain supported.
- Replace iteration-dependent cable length correction with a coupled solver so wide strings return to their original resting sag after dragging.
- Preserve original cable lengths when grabbing a breeze-displaced string.
- Trim free cable ends at the final accepted bulb after intersection clearance; omit empty dangling wires.

## 0.1.1

- Keep React decorations inside their component when `style.position` is `static`.
- Emit a compact, explicit React return type in the published declaration file.

## 0.1.0

- Initial JavaScript, React, and copyable shadcn distributions.

Release Please generates future version entries from Conventional Commits.
