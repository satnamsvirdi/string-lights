/** Measure page content without letting our absolute overlay keep the page artificially tall. */
export function dimensions({ page, options, win, host, doc }) {
  if (!page) return [host.clientWidth, host.clientHeight];
  if (options.pagePosition === 'fixed') return [win.innerWidth, win.innerHeight];
  const overlays = [...doc.querySelectorAll('svg[data-string-page="absolute"]')];
  const previous = overlays.map((overlay) => overlay.style.height);
  overlays.forEach((overlay) => {
    overlay.style.height = '0px';
  });
  const height = Math.max(win.innerHeight, doc.documentElement.scrollHeight, doc.body.scrollHeight);
  overlays.forEach((overlay, i) => {
    overlay.style.height = previous[i];
  });
  return [doc.documentElement.clientWidth || win.innerWidth, height];
}
