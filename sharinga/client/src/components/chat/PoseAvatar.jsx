import { useEffect, useState } from "react";
import { Hand, Pause, Play } from "lucide-react";

const POSES = {
  HELLO: {
    arms: "up",
    hands: "open",
    description: "HELLO",
  },
  HI: {
    arms: "up",
    hands: "open",
    description: "HI",
  },
  GOOD: {
    arms: "neutral",
    hands: "open",
    description: "GOOD",
  },
  MORNING: {
    arms: "up",
    hands: "flat",
    description: "MORNING",
  },
  AFTERNOON: {
    arms: "neutral",
    hands: "flat",
    description: "AFTERNOON",
  },
  EVENING: {
    arms: "down",
    hands: "flat",
    description: "EVENING",
  },
  THANK: {
    arms: "forward",
    hands: "flat",
    description: "THANK YOU",
  },
  YOU: {
    arms: "forward",
    hands: "point",
    description: "YOU",
  },
  YES: {
    arms: "neutral",
    hands: "fist-nod",
    description: "YES",
  },
  NO: {
    arms: "neutral",
    hands: "wave",
    description: "NO",
  },
  PLEASE: {
    arms: "forward",
    hands: "open",
    description: "PLEASE",
  },
  SORRY: {
    arms: "neutral",
    hands: "flat",
    description: "SORRY",
  },
  HOW: {
    arms: "forward",
    hands: "curled",
    description: "HOW",
  },
  ARE: {
    arms: "neutral",
    hands: "open",
    description: "ARE",
  },
  OK: {
    arms: "neutral",
    hands: "ok",
    description: "OK",
  },
};

function getPose(word) {
  if (!word) return null;
  const key = word.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return POSES[key] || null;
}

export default function PoseAvatar({ text }) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    setIndex(0);
    setPlaying(true);
  }, [text]);

  useEffect(() => {
    if (!playing || words.length === 0) return;
    const current = words[index];
    const pose = getPose(current);
    const delay = pose ? 900 : 400;
    const timer = setTimeout(() => {
      if (index < words.length - 1) setIndex(index + 1);
      else setPlaying(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [index, playing, words]);

  const currentWord = words[index] || "";
  const currentPose = getPose(currentWord);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Hand className="h-4 w-4 text-brand" aria-hidden="true" />
          Live ASL Avatar (Free, Browser-only)
        </span>
        {words.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {index + 1}/{words.length}
            </span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand/40"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
      <div className="relative aspect-video w-full bg-surface-2 grid place-items-center">
        <div className="flex flex-col items-center">
          <svg
            width="280"
            height="280"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle cx="100" cy="40" r="20" fill="#E5E7EB" />
            <rect x="90" y="60" width="20" height="70" rx="10" fill="#D1D5DB" />
            <rect
              x="110"
              y="70"
              width="50"
              height="12"
              rx="6"
              fill="#9CA3AF"
              transform={currentPose?.arms === "up" ? "rotate(-90 110 70)" : currentPose?.arms === "forward" ? "rotate(-30 110 70)" : "rotate(0 110 70)"}
            />
            <rect
              x="40"
              y="70"
              width="50"
              height="12"
              rx="6"
              fill="#9CA3AF"
              transform={currentPose?.arms === "up" ? "rotate(90 90 70)" : currentPose?.arms === "forward" ? "rotate(30 90 70)" : "rotate(0 90 70)"}
            />
            <circle cx="165" cy={currentPose?.arms === "up" ? "30" : "80"} r="8" fill="#A3A3A3" />
            <circle cx="35" cy={currentPose?.arms === "up" ? "30" : "80"} r="8" fill="#A3A3A3" />
            <text x="100" y="190" textAnchor="middle" className="fill-muted text-xs">
              {currentPose?.description || (currentWord ? currentWord.toUpperCase() : "SIGNING...")}
            </text>
          </svg>
          <p className="mt-2 px-4 text-center text-xs text-muted">
            Word-by-word signing (extendable dictionary). Free, no external API keys.
          </p>
        </div>
      </div>
      <div className="border-t border-line bg-surface px-4 py-3" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Gloss</p>
        <p className="mt-1 text-lg font-semibold leading-snug text-ink break-words">
          {(text || "").trim() ? (text || "").toUpperCase() : "No message"}
        </p>
      </div>
    </div>
  );
}
