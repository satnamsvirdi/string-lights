/** An occasional gust, separated by quiet air. Time is in seconds. */
export function breezeForce(time, strand = 0) {
  const t = (((time - strand * 0.19) % 19) + 19) % 19;
  if (t > 6) return 0;
  return Math.sin((Math.PI * t) / 6) ** 2 * (Math.sin(t * 1.2) + 0.35 * Math.sin(t * 2.3));
}
/** Seconds until this strand's next active gust; zero while a gust is active. */
export function breezeWait(time, strand = 0) {
  const phase = (((time - strand * 0.19) % 19) + 19) % 19;
  return phase <= 6 ? 0 : 19 - phase;
}
