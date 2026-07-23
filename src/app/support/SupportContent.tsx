"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";
import { socket } from "@/lib/socket";

type Message = {
  id:        number;
  text:      string;
  sender:    "user" | "agent" | "system";
  roomId:    string;
  timestamp: number;
};

type ChatScreen = "name-entry" | "waiting" | "active" | "closed";

export default function SupportContent() {
  const [screen, setScreen]         = useState<ChatScreen>("name-entry");
  const [nameInput, setNameInput]   = useState("");
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [isTyping, setIsTyping]     = useState(false);

  const roomIdRef      = useRef<string>("");
  const bottomRef      = useRef<HTMLDivElement>(null);
  const typingTimeout  = useRef<NodeJS.Timeout | null>(null);

  /* ── SOCKET ── */
  useEffect(() => {
    socket.connect();

    socket.on("chat-history", (history: Message[]) => {
      setMessages(history);
    });

    socket.on("chat-status", (status: "waiting" | "active" | "closed") => {
      setScreen(status);
    });

    socket.on("chat-message", (msg: Message) => {
      if (msg.sender === "system" && msg.text.includes("connected with")) {
        setScreen("active");
      }
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("agent-typing", ({ isTyping: typing }: { isTyping: boolean }) => {
      setAgentTyping(typing);
    });

    socket.on("chat-closed", () => {
      setScreen("closed");
      setAgentTyping(false);
    });

    return () => {
      socket.off("chat-history");
      socket.off("chat-status");
      socket.off("chat-message");
      socket.off("agent-typing");
      socket.off("chat-closed");
    };
  }, []);

  /* ── AUTO SCROLL ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  /* ── START CHAT ── */
  const startChat = () => {
    const name = nameInput.trim();
    if (!name) return;

    let room = localStorage.getItem("support-room");
    if (!room) {
      room = "room-" + Date.now();
      localStorage.setItem("support-room", room);
    }
    roomIdRef.current = room;

    socket.emit("customer-join", {
      roomId:       room,
      customerId:   room,
      customerName: name,
    });

    setScreen("waiting");
  };

  /* ── TYPING ── */
  const handleTyping = (value: string) => {
    setInput(value);
    const roomId = roomIdRef.current;
    if (!roomId || screen !== "active") return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("customer-typing", { roomId, isTyping: true });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("customer-typing", { roomId, isTyping: false });
    }, 2000);
  };

  /* ── SEND MESSAGE ── */
  const sendMessage = () => {
    const roomId = roomIdRef.current;
    if (!input.trim() || !roomId || screen !== "active") return;

    const msg: Message = {
      id:        Date.now(),
      text:      input,
      sender:    "user",
      roomId,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("chat-message", { roomId, message: msg });

    // stop typing signal
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setIsTyping(false);
    socket.emit("customer-typing", { roomId, isTyping: false });

    setInput("");
  };

  /* ── NAME ENTRY SCREEN ── */
  if (screen === "name-entry") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>Customer Support</div>
        <div style={styles.nameScreen}>
          <div style={styles.nameCard}>
            <div style={styles.avatar}>💬</div>
            <h2 style={styles.nameTitle}>Welcome to Support</h2>
            <p style={styles.nameSubtitle}>Enter your name to start chatting with our team</p>
            <input
              style={styles.nameInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name..."
              onKeyDown={(e) => e.key === "Enter" && startChat()}
              autoFocus
            />
            <button
              style={{
                ...styles.nameButton,
                opacity: nameInput.trim() ? 1 : 0.6,
                cursor:  nameInput.trim() ? "pointer" : "not-allowed",
              }}
              onClick={startChat}
              disabled={!nameInput.trim()}
            >
              Start Chat →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bannerMap: Record<string, { text: string; bg: string }> = {
    waiting: { text: "⏳ Waiting for an agent...",      bg: "#d97706" },
    active:  { text: "🟢 Connected with support",       bg: "#16a34a" },
    closed:  { text: "🔴 This chat has ended",          bg: "#dc2626" },
  };
  const banner = bannerMap[screen] ?? bannerMap.waiting;

  return (
    <div style={styles.container}>
      <div style={styles.header}>Customer Support</div>

      <div style={{ ...styles.banner, background: banner.bg }}>
        {banner.text}
      </div>

      <div style={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              ...(msg.sender === "user"   ? styles.user   : {}),
              ...(msg.sender === "agent"  ? styles.agent  : {}),
              ...(msg.sender === "system" ? styles.system : {}),
            }}
          >
            <div>{msg.text}</div>
            {msg.sender !== "system" && (
              <div style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            )}
          </div>
        ))}

        {/* agent typing bubble */}
        {agentTyping && (
          <div style={styles.typingWrap}>
            <div style={styles.typingBubble}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.15s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.3s"  }} />
            </div>
          </div>
        )}

        {screen === "closed" && (
          <div style={styles.closedNote}>
            Session ended. Refresh the page to start a new conversation.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* typing bounce animation */}
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
      `}</style>

      <div style={styles.inputBox}>
        <input
          style={{ ...styles.input, opacity: screen === "active" ? 1 : 0.5 }}
          value={input}
          disabled={screen !== "active"}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder={
            screen === "active"  ? "Type your message..."        :
            screen === "waiting" ? "Please wait for an agent..." :
                                   "Chat has ended"
          }
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          style={{ ...styles.button, opacity: screen === "active" ? 1 : 0.5 }}
          disabled={screen !== "active"}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container:    { height: "100vh", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" },
  header:       { padding: "14px 16px", background: "#0f172a", color: "white", fontWeight: 600, fontSize: 15 },
  banner:       { padding: "6px 16px", color: "white", fontSize: 13, textAlign: "center", transition: "background 0.3s" },
  messages:     { flex: 1, padding: 16, overflowY: "auto", background: "#f1f5f9", display: "flex", flexDirection: "column", gap: 8 },
  message:      { padding: "10px 14px", borderRadius: 12, maxWidth: "72%", fontSize: 14, lineHeight: 1.5 },
  timestamp:    { fontSize: 10, opacity: 0.6, marginTop: 4 },
  user:         { alignSelf: "flex-end", background: "#2563eb", color: "white", borderBottomRightRadius: 4 },
  agent:        { alignSelf: "flex-start", background: "white", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4 },
  system:       { alignSelf: "center", background: "#fef9c3", color: "#854d0e", fontSize: 12, border: "1px solid #fde68a", borderRadius: 20, padding: "4px 16px", maxWidth: "90%", textAlign: "center" },
  typingWrap:   { alignSelf: "flex-start" },
  typingBubble: { background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "10px 14px", display: "flex", gap: 4, alignItems: "center" },
  dot:          { width: 7, height: 7, background: "#94a3b8", borderRadius: "50%", display: "inline-block", animation: "chatBounce 1s infinite" },
  closedNote:   { alignSelf: "center", color: "#94a3b8", fontSize: 12, marginTop: 8, textAlign: "center" },
  inputBox:     { display: "flex", padding: 12, borderTop: "1px solid #e2e8f0", gap: 8, background: "white" },
  input:        { flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" },
  button:       { padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 20, fontSize: 14, fontWeight: 600, cursor: "pointer" },

  // name entry
  nameScreen:   { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" },
  nameCard:     { background: "white", borderRadius: 20, padding: "36px 32px", width: 340, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.10)" },
  avatar:       { fontSize: 44, marginBottom: 14 },
  nameTitle:    { fontSize: 20, fontWeight: 700, marginBottom: 6, color: "#0f172a", textAlign: "center" },
  nameSubtitle: { fontSize: 14, color: "#64748b", marginBottom: 24, textAlign: "center", lineHeight: 1.5 },
  nameInput:    { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" },
  nameButton:   { width: "100%", padding: "13px", background: "#2563eb", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600 },
};