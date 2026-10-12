import { Volume2, CheckCheck } from "lucide-react";
import { simplifyText } from "../../lib/constants";
import { useTTS } from "../../hooks/useTTS";
import { useAuth } from "../../context/AuthContext";
import { useDisplay } from "../../context/DisplayContext";

function timeLabel(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isMine }) {
  const { speak, speaking, supported } = useTTS();
  const { user } = useAuth();
  const { settings } = useDisplay();

  const myMode = user?.accessMode || "standard";

  // Cognitive mode: show simplified language with original available
  const showSimple = myMode === "cognitive" && !isMine;
  const text = showSimple ? simplifyText(message.text) : message.text;

  const canReadAloud = supported && !isMine && settings.autoSpeak;

  return (
    <li className={`animate-rise flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${isMine ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-left shadow-sm ${
            isMine
              ? "rounded-br-md bg-brand text-white"
              : "rounded-bl-md border border-line bg-surface text-ink"
          }`}
        >
          {!isMine && (
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
              {message.senderName}
            </p>
          )}

          <p
            className={`whitespace-pre-wrap break-words leading-relaxed ${
              showSimple ? "text-lg font-medium" : "text-[0.975rem]"
            }`}
          >
            {text}
          </p>

          {showSimple && text !== message.text && (
            <details className="mt-2 text-xs">
              <summary
                className={`cursor-pointer font-semibold ${
                  isMine ? "text-white/80" : "text-muted"
                }`}
              >
                Show original wording
              </summary>
              <p className={`mt-1 ${isMine ? "text-white/85" : "text-muted"}`}>
                {message.text}
              </p>
            </details>
          )}
        </div>

        <div
          className={`mt-1 flex items-center gap-2 text-[0.7rem] font-medium text-muted ${
            isMine ? "justify-end" : ""
          }`}
        >
          <time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>
          {isMine && <CheckCheck className="h-3.5 w-3.5 text-brand" aria-label="Sent" />}
          {canReadAloud && (
            <button
              onClick={() => speak(message.text)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-brand hover:bg-brand-soft"
              aria-label={`Read message from ${message.senderName} aloud`}
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              {speaking ? "Speaking…" : "Read aloud"}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
