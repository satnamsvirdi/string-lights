import { clamp } from './utils.js';
import { ropeAttachment, releaseRope } from './physics.js';
import { activateStrand, followAttachment } from './attachments.js';
import { tether } from './tether.js';
export function createInteraction(state) {
  const { svg, win, media } = state;
  function release(withMomentum = false) {
    if (!state.drag) return;
    if (withMomentum) {
      const age = (win.performance.now() - state.drag.motionTime) / 1000;
      const fade = Math.exp(-Math.max(0, age - 0.05) / 0.06);
      releaseRope(state.drag.strand.rope, state.drag, {
        x: state.drag.velocityX * fade,
        y: state.drag.velocityY * fade,
      });
    }
    const pointerId = state.drag.pointerId;
    state.drag = null;
    if (svg.hasPointerCapture(pointerId)) svg.releasePointerCapture(pointerId);
    svg.style.cursor = '';
  }
  function pointerPosition(event) {
    const matrix = svg.getScreenCTM();
    return matrix
      ? new win.DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
      : null;
  }
  function grab(event, strand, attachment) {
    if (
      state.drag ||
      !state.options.interactive ||
      state.options.paused ||
      media.matches ||
      event.button !== 0 ||
      !event.isPrimary
    )
      return;
    const p = pointerPosition(event);
    if (!p) return;
    // Start at the current breeze pose, but keep the original cable lengths and supports.
    activateStrand(strand);
    followAttachment(strand, state.strands);
    if (!attachment) {
      let closest = Infinity;
      strand.rope.nodes.slice(0, -1).forEach((a, segment) => {
        const b = strand.rope.nodes[segment + 1],
          dx = b.x - a.x,
          dy = b.y - a.y;
        const t = clamp(
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / Math.max(0.001, dx * dx + dy * dy),
          0,
          1,
        );
        const distance = Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
        if (distance < closest) {
          closest = distance;
          attachment = { segment, t };
        }
      });
    }
    const { segment, t } = attachment,
      nodes = strand.rope.nodes;
    if ((t < 0.01 && nodes[segment].pinned) || (t > 0.99 && nodes[segment + 1].pinned)) return;
    const base = ropeAttachment(strand.rope, segment, t);
    event.preventDefault();
    event.stopPropagation();
    strand.rope.active = true;
    strand.rope.sleeping = false;
    strand.rope.quietTime = 0;
    const now = win.performance.now();
    state.drag = {
      strand,
      segment,
      t,
      pointerId: event.pointerId,
      start: p,
      base,
      x: base.x,
      y: base.y,
      velocityX: 0,
      velocityY: 0,
      sampleTime: now,
      motionTime: now,
    };
    svg.setPointerCapture(event.pointerId);
    svg.style.cursor = 'grabbing';
    state.sync();
  }
  function move(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    const p = pointerPosition(event);
    if (!p) return;
    event.preventDefault();
    const previousX = state.drag.x,
      previousY = state.drag.y;
    state.drag.x = state.drag.base.x + p.x - state.drag.start.x;
    state.drag.y = state.drag.base.y + p.y - state.drag.start.y;
    const { nodes, lengths } = state.drag.strand.rope;
    const leftLength =
      lengths.slice(0, state.drag.segment).reduce((a, b) => a + b, 0) +
      lengths[state.drag.segment] * state.drag.t;
    const total = lengths.reduce((a, b) => a + b, 0);
    // A taut cable resists the cursor instead of stretching into an impossible curve.
    tether(state.drag, nodes[0], leftLength, nodes.at(-1), total - leftLength);
    // Leave a little slack at maximum reach so the held constraint never becomes singular.
    const homeA = nodes[state.drag.segment],
      homeB = nodes[state.drag.segment + 1];
    state.drag.x +=
      (homeA.homeX + (homeB.homeX - homeA.homeX) * state.drag.t - state.drag.x) * 0.002;
    state.drag.y +=
      (homeA.homeY + (homeB.homeY - homeA.homeY) * state.drag.t - state.drag.y) * 0.002;
    const now = win.performance.now(),
      dx = state.drag.x - previousX,
      dy = state.drag.y - previousY;
    if (Math.hypot(dx, dy) > 0.01) {
      const dt = clamp((now - state.drag.sampleTime) / 1000, 1 / 240, 0.1);
      const blend = 1 - Math.exp(-dt / 0.035),
        scale = Math.min(1, (600 * dt) / Math.hypot(dx, dy));
      state.drag.velocityX += ((dx * scale) / dt - state.drag.velocityX) * blend;
      state.drag.velocityY += ((dy * scale) / dt - state.drag.velocityY) * blend;
      state.drag.motionTime = now;
    }
    state.drag.sampleTime = now;
  }
  function endDrag(event) {
    if (state.drag && (event.pointerId === undefined || event.pointerId === state.drag.pointerId)) {
      if (event.type === 'pointerup') move(event);
      release(event.type === 'pointerup');
      state.sync();
    }
  }

  function down(event) {
    if (!state.options.interactive) return;
    const hit = event.target.closest('[data-string-bulb], [data-string-wire]');
    if (!hit || !svg.contains(hit)) return;
    if (hit.hasAttribute('data-string-bulb')) {
      const b = state.bulbs[Number(hit.dataset.stringBulb)].bulb;
      grab(event, state.strands[b.wire], b);
    } else grab(event, state.strands[Number(hit.dataset.stringWire)]);
  }
  const listeners = [
    ['pointerdown', down],
    ['pointermove', move],
    ['pointerup', endDrag],
    ['pointercancel', endDrag],
    ['lostpointercapture', endDrag],
  ];
  listeners.forEach(([name, fn]) => svg.addEventListener(name, fn));
  win.addEventListener('blur', endDrag);
  return {
    release,
    dispose() {
      release();
      listeners.forEach(([name, fn]) => svg.removeEventListener(name, fn));
      win.removeEventListener('blur', endDrag);
    },
  };
}
