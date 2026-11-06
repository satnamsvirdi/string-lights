# Changelog

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
