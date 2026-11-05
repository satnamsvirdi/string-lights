# Changelog

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
