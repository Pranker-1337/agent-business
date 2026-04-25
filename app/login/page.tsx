"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserByEmail, verifyPassword, generateId } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("agent_business_session");
    if (session) router.push("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Заполните все поля");

    setLoading(true);
    try {
      const user = getUserByEmail(email);
      if (!user) return setError("Пользователь не найден");
      if (!verifyPassword(password, user.passwordHash)) return setError("Неверный пароль");

      const sessionId = generateId();
      localStorage.setItem("agent_business_session", sessionId);
      localStorage.setItem("agent_business_user_email", email);
      router.push("/dashboard");
    } catch {
      setError("Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Вход</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Войдите в Agent Business</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Пароль</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ваш пароль"
              required
            />
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fee", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Нет аккаунта?</p>
          <button
            onClick={() => router.push("/register")}
            style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Зарегистрироваться →
          </button>
        </div>
      </div>
    </main>
  );
}