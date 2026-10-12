import { useEffect, useState } from "react";
import { Hand, Loader2, AlertTriangle, Info } from "lucide-react";
import { useDisplay } from "../../context/DisplayContext";
import { api } from "../../lib/api";

/**
 * Free open-source text→ASL gloss via sign-language-translator service (Python).
 * Falls back to captions if service unavailable.
 */
export default function AslAvatar({ text }) {
  const [status, setStatus] = useState("idle");
  const [gloss, setGloss] = useState(null);
  const { settings } = useDisplay();

  useEffect(() => {
    let cancel = false;
    setGloss(null);
    if (!text?.trim()) return;
    setStatus("loading");
    api("/translate", { method: "POST", body: { text } })
      .then((r) => {
        if (cancel) return;
        setGloss(r.gloss || text);
        setStatus("ready");
      })
      .catch(() => {
        if (cancel) return;
        setGloss(text);
        setStatus("unavailable");
      });
    return () => {
      cancel = true;
    };
  }, [text]);

  if (!text?.trim()) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-10 text-center">
        <Hand className="h-8 w-8 text-muted" aria-hidden="true" />
        <p className="mt-3 max-w-xs text-sm text-muted">
          Incoming messages will be shown with captions here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Hand className="h-4 w-4 text-brand" aria-hidden="true" />
          ASL (captions)
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
          {status === "loading" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Preparing…
            </>
          )}
          {settings.reduceMotion && "Motion reduced"}
        </span>
      </div>

      <div className="relative aspect-video w-full bg-surface-2 grid place-items-center">
        <div className="flex flex-col items-center px-4 text-center">
          <Info className="h-6 w-6 text-muted" aria-hidden="true" />
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Free open-source text→ASL gloss (sign-language-translator).
          </p>
          {gloss && (
            <div className="mt-3 rounded-xl border border-line bg-surface px-4 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">ASL Gloss</p>
              <p className="mt-1 text-base font-semibold text-ink">{gloss}</p>
            </div>
          )}
        </div>
        {status === "unavailable" && (
          <div className="absolute inset-0 grid place-items-center bg-surface-2/90 p-4">
            <div className="flex items-start gap-2 text-sm text-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Sign service unavailable — showing captions.</p>
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
