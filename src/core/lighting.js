import { random } from './utils.js';
import { isInactive } from './state.js';
export function createLighting(state) {
  const { win, svg, media } = state;
  let animations = [],
    animationSpeed = state.options.speed;
  let patternIndex = 0,
    currentMode = state.options.mode,
    patternBag = [],
    patternTimer = 0,
    patternStarted = 0,
    patternRemaining = 0,
    patternRandom;
  function stopPatternClock() {
    if (!patternTimer) return;
    win.clearTimeout(patternTimer);
    patternTimer = 0;
    patternRemaining = Math.max(0, patternRemaining - (win.performance.now() - patternStarted));
  }
  function startPatternClock() {
    if (
      patternTimer ||
      state.destroyed ||
      isInactive(state) ||
      media.matches ||
      !state.options.animated ||
      state.options.patternOrder === 'fixed' ||
      state.options.patternSequence.length < 2
    )
      return;
    patternStarted = win.performance.now();
    patternTimer = win.setTimeout(() => {
      patternTimer = 0;
      if (state.destroyed) return;
      if (isInactive(state) || media.matches || !state.options.animated) {
        patternRemaining = 0;
        return;
      }
      const sequence = state.options.patternSequence;
      if (state.options.patternOrder === 'random' && sequence.length > 1) {
        if (!patternBag.length) patternBag = sequence.map((_, i) => i);
        const choices = patternBag.filter((i) => i !== patternIndex);
        patternIndex = choices[Math.floor(patternRandom() * choices.length)];
        patternBag.splice(patternBag.indexOf(patternIndex), 1);
      } else patternIndex = (patternIndex + 1) % sequence.length;
      patternRemaining = state.options.patternInterval * 1000;
      applyPattern(sequence[patternIndex]);
      startPatternClock();
    }, patternRemaining);
  }
  function applyPattern(mode) {
    const changed = svg.dataset.pattern !== mode;
    currentMode = mode;
    animationSpeed = state.options.speed;
    animations.forEach((a) => a.cancel());
    animations = [];
    for (const [index, { light, bulb }] of state.bulbs.entries()) {
      if (mode === 'static' || !state.options.animated || media.matches || !light.animate) continue;
      let frames,
        duration = 4000 / state.options.speed,
        delay = 0;
      const low = state.options.dimBase ? 0.02 : 0.2;
      if (mode === 'twinkle') {
        frames = [
          { opacity: 1 },
          { opacity: state.options.dimBase ? low : 0.45, offset: 0.35 },
          { opacity: 0.85, offset: 0.5 },
          { opacity: state.options.dimBase ? 0.03 : 0.6, offset: 0.7 },
          { opacity: 1 },
        ];
        duration = (3000 / state.options.speed) * (1 + bulb.phase * 0.6);
        delay = -bulb.phase * duration;
      } else if (mode === 'wave') {
        frames = [{ opacity: low }, { opacity: 1 }, { opacity: low }];
        delay = -index * 130;
      } else {
        frames = [{ opacity: 1 }, { opacity: state.options.dimBase ? 0.02 : 0.15 }, { opacity: 1 }];
        delay = mode === 'chase' ? (-bulb.group * duration) / 4 : 0;
      }
      const animation = light.animate(frames, {
        duration,
        delay,
        iterations: Infinity,
        easing: 'linear',
      });
      if (isInactive(state)) animation.pause();
      animations.push(animation);
    }
    svg.dataset.pattern = mode;
    if (changed)
      svg.dispatchEvent(new win.CustomEvent('stringpatternchange', { detail: { mode } }));
  }

  function resetProgram() {
    stopPatternClock();
    patternIndex = 0;
    patternRemaining = state.options.patternInterval * 1000;
    patternBag = state.options.patternSequence.map((_, i) => i).slice(1);
    currentMode =
      state.options.patternOrder === 'fixed'
        ? state.options.mode
        : state.options.patternSequence[0];
    patternRandom = random(state.options.seed + 941);
  }
  function cancel() {
    stopPatternClock();
    animations.forEach((a) => a.cancel());
    animations = [];
  }
  resetProgram();
  return {
    get mode() {
      return currentMode;
    },
    apply: () => applyPattern(currentMode),
    resetProgram,
    cancel,
    updateSpeed() {
      animations.forEach((a) => a.updatePlaybackRate(state.options.speed / animationSpeed));
    },
    sync() {
      animations.forEach((a) => (isInactive(state) ? a.pause() : a.play()));
      if (
        isInactive(state) ||
        media.matches ||
        !state.options.animated ||
        state.options.patternOrder === 'fixed'
      )
        stopPatternClock();
      else startPatternClock();
    },
  };
}
