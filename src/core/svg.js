const NS = 'http://www.w3.org/2000/svg';
let serial = 0;
export function nextId(prefix) {
  // Separate bundled copies and copied registry components can coexist on the same page.
  const namespace = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${namespace}-${++serial}`;
}
export function svgNode(doc, tag, attrs = {}, parent) {
  const n = doc.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  parent?.append(n);
  return n;
}
