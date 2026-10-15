/**
 * Sign language pose library (data only, no dependencies).
 *
 * Rotation convention (degrees, CSS 3D):
 *   uf  upper-arm forward  (rotateX, + = swing forward / up in front of body)
 *   uo  upper-arm out      (distance from body; applied per side)
 *   ut  upper-arm twist    (rotateY)
 *   ef  forearm bend       (rotateX, + = elbow bends, hand rises)
 *   et  forearm twist      (rotateY)
 *   hx/hy/hz  hand rotation
 *   handshape  key into HANDSHAPES
 *
 * Everything unspecified falls back to NEUTRAL, so a frame only lists
 * what actually moves.  Frames are played in order; `repeats` replays them.
 */

/** Finger curl 0 (straight) … 1 (fully curled) + spread of the four fingers. */
export const HANDSHAPES = {
  rest: { thumb: 0.45, index: 0.3, middle: 0.3, ring: 0.3, pinky: 0.3, spread: 0.1 },
  flat: { thumb: 0.75, index: 0, middle: 0, ring: 0, pinky: 0, spread: 0.05 },
  fist: { thumb: 0.9, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0 },
  open5: { thumb: 0.1, index: 0, middle: 0, ring: 0, pinky: 0, spread: 0.5 },
  point: { thumb: 1, index: 0, middle: 1, ring: 1, pinky: 1, spread: 0 },
  v: { thumb: 1, index: 0, middle: 0, ring: 1, pinky: 1, spread: 0.3 },
  w: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1, spread: 0.25 },
  c: { thumb: 0.3, index: 0.5, middle: 0.5, ring: 0.5, pinky: 0.5, spread: 0.15 },
  o: { thumb: 0.2, index: 0.5, middle: 0.65, ring: 0.8, pinky: 0.9, spread: 0 },
  pinch: { thumb: 0.25, index: 0.45, middle: 0.65, ring: 0.85, pinky: 0.95, spread: 0 },
  bent: { thumb: 0.6, index: 0.6, middle: 0.6, ring: 0.6, pinky: 0.6, spread: 0.1 },
  claw: { thumb: 0.6, index: 0.75, middle: 0.75, ring: 0.75, pinky: 0.75, spread: 0.25 },
  pinky: { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 0, spread: 0.05 },
  l: { thumb: 0, index: 0, middle: 1, ring: 1, pinky: 1, spread: 0.2 },
  y: { thumb: 0.1, index: 1, middle: 1, ring: 1, pinky: 0, spread: 0.25 },
  ily: { thumb: 0.1, index: 0, middle: 1, ring: 1, pinky: 0, spread: 0.35 },
  wshape: { thumb: 1, index: 0, middle: 0, ring: 0, pinky: 1, spread: 0.2 },
  ohand: { thumb: 0.2, index: 0.45, middle: 0.6, ring: 0.8, pinky: 0.9, spread: 0 },
  cup: { thumb: 0.35, index: 0.4, middle: 0.45, ring: 0.5, pinky: 0.55, spread: 0.3 },
  thumbup: { thumb: 0.05, index: 1, middle: 1, ring: 1, pinky: 1, spread: 0 },
  hooked: { thumb: 0.75, index: 0.65, middle: 0.55, ring: 1, pinky: 1, spread: 0.1 },
};

export const NEUTRAL = {
  lean: [0, 0, 0],
  head: [0, 0, 0],
  neck: [0, 0, 0],
  R: { uf: 4, uo: 8, ut: 0, ef: 12, et: 0, hx: 0, hy: 0, hz: 0, handshape: "rest" },
  L: { uf: 4, uo: 8, ut: 0, ef: 12, et: 0, hx: 0, hy: 0, hz: 0, handshape: "rest" },
};

/** Compact arm builder: S(forward, out, elbow, shape, extra) */
const S = (uf = 4, uo = 8, ef = 12, handshape = "rest", extra = {}) => ({
  uf,
  uo,
  ef,
  handshape,
  ...extra,
});

/**
 * Signs are the *shape of the motion*, not literal ASL grammar — a friendly,
 * recognisable approximation intended as a visual aid alongside captions.
 */
export const SIGNS = {
  HELLO: { repeats: 2, frames: [
    { R: S(14, 34, 95, "flat", { hy: 16 }), head: [0, 0, -3] },
    { R: S(14, 34, 95, "flat", { hy: -16 }), head: [0, 0, 3] },
  ] },
  HI: { repeats: 3, frames: [
    { R: S(14, 34, 95, "flat", { hy: 18 }) },
    { R: S(14, 34, 95, "flat", { hy: -18 }) },
  ] },
  BYE: { repeats: 3, frames: [
    { R: S(20, 36, 88, "open5", { hy: 18 }) },
    { R: S(20, 36, 88, "open5", { hy: -18 }) },
  ] },
  GOODBYE: { repeats: 2, frames: [
    { R: S(20, 36, 88, "open5", { hy: 18 }) },
    { R: S(20, 36, 88, "open5", { hy: -18 }) },
  ] },
  MORNING: { frames: [
    { R: S(14, 10, 88, "flat"), head: [2, 0, 0] },
    { R: S(52, 16, 96, "flat"), head: [-2, 0, 0] },
  ] },
  AFTERNOON: { frames: [
    { R: S(30, 24, 68, "flat"), head: [-3, 0, 0] },
  ] },
  EVENING: { frames: [
    { R: S(18, 14, 105, "flat"), head: [4, 0, 0] },
  ] },
  NIGHT: { frames: [
    { R: S(46, 16, 92, "bent") },
    { R: S(34, 16, 104, "bent") },
  ] },
  GOOD: { frames: [
    { R: S(18, 12, 96, "flat"), head: [-2, 0, 0] },
    { R: S(30, 12, 58, "flat"), head: [0, 0, 0] },
  ] },
  THANK: { frames: [
    { R: S(18, 10, 98, "flat") },
    { R: S(40, 12, 58, "flat") },
  ] },
  THANKS: { frames: [
    { R: S(18, 10, 98, "flat") },
    { R: S(40, 12, 58, "flat") },
  ] },
  PLEASE: { frames: [
    { R: S(10, 6, 58, "flat") },
    { R: S(16, 12, 52, "flat") },
  ] },
  SORRY: { frames: [
    { R: S(10, 8, 62, "fist") },
    { R: S(16, 14, 56, "fist") },
  ] },
  YES: { repeats: 2, frames: [
    { R: S(14, 10, 72, "fist", { hx: 0 }) },
    { R: S(14, 10, 72, "fist", { hx: 24 }) },
  ] },
  NO: { repeats: 2, frames: [
    { R: S(18, 12, 86, "bent"), head: [0, 10, 0] },
    { R: S(18, 12, 86, "bent"), head: [0, -10, 0] },
  ] },
  YOU: { frames: [{ R: S(56, 8, 22, "point") }] },
  ME: { frames: [{ R: S(18, 4, 74, "point") }] },
  I: { frames: [{ R: S(18, 4, 74, "point") }] },
  WE: { frames: [
    { R: S(18, 4, 74, "point") },
    { R: S(50, 8, 40, "point") },
  ] },
  MY: { frames: [{ R: S(16, 6, 78, "flat") }] },
  YOUR: { frames: [{ R: S(54, 8, 24, "flat") }] },
  NAME: { frames: [
    { R: S(24, 12, 70, "v"), L: S(20, 12, 60, "flat") },
    { R: S(24, 12, 58, "v"), L: S(20, 12, 60, "flat") },
  ] },
  HOW: { frames: [
    { R: S(40, 20, 54, "bent"), L: S(40, 20, 54, "bent") },
    { R: S(30, 20, 66, "bent"), L: S(30, 20, 66, "bent") },
  ] },
  WHAT: { repeats: 2, frames: [
    { R: S(40, 25, 44, "open5", { hy: 12 }), L: S(40, 25, 44, "open5", { hy: 12 }) },
    { R: S(40, 25, 44, "open5", { hy: -12 }), L: S(40, 25, 44, "open5", { hy: -12 }) },
  ] },
  WHERE: { repeats: 2, frames: [
    { R: S(34, 15, 82, "point", { hz: 14 }) },
    { R: S(34, 15, 80, "point", { hz: -14 }) },
  ] },
  WHEN: { frames: [{ R: S(24, 12, 88, "point") }] },
  WHY: { frames: [
    { R: S(18, 10, 102, "open5") },
    { R: S(42, 12, 68, "open5") },
  ] },
  WHO: { frames: [
    { R: S(22, 12, 96, "point", { hy: 20 }) },
    { R: S(22, 10, 96, "point", { hy: -20 }) },
  ] },
  WHICH: { frames: [
    { R: S(30, 16, 70, "l"), L: S(30, 16, 70, "l") },
    { R: S(46, 18, 54, "l"), L: S(30, 16, 70, "l") },
  ] },
  HELP: { frames: [
    { R: S(24, 8, 70, "fist"), L: S(30, 14, 60, "flat") },
    { R: S(36, 8, 70, "fist"), L: S(42, 14, 60, "flat") },
  ] },
  LOVE: { frames: [{ R: S(12, 2, 70, "fist"), L: S(12, 2, 70, "fist") }] },
  FRIEND: { frames: [
    { R: S(20, 6, 76, "point"), L: S(20, 6, 76, "point") },
    { R: S(24, 6, 68, "point"), L: S(24, 6, 68, "point") },
  ] },
  FAMILY: { repeats: 2, frames: [
    { R: S(30, 22, 58, "pinch", { hy: 10 }), L: S(30, 22, 58, "pinch", { hy: 10 }) },
    { R: S(34, 30, 52, "pinch", { hy: -10 }), L: S(34, 30, 52, "pinch", { hy: -10 }) },
  ] },
  WATER: { repeats: 2, frames: [
    { R: S(18, 8, 100, "w") },
    { R: S(18, 8, 90, "w") },
  ] },
  FOOD: { repeats: 2, frames: [
    { R: S(18, 6, 100, "pinch") },
    { R: S(18, 6, 92, "pinch") },
  ] },
  EAT: { repeats: 2, frames: [
    { R: S(18, 6, 100, "pinch") },
    { R: S(18, 6, 92, "pinch") },
  ] },
  DRINK: { repeats: 2, frames: [
    { R: S(18, 6, 100, "c") },
    { R: S(18, 6, 92, "c") },
  ] },
  MORE: { repeats: 2, frames: [
    { R: S(30, 10, 60, "pinch"), L: S(30, 10, 60, "pinch") },
    { R: S(30, 10, 50, "pinch"), L: S(30, 10, 50, "pinch") },
  ] },
  STOP: { frames: [
    { R: S(48, 6, 50, "flat"), L: S(30, 12, 70, "flat") },
    { R: S(30, 8, 66, "flat"), L: S(30, 12, 70, "flat") },
  ] },
  WAIT: { repeats: 2, frames: [
    { R: S(40, 22, 46, "open5", { hx: 0 }), L: S(40, 22, 46, "open5", { hx: 0 }) },
    { R: S(40, 22, 46, "claw", { hx: 10 }), L: S(40, 22, 46, "claw", { hx: 10 }) },
  ] },
  HAPPY: { frames: [
    { R: S(14, 8, 60, "flat"), L: S(14, 8, 60, "flat"), head: [-3, 0, 0] },
    { R: S(30, 8, 66, "flat"), L: S(30, 8, 66, "flat"), head: [-5, 0, 0] },
  ] },
  SAD: { frames: [
    { R: S(20, 10, 96, "flat"), L: S(20, 10, 96, "flat"), head: [10, 0, 0] },
    { R: S(10, 10, 70, "flat"), L: S(10, 10, 70, "flat"), head: [18, 0, 0] },
  ] },
  ANGRY: { frames: [
    { R: S(22, 12, 78, "claw"), L: S(22, 12, 78, "claw"), head: [4, 0, 0] },
    { R: S(26, 14, 82, "claw"), L: S(26, 14, 82, "claw"), head: [2, 0, 0] },
  ] },
  SICK: { frames: [
    { R: S(20, 8, 100, "claw"), L: S(24, 8, 66, "claw") },
    { R: S(20, 8, 100, "claw"), L: S(40, 8, 56, "claw") },
  ] },
  HURT: { repeats: 2, frames: [
    { R: S(28, 14, 78, "point"), L: S(28, 14, 78, "point") },
    { R: S(34, 8, 66, "point"), L: S(34, 8, 66, "point") },
  ] },
  HOME: { frames: [
    { R: S(18, 8, 100, "pinch") },
    { R: S(14, 8, 66, "pinch") },
  ] },
  SCHOOL: { frames: [
    { R: S(34, 16, 58, "flat"), L: S(34, 16, 58, "flat") },
    { R: S(34, 8, 62, "flat"), L: S(34, 8, 62, "flat") },
  ] },
  WORK: { repeats: 2, frames: [
    { R: S(26, 8, 74, "fist"), L: S(24, 14, 74, "flat") },
    { R: S(18, 8, 86, "fist"), L: S(24, 14, 74, "flat") },
  ] },
  TIME: { repeats: 2, frames: [
    { R: S(26, 8, 74, "point"), L: S(24, 14, 74, "flat") },
    { R: S(18, 8, 86, "point"), L: S(24, 14, 74, "flat") },
  ] },
  DAY: { frames: [
    { R: S(120, 20, 24, "flat") },
    { R: S(80, 22, 40, "flat") },
  ] },
  TODAY: { frames: [
    { R: S(22, 12, 62, "flat"), L: S(22, 12, 62, "flat") },
    { R: S(14, 12, 52, "flat"), L: S(14, 12, 52, "flat") },
  ] },
  TOMORROW: { frames: [
    { R: S(18, 10, 96, "thumbup", { hy: -22 }) },
    { R: S(18, 10, 96, "thumbup", { hy: -34 }) },
  ] },
  YESTERDAY: { frames: [
    { R: S(18, 10, 96, "thumbup", { hy: 22 }) },
    { R: S(18, 10, 96, "thumbup", { hy: 34 }) },
  ] },
  MONEY: { repeats: 2, frames: [
    { R: S(26, 8, 66, "pinch"), L: S(24, 12, 70, "flat") },
    { R: S(20, 8, 78, "pinch"), L: S(24, 12, 70, "flat") },
  ] },
  PHONE: { frames: [
    { R: S(18, 20, 104, "y") },
    { R: S(18, 20, 100, "y") },
  ] },
  CAR: { repeats: 2, frames: [
    { R: S(36, 18, 54, "fist", { hy: 12 }), L: S(36, 18, 54, "fist", { hy: -12 }) },
    { R: S(36, 18, 54, "fist", { hy: -12 }), L: S(36, 18, 54, "fist", { hy: 12 }) },
  ] },
  BOOK: { frames: [
    { R: S(28, 12, 60, "flat"), L: S(28, 12, 60, "flat") },
    { R: S(28, 26, 58, "flat"), L: S(28, 26, 58, "flat") },
  ] },
  LEARN: { frames: [
    { R: S(30, 10, 60, "flat"), L: S(26, 14, 66, "flat") },
    { R: S(20, 12, 100, "flat"), L: S(26, 14, 66, "flat") },
  ] },
  UNDERSTAND: { frames: [
    { R: S(20, 12, 94, "point") },
    { R: S(22, 12, 106, "point") },
  ] },
  KNOW: { repeats: 2, frames: [
    { R: S(14, 8, 106, "flat") },
    { R: S(18, 8, 96, "flat") },
  ] },
  THINK: { frames: [{ R: S(14, 8, 106, "point") }] },
  REMEMBER: { frames: [
    { R: S(18, 10, 92, "flat", { hx: 0 }) },
    { R: S(18, 10, 96, "flat", { hx: 40 }) },
  ] },
  FORGET: { frames: [
    { R: S(18, 10, 96, "flat", { hx: 0 }) },
    { R: S(18, 10, 88, "flat", { hx: -40 }) },
  ] },
  WANT: { frames: [
    { R: S(46, 14, 44, "claw"), L: S(46, 14, 44, "claw") },
    { R: S(24, 14, 72, "claw"), L: S(24, 14, 72, "claw") },
  ] },
  NEED: { frames: [{ R: S(24, 8, 58, "point") }] },
  CAN: { frames: [
    { R: S(22, 8, 54, "fist"), L: S(22, 8, 54, "fist") },
    { R: S(14, 8, 58, "fist"), L: S(14, 8, 58, "fist") },
  ] },
  MAYBE: { frames: [
    { R: S(24, 10, 62, "flat"), L: S(36, 14, 48, "flat") },
    { R: S(36, 14, 48, "flat"), L: S(24, 10, 62, "flat") },
  ] },
  AGAIN: { repeats: 2, frames: [
    { R: S(24, 10, 62, "flat"), L: S(24, 10, 62, "flat") },
    { R: S(24, 10, 50, "flat"), L: S(24, 10, 50, "flat") },
  ] },
  FINISH: { frames: [
    { R: S(30, 10, 56, "flat", { hx: 0 }), L: S(30, 10, 56, "flat", { hx: 0 }) },
    { R: S(30, 10, 56, "flat", { hx: 55 }), L: S(30, 10, 56, "flat", { hx: 55 }) },
  ] },
  START: { frames: [
    { R: S(30, 8, 56, "point", { hy: 0 }), L: S(30, 8, 56, "point", { hy: 0 }) },
    { R: S(30, 8, 56, "point", { hy: 50 }), L: S(30, 8, 56, "point", { hy: -50 }) },
  ] },
  OPEN: { frames: [
    { R: S(30, 6, 60, "flat"), L: S(30, 6, 60, "flat") },
    { R: S(30, 30, 60, "flat"), L: S(30, 30, 60, "flat") },
  ] },
  CLOSE: { frames: [
    { R: S(30, 30, 60, "flat"), L: S(30, 30, 60, "flat") },
    { R: S(30, 6, 60, "flat"), L: S(30, 6, 60, "flat") },
  ] },
  BIG: { frames: [
    { R: S(44, 30, 36, "open5"), L: S(44, 30, 36, "open5") },
    { R: S(44, 46, 34, "open5"), L: S(44, 46, 34, "open5") },
  ] },
  SMALL: { frames: [
    { R: S(34, 10, 52, "pinch"), L: S(34, 10, 52, "pinch") },
    { R: S(34, 4, 56, "pinch"), L: S(34, 4, 52, "pinch") },
  ] },
  FAST: { frames: [
    { R: S(30, 12, 50, "point") },
    { R: S(30, 12, 50, "l") },
  ] },
  SLOW: { frames: [
    { R: S(24, 10, 56, "flat"), L: S(24, 12, 62, "flat") },
    { R: S(28, 10, 44, "flat"), L: S(24, 12, 60, "flat") },
  ] },
  HOT: { frames: [
    { R: S(18, 8, 100, "claw") },
    { R: S(36, 20, 68, "claw") },
  ] },
  COLD: { repeats: 2, frames: [
    { R: S(20, 12, 66, "fist"), L: S(20, 12, 66, "fist") },
    { R: S(20, 20, 66, "fist"), L: S(20, 20, 66, "fist") },
  ] },
  BAD: { frames: [
    { R: S(18, 10, 96, "flat", { hx: 0 }) },
    { R: S(24, 10, 96, "flat", { hx: 70 }) },
  ] },
  OK: { frames: [
    { R: S(30, 12, 60, "o") },
    { R: S(30, 12, 56, "o") },
  ] },
  FINE: { frames: [
    { R: S(28, 12, 56, "flat"), L: S(28, 12, 56, "flat") },
  ] },
  NICE: { frames: [
    { R: S(40, 12, 50, "flat"), L: S(24, 12, 60, "flat") },
    { R: S(30, 12, 56, "flat"), L: S(30, 12, 56, "flat") },
  ] },
  MEET: { frames: [
    { R: S(40, 14, 50, "flat"), L: S(40, 14, 50, "flat") },
    { R: S(34, 6, 58, "flat"), L: S(34, 6, 58, "flat") },
  ] },
  WELCOME: { frames: [
    { R: S(24, 26, 54, "open5"), L: S(24, 6, 58, "open5") },
    { R: S(22, 12, 62, "open5"), L: S(22, 10, 60, "open5") },
  ] },
  BEAUTIFUL: { repeats: 2, frames: [
    { R: S(20, 10, 92, "open5", { hy: 20 }) },
    { R: S(16, 8, 96, "open5", { hy: -20 }) },
  ] },
  ALL: { repeats: 2, frames: [
    { R: S(40, 20, 48, "open5", { hy: 0 }), L: S(40, 20, 48, "open5", { hy: 0 }) },
    { R: S(34, 34, 44, "open5", { hy: 0 }), L: S(34, 34, 44, "open5", { hy: 0 }) },
  ] },
  NOTHING: { frames: [
    { R: S(40, 22, 44, "open5", { hx: 0 }), L: S(40, 22, 44, "open5", { hx: 0 }) },
    { R: S(40, 22, 44, "open5", { hx: 60 }), L: S(40, 22, 44, "open5", { hx: 60 }) },
  ] },
  EVERYTHING: { repeats: 2, frames: [
    { R: S(34, 16, 54, "open5", { hy: 8 }), L: S(34, 16, 54, "open5", { hy: 8 }) },
    { R: S(34, 26, 50, "open5", { hy: -8 }), L: S(34, 26, 50, "open5", { hy: -8 }) },
  ] },
  MANY: { frames: [
    { R: S(34, 16, 50, "open5"), L: S(34, 16, 50, "open5") },
    { R: S(34, 34, 48, "open5"), L: S(34, 34, 48, "open5") },
  ] },
  FEW: { frames: [{ R: S(34, 12, 54, "pinch") }] },
  LISTEN: { frames: [
    { R: S(16, 22, 100, "cup") },
    { R: S(16, 22, 96, "cup") },
  ] },
  SEE: { frames: [
    { R: S(18, 14, 96, "v") },
    { R: S(40, 14, 62, "v") },
  ] },
  LOOK: { frames: [
    { R: S(18, 14, 96, "v") },
    { R: S(44, 14, 58, "v") },
  ] },
  TALK: { repeats: 2, frames: [
    { R: S(20, 10, 92, "bent", { hx: 0 }) },
    { R: S(20, 10, 92, "bent", { hx: 20 }) },
  ] },
  SAY: { frames: [
    { R: S(20, 10, 92, "bent") },
    { R: S(34, 10, 66, "bent") },
  ] },
  TELL: { frames: [
    { R: S(20, 10, 92, "bent") },
    { R: S(36, 10, 62, "bent") },
  ] },
  ASK: { frames: [
    { R: S(34, 12, 58, "open5") },
    { R: S(44, 14, 48, "open5") },
  ] },
  ANSWER: { frames: [
    { R: S(20, 12, 92, "point") },
    { R: S(30, 12, 74, "point") },
  ] },
  TRY: { repeats: 2, frames: [
    { R: S(26, 10, 66, "fist", { hy: 0 }) },
    { R: S(26, 10, 66, "fist", { hy: 40 }) },
  ] },
  PRACTICE: { repeats: 2, frames: [
    { R: S(26, 10, 66, "fist", { hy: 0 }), L: S(26, 10, 66, "fist", { hy: 0 }) },
    { R: S(26, 10, 66, "fist", { hy: 40 }), L: S(26, 10, 66, "fist", { hy: -40 }) },
  ] },
  WELCOME2: { frames: [{ R: S(30, 26, 54, "open5") }] },
  PLEASE2: { frames: [{ R: S(12, 8, 58, "flat") }] },
};

/** Simplified ASL fingerspelling: shape + a hand tilt that hints at the letter. */
export const LETTERS = {
  A: { shape: "fist" },
  B: { shape: "flat" },
  C: { shape: "c" },
  D: { shape: "point", hy: 0 },
  E: { shape: "bent" },
  F: { shape: "pinch" },
  G: { shape: "point", hy: 55 },
  H: { shape: "v", hy: 55 },
  I: { shape: "pinky" },
  J: { shape: "pinky", hy: 40 },
  K: { shape: "v", hy: 20 },
  L: { shape: "l", hy: 0 },
  M: { shape: "fist", hy: 25 },
  N: { shape: "fist", hy: 25 },
  O: { shape: "o" },
  P: { shape: "point", hy: 40 },
  Q: { shape: "point", hy: 60 },
  R: { shape: "v", hy: 15 },
  S: { shape: "fist", hy: 10 },
  T: { shape: "fist", hy: 20 },
  U: { shape: "v" },
  V: { shape: "v" },
  W: { shape: "w" },
  X: { shape: "point", hx: 40 },
  Y: { shape: "y" },
  Z: { shape: "point", hy: 30 },
};

const FILLER = new Set([
  "THE", "A", "AN", "IS", "ARE", "AM", "WAS", "WERE", "BE", "BEEN", "BEING",
  "TO", "OF", "AND", "OR", "BUT", "IN", "ON", "AT", "IT", "ITS", "THIS",
  "THAT", "DO", "DOES", "DID", "SO", "AS", "IF", "THEN", "THAN", "BY", "FOR",
]);

