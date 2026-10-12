import { useEffect, useMemo, useState } from "react";
import { Shapes, X, Loader2 } from "lucide-react";

const STOPWORDS = new Set([
  "a", "an", "the", "is", "am", "are", "was", "were", "be", "been", "of", "to",
  "in", "on", "at", "and", "or", "but", "so", "for", "with", "that", "this",
  "it", "its", "i", "you", "he", "she", "we", "they", "them", "his", "her",
  "my", "your", "our", "their", "as", "by", "from", "do", "does", "did",
  "have", "has", "had", "will", "would", "can", "could", "not", "no",
]);

function keywords(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 6);
}

const idCache = new Map();

async function findPictogramId(word) {
  if (idCache.has(word)) return idCache.get(word);
  try {
    const res = await fetch(
      `https://api.arasaac.org/api/pictograms/en/search/${encodeURIComponent(word)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("search failed");
    const results = await res.json();
    const id = Array.isArray(results) && results[0]?._id ? results[0]._id : null;
    idCache.set(word, id);
    return id;
  } catch {
    idCache.set(word, null);
    return null;
  }
}

function PictogramTile({ word, onOpen }) {
  const [state, setState] = useState({ loading: true, id: null });

  useEffect(() => {
    let cancelled = false;
    findPictogramId(word).then((id) => {
      if (!cancelled) setState({ loading: false, id });
    });
    return () => {
      cancelled = true;
    };
  }, [word]);

  return (
    <li>
      <button
        className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface-2 p-2 transition-transform hover:-translate-y-0.5 hover:border-brand"
        onClick={() => state.id && onOpen({ word, id: state.id })}
        disabled={!state.id && !state.loading}
        aria-label={state.id ? `Enlarge symbol for ${word}` : `Symbol for ${word} not available`}
      >
        {state.loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden="true" />
        ) : state.id ? (
          <img
            src={`https://static.arasaac.org/pictograms/${state.id}/${state.id}_300.png`}
            alt=""
            loading="lazy"
            className="h-14 w-14 object-contain"
          />
        ) : (
          <span className="text-2xl" aria-hidden="true">
            🔤
          </span>
        )}
        <span className="w-full truncate text-center text-xs font-bold capitalize text-ink">
          {word}
        </span>
      </button>
    </li>
  );
}

/**
 * ARASAAC pictogram strip — free, open-licensed AAC symbols (CC BY-NC-SA).
 * Words without a symbol fall back to a text tile so meaning is never lost.
 */
export default function PictogramView({ text }) {
  const words = useMemo(() => keywords(text || ""), [text]);
  const [chosen, setChosen] = useState(null);

  if (!words.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Shapes className="h-4 w-4 text-brand" aria-hidden="true" />
          Picture symbols
        </span>
        <span className="text-xs font-medium text-muted">ARASAAC · CC BY-NC-SA</span>
      </div>

      <ul className="flex flex-wrap gap-2.5 p-4" aria-label="Key words shown as symbols">
        {words.map((word) => (
          <PictogramTile key={word} word={word} onOpen={setChosen} />
        ))}
      </ul>

      <div className="border-t border-line px-4 py-3" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Key idea</p>
        <p className="mt-1 text-base font-semibold text-ink">{text}</p>
      </div>

      {chosen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Symbol enlarged for ${chosen.word}`}
          onClick={() => setChosen(null)}
        >
          <div className="animate-pop card w-full max-w-sm p-6 text-center">
            <img
              src={`https://static.arasaac.org/pictograms/${chosen.id}/${chosen.id}_300.png`}
              alt={`Symbol for ${chosen.word}`}
              className="mx-auto h-48 w-48 object-contain"
            />
            <p className="mt-4 text-2xl font-bold capitalize text-ink">{chosen.word}</p>
            <button className="btn btn-secondary mt-5 w-full" onClick={() => setChosen(null)}>
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
