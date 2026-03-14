"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePlatformStore } from "@/lib/platform/store";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Message = {
  id:        string;
  user:      string;
  text:      string;
  at:        number;
  room:      string;
  avatar?:   string;
  isSystem?: boolean;
};

const CHANNELS = [
  { id: "global",   label: "🌍 عام"       },
  { id: "domino",   label: "🁣 دومينو"    },
  { id: "baloot",   label: "🃏 بلوت"      },
  { id: "chess",    label: "♟ شطرنج"     },
  { id: "ludo",     label: "🎲 لودو"      },
];

const EMOJI_SHORTCUTS = ["😂","🔥","👑","💯","🎮","🏆","😎","❤️","👍","🥇"];

const SYSTEM_MSGS: Record<string, string[]> = {
  global:  ["مرحباً في المجتمع! 🎮", "أهلاً وسهلاً بالجميع"],
  domino:  ["من يريد مباراة دومينو؟ 🁣", "انضم لطاولة الدومينو الآن!"],
  baloot:  ["البلوت السعودي يبدأ! 🃏", "نحتاج لاعبَيْن للبلوت"],
  chess:   ["تحدي الشطرنج! ♟", "من يجرؤ على مواجهتي؟"],
  ludo:    ["لودو مع العيلة! 🎲", "أهلاً في طاولة اللودو"],
};

/* ══════════════════════════════════════════════════════════════
   MOCK AVATARS (لو مفيش avatar حقيقي)
══════════════════════════════════════════════════════════════ */
const AVATARS = ["🦁","🤖","👸","🦅","🐯","🦊","🐉","⚡","🌙","🔥"];
function getAvatar(name: string): string {
  const code = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATARS[code % AVATARS.length];
}

