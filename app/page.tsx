"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("agent_business_session");
    if (session) {
      setIsLoggedIn(true);
    }
  }, []);

  if (isLoggedIn) {
    router.push("/dashboard");
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: "var(--color-text)" }}>
            Agent Business
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 16 }}>
            AI-советник для управления личными финансами
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            className="btn-primary"
            onClick={() => router.push("/login")}
            style={{ background: "var(--color-accent)" }}
          >
            Войти
          </button>
          <button
            className="btn-primary"
            onClick={() => router.push("/register")}
            style={{ background: "transparent", border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}
          >
            Создать аккаунт
          </button>
        </div>

        <div style={{ marginTop: 32, padding: 16, background: "var(--color-surface-secondary)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
            💡 AI поможет оптимизировать расходы и накопить на цели
          </p>
        </div>
      </div>
    </main>
  );
}