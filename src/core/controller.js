import { normalizeOptions } from './options.js';
import { svgNode, nextId } from './svg.js';
import { createInteraction } from './interaction.js';
import { createLighting } from './lighting.js';
import { createMotion } from './motion.js';
import { renderScene } from './renderer.js';
import { dimensions } from './dimensions.js';

// Shared ownership also covers a copied registry engine and an npm engine on one host.
const hostRecordKey = /* @__PURE__ */ Symbol.for('string-lights.host-position.v1');
const programKeys = ['mode', 'patternOrder', 'patternInterval', 'patternSequence', 'seed'];
const liveKeys = new Set([
  'mode',
  'speed',
  'patternOrder',
  'patternInterval',
  'patternSequence',
  'paused',
  'breeze',
  'wind',
  'animated',
]);

function retainHost(host, win) {
  let record = host[hostRecordKey];
  if (!record) {
    record = {
      count: 0,
      position: host.style.position,
      changed: win.getComputedStyle(host).position === 'static',
    };
    Object.defineProperty(host, hostRecordKey, { value: record, configurable: true });
  }
  if (record.changed) host.style.position = 'relative';
  record.count++;
}

function releaseHost(host) {
  const record = host[hostRecordKey];
  if (--record.count !== 0) return;
  if (record.changed && host.style.position === 'relative') host.style.position = record.position;
  delete host[hostRecordKey];
}

function changedKeys(previous, next) {
  return Object.keys(next).filter((key) => {
    const a = previous[key],
      b = next[key];
    return Array.isArray(a) && Array.isArray(b)
      ? a.length !== b.length || a.some((value, i) => value !== b[i])
      : a !== b;
  });
}

/** Own one instance's resources and route option changes to the appropriate subsystem. */
export function createStringLights(target, input = {}) {
  const host = typeof target === 'string' ? document.querySelector(target) : target;
  if (!host?.ownerDocument?.defaultView || !host.style)
    throw new TypeError('A DOM element is required.');
  const options = normalizeOptions(input);
  const doc = host.ownerDocument,
    win = doc.defaultView;
  const page = host === doc.body || host === doc.documentElement;
  let retainedHost = false;
  const id = nextId('string');
  const svg = svgNode(
    doc,
    'svg',
    { 'aria-hidden': 'true', focusable: 'false', 'data-string': id },
    host,
  );
  Object.assign(svg.style, {
    position: page ? 'fixed' : 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    touchAction: 'none',
    overflow: 'hidden',
    clipPath: 'inset(0)',
    zIndex: '10',
  });
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    host,
    doc,
    win,
    page,
    id,
    svg,
    media,
    options,
    destroyed: false,
    visible: true,
    strands: [],
    bulbs: [],
    drag: null,
    width: -1,
    height: -1,
  };
  const lighting = createLighting(state);
  const motion = createMotion(state);
  const interaction = createInteraction(state);
  let resizeFrame = 0;
  function sync() {
    lighting.sync();
    motion.sync();
  }
  function render() {
    if (state.destroyed) return;
    const retain = !page || state.options.pagePosition === 'absolute';
    if (retain !== retainedHost) {
      if (retain) retainHost(host, win);
      else releaseHost(host);
      retainedHost = retain;
    }
    interaction.release();
    lighting.cancel();
    motion.reset();
    renderScene(state);
    lighting.apply();
    sync();
  }
  state.sync = sync;
  state.refresh = render;
  state.release = interaction.release;
  function resize() {
    if (state.destroyed || resizeFrame) return;
    const [width, height] = dimensions(state);
    if (width === state.width && height === state.height) return;
    resizeFrame = win.requestAnimationFrame(() => {
      resizeFrame = 0;
      render();
    });
  }
  const observer = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(resize) : null;
  observer?.observe(host);
  if (!page) host.addEventListener('scroll', resize, { passive: true });
  if (page) observer?.observe(doc.documentElement);
  const visibility =
    !page && typeof win.IntersectionObserver === 'function'
      ? new win.IntersectionObserver(
          (entries) => {
            if (state.destroyed) return;
            const entry = entries.at(-1);
            const visible = entry.isIntersecting && entry.intersectionRatio > 0;
            if (visible !== state.visible) {
              state.visible = visible;
              sync();
            }
          },
          { threshold: [0, Number.EPSILON] },
        )
      : null;
  visibility?.observe(host);
  const needsWindowResize = page || !observer;
  if (needsWindowResize) win.addEventListener('resize', resize);
  media.addEventListener('change', render);
  doc.addEventListener('visibilitychange', sync);

  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    interaction.dispose();
    lighting.cancel();
    motion.stop();
    win.cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    if (!page) host.removeEventListener('scroll', resize);
    visibility?.disconnect();
    if (needsWindowResize) win.removeEventListener('resize', resize);
    media.removeEventListener('change', render);
    doc.removeEventListener('visibilitychange', sync);
    svg.remove();
    state.strands = [];
    state.bulbs = [];
    if (retainedHost) releaseHost(host);
  }
  try {
    render();
  } catch (error) {
    destroy();
    throw error;
  }
  return {
    element: svg,
    get pattern() {
      return lighting.mode;
    },
    update(next = {}) {
      if (state.destroyed) return;
      const normalized = normalizeOptions({ ...state.options, ...next });
      const changed = changedKeys(state.options, normalized);
      if (!changed.length) return;
      state.options = normalized;
      const programChanged = programKeys.some((key) => changed.includes(key));
      if (programChanged) lighting.resetProgram();
      if (changed.some((key) => !liveKeys.has(key))) {
        render();
        return;
      }
      if (programChanged || changed.includes('animated')) lighting.apply();
      else if (changed.includes('speed')) lighting.updateSpeed();
      sync();
    },
    pause() {
      if (!state.destroyed) {
        state.options.paused = true;
        sync();
      }
    },
    play() {
      if (!state.destroyed) {
        state.options.paused = false;
        sync();
      }
    },
    destroy,
  };
}
