import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../api/axiosClient";
import { getSocket } from "../api/socket";
import AppLayout from "../components/AppLayout";
import { useToast } from "../components/Toast";
import { decrementUnread, incrementUnread, setUnreadCount } from "../store/inboxSlice";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const initialsOf = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const Inbox = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user, token } = useSelector((state) => state.auth);

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [typingUser, setTypingUser] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeIdRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  );

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Initial load: conversations + everyone else you can start a chat with.
  useEffect(() => {
    const load = async () => {
      try {
        const [convRes, contactsRes] = await Promise.all([
          axiosClient.get("/messages/conversations"),
          axiosClient.get("/messages/contacts"),
        ]);
        setConversations(convRes.data);
        setContacts(contactsRes.data);
        const total = convRes.data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        dispatch(setUnreadCount(total));
      } catch (error) {
        showToast("Could not load inbox", "error");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time: new messages + typing indicator.
  useEffect(() => {
    const socket = getSocket(token);
    if (!socket) return;

    const handleNewMessage = (payload) => {
      const isActive = payload.conversation === activeIdRef.current;
      const isOwnMessage = payload.sender.id === user?.id;

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === payload.conversation);
        if (!exists) return prev; // conversation list will refresh on next visit/new chat
        return prev
          .map((c) =>
            c.id === payload.conversation
              ? {
                  ...c,
                  lastMessageText: payload.text,
                  lastMessageAt: payload.createdAt,
                  unreadCount:
                    isActive || isOwnMessage ? c.unreadCount : c.unreadCount + 1,
                }
              : c
          )
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
      });

      if (isActive) {
        setMessages((prev) =>
          prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]
        );
      } else if (!isOwnMessage) {
        dispatch(incrementUnread(1));
      }
    };

    const handleTyping = ({ conversationId, isTyping }) => {
      if (conversationId !== activeIdRef.current) return;
      setTypingUser(isTyping);
      if (isTyping) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(false), 3000);
      }
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [token, user?.id, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (conversation) => {
    setActiveId(conversation.id);
    setNewChatOpen(false);
    setLoadingThread(true);
    try {
      const res = await axiosClient.get(`/messages/conversations/${conversation.id}/messages`);
      setMessages(res.data);
      if (conversation.unreadCount) {
        dispatch(decrementUnread(conversation.unreadCount));
        setConversations((prev) =>
          prev.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (error) {
      showToast("Could not load messages", "error");
    } finally {
      setLoadingThread(false);
    }
  };

  const startChatWith = async (contact) => {
    try {
      const res = await axiosClient.post("/messages/conversations", { userId: contact.id });
      const conv = res.data;
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      openConversation(conv);
    } catch (error) {
      showToast("Could not start conversation", "error");
    }
  };

  const emitTyping = (isTyping) => {
    const socket = getSocket(token);
    if (!socket || !activeConversation) return;
    socket.emit("typing", {
      conversationId: activeConversation.id,
      recipientId: activeConversation.otherUser.id,
      isTyping,
    });
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeConversation || sending) return;

    setSending(true);
    setText("");
    emitTyping(false);
    try {
      const res = await axiosClient.post(
        `/messages/conversations/${activeConversation.id}/messages`,
        { text: trimmed }
      );
      setMessages((prev) => (prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]));
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === activeConversation.id
              ? { ...c, lastMessageText: res.data.text, lastMessageAt: res.data.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
      );
    } catch (error) {
      showToast("Message could not be sent", "error");
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const existingContactIds = new Set(conversations.map((c) => c.otherUser?.id));

  return (
    <AppLayout title="Inbox">
      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {/* Conversation list */}
        <div className="flex w-full max-w-xs shrink-0 flex-col border-r border-line">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-sm font-bold text-ink">Chats</h2>
            <button
              onClick={() => setNewChatOpen((v) => !v)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-blueprint hover:bg-paper"
            >
              + New
            </button>
          </div>

          {newChatOpen && (
            <div className="max-h-56 overflow-y-auto border-b border-line bg-paper/60">
              {contacts.length === 0 && (
                <p className="px-4 py-3 text-xs text-ink-muted">No other users yet.</p>
              )}
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => startChatWith(c)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-white"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blueprint to-marker text-xs font-bold text-white">
                    {initialsOf(c.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.username}</p>
                    <p className="truncate text-xs capitalize text-ink-muted">{c.role}</p>
                  </div>
                  {existingContactIds.has(c.id) && (
                    <span className="ml-auto shrink-0 text-xs text-ink-muted">chat exists</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && !newChatOpen && (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">
                No conversations yet. Tap "+ New" to message someone.
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c)}
                className={`flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition ${
                  activeId === c.id ? "bg-paper" : "hover:bg-paper/60"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blueprint to-marker text-sm font-bold text-white">
                  {initialsOf(c.otherUser?.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.otherUser?.username}
                    </p>
                    <span className="shrink-0 text-[11px] text-ink-muted">
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-ink-muted">
                    {c.lastMessageText || "Say hi 👋"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-marker px-1.5 text-[11px] font-bold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-1 flex-col">
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blueprint to-marker text-xs font-bold text-white">
                  {initialsOf(activeConversation.otherUser?.username)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {activeConversation.otherUser?.username}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {typingUser ? "typing..." : activeConversation.otherUser?.role}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <p className="text-center text-sm text-ink-muted">Loading...</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m) => {
                      const mine = m.sender?.id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                              mine
                                ? "rounded-br-sm bg-linear-to-r from-blueprint to-blueprint-dark text-white"
                                : "rounded-bl-sm bg-paper text-ink"
                            }`}
                          >
                            <p className="whitespace-pre-wrap-break-word">{m.text}</p>
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? "text-white/70" : "text-ink-muted"
                              }`}
                            >
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line p-3">
                <input
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-blueprint"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="rounded-lg bg-linear-to-r from-blueprint to-blueprint-dark px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Inbox;