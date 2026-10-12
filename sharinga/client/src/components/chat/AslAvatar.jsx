import { useEffect, useState } from "react";
import { Hand, Loader2, AlertTriangle, KeyRound, Info } from "lucide-react";
import { useDisplay } from "../../context/DisplayContext";

const API_KEY_STORAGE = "sharinga:signspealk-key";

const envKey =
  (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_SIGNSPEAK_API_KEY || import.meta.env.VITE_SIGN_SPEAK_API_KEY)) ||
  "";

export function getSignSpeakKey() {
  if (envKey) return envKey;
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function setSignSpeakKey(key) {
  if (key) localStorage.setItem(API_KEY_STORAGE, key);
  else localStorage.removeItem(API_KEY_STORAGE);
}

/**
 * Renders an ASL avatar for a sentence using the Sign-Speak SDK.
 * If no API key or the SDK is unavailable, falls back to a clear caption card
 * so the conversation is never blocked.
 */
export default function AslAvatar({ text, model = "MALE" }) {
  const [status, setStatus] = useState("idle"); // idle | loading | ready | unavailable
  const hasKey = Boolean(getSignSpeakKey());
  const { settings } = useDisplay();

  if (!text?.trim()) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-10 text-center">
        <Hand className="h-8 w-8 text-muted" aria-hidden="true" />
        <p className="mt-3 max-w-xs text-sm text-muted">
          Incoming messages will be signed here by the ASL avatar.
        </p>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="rounded-2xl border border-warning bg-warning-soft p-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-warning-ink">ASL avatar not configured</p>
            <p className="mt-1 text-sm leading-relaxed text-warning-ink opacity-90">
              Set <code className="rounded bg-white/40 px-1">VITE_SIGNSPEAK_API_KEY</code> in
              your environment (or paste in Settings). Captions below still work.
            </p>
          </div>
        </div>
        <Captions text={text} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Hand className="h-4 w-4 text-brand" aria-hidden="true" />
          ASL avatar
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {status === "loading" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Signing…
            </>
          )}
          {settings.reduceMotion && "Motion reduced"}
        </span>
      </div>

      <div className="relative aspect-video w-full bg-surface-2">
        <SignSpeakPlayer
          text={text}
          model={model}
          onLoading={() => setStatus("loading")}
          onReady={() => setStatus("ready")}
          onError={() => setStatus("unavailable")}
        />
        {status === "unavailable" && (
          <div className="absolute inset-0 grid place-items-center bg-surface-2 p-4">
            <div className="flex items-start gap-2 text-sm text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Avatar temporarily unavailable — captions shown below.</p>
            </div>
          </div>
        )}
      </div>

      <Captions text={text} />
    </div>
  );
}

function Captions({ text }) {
  return (
    <div className="border-t border-line bg-surface px-4 py-3" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Captions</p>
      <p className="mt-1 text-lg font-semibold leading-snug text-ink">{text}</p>
    </div>
  );
}

/**
 * Lazily loads the Sign-Speak SDK. Kept as a child component so a missing
 * package or failed network load never crashes the main app.
 */
function SignSpeakPlayer({ text, model, onLoading, onReady, onError }) {
  const [Comp, setComp] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    onLoading();

    import("@sign-speak/react-sdk")
      .then((mod) => {
        if (cancelled) return;
        const { SignProduction, setKey } = mod;
        if (!SignProduction) throw new Error("SignProduction missing");
        setKey(getSignSpeakKey());
        setComp(() => SignProduction);
        onReady();
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        onError();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Comp) onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Comp, text]);

  if (failed) return null;

  return Comp ? (
    <div className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-contain">
      <Comp
        key={text}
        text={text}
        model={model}
        videoContainerClassName="h-full w-full bg-surface-2"
        videoClassName="h-full w-full object-contain"
        loadingClassName="grid h-full w-full place-items-center"
      />
    </div>
  ) : (
    <div className="grid h-full w-full place-items-center text-muted">
      <span className="flex items-center gap-2 text-sm">
        <Info className="h-4 w-4" aria-hidden="true" /> Loading avatar…
      </span>
    </div>
  );
}
