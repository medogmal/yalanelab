"use client";
import { useCallback, useEffect, useState } from "react";

type ChatMessage = { id: string; user: string; text: string; at: number };

export default function ChatRoom({ room }: { room: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState("مشاهد");

  const load = useCallback(() => {
    fetch(`/api/chat?room=${encodeURIComponent(room)}`)
      .then((r) => r.json())
      .then(setMessages);
  }, [room]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [room, load]);

  function send() {
    fetch(`/api/chat?room=${encodeURIComponent(room)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text }),
    }).then(() => {
      setText("");
      load();
    });
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-lg font-semibold mb-3">الدردشة</div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id}>
            <span className="font-medium">{m.user}:</span> <span>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          className="w-32 border rounded px-2 py-1"
          placeholder="الاسم"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          className="flex-1 border rounded px-2 py-1"
          placeholder="اكتب رسالة..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={send}>
          إرسال
        </button>
      </div>
    </div>
  );
}