/** Merge a partial frame onto NEUTRAL. */
export function mergePose(partial = {}) {
  return {
    lean: partial.lean || NEUTRAL.lean,
    head: partial.head || NEUTRAL.head,
    neck: partial.neck || NEUTRAL.neck,
    R: { ...NEUTRAL.R, ...(partial.R || {}) },
    L: { ...NEUTRAL.L, ...(partial.L || {}) },
  };
}

/** Build a single-frame pose directly from a handshape (used for fingerspelling). */
export function letterPose(letter, side = "R") {
  const def = LETTERS[letter] || LETTERS.A;
  const arm = { uf: 40, uo: 12, ef: 58, handshape: def.shape, hy: def.hy || 0, hx: def.hx || 0 };
  return mergePose({ [side]: arm });
}

/**
 * Turn raw text into an ordered list of playable tokens.
 * Recognised words become signs; unknown words are fingerspelled.
 */
export function resolveTokens(text) {
  const raw = (text || "").trim();
  if (!raw) return [];
  const words = raw
    .toUpperCase()
    .replace(/[^A-Z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const tokens = [];
  for (const word of words) {
    const key = word.replace(/[^A-Z0-9]/g, "");
    if (!key) continue;
    if (FILLER.has(key)) continue;
    if (SIGNS[key]) {
      tokens.push({ word: key, kind: "sign", frames: SIGNS[key].frames, repeats: SIGNS[key].repeats || 1 });
    } else {
      const letters = key.split("").filter((c) => LETTERS[c]);
      tokens.push({ word: key, kind: letters.length ? "letters" : "unknown", letters });
    }
  }
  return tokens;
}
