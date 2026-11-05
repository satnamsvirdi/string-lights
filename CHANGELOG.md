# Changelog

## 0.2.0

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
