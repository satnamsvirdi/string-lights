import { createRope, ropeAttachment } from './physics.js';

/** Activate at the displayed pose while preserving cable lengths. */
export function activateStrand(strand) {
  if (strand.rope?.active) return;
  const rope = createRope(strand.points);
  for (const [i, node] of rope.nodes.entries()) {
    const shift = (strand.offset || 0) * strand.points[i].mobility;
    node.x = node.px = node.homeX + shift + (strand.anchorX || 0);
    node.y = node.py = node.homeY + shift * 0.12 + (strand.anchorY || 0);
  }
  rope.active = true;
  strand.rope = rope;
}

/** Resolve a drop's tied endpoint from its parent's current local attachment. */
export function followAttachment(strand, strands) {
  const joint = strand.points[0].attachment;
  if (!joint) return;
  const parent = strands[joint.wire];
  const a = parent.points[joint.segment],
    b = parent.points[joint.segment + 1];
  const mobility = a.mobility + (b.mobility - a.mobility) * joint.t;
  const shift = parent.offset * mobility;
  const point = parent.rope?.active
    ? ropeAttachment(parent.rope, joint.segment, joint.t)
    : {
        x: a.x + (b.x - a.x) * joint.t + shift,
        y: a.y + (b.y - a.y) * joint.t + shift * 0.12,
      };
  if (parent.rope?.active) activateStrand(strand);
  strand.anchorX = point.x - strand.points[0].x;
  strand.anchorY = point.y - strand.points[0].y;
  if (strand.rope?.active) {
    const root = strand.rope.nodes[0];
    if (Math.hypot(root.homeX - point.x, root.homeY - point.y) > 1e-8) {
      strand.rope.sleeping = false;
      strand.rope.quietTime = 0;
    }
    root.x = root.homeX = point.x;
    root.y = root.homeY = point.y;
  }
}
