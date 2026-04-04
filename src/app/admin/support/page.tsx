"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

type Message = {
  id: number;
  text: string;
  sender: "user" | "agent";
  roomId: string;
};

export default function SupportDashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  /* ===============================
     SOCKET CONNECT
  =============================== */

  useEffect(() => {
    socket.connect();

    socket.on("chat-message", (msg: Message) => {
      // set active room automatically
      if (!activeRoom) {
        setActiveRoom(msg.roomId);
      }

      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, [activeRoom]);

  /* ===============================
     SEND MESSAGE
  =============================== */

  const sendMessage = () => {
    if (!input.trim() || !activeRoom) return;

    const msg: Message = {
      id: Date.now(),
      text: input,
      sender: "agent",
      roomId: activeRoom,
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("chat-message", {
      roomId: activeRoom,
      message: msg,
    });

    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">
      
      {/* LEFT SIDEBAR */}
      <div className="w-80 border-r">
        <div className="p-4 font-semibold border-b">
          Conversations
        </div>

        <div className="p-4 text-sm text-zinc-500">
          Live Chat
        </div>
      </div>

      {/* RIGHT CHAT */}
      <div className="flex flex-1 flex-col">
        
        {/* HEADER */}
        <div className="border-b p-4 font-medium">
          Customer Chat
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50 dark:bg-zinc-950">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                msg.sender === "agent"
                  ? "ml-auto bg-blue-600 text-white"
                  : "bg-white border dark:bg-zinc-800"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Reply..."
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none dark:bg-zinc-900"
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
          />

          <button
            onClick={sendMessage}
            className="rounded-md bg-blue-600 px-4 py-2 text-white text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}