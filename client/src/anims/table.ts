import {
  Cam,
  circ,
  clamp,
  facing,
  fit,
  prism,
  proj,
  rings,
  unproj,
  type Ring,
  type Vec2,
} from "./core/iso.ts";
import { tdone, tset, tval, tween, type Tween } from "./core/motion.ts";
import {
  disposer,
  mk,
  pointer,
  put,
  register,
  solid,
  type FigureMount,
  type Solid,
  type Tour,
} from "./core/stage.ts";
import { turn } from "./turn.ts";

const N = 6;
const TABLE_R = 30;
const TOP_Z0 = 29;
const TOP_Z1 = 32;
const D0 = TABLE_R + 3;
const SEAT = 16;
const HALF = 8;
const SEAT_Z0 = 13;
const SEAT_Z1 = 17;
const BACK_Z1 = 34;
const BACK_T = 3;
const REST = [9, 1, 3, 0, 2, 4];
const YOU = 0;
const FALL = [1, 0.3, 0.08, 0];
const STEP = 45;
const OUT_MAX = 20;
const ARC = (2 * Math.PI) / N;
const FAR = D0 + OUT_MAX + SEAT;

type Part = [[Ring, Ring], number, number];

type Chair = {
  i: number;
  th: number;
  parts: Solid[];
  tw: Tween;
  drawn: number;
};

const PARTS: Part[] = [
  [rings(4, -3, 12, 3, 2, 0.8), 0, SEAT_Z0],
  [rings(0, -HALF, SEAT, HALF, 3, 1.2), SEAT_Z0, SEAT_Z1],
  [rings(SEAT - BACK_T, -HALF, SEAT, HALF, 1.4, 0.6), SEAT_Z1, BACK_Z1],
];

const apart = (i: number, a: number) =>
  Math.min(Math.abs(i - a), N - Math.abs(i - a));

const depth = (i: number) => Math.cos(i * ARC) + Math.sin(i * ARC);

export const tableTour: Tour = [[175, 213], [133, 133], [300, 153], null];

export const mountTable: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let out = value;

  const C = Cam(45, 0.5, 2.3);
  fit(
    C,
    [
      [-FAR, 0, 0],
      [FAR, 0, 0],
      [0, -FAR, 0],
      [0, FAR, 0],
      [-FAR * 0.7, -FAR * 0.7, BACK_Z1],
      [FAR * 0.7, FAR * 0.7, 0],
    ],
    200,
    166,
  );
  const P = proj(C);
  const front = facing(C);
  const g = mk("g", {}, svg);
  const chairs: Chair[] = [];

  const addChair = (i: number) => {
    const group = mk("g", {}, g);
    chairs.push({
      i,
      th: i * ARC,
      parts: PARTS.map(() => solid(group)),
      tw: tween(REST[i]),
      drawn: Number.NaN,
    });
  };

  const addDisc = (r: number, b: number, n: number, z0: number, z1: number) => {
    put(solid(g), prism(P, front, circ(r, n), circ(r - b, n), z0, z1));
  };

  const order = Array.from({ length: N }, (_, i) => i).sort(
    (a, b) => depth(a) - depth(b),
  );
  order.filter((i) => depth(i) < 0).forEach(addChair);
  addDisc(14, 1.2, 24, 0, 3);
  addDisc(4, 0.8, 16, 3, TOP_Z0);
  addDisc(TABLE_R, 2, 48, TOP_Z0, TOP_Z1);
  order.filter((i) => depth(i) >= 0).forEach(addChair);

  const draw = (chair: Chair, d: number) => {
    if (d === chair.drawn) return;
    chair.drawn = d;
    const cx = d * Math.cos(chair.th);
    const cy = d * Math.sin(chair.th);
    PARTS.forEach(([[ring, inner], z0, z1], k) => {
      const outer = turn(ring, chair.th, cx, cy);
      const crease = turn(inner, chair.th, cx, cy);
      put(chair.parts[k], prism(P, front, outer, crease, z0, z1));
    });
  };

  const loop = register(stage, (_dt, now) => {
    let moving = false;
    for (const chair of chairs) {
      draw(chair, D0 + tval(chair.tw, now));
      if (!tdone(chair.tw, now)) moving = true;
    }
    return moving;
  });
  bag.add(loop.unregister);

  const light = (active: number) => {
    for (const chair of chairs) {
      for (const part of chair.parts) {
        part.sil.classList.toggle("hi", chair.i === active);
      }
    }
  };
  light(YOU);

  const hit = ([sx, sy]: Vec2) => {
    const [x, y] = unproj(C, sx, sy, SEAT_Z1);
    const r = Math.hypot(x, y);
    if (r < TABLE_R * 0.55 || r > FAR + 20) return -1;
    return ((Math.round(Math.atan2(y, x) / ARC) % N) + N) % N;
  };

  const target = (i: number, active: number) => {
    if (active < 0) return REST[i];
    return clamp(Math.max(REST[i], out * FALL[apart(i, active)]), 0, OUT_MAX);
  };

  let act = -1;
  const setActive = (active: number, force = false) => {
    if (active === act && !force) return;
    const now = performance.now();
    const from = active >= 0 ? active : act;
    act = active;
    for (const chair of chairs) {
      const delay = from < 0 ? 0 : apart(chair.i, from) * STEP;
      tset(chair.tw, target(chair.i, active), now, delay);
    }
    light(active < 0 ? YOU : active);
    read.textContent = active < 0 ? "rest" : `seat ${active + 1} · 0`;
    loop.wake();
  };

  bag.add(
    pointer(stage, {
      move: (p) => setActive(hit(p)),
      leave: () => setActive(-1),
    }),
  );
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      out = v;
      if (act >= 0) setActive(act, true);
    },
    destroy: bag.dispose,
  };
};