/* ══════════════════════════════════════════════════════════════
   COMMUNITY CHAT COMPONENT
══════════════════════════════════════════════════════════════ */
export default function CommunityChat() {
  const { user } = usePlatformStore();

  const [channel,    setChannel]    = useState("global");
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [showEmoji,  setShowEmoji]  = useState(false);
  const [onlineCount,setOnlineCount]= useState(1247);
  const [typingUsers,setTypingUsers]= useState<string[]>([]);

  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load messages ── */
  const loadMessages = useCallback(async () => {
    try {
      const res  = await fetch(`/api/chat?room=${channel}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        // أضف system message لو الـ channel فاضي
        if (data.length === 0) {
          const systemMsgs = SYSTEM_MSGS[channel] ?? [];
          const systemList: Message[] = systemMsgs.map((text, i) => ({
            id:        `sys-${i}`,
            user:      "النظام",
            text,
            at:        Date.now() - (systemMsgs.length - i) * 60_000,
            room:      channel,
            isSystem:  true,
          }));
          setMessages(systemList);
        } else {
          setMessages(data);
        }
      }
    } catch {/* ignore */}
  }, [channel]);

  useEffect(() => {
    setMessages([]);
    loadMessages();

    // Poll كل 4 ثانية
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(loadMessages, 4_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [channel, loadMessages]);

  /* ── Auto scroll ── */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ── Fake online count ── */
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount(c => c + Math.floor((Math.random() - 0.5) * 10));
    }, 8_000);
    return () => clearInterval(t);
  }, []);

  /* ── Send message ── */
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const senderName = user?.name ?? "ضيف";

    // Optimistic UI
    const optimistic: Message = {
      id:   `opt-${Date.now()}`,
      user: senderName,
      text,
      at:   Date.now(),
      room: channel,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput("");
    setShowEmoji(false);
    setSending(true);

    try {
      await fetch(`/api/chat?room=${channel}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user: senderName, text }),
      });
      await loadMessages();
    } catch {/* keep optimistic */}
    finally { setSending(false); }
  }

  function addEmoji(emoji: string) {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  }

  const filteredMsgs = messages.filter(m => !m.room || m.room === channel || m.isSystem);
  const isLoggedIn   = !!user && user.id !== "guest_001";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
      background: "rgba(5,8,24,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(0,212,255,0.12)",
      borderRadius: 20,
      fontFamily: "var(--font-cairo), sans-serif",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        flexShrink: 0,
        padding: "12px 14px 10px",
        borderBottom: "1px solid rgba(0,212,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(2,3,16,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}>💬</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#fff" }}>
              {CHANNELS.find(c => c.id === channel)?.label ?? "عام"}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,212,255,0.4)", marginTop: 1 }}>
              مجتمع يالا نلعب
            </div>
          </div>
        </div>

        {/* Online count */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 99,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.18)",
          fontSize: 10, fontWeight: 800, color: "#22c55e",
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#22c55e", boxShadow: "0 0 5px #22c55e",
            animation: "pulse-dot 1.5s ease-in-out infinite",
          }}/>
          {onlineCount.toLocaleString()}
        </div>
      </div>

      {/* ── CHANNEL TABS ── */}
      <div style={{
        flexShrink: 0,
        display: "flex", overflowX: "auto", gap: 6,
        padding: "8px 10px 6px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        scrollbarWidth: "none",
      }}>
        {CHANNELS.map(ch => {
          const isActive = ch.id === channel;
          return (
            <motion.button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              whileTap={{ scale: 0.92 }}
              style={{
                flexShrink: 0,
                padding: "4px 10px", borderRadius: 8,
                fontSize: 10, fontWeight: 900,
                cursor: "pointer",
                background: isActive ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: isActive ? "#00d4ff" : "rgba(255,255,255,0.35)",
                transition: "all .2s",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
              }}
            >
              {ch.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── MESSAGES ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto", overflowX: "hidden",
          padding: "10px 12px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(0,212,255,0.2) transparent",
        }}
      >
        <AnimatePresence initial={false}>
          {filteredMsgs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "32px 16px",
                fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}
            >
              لا توجد رسائل بعد — كن أول من يتحدث! 💬
            </motion.div>
          ) : (
            filteredMsgs.map((msg, i) => {
              const isMe     = msg.user === (user?.name ?? "");
              const isSystem = msg.isSystem;
              const avatar   = msg.avatar ?? getAvatar(msg.user);

              if (isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      textAlign: "center", margin: "8px 0",
                      fontSize: 10, fontWeight: 700,
                      color: "rgba(0,212,255,0.45)",
                      padding: "4px 12px", borderRadius: 99,
                      background: "rgba(0,212,255,0.04)",
                      border: "1px solid rgba(0,212,255,0.08)",
                      display: "inline-block", width: "auto",
                      marginLeft: "auto", marginRight: "auto",
                    }}
                  >
                    {msg.text}
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i < 5 ? i * 0.03 : 0 }}
                  style={{
                    display: "flex",
                    flexDirection: isMe ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  {/* Avatar */}
                  {!isMe && (
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      {avatar}
                    </div>
                  )}

                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                  }}>
                    {/* Sender name */}
                    {!isMe && (
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        color: "rgba(0,212,255,0.6)",
                        marginBottom: 3,
                      }}>{msg.user}</span>
                    )}

                    {/* Bubble */}
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      fontSize: 13, fontWeight: 600, lineHeight: 1.5,
                      background: isMe
                        ? "linear-gradient(135deg,rgba(0,212,255,0.25),rgba(0,212,255,0.15))"
                        : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMe ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.07)"}`,
                      color: "#fff",
                      wordBreak: "break-word",
                    }}>
                      {msg.text}
                    </div>

                    {/* Time */}
                    <span style={{
                      fontSize: 9, color: "rgba(255,255,255,0.22)",
                      marginTop: 3, fontWeight: 600,
                    }}>
                      {new Date(msg.at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
            {[0,1,2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(0,212,255,0.5)" }}
              />
            ))}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
              يكتب...
            </span>
          </div>
        )}
      </div>

      {/* ── INPUT ── */}
      <div style={{
        flexShrink: 0,
        padding: "8px 10px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(2,3,16,0.6)",
        position: "relative",
      }}>
        {/* Emoji picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              style={{
                position: "absolute", bottom: "100%", right: 10, left: 10,
                marginBottom: 6,
                padding: "10px",
                borderRadius: 14,
                background: "rgba(5,8,24,0.98)",
                border: "1px solid rgba(0,212,255,0.15)",
                backdropFilter: "blur(20px)",
                display: "flex", flexWrap: "wrap", gap: 6,
                zIndex: 50,
              }}
            >
              {EMOJI_SHORTCUTS.map(e => (
                <button key={e} onClick={() => addEmoji(e)} style={{
                  fontSize: 22, cursor: "pointer", background: "none",
                  border: "none", padding: "2px 4px", borderRadius: 8,
                  transition: "transform .15s",
                }}>
                  {e}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoggedIn ? (
          <div style={{
            textAlign: "center", padding: "10px 16px",
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)",
          }}>
            <a href="/auth/login" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 900 }}>
              سجّل دخولك
            </a>{" "}
            للمشاركة في الدردشة
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Emoji button */}
            <button
              type="button"
              onClick={() => setShowEmoji(v => !v)}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, cursor: "pointer",
                background: showEmoji ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", fontFamily: "inherit",
              }}
            >😊</button>

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`اكتب في ${CHANNELS.find(c => c.id === channel)?.label ?? "عام"}...`}
              maxLength={200}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(0,212,255,0.14)",
                color: "#fff", fontSize: 13, fontWeight: 600,
                fontFamily: "inherit", outline: "none",
                transition: "border-color .2s",
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(0,212,255,0.4)"}
              onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "rgba(0,212,255,0.14)"}
            />

            {/* Send button */}
            <motion.button
              type="submit"
              disabled={!input.trim() || sending}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, cursor: input.trim() ? "pointer" : "not-allowed",
                background: input.trim()
                  ? "linear-gradient(135deg,#00d4ff,#0099cc)"
                  : "rgba(255,255,255,0.05)",
                border: "none",
                color: input.trim() ? "#000" : "rgba(255,255,255,0.2)",
                transition: "all .2s", fontFamily: "inherit",
                opacity: sending ? 0.6 : 1,
              }}
            >
              {sending ? "⏳" : "↑"}
            </motion.button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.6);}
          50%    {box-shadow:0 0 0 5px rgba(34,197,94,0);}
        }
      `}</style>
    </div>
  );
}
