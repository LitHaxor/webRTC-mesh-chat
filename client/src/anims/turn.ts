import type { Ring } from "./core/iso.ts";

export const turn = (ring: Ring, th: number, cx: number, cy: number): Ring => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return ring.map((q) => ({
    u: cx + q.u * c - q.v * s,
    v: cy + q.u * s + q.v * c,
    nu: q.nu * c - q.nv * s,
    nv: q.nu * s + q.nv * c,
  }));
};
