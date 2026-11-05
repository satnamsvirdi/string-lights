import { isInactive } from './state.js';
import { breezeForce, breezeWait } from './breeze.js';
import { PHYSICS_STEP, stepRope, ropeAttachment } from './physics.js';
import { clamp } from './utils.js';
import { pathFor } from './paths.js';
import { collideStrands } from './collisions.js';
import { followAttachment } from './attachments.js';
export function createMotion(state) {
  const { win, media } = state;
  let frame = 0,
    wakeTimer = 0,
    lastTime = 0,
    windTime = 0;
  function moving() {
    return (
      state.drag ||
      state.strands.some((strand) =>
        strand.rope?.active
          ? !strand.rope.sleeping
          : Math.abs(strand.offset) + Math.abs(strand.velocity) > 0.002,
      )
    );
  }
  function schedule() {
    if (frame || wakeTimer || isInactive(state) || media.matches) return;
    const breeze = state.options.breeze && state.options.wind && state.strands.length;
    let wait = Infinity;
    if (breeze)
      for (let i = 0; i < state.strands.length; i++) {
        wait = Math.min(wait, breezeWait(windTime, i));
        if (wait === 0) break;
      }
    if (moving() || wait === 0) frame = win.requestAnimationFrame(tick);
    else if (breeze)
      wakeTimer = win.setTimeout(() => {
        wakeTimer = 0;
        if (!isInactive(state)) frame = win.requestAnimationFrame(tick);
      }, wait * 1000);
    else lastTime = 0;
  }
  function tick(now) {
    frame = 0;
    if (state.destroyed || isInactive(state)) return;
    // A frame can observe a preference change before the media change event arrives.
    if (media.matches) {
      state.refresh();
      return;
    }
    const elapsed = lastTime ? (now - lastTime) / 1000 : 0;
    const dt = Math.min(elapsed, 0.1);
    lastTime = now;
    windTime += elapsed;
    if (state.options.collisions) collideStrands(state.strands, state.drag?.strand, dt);
    // Untouched strands use a small breeze sway; grabbed strands use local rope dynamics.
    for (const [i, strand] of state.strands.entries()) {
      const oldX = strand.anchorX || 0,
        oldY = strand.anchorY || 0;
      followAttachment(strand, state.strands);
      const anchorMoved = oldX !== (strand.anchorX || 0) || oldY !== (strand.anchorY || 0);
      if (anchorMoved || (strand.rope?.active && strand.anchorTransformed)) {
        strand.paths.forEach((p) =>
          p.setAttribute(
            'transform',
            strand.rope?.active ? '' : `translate(${strand.anchorX || 0} ${strand.anchorY || 0})`,
          ),
        );
        strand.anchorTransformed = !strand.rope?.active;
      }
      if (strand.rope?.active) {
        const held = state.drag?.strand === strand,
          wind = state.options.breeze ? breezeForce(windTime, i) * state.options.wind * 12 : 0;
        if (held || Math.abs(wind) > 0.01) {
          strand.rope.sleeping = false;
          strand.rope.quietTime = 0;
        }
        if (strand.rope.sleeping) {
          strand.changed = false;
          continue;
        }
        strand.rope.accumulator += dt;
        while (strand.rope.accumulator >= PHYSICS_STEP) {
          const joint = strand.points[0].attachment;
          const supportHeld = joint && state.drag?.strand === state.strands[joint.wire];
          stepRope(strand.rope, PHYSICS_STEP, held ? state.drag : null, wind, supportHeld);
          strand.rope.accumulator -= PHYSICS_STEP;
        }
        let speed = 0;
        for (const p of strand.rope.nodes)
          speed = Math.max(speed, Math.hypot(p.x - p.px, p.y - p.py) / PHYSICS_STEP);
        strand.rope.quietTime =
          !held && speed < 0.3 && Math.abs(wind) < 0.01 ? strand.rope.quietTime + dt : 0;
        if (strand.rope.quietTime > 1) strand.rope.sleeping = true;
        strand.changed = true;
        const d = pathFor(strand.rope.nodes);
        strand.paths.forEach((p) => p.setAttribute('d', d));
        continue;
      }
      const force = state.options.breeze ? breezeForce(windTime, i) * state.options.wind * 13 : 0;
      strand.velocity += (force - 5 * strand.offset - 3.6 * strand.velocity) * dt;
      strand.offset += strand.velocity * dt;
      strand.changed =
        anchorMoved || Math.abs(strand.offset) + Math.abs(strand.velocity) > 0.002 || strand.dirty;
      if (strand.changed) {
        const d = pathFor(strand.points, strand.offset);
        strand.paths.forEach((p) => p.setAttribute('d', d));
        strand.dirty = false;
      }
    }
    for (const { node, bulb } of state.bulbs) {
      const strand = state.strands[bulb.wire],
        shift = strand.offset * bulb.mobility;
      if (!strand.changed) continue;
      const point = strand.rope?.active
        ? ropeAttachment(strand.rope, bulb.segment, bulb.t)
        : {
            x: bulb.x + shift + (strand.anchorX || 0),
            y: bulb.y + shift * 0.12 + (strand.anchorY || 0),
          };
      let angle = bulb.angle;
      if (strand.rope?.active && bulb.angle) {
        const a = strand.rope.nodes[bulb.segment],
          b = strand.rope.nodes[bulb.segment + 1];
        const ra = strand.points[bulb.segment],
          rb = strand.points[bulb.segment + 1];
        angle +=
          ((Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(rb.y - ra.y, rb.x - ra.x)) * 180) /
          Math.PI;
      } else if (!strand.rope?.active)
        angle += clamp((-strand.offset * 0.7 - strand.velocity * 0.35) * bulb.mobility, -18, 18);
      node.setAttribute(
        'transform',
        `translate(${point.x} ${point.y}) rotate(${angle}) scale(${state.options.size})`,
      );
    }
    schedule();
  }
  function sync() {
    const pause = isInactive(state);
    if (pause || media.matches) {
      state.release();
      stop();
    } else if (!(state.options.breeze && state.options.wind) && !moving()) stop();
    else {
      if (wakeTimer && moving()) {
        advanceIdleTime();
        win.clearTimeout(wakeTimer);
        wakeTimer = 0;
      }
      schedule();
    }
  }

  function stop() {
    if (wakeTimer) advanceIdleTime();
    win.cancelAnimationFrame(frame);
    win.clearTimeout(wakeTimer);
    wakeTimer = 0;
    frame = 0;
    lastTime = 0;
  }
  function advanceIdleTime() {
    const now = win.performance.now();
    if (lastTime) windTime += Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
  }
  return {
    sync,
    stop,
    reset() {
      stop();
      windTime = 0;
    },
  };
}
