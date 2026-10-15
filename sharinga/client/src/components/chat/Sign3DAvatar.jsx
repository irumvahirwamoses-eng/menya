import { useEffect, useMemo, useRef, useState } from "react";
import { Hand, Play, Pause, RotateCcw, Gauge } from "lucide-react";
import { HANDSHAPES, mergePose, letterPose, resolveTokens } from "../../lib/sign3d/poses";
import { useDisplay } from "../../context/DisplayContext";

/* ------------------------------------------------------------------ *
 * Geometry (device-independent px; the stage is scaled to fit)
 * ------------------------------------------------------------------ */
const STAGE_W = 340;
const STAGE_H = 420;
const CX = 170;

const SHOULDER_Y = 146;
const SHOULDER_DX = 56;
const ARM_W = 26;
const FOREARM_LEN = 56;
const HAND_W = 34;
const HAND_LEN = 46;

const FINGERS = [
  { key: "index", x: 4, len: 27, fan: -1 },
  { key: "middle", x: 11, len: 30, fan: -0.35 },
  { key: "ring", x: 18, len: 27, fan: 0.35 },
  { key: "pinky", x: 25, len: 23, fan: 1 },
];

const C = {
  skin: "#e3a878",
  skinDark: "#cf9765",
  shirt: "var(--color-brand)",
  pants: "#3b4a63",
  shoe: "#22303f",
  hair: "#2b1d16",
  eye: "#16202e",
  mouth: "#8f4a3c",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ *
 * Avatar pieces
 * ------------------------------------------------------------------ */
function Part({ c, style }) {
  return <div className="s3d-part" style={{ "--c": c, ...style }} />;
}

function HandRig({ side, pose }) {
  const dir = side === "R" ? 1 : -1;
  const thumbLeft = side === "R" ? -7 : HAND_W - 2;

  return (
    <div
      className="s3d-bone"
      style={{
        left: -(HAND_W - ARM_W) / 2,
        top: FOREARM_LEN,
        width: HAND_W,
        height: HAND_LEN,
        transform: `rotateX(${pose.hx}deg) rotateY(${pose.hy}deg) rotateZ(${pose.hz}deg)`,
      }}
    >
      <Part c={C.skin} style={{ borderRadius: "14px 14px 16px 16px" }} />

      <div
        className="s3d-bone"
        style={{
          left: thumbLeft,
          top: 6,
          width: 9,
          height: 24,
          transform: `rotateZ(${dir * 34}deg) rotateX(${pose.thumb * 70}deg)`,
        }}
      >
        <Part c={C.skin} />
      </div>

      {FINGERS.map((f) => {
        const x = side === "R" ? f.x : HAND_W - 7 - f.x;
        return (
          <div
            key={f.key}
            className="s3d-bone"
            style={{
              left: x,
              top: HAND_LEN - 6,
              width: 7,
              height: f.len,
              transform: `rotateZ(${f.fan * pose.spread * 30}deg) rotateX(${pose[f.key] * 95}deg)`,
            }}
          >
            <Part c={C.skin} />
          </div>
        );
      })}
    </div>
  );
}

function Arm({ side, pose }) {
  const dir = side === "R" ? 1 : -1;
  const shape = HANDSHAPES[pose.handshape] || HANDSHAPES.rest;
  const shoulderX = CX + dir * SHOULDER_DX;

  const handPose = {
    hx: pose.hx,
    hy: pose.hy,
    hz: pose.hz,
    thumb: shape.thumb,
    index: shape.index,
    middle: shape.middle,
    ring: shape.ring,
    pinky: shape.pinky,
    spread: shape.spread,
  };

  return (
    <div
      className="s3d-bone"
      style={{
        left: shoulderX - ARM_W / 2,
        top: SHOULDER_Y,
        width: ARM_W,
        height: 60,
        transform: `rotateZ(${-dir * pose.uo}deg) rotateX(${pose.uf}deg) rotateY(${pose.ut}deg)`,
      }}
    >
      <Part c={C.skin} />
      <Part c={C.shirt} style={{ top: 0, bottom: "auto", height: 24, borderRadius: "14px 14px 6px 6px" }} />

      <div
        className="s3d-bone"
        style={{
          left: 0,
          top: 60,
          width: ARM_W,
          height: FOREARM_LEN,
          transform: `rotateY(${pose.et}deg) rotateX(${pose.ef}deg)`,
        }}
      >
        <Part c={C.skin} />
        <HandRig side={side} pose={handPose} />
      </div>
    </div>
  );
}

function Leg({ side }) {
  const dir = side === "R" ? 1 : -1;
  const centerX = CX + dir * 19;
  return (
    <div className="s3d-bone" style={{ left: centerX - 22, top: 288, width: 44, height: 60 }}>
      <Part c={C.pants} />
      <div className="s3d-bone" style={{ left: 2, top: 58, width: 40, height: 54 }}>
        <Part c={C.pants} />
        <div className="s3d-bone" style={{ left: -2, top: 52, width: 44, height: 16, transform: "translateZ(9px)" }}>
          <Part c={C.shoe} style={{ borderRadius: "10px 12px 8px 8px" }} />
        </div>
      </div>
    </div>
  );
}

function Head({ pose }) {
  const [hx, hy, hz] = pose.head;
  return (
    <div
      className="s3d-bone"
      style={{
        left: CX - 44,
        top: 34,
        width: 88,
        height: 92,
        transformOrigin: "50% 100%",
        transform: `rotateX(${hx}deg) rotateY(${hy}deg) rotateZ(${hz}deg)`,
      }}
    >
      <Part c={C.skin} style={{ borderRadius: "50%", transform: "translateZ(-3px)" }} />
      <Part
        c={C.hair}
        style={{ inset: "auto", left: 0, top: -3, width: 88, height: 46, borderRadius: "44px 44px 22px 22px", transform: "translateZ(-1px)" }}
      />
      <Part c={C.eye} style={{ inset: "auto", left: 24, top: 46, width: 10, height: 12, borderRadius: "50%" }} />
      <Part c={C.eye} style={{ inset: "auto", left: 54, top: 46, width: 10, height: 12, borderRadius: "50%" }} />
      <Part c={C.mouth} style={{ inset: "auto", left: 32, top: 66, width: 24, height: 9, borderRadius: "4px 4px 14px 14px" }} />
    </div>
  );
}

function Body({ pose }) {
  const [lx, ly, lz] = pose.lean;
  return (
    <div
      className="s3d-body"
      style={{
        transformOrigin: `${CX}px 250px`,
        transform: `rotateX(${lx}deg) rotateY(${ly}deg) rotateZ(${lz}deg)`,
      }}
    >
      <Part c={C.shirt} style={{ inset: "auto", left: 112, top: 130, width: 116, height: 122, borderRadius: "46px 46px 30px 30px" }} />
      <Part c={C.skinDark} style={{ inset: "auto", left: 157, top: 116, width: 26, height: 30, borderRadius: 10 }} />
      <Part c={C.pants} style={{ inset: "auto", left: 118, top: 244, width: 104, height: 46, borderRadius: 22 }} />
      <Head pose={pose} />
      <Arm side="R" pose={pose.R} />
      <Arm side="L" pose={pose.L} />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Main component
 * ------------------------------------------------------------------ */
export default function Sign3DAvatar({ text }) {
  const { settings } = useDisplay();
  const reduce = !!settings?.reduceMotion;

  const tokens = useMemo(() => resolveTokens(text), [text]);

  const boxRef = useRef(null);
  const pausedRef = useRef(false);

  const [k, setK] = useState(0.9);
  const [pose, setPose] = useState(() => mergePose());
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [nonce, setNonce] = useState(0);

  /* scale stage to the container width */
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || STAGE_W;
      setK(Math.max(0.4, Math.min(w / STAGE_W, 2)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);

  /* playback */
  useEffect(() => {
    let cancelled = false;

    const gate = () =>
      new Promise((resolve) => {
        const step = () => {
          if (cancelled || !pausedRef.current) return resolve();
          setTimeout(step, 70);
        };
        step();
      });

    async function run() {
      if (!tokens.length) {
        setPose(mergePose());
        setPlaying(false);
        return;
      }
      setPlaying(true);
      const frameMs = reduce ? 120 : 620 / speed;
      const letterMs = reduce ? 80 : 200 / speed;
      const gapMs = reduce ? 40 : 120 / speed;

      for (let i = 0; i < tokens.length; i += 1) {
        if (cancelled) return;
        await gate();
        if (cancelled) return;
        setIndex(i);
        const t = tokens[i];

        if (t.kind === "sign" && t.frames?.length) {
          const reps = t.repeats || 1;
          for (let rep = 0; rep < reps; rep += 1) {
            for (const frame of t.frames) {
              if (cancelled) return;
              await gate();
              if (cancelled) return;
              setPose(mergePose(frame));
              await sleep(frameMs);
            }
          }
        } else if (t.kind === "letters" && t.letters.length) {
          for (const ch of t.letters) {
            if (cancelled) return;
            await gate();
            if (cancelled) return;
            setPose(letterPose(ch));
            await sleep(letterMs);
          }
        } else {
          await sleep(letterMs);
        }
        await sleep(gapMs);
      }
      if (!cancelled) {
        setPose(mergePose());
        setPlaying(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [tokens, speed, reduce, nonce]);

  const replay = () => {
    pausedRef.current = false;
    setPlaying(true);
    setPose(mergePose());
    setIndex(0);
    setNonce((n) => n + 1);
  };

  const cycleSpeed = () => setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 0.75 : 1));

  const current = tokens[index]?.word || "";

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Hand className="h-4 w-4 text-brand" aria-hidden="true" />
          Sign avatar (3D)
        </span>
        <div className="flex items-center gap-1">
          <button type="button" className="icon-btn !h-9 !w-9" onClick={() => { pausedRef.current = false; setPlaying(true); }} disabled={playing || !tokens.length} aria-label="Play signing">
            <Play className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn !h-9 !w-9" onClick={() => { pausedRef.current = true; setPlaying(false); }} disabled={!playing} aria-label="Pause signing">
            <Pause className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn !h-9 !w-9" onClick={replay} aria-label="Replay signing">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn !h-9 !w-auto gap-1 px-2 text-xs font-bold" onClick={cycleSpeed} aria-label={`Signing speed ${speed} times`}>
            <Gauge className="h-4 w-4" aria-hidden="true" />
            {speed}×
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className="s3d-viewport w-full overflow-hidden bg-surface-2"
        style={{ height: Math.round(STAGE_H * k) }}
        aria-hidden="true"
      >
        <div
          className="s3d-stage"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            margin: "0 auto",
            transformOrigin: "50% 0",
            transform: `scale(${k}) rotateY(-9deg)`,
          }}
        >
          <div className="s3d-shadow" style={{ left: 68, top: 392, width: 204, height: 46 }} />
          <Leg side="R" />
          <Leg side="L" />
          <Body pose={pose} />
        </div>
      </div>

      <div className="border-t border-line bg-surface px-4 py-3" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Signing</p>
        <p className="mt-1 min-h-7 text-lg font-semibold leading-snug text-ink">
          {current || (text?.trim() ? "…" : "No message")}
        </p>
        {tokens.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tokens.map((t, i) => (
              <span
                key={`${t.word}-${i}`}
                className={
                  "rounded-lg px-2 py-0.5 text-xs font-semibold " +
                  (i === index
                    ? "bg-brand text-white"
                    : i < index
                      ? "bg-surface-2 text-muted"
                      : "bg-surface-2 text-muted/70")
                }
              >
                {t.word}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Browser-rendered 3D avatar, free and offline. Signs play word-by-word; unknown words
          are fingerspelled. Always paired with the text above.
        </p>
      </div>
    </div>
  );
}
