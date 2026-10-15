import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Hand,
  Shapes,
  Users,
  Circle,
  StopCircle,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import AppShell from "../layout/AppShell";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import Sign3DAvatar from "./Sign3DAvatar";
import PictogramView from "./PictogramView";
import UserAvatar from "../ui/UserAvatar";
import ModeBadge from "../ui/ModeBadge";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useDisplay } from "../../context/DisplayContext";
import { useTTS } from "../../hooks/useTTS";
import { getSocket } from "../../lib/socket";
import { api } from "../../lib/api";
import { ACCESS_MODES } from "../../lib/constants";

function TypingIndicator({ name }) {
  return (
    <li className="flex items-center gap-2 px-1 text-sm text-muted" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {name} is typing…
    </li>
  );
}

export default function Chat() {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const { settings, update: updateDisplay } = useDisplay();
  const { speak, stop, speaking } = useTTS();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [typing, setTyping] = useState(null);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [sendError, setSendError] = useState("");

  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  const myMode = user?.accessMode || "standard";
  const partnerMode = ACCESS_MODES[partner?.accessMode] || ACCESS_MODES.standard;
  const wantsAvatar = myMode === "deaf";
  const wantsSymbols = myMode === "cognitive";
  const lastIncoming = [...messages].reverse().find((m) => m.sender !== user?.id);

  // Load conversation + history
  useEffect(() => {
    let cancelled = false;
    setError("");

    Promise.all([
      api(`/conversations/${conversationId}`),
      api(`/conversations/${conversationId}/messages`),
    ])
      .then(([convoData, msgData]) => {
        if (cancelled) return;
        setConversation(convoData.conversation);
        setMessages(msgData.messages);
        const meId = String(user?.id);
        const other = convoData.conversation.participants?.find(
          (p) => String(p._id ?? p.id) !== meId
        );
        setPartner(other || null);
        setPanelOpen(myMode === "deaf" || myMode === "cognitive");
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [conversationId, user?.id, myMode]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  // Socket wiring
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const join = () => socket.emit("room:join", { conversationId });
    if (socket.connected) join();
    socket.on("connect", join);

    const onMessage = (msg) => {
      if (String(msg.conversation) !== String(conversationId)) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
      );
      setTyping(null);
      scrollToBottom();

      if (msg.sender !== user?.id) {
        const spokenModes = ["blind", "cognitive"];
        if (settings.autoSpeak && spokenModes.includes(myMode)) speak(msg.text);
      }
    };

    const onTyping = ({ userId, name, isTyping }) => {
      if (String(userId) === String(user?.id)) return;
      setTyping(isTyping ? name : null);
    };

    const onPresence = ({ online }) => setPartnerOnline(Boolean(online));

    const onPresenceState = ({ partner: p, conversationId: cid }) => {
      if (String(cid) === String(conversationId) && p) setPartner(p);
    };

    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    socket.on("presence:update", onPresence);
    socket.on("presence:state", onPresenceState);

    return () => {
      socket.emit("room:leave", { conversationId });
      socket.off("connect", join);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
      socket.off("presence:update", onPresence);
      socket.off("presence:state", onPresenceState);
    };
  }, [conversationId, user?.id, myMode, settings.autoSpeak, speak, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const sendMessage = (text) => {
    setSendError("");
    socketRef.current?.emit(
      "message:send",
      { conversationId, text, kind: "text" },
      (res) => {
        if (res?.error) setSendError(res.error);
      }
    );
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const sendTyping = (isTyping) => {
      socket.emit("typing", { conversationId, isTyping });
    };
    const handler = () => {
      sendTyping(true);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => sendTyping(false), 2500);
    };
    const stopHandler = () => {
      clearTimeout(typingTimerRef.current);
      sendTyping(false);
    };
    document.addEventListener("keydown", handler, { capture: true });
    document.addEventListener("visibilitychange", stopHandler);
    window.addEventListener("blur", stopHandler);
    return () => {
      document.removeEventListener("keydown", handler, { capture: true });
      document.removeEventListener("visibilitychange", stopHandler);
      window.removeEventListener("blur", stopHandler);
      clearTimeout(typingTimerRef.current);
      sendTyping(false);
    };
  }, [conversationId]);

  if (error) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="card p-8">
            <p className="text-lg font-bold text-ink">Conversation unavailable</p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <Link to="/lobby" className="btn btn-primary mt-6 inline-flex">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to conversations
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const showSidePanel = wantsAvatar || wantsSymbols;
  const partnerName = partner?.name || "Partner";

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-7xl flex-col px-0 sm:px-6">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:rounded-t-2xl sm:border-x sm:border-t">
          <Link
            to="/lobby"
            className="icon-btn !h-10 !w-10"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>

          <UserAvatar name={partnerName} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold text-ink sm:text-base">
                {partnerName}
              </h1>
              <ModeBadge mode={partnerMode} className="hidden sm:inline-flex" />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Circle
                className={`h-2 w-2 fill-current ${
                  partnerOnline ? "text-success" : "text-muted"
                }`}
                aria-hidden="true"
              />
              {partnerOnline ? "Online now" : "Offline"}
              <span aria-hidden="true">·</span>
              Room {conversation?.code}
            </p>
          </div>

          {speaking && (
            <Button variant="secondary" className="hidden !min-h-10 !px-3 sm:inline-flex" onClick={stop}>
              <StopCircle className="h-4 w-4" aria-hidden="true" />
              Stop audio
            </Button>
          )}

          {showSidePanel && (
            <button
              className="icon-btn !h-10 !w-10"
              onClick={() => setPanelOpen((v) => !v)}
              aria-expanded={panelOpen}
              aria-label={panelOpen ? "Hide assist panel" : "Show assist panel"}
            >
              {panelOpen ? (
                <PanelRightClose className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelRightOpen className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
        </header>

        <div className="flex min-h-0 flex-1 gap-0 sm:gap-4">
          {/* Messages */}
          <section
            className="flex min-w-0 flex-1 flex-col border-x border-line bg-canvas sm:rounded-b-2xl sm:border"
            aria-label="Message thread"
          >
            <div
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
              ref={scrollRef}
              tabIndex={0}
            >
              {messages.length === 0 && (
                <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
                  <p className="mt-3 font-bold text-ink">It starts with hello</p>
                  <p className="mt-1 text-sm text-muted">
                    Send your first message — {partnerName} will see it in their preferred
                    format.
                  </p>
                </div>
              )}

              <ul className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isMine={String(msg.sender) === String(user?.id)}
                  />
                ))}
                {typing && <TypingIndicator name={typing} />}
              </ul>
            </div>

            {sendError && (
              <p className="field-error px-4 pb-2" role="alert">
                {sendError}
              </p>
            )}

            <Composer
              onSend={sendMessage}
              disabled={false}
            />
            <span className="sr-only" aria-live="polite">
              {typing ? `${typing} is typing` : ""}
            </span>
          </section>

          {/* Assist panel */}
          {showSidePanel && panelOpen && (
            <aside
              className="hidden w-[380px] shrink-0 flex-col gap-4 overflow-y-auto py-4 xl:flex"
              aria-label="Assist panel"
            >
              {wantsAvatar && (
                <div>
                  <h2 className="sr-only">Sign language avatar</h2>
                  <Sign3DAvatar text={lastIncoming?.text || ""} />
                </div>
              )}

              {wantsSymbols && lastIncoming && (
                <PictogramView text={lastIncoming.text} />
              )}

              <div className="rounded-2xl border border-line bg-surface p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  {wantsAvatar ? (
                    <>
                      <Hand className="h-4 w-4 text-brand" aria-hidden="true" /> How this
                      works
                    </>
                  ) : (
                    <>
                      <Shapes className="h-4 w-4 text-brand" aria-hidden="true" /> How this
                      works
                    </>
                  )}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {wantsAvatar
                    ? "Every message from your partner is signed by the 3D avatar, word by word, with the text shown underneath."
                    : "Messages are rewritten in simpler words and shown with picture symbols so meaning is easy to catch."}
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => updateDisplay({ autoSpeak: e.target.checked })}
                    className="h-4.5 w-4.5 rounded accent-[var(--color-brand)]"
                  />
                  Read incoming messages aloud
                </label>
              </div>
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}
