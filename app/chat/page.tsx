"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserByEmail, getChatMessages, addChatMessage, getFinancesByUserId, generateId } from "@/lib/storage";
import { analyzeExpenses } from "@/lib/finance";
import { generateChatResponse } from "@/lib/gemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId] = useState(() => generateId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadData = useCallback(() => {
    const email = localStorage.getItem("agent_business_user_email");
    if (!email) {
      router.push("/login");
      return;
    }
    const userData = getUserByEmail(email);
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser({ id: userData.id, email: userData.email, name: userData.name });

    const stored = getChatMessages(sessionId);
    setMessages(
      stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }))
    );
  }, [router, sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setError("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    addChatMessage({ sessionId, role: "user", content: userMessage, timestamp: userMsg.timestamp });

    setLoading(true);
    try {
      const finances = user ? getFinancesByUserId(user.id) : [];
      const analysis = analyzeExpenses(finances);

      const reply = await generateChatResponse(
        messages.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        userMessage,
        {
          totalIncome: analysis.totalIncome,
          totalExpenses: analysis.totalExpenses,
          balance: analysis.balance,
          savingsRate: analysis.savingsRate,
        }
      );

      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: reply.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      addChatMessage({ sessionId, role: "assistant", content: reply.reply, timestamp: assistantMsg.timestamp });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Ошибка";
      setError(errMsg);
      const failMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `Извините, произошла ошибка: ${errMsg}. Попробуйте переформулировать вопрос.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failMsg]);
      addChatMessage({ sessionId, role: "assistant", content: failMsg.content, timestamp: failMsg.timestamp });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--color-surface)", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>AI Financial Advisor</span>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>Gemini-powered assistant</p>
          </div>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}>
          ← Назад
        </button>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Привет, {user?.name || "друг"}!</h2>
            <p style={{ color: "var(--color-text-secondary)", maxWidth: 400, margin: "0 auto" }}>
              Я помогу вам управлять финансами. Спросите что-нибудь — например, &quot;на что тратить деньги?&quot; или &quot;как накопить на ПК?&quot;
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
              {["Как оптимизировать расходы?", "Сколько откладывать?", "Какие траты урезать?"].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid #d2d2d7", background: "var(--color-surface)", cursor: "pointer", fontSize: 13 }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius: "var(--radius-lg)",
                background: msg.role === "user" ? "var(--color-accent)" : "var(--color-surface)",
                color: msg.role === "user" ? "white" : "var(--color-text)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--color-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                fontSize: 16,
              }}
            >
              🤖
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    animation: `bounce 1.4s infinite ease-in-out ${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--color-surface)",
          padding: "12px 16px",
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Спросите что-нибудь..."
          rows={1}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "1px solid #d2d2d7",
            borderRadius: "var(--radius-lg)",
            fontSize: 15,
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
            lineHeight: 1.4,
            maxHeight: 120,
            overflow: "auto",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-lg)",
            border: "none",
            background: input.trim() && !loading ? "var(--color-accent)" : "#ccc",
            color: "white",
            fontWeight: 600,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontSize: 15,
            transition: "background 0.2s",
          }}
        >
          {loading ? "..." : "→"}
        </button>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}