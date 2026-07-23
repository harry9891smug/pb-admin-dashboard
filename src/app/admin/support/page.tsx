"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "@/lib/socket";

/* ── swap with your real auth ── */
const MOCK_AGENT = {
  agentId: "agent-001",
  name:    "Raman",
  email:   "raman@promobandhu.com",
};

type AgentStatus = "available" | "busy" | "offline";

type Message = {
  id:        number;
  text:      string;
  sender:    "user" | "agent" | "system";
  roomId:    string;
  timestamp: number;
};

type Room = {
  roomId:          string;
  customerName:    string;
  assignedAgentId: string | null;
  messages:        Message[];
  status:          "waiting" | "active" | "closed";
  createdAt:       number;
  lastMessage?:    Message;
  unread:          number;
};

export default function SupportDashboardPage() {
  const [rooms, setRooms]               = useState<Map<string, Room>>(new Map());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [myStatus, setMyStatus]         = useState<AgentStatus>("available");
  const [agentList, setAgentList]       = useState<{ agentId: string; name: string; status: AgentStatus }[]>([]);
  const [typingRooms, setTypingRooms]   = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping]         = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);

  const activeRoomRef  = useRef<string | null>(null);
  const roomsRef       = useRef<Map<string, Room>>(new Map());
  const bottomRef      = useRef<HTMLDivElement>(null);
  const typingTimeout  = useRef<NodeJS.Timeout | null>(null);

  /* ─────────────────────────────────────────
     Atomic update — state + ref together
  ───────────────────────────────────────── */
  const updateRooms = useCallback((updater: (prev: Map<string, Room>) => Map<string, Room>) => {
    setRooms((prev) => {
      const next = updater(new Map(prev));
      roomsRef.current = next;
      return next;
    });
  }, []);

  /* ─────────────────────────────────────────
     SOCKET — single useEffect, all refs
  ───────────────────────────────────────── */
  useEffect(() => {
    socket.connect();
    socket.emit("agent-register", MOCK_AGENT);

    /* new chat assigned to this agent */
    socket.on("chat-assigned", (data: {
      roomId:       string;
      customerName: string;
      createdAt:    number;
      messages:     Message[];
    }) => {
      updateRooms((prev) => {
        const map = new Map(prev);
        map.set(data.roomId, {
          roomId:          data.roomId,
          customerName:    data.customerName,
          assignedAgentId: MOCK_AGENT.agentId,
          messages:        data.messages,
          status:          "active",
          createdAt:       data.createdAt,
          unread:          activeRoomRef.current === data.roomId ? 0 : 1,
        });
        return map;
      });

      // auto-open if no chat is open
      if (!activeRoomRef.current) {
        activeRoomRef.current = data.roomId;
        setActiveRoomId(data.roomId);
        setMessages(data.messages);
      }
    });

    /* ✅ real-time message — reads activeRoomRef not stale state */
    socket.on("chat-message", (msg: Message) => {
      const isActive = activeRoomRef.current === msg.roomId;

      updateRooms((prev) => {
        const map  = new Map(prev);
        const room = map.get(msg.roomId);
        if (!room) return map;
        map.set(msg.roomId, {
          ...room,
          messages:    [...room.messages, msg],
          lastMessage: msg,
          unread:      isActive ? 0 : (room.unread ?? 0) + 1,
        });
        return map;
      });

      // ✅ directly push to visible messages if room is open
      if (isActive) {
        setMessages((prev) => [...prev, msg]);
        // clear customer typing when message arrives
        setCustomerTyping(false);
      }
    });

    /* reconnect restore */
    socket.on("rooms-list", (list: Room[]) => {
      updateRooms(() => {
        const map = new Map<string, Room>();
        list.forEach((r) => map.set(r.roomId, { ...r, unread: 0 }));
        return map;
      });
    });

    /* agent list */
    socket.on("agent-list", (list: { agentId: string; name: string; status: AgentStatus }[]) => {
      setAgentList(list);
    });

    /* chat closed */
    socket.on("chat-closed", ({ roomId }: { roomId: string }) => {
      // show closed state briefly then remove from sidebar
      updateRooms((prev) => {
        const map  = new Map(prev);
        const room = map.get(roomId);
        if (room) map.set(roomId, { ...room, status: "closed" });
        return map;
      });

      if (activeRoomRef.current === roomId) {
        setMessages((prev) => [...prev]);
      }

      // remove from sidebar after 3s
      setTimeout(() => {
        updateRooms((prev) => {
          const map = new Map(prev);
          map.delete(roomId);
          return map;
        });
        if (activeRoomRef.current === roomId) {
          activeRoomRef.current = null;
          setActiveRoomId(null);
          setMessages([]);
          setCustomerTyping(false);
        }
      }, 3000);
    });

    /* customer typing */
    socket.on("customer-typing", ({ roomId, isTyping: typing }: { roomId: string; isTyping: boolean }) => {
      // update sidebar typing indicator
      setTypingRooms((prev) => {
        const next = new Set(prev);
        typing ? next.add(roomId) : next.delete(roomId);
        return next;
      });

      // update chat typing bubble if this room is open
      if (activeRoomRef.current === roomId) {
        setCustomerTyping(typing);
      }
    });

    return () => {
      socket.off("chat-assigned");
      socket.off("chat-message");
      socket.off("rooms-list");
      socket.off("agent-list");
      socket.off("chat-closed");
      socket.off("customer-typing");
      socket.disconnect();
    };
  }, [updateRooms]);

  /* auto scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, customerTyping]);

  /* ── SWITCH ROOM ── */
  const switchRoom = (room: Room) => {
    // always read fresh from ref
    const fresh = roomsRef.current.get(room.roomId) ?? room;

    activeRoomRef.current = fresh.roomId;
    setActiveRoomId(fresh.roomId);
    setMessages(fresh.messages);
    setCustomerTyping(typingRooms.has(fresh.roomId));

    // clear unread
    updateRooms((prev) => {
      const map = new Map(prev);
      const r   = map.get(fresh.roomId);
      if (r) map.set(fresh.roomId, { ...r, unread: 0 });
      return map;
    });

    socket.emit("agent-mark-seen", fresh.roomId);
  };

  /* ── TYPING ── */
  const handleTyping = (value: string) => {
    setInput(value);
    const roomId = activeRoomRef.current;
    if (!roomId) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("agent-typing", { roomId, isTyping: true });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("agent-typing", { roomId, isTyping: false });
    }, 2000);
  };

  /* ── SEND MESSAGE ── */
  const sendMessage = () => {
    const roomId = activeRoomRef.current;
    if (!input.trim() || !roomId) return;

    const room = roomsRef.current.get(roomId);
    if (room?.status !== "active") return;

    const msg: Message = {
      id:        Date.now(),
      text:      input,
      sender:    "agent",
      roomId,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
    updateRooms((prev) => {
      const map = new Map(prev);
      const r   = map.get(roomId);
      if (r) map.set(roomId, { ...r, lastMessage: msg, messages: [...r.messages, msg] });
      return map;
    });

    socket.emit("chat-message", { roomId, message: msg });

    // stop typing
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    setIsTyping(false);
    socket.emit("agent-typing", { roomId, isTyping: false });

    setInput("");
  };

  /* ── TOGGLE STATUS ── */
  const toggleStatus = () => {
    const next: AgentStatus = myStatus === "available" ? "busy" : "available";
    setMyStatus(next);
    socket.emit("agent-set-status", next);
  };

  /* ── CLOSE CHAT ── */
  const closeChat = () => {
    const roomId = activeRoomRef.current;
    if (!roomId) return;
    socket.emit("agent-close-chat", roomId);
  };

  /* ── DERIVED ── */
  const roomList = [...rooms.values()]
    .filter((r) => r.status !== "closed")
    .sort((a, b) =>
      (b.lastMessage?.timestamp ?? b.createdAt) -
      (a.lastMessage?.timestamp ?? a.createdAt)
    );

  const activeRoom = activeRoomId ? rooms.get(activeRoomId) : null;

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("en-IN", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
      `}</style>

      <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">

        {/* ══════════ SIDEBAR ══════════ */}
        <div className="w-80 border-r flex flex-col shrink-0">

          {/* agent header */}
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{MOCK_AGENT.name}</p>
              <p className="text-xs text-zinc-500 truncate">{MOCK_AGENT.email}</p>
            </div>
            <button
              onClick={toggleStatus}
              className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium border transition-colors ${
                myStatus === "available"
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "bg-yellow-50 text-yellow-700 border-yellow-300"
              }`}
            >
              {myStatus === "available" ? "🟢 Available" : "🟡 Busy"}
            </button>
          </div>

          {/* agents online */}
          <div className="px-4 pt-3 pb-2 border-b">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              Agents Online
            </p>
            {agentList.length === 0 && (
              <p className="text-xs text-zinc-400">No agents online</p>
            )}
            {agentList.map((a) => (
              <div key={a.agentId} className="flex items-center gap-2 text-xs py-0.5">
                <span>
                  {a.status === "available" ? "🟢" : a.status === "busy" ? "🟡" : "⚪"}
                </span>
                <span className="font-medium">{a.name}</span>
                <span className="text-zinc-400 ml-auto capitalize">{a.status}</span>
              </div>
            ))}
          </div>

          {/* conversation list */}
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
              Active Chats ({roomList.length})
            </p>

            {roomList.length === 0 && (
              <div className="px-4 mt-6 text-center">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-zinc-400">No active chats</p>
                <p className="text-xs text-zinc-300 mt-1">Waiting for customers...</p>
              </div>
            )}

            {roomList.map((room) => (
              <div
                key={room.roomId}
                onClick={() => switchRoom(room)}
                className={`px-4 py-3 cursor-pointer border-b transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  activeRoomId === room.roomId
                    ? "bg-blue-50 dark:bg-zinc-800 border-l-2 border-l-blue-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  {/* name + unread */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-semibold truncate">{room.customerName}</p>
                    {room.unread > 0 && (
                      <span className="shrink-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                        {room.unread > 9 ? "9+" : room.unread}
                      </span>
                    )}
                  </div>

                  {/* typing badge */}
                  {typingRooms.has(room.roomId) ? (
                    <span className="text-[10px] text-blue-500 shrink-0 font-medium">typing…</span>
                  ) : (
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {formatTime(room.lastMessage?.timestamp ?? room.createdAt)}
                    </span>
                  )}
                </div>

                {/* date */}
                <p className="text-[11px] text-zinc-400 mb-0.5">
                  {formatDate(room.createdAt)}
                </p>

                {/* last message preview */}
                <p className="text-xs text-zinc-400 truncate">
                  {room.lastMessage
                    ? `${room.lastMessage.sender === "agent" ? "You: " : ""}${room.lastMessage.text}`
                    : "Chat started"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════ CHAT AREA ══════════ */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* header */}
          <div className="border-b p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {activeRoom?.customerName ?? "No active chat"}
              </p>
              {activeRoom && (
                <p className="text-xs text-zinc-400">
                  Started {formatDate(activeRoom.createdAt)}
                </p>
              )}
            </div>
            {activeRoom?.status === "active" && (
              <button
                onClick={closeChat}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors font-medium"
              >
                End Chat
              </button>
            )}
            {activeRoom?.status === "closed" && (
              <span className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-500 border">
                Chat Ended
              </span>
            )}
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50 dark:bg-zinc-950">
            {!activeRoom ? (
              <div className="text-center mt-20">
                <p className="text-3xl mb-3">👋</p>
                <p className="text-zinc-400 text-sm">Select a conversation from the sidebar</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "agent"  ? "justify-end"   :
                      msg.sender === "system" ? "justify-center" :
                                                "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 text-sm ${
                        msg.sender === "agent"
                          ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                          : msg.sender === "system"
                          ? "bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-full px-5"
                          : "bg-white border dark:bg-zinc-800 rounded-2xl rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.sender !== "system" && (
                        <p className={`text-[10px] mt-1 ${
                          msg.sender === "agent" ? "text-blue-200 text-right" : "text-zinc-400"
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* customer typing bubble */}
                {customerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            style={{
                              width: 7, height: 7,
                              background: "#94a3b8",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: `chatBounce 1s infinite ${delay}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeRoom.status === "closed" && (
                  <p className="text-center text-xs text-zinc-400 py-4">
                    This chat has ended
                  </p>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          <div className="border-t p-3 flex gap-2 items-center bg-white dark:bg-zinc-900">
            <input
              value={input}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder={
                activeRoom?.status === "active" ? "Type a reply..."  :
                activeRoom?.status === "closed" ? "Chat has ended"   :
                                                  "Select a chat to reply"
              }
              disabled={activeRoom?.status !== "active"}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none dark:bg-zinc-800 disabled:opacity-50 focus:border-blue-400 transition-colors"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={activeRoom?.status !== "active" || !input.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
}