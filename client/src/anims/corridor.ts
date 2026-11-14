import {
  Cam,
  clamp,
  facing,
  fillet,
  fit,
  open,
  poly,
  prism,
  proj,
  rad,
  rings,
  unproj,
  type Vec2,
} from "./core/iso.ts";
import { tdone, tset, tval, tween, type Tween } from "./core/motion.ts";
import {
  disposer,
  mk,
  place,
  pointer,
  put,
  register,
  solid,
  type FigureMount,
  type Solid,
  type Tour,
} from "./core/stage.ts";
import { turn } from "./turn.ts";

const N = 5;
const PITCH = 30;
const DOOR_W = 20;
const DOOR_H = 34;
const WALL_H = 46;
const WALL_T = 5;
const MARGIN = 8;
const ROOM_D = 9;
const L = MARGIN * 2 + (N - 1) * PITCH + DOOR_W;
const REST = [0, 16, 0, 5, 0];
const AJAR = 1;
const FALL = [1, 0.18, 0.05, 0, 0];
const STEP = 45;
const OPEN_MAX = 100;

type Door = {
  i: number;
  x0: number;
  leaf: Solid;
  knob: SVGCircleElement;
  tw: Tween;
  drawn: number;
};

const LEAF = rings(0.4, -1.8, DOOR_W - 0.4, 0, 0.7, 0.35);

export const corridorTour: Tour = [[246, 183], [125, 122], [206, 163], null];

export const mountCorridor: FigureMount = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let swing = value;

  const C = Cam(45, 0.5, 1.9);
  fit(
    C,
    [
      [-6, -WALL_T - 14, -4],
      [L + 6, -WALL_T - 14, -4],
      [-6, 28, -4],
      [L + 6, 28, -4],
      [0, -WALL_T, WALL_H],
      [L, -WALL_T, WALL_H],
      [0, 0, WALL_H],
      [L, 0, WALL_H],
    ],
    200,
    166,
  );
  const P = proj(C);
  const front = facing(C);
  const g = mk("g", {}, svg);

  const [floor, floorCrease] = rings(-6, -WALL_T - 14, L + 6, 28, 4, 1.6);
  put(solid(g), prism(P, front, floor, floorCrease, -4, 0));
  const [wall, wallCrease] = rings(0, -WALL_T, L, 0, 2, 1);
  put(solid(g), prism(P, front, wall, wallCrease, 0, WALL_H));

  const doors: Door[] = [];
  for (let i = 0; i < N; i++) {
    const x0 = MARGIN + i * PITCH;
    const x1 = x0 + DOOR_W;
    const hole = fillet(
      [
        [x0, 0],
        [x0, DOOR_H],
        [x1, DOOR_H],
        [x1, 0],
      ],
      [0.1, 2.4, 2.4, 0.1],
    );
    const onFace = hole.map(([x, z]) => P(x, 0, z));
    const reveal = [
      P(x0, 0, 0),
      P(x0, 0, DOOR_H - 2),
      P(x0, -WALL_T, DOOR_H - 2),
      P(x0, -WALL_T, 0),
    ];
    const room = [
      P(x0, -WALL_T, 0),
      P(x0, -WALL_T - ROOM_D, 0),
      P(x1 - WALL_T - ROOM_D - 1, -WALL_T - ROOM_D, 0),
    ];
    mk("path", { d: poly(onFace), class: "fo" }, g);
    mk("path", { d: poly(reveal), class: "lo" }, g);
    mk("path", { d: open(room), class: "nf lo" }, g);
    mk("path", { d: open(onFace), class: "nf" }, g);
    doors.push({
      i,
      x0,
      leaf: solid(g),
      knob: mk("circle", { r: 1.1, class: "dot off" }, g),
      tw: tween(REST[i]),
      drawn: Number.NaN,
    });
  }

  const draw = (door: Door, degrees: number) => {
    if (degrees === door.drawn) return;
    door.drawn = degrees;
    const th = rad(degrees);
    const [ring, inner] = LEAF;
    const outer = turn(ring, th, door.x0, 0);
    const crease = turn(inner, th, door.x0, 0);
    put(door.leaf, prism(P, front, outer, crease, 0.4, DOOR_H - 0.6));
    const [knob] = turn(
      [{ u: DOOR_W - 3.2, v: 0.4, nu: 0, nv: 1 }],
      th,
      door.x0,
      0,
    );
    place(door.knob, P(knob.u, knob.v, DOOR_H * 0.47));
  };

  const loop = register(stage, (_dt, now) => {
    let moving = false;
    for (const door of doors) {
      draw(door, tval(door.tw, now));
      if (!tdone(door.tw, now)) moving = true;
    }
    return moving;
  });
  bag.add(loop.unregister);

  const light = (active: number) => {
    for (const door of doors) {
      door.leaf.sil.classList.toggle("hi", door.i === active);
    }
  };
  light(AJAR);

  const hit = ([sx, sy]: Vec2) => {
    const [x, y] = unproj(C, sx, sy, DOOR_H / 2);
    if (x < 0 || x > L || y < -60 || y > 30) return -1;
    return clamp(Math.round((x - MARGIN - DOOR_W / 2) / PITCH), 0, N - 1);
  };

  const target = (i: number, active: number) => {
    if (active < 0) return REST[i];
    const opened = swing * FALL[Math.abs(i - active)];
    return clamp(Math.max(REST[i], opened), 0, OPEN_MAX);
  };

  let act = -1;
  const setActive = (active: number, force = false) => {
    if (active === act && !force) return;
    const now = performance.now();
    const from = active >= 0 ? active : act;
    act = active;
    for (const door of doors) {
      const delay = from < 0 ? 0 : Math.abs(door.i - from) * STEP;
      tset(door.tw, target(door.i, active), now, delay);
    }
    light(active < 0 ? AJAR : active);
    read.textContent = active < 0 ? "rest" : `door ${active + 1} · 0`;
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
      swing = v;
      if (act >= 0) setActive(act, true);
    },
    destroy: bag.dispose,
  };
};
