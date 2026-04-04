"use client";

import { useEffect, useState, CSSProperties } from "react";
import { socket } from "@/lib/socket";

type Message = {
  id: number;
  text: string;
  sender: "user" | "agent";
};

export default function SupportContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    socket.connect();

    // get or create unique room
    let roomId = localStorage.getItem("support-room");

    if (!roomId) {
      roomId = "room-" + Date.now();
      localStorage.setItem("support-room", roomId);
    }

    // join room
    socket.emit("join-room", roomId);

    socket.on("chat-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("chat-message");
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;

    const roomId =
      localStorage.getItem("support-room")!;

    const msg: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("chat-message", {
      roomId,
      message: msg,
    });

    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Customer Support
      </div>

      <div style={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              ...(msg.sender === "user"
                ? styles.user
                : styles.agent),
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Type your message..."
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage()
          }
        />

        <button
          style={styles.button}
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    padding: 16,
    background: "#0f172a",
    color: "white",
    fontWeight: 600,
  },

  messages: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    background: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
  },

  message: {
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 10,
    maxWidth: "70%",
  },

  user: {
    marginLeft: "auto",
    background: "#2563eb",
    color: "white",
  },

  agent: {
    background: "white",
    border: "1px solid #e2e8f0",
  },

  inputBox: {
    display: "flex",
    padding: 12,
    borderTop: "1px solid #e2e8f0",
    gap: 8,
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },

  button: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6,
  },
};