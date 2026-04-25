"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser, getUserByEmail, verifyPassword, generateId } from "@/lib/storage";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("agent_business_session");
    if (session) router.push("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Введите имя");
    if (!email.includes("@")) return setError("Введите корректный email");
    if (password.length < 6) return setError("Пароль минимум 6 символов");
    if (password !== confirm) return setError("Пароли не совпадают");

    setLoading(true);
    try {
      createUser(email, name, password);
      const sessionId = generateId();
      localStorage.setItem("agent_business_session", sessionId);
      localStorage.setItem("agent_business_user_email", email);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Регистрация</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>Создайте аккаунт Agent Business</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Имя</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
          </div>

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
              placeholder="Минимум 6 символов"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Подтверждение</label>
            <input
              type="password"
              className="input-field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Повторите пароль"
              required
            />
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fee", borderRadius: "var(--radius-md)", color: "var(--color-danger)", fontSize: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Создание..." : "Создать аккаунт"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Уже есть аккаунт?</p>
          <button
            onClick={() => router.push("/login")}
            style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Войти →
          </button>
        </div>
      </div>
    </main>
  );
}