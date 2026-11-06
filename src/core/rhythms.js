// Controller-style channel programs. Timings are milliseconds at speed 1.
const programs = {
  alternate: [
    [0, 600],
    [1, 600],
  ],
  pairs: [
    [0, 600],
    [1, 600],
  ],
  double: [
    [0, 180],
    [-1, 180],
    [0, 180],
    [-1, 420],
    [1, 180],
    [-1, 180],
    [1, 180],
    [-1, 420],
  ],
  steps: /* @__PURE__ */ [0, 1, 2, 3].map((channel) => [channel, 320]),
  bounce: /* @__PURE__ */ [0, 1, 2, 3, 2, 1].map((channel) => [
    channel,
    channel === 0 || channel === 3 ? 420 : 300,
  ]),
};

/** Synchronized channels, with a short fade at each electrical switch. */
export function rhythmFrames(mode, index, dimBase) {
  const low = dimBase ? 0.02 : 0.04;
  if (mode === 'fade') {
    const channel = index % 4;
    const frames = [0, 1, 2, 3].map((step) => {
      const distance = Math.min((channel - step + 4) % 4, (step - channel + 4) % 4);
      return { offset: step / 4, opacity: distance === 0 ? 1 : distance === 1 ? 0.3 : low };
    });
    return { frames: [...frames, { ...frames[0], offset: 1 }], duration: 2400 };
  }
  const steps = programs[mode];
  if (!steps) return null;
  const channel =
    mode === 'pairs'
      ? Math.floor(index / 2) % 2
      : index % (mode === 'alternate' || mode === 'double' ? 2 : 4);
  const duration = steps.reduce((sum, [, time]) => sum + time, 0);
  const frames = [];
  let time = 0;
  steps.forEach(([active, hold], step) => {
    const opacity = active === channel ? 1 : low;
    const next = steps[(step + 1) % steps.length][0] === channel ? 1 : low;
    const edge = Math.min(35, hold * 0.12);
    frames.push(
      { offset: time / duration, opacity },
      { offset: (time + hold - edge) / duration, opacity },
      { offset: (time + hold) / duration, opacity: next },
    );
    time += hold;
  });
  return { frames, duration };
}
