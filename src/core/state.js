export const isInactive = (state) =>
  state.destroyed ||
  state.options.paused ||
  state.doc.hidden ||
  !state.visible ||
  state.width === 0 ||
  state.height === 0;
