/** Measure page content without letting our absolute overlay keep the page artificially tall. */
export function dimensions({ page, options, win, host, doc }) {
  if (!page) {
    const scrolls = /^(auto|scroll)$/.test(win.getComputedStyle(host).overflowY);
    if (!scrolls) return [host.clientWidth, host.clientHeight];
    const height = withoutOverlays(host.querySelectorAll(':scope > svg[data-string]'), () =>
      Math.max(host.clientHeight, host.scrollHeight),
    );
    return [host.clientWidth, height];
  }
  if (options.pagePosition === 'fixed')
    return [doc.documentElement.clientWidth || win.innerWidth, win.innerHeight];
  const height = withoutOverlays(doc.querySelectorAll('svg[data-string-page="absolute"]'), () =>
    Math.max(win.innerHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight),
  );
  return [doc.documentElement.clientWidth || win.innerWidth, height];
}

function withoutOverlays(nodes, measure) {
  const overlays = [...nodes];
  const previous = overlays.map((overlay) => overlay.style.height);
  overlays.forEach((overlay) => {
    overlay.style.height = '0px';
  });
  const height = measure();
  overlays.forEach((overlay, i) => {
    overlay.style.height = previous[i];
  });
  return height;
}
