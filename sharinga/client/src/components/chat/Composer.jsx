import { useEffect, useRef, useState } from "react";
import {
  Send,
  Mic,
  MicOff,
  MessageCircleHeart,
  Zap,
} from "lucide-react";
import { useSTT } from "../../hooks/useSTT";
import { useTTS } from "../../hooks/useTTS";
import { useAuth } from "../../context/AuthContext";
import { QUICK_PHRASES } from "../../lib/constants";

export default function Composer({ onSend, disabled }) {
  const { user } = useAuth();
  const mode = user?.accessMode || "standard";
  const [text, setText] = useState("");
  const [showPhrases, setShowPhrases] = useState(false);
  const textareaRef = useRef(null);
  const { speak } = useTTS();

  const { start, stop, listening, interim, supported: sttSupported } = useSTT({
    onResult: (finalText) => setText((prev) => (prev ? `${prev} ${finalText}` : finalText)),
  });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const submit = () => {
    const clean = text.trim();
    if (!clean || disabled) return;
    onSend(clean);
    setText("");
    setShowPhrases(false);
    if (mode === "speech") speak(clean);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-line bg-surface p-3 sm:p-4">
      {mode === "cognitive" && (
        <div className="mb-2.5">
          <button
            className="btn btn-ghost !min-h-9 gap-1.5 !px-3 !py-1.5 text-xs"
            onClick={() => setShowPhrases((v) => !v)}
            aria-expanded={showPhrases}
          >
            <Zap className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
            Quick phrases
          </button>

          {showPhrases && (
            <ul className="animate-rise mt-2 flex flex-wrap gap-2" aria-label="Quick phrases">
              {QUICK_PHRASES.map((phrase) => (
                <li key={phrase}>
                  <button
                    className="rounded-full border border-line bg-surface-2 px-3.5 py-2 text-sm font-semibold text-ink hover:border-brand hover:bg-brand-soft hover:text-brand-ink"
                    onClick={() => {
                      onSend(phrase);
                      if (mode === "speech") speak(phrase);
                      setShowPhrases(false);
                    }}
                  >
                    {phrase}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        {sttSupported && (
          <button
            className={`icon-btn shrink-0 border ${
              listening
                ? "border-danger bg-danger-soft text-danger"
                : "border-line text-muted"
            }`}
            onClick={() => (listening ? stop() : start())}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            aria-pressed={listening}
            title={listening ? "Stop listening" : "Speak your message"}
          >
            {listening ? (
              <MicOff className="h-5 w-5 animate-pulse" aria-hidden="true" />
            ) : (
              <Mic className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}

        <div className="relative flex-1">
          <label htmlFor="composer-input" className="sr-only">
            Type your message
          </label>
          <textarea
            id="composer-input"
            ref={textareaRef}
            className="input resize-none !min-h-11 py-2.5 pr-12"
            rows={1}
            placeholder={
              listening
                ? "Listening…"
                : mode === "speech"
                  ? "Type — the app will speak for you"
                  : "Type a message…"
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            aria-describedby="composer-hint"
          />
          <button
            className="icon-btn absolute bottom-1 right-1 !h-9 !w-9 text-brand disabled:opacity-40"
            onClick={submit}
            disabled={!text.trim() || disabled}
            aria-label="Send message"
          >
            <Send className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {interim && (
        <p className="mt-2 px-1 text-sm italic text-muted" aria-live="polite">
          {interim}
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-muted" id="composer-hint">
        <MessageCircleHeart className="h-3.5 w-3.5" aria-hidden="true" />
        {mode === "speech"
          ? "Your message is read aloud automatically when you send."
          : "Press Enter to send · Shift + Enter for a new line"}
      </p>
    </div>
  );
}
