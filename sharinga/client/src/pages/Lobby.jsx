import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  LogIn,
  Copy,
  Check,
  MessageSquare,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import ModeBadge from "../components/ui/ModeBadge";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ACCESS_MODES } from "../lib/constants";

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function RoomCodeCard({ code, onCreated }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/conversations", { method: "POST", body: {} });
      onCreated(data.conversation);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (code) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-ink">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Your room is ready
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Share this 6-character code with the other person so they can join.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <output
            className="rounded-xl border-2 border-dashed border-brand bg-brand-soft px-5 py-3 font-mono text-2xl font-bold tracking-[0.3em] text-brand-ink"
            aria-label={`Room code ${code.split("").join(" ")}`}
          >
            {code}
          </output>
          <Button variant="secondary" onClick={copy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" /> Copy code
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Start a new conversation</h2>
          <p className="mt-1 text-sm text-muted">
            Create a private room, then share the code with your partner.
          </p>
        </div>
        <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink sm:grid">
          <Plus className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <Button className="mt-5 w-full sm:w-auto" onClick={create} disabled={busy}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {busy ? "Creating…" : "Create room"}
      </Button>
    </div>
  );
}

function JoinCard({ onJoined }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const join = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/conversations/join", {
        method: "POST",
        body: { code },
      });
      onJoined(data.conversation);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card p-6" onSubmit={join}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Join with a code</h2>
          <p className="mt-1 text-sm text-muted">
            Enter the 6-character code your partner shared with you.
          </p>
        </div>
        <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted sm:grid">
          <LogIn className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field
          label="Room code"
          className="flex-1"
          placeholder="ABC123"
          maxLength={6}
          autoComplete="off"
          spellCheck={false}
          style={{ textTransform: "uppercase", letterSpacing: "0.25em", fontWeight: 700 }}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          error={error || undefined}
        />
        <Button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Joining…" : "Join room"}
        </Button>
      </div>
    </form>
  );
}

function ConversationRow({ convo, meId }) {
  const partner = convo.participants?.find(
    (p) => String(p._id ?? p.id) !== String(meId)
  );
  const mode = ACCESS_MODES[partner?.accessMode] || ACCESS_MODES.standard;

  return (
    <Link
      to={`/chat/${convo._id}`}
      className="card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:border-brand"
    >
      <span className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
        </span>
        <span
          className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface ${mode.dot}`}
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-bold text-ink">
            {partner?.name || convo.title}
          </span>
          <ModeBadge mode={mode} className="hidden sm:inline-flex" />
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">
          {convo.lastMessage?.text
            ? `${convo.lastMessage.senderName}: ${convo.lastMessage.text}`
            : "No messages yet — say hello!"}
        </span>
      </span>

      <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-muted sm:flex">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {timeAgo(convo.updatedAt || convo.createdAt)}
      </span>
    </Link>
  );
}

export default function Lobby() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCode, setActiveCode] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api("/conversations");
      setConversations(data.conversations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRoomReady = (convo) => {
    if (convo.participants?.length > 1) {
      navigate(`/chat/${convo._id}`);
    } else {
      setActiveCode(convo.code);
      load();
    }
  };

  const mode = ACCESS_MODES[user?.accessMode] || ACCESS_MODES.standard;
  const Icon = mode.icon;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-rise flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">
              Welcome, {user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-1.5 text-muted">
              Create a room or join your partner to start talking.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-ink">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Your mode
              </p>
              <p className="text-sm font-bold text-ink">{mode.longLabel}</p>
            </div>
            <Link
              to="/settings"
              className="ml-2 text-sm font-semibold text-brand hover:underline"
            >
              Change
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <RoomCodeCard code={activeCode} onCreated={onRoomReady} />
          <JoinCard onJoined={(convo) => navigate(`/chat/${convo._id}`)} />
        </div>

        <section className="mt-10" aria-labelledby="history-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="history-heading" className="text-lg font-bold text-ink">
              Your conversations
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {conversations.length} total
            </span>
          </div>

          {loading && <p className="text-sm text-muted">Loading conversations…</p>}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {!loading && !conversations.length && (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <MessageSquare className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-bold text-ink">No conversations yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Create your first room above and share the code with the person you want to
                talk with.
              </p>
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {conversations.map((convo) => (
              <li key={convo._id}>
                <ConversationRow convo={convo} meId={user?.id} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
