"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserByEmail, getFinancesByUserId, addFinance, deleteFinance } from "@/lib/storage";
import { categorizeExpense, formatCurrency, formatDate, getCategoryLabel, calculateMonthlyData, analyzeExpenses } from "@/lib/finance";
import type { StoredFinance } from "@/lib/storage";
import type { ExpenseCategory } from "@/types";

const CATEGORIES: ExpenseCategory[] = ["housing", "food", "transport", "healthcare", "entertainment", "subscriptions", "utilities", "education", "savings", "other"];

export default function FinancesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [finances, setFinances] = useState<StoredFinance[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "income">("other");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");
  const [formError, setFormError] = useState("");

  const loadData = useCallback(() => {
    const email = localStorage.getItem("agent_business_user_email");
    if (!email) { router.push("/login"); return; }
    const userData = getUserByEmail(email);
    if (!userData) { router.push("/login"); return; }
    setUser({ id: userData.id });
    setFinances(getFinancesByUserId(userData.id));
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError("");
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) return setFormError("Введите сумму");
    if (!description.trim()) return setFormError("Введите описание");

    const autoCategory = type === "income" ? "income" : categorizeExpense(description);

    addFinance({
      userId: user.id,
      type,
      amount: numAmount,
      description: description.trim(),
      category: autoCategory,
      date: new Date(date).toISOString(),
    });

    setAmount(""); setDescription(""); setCategory("other");
    setShowModal(false);
    loadData();
  }

  function handleDelete(id: string) {
    if (!confirm("Удалить запись?")) return;
    deleteFinance(id, user!.id);
    loadData();
  }

  const analysis = analyzeExpenses(finances);
  const monthlyData = calculateMonthlyData(finances, 6);
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expenses)), 1);

  const grouped = finances.reduce((acc, f) => {
    const key = f.date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {} as Record<string, StoredFinance[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--color-surface)", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>💳</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Финансы</span>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}>← Назад</button>
      </header>

      <div style={{ background: "var(--color-surface)", padding: "8px 16px", display: "flex", gap: 8, borderBottom: "1px solid #eee" }}>
        {(["list", "add"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              background: activeTab === tab ? "var(--color-accent)" : "transparent",
              color: activeTab === tab ? "white" : "var(--color-text-secondary)",
            }}
          >
            {tab === "list" ? "📋 Записи" : "➕ Добавить"}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, padding: 16, maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {activeTab === "add" && (
          <div className="card">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Добавить запись</h2>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategory("other"); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "var(--radius-md)",
                      border: "2px solid",
                      borderColor: type === t ? (t === "income" ? "var(--color-success)" : "var(--color-danger)") : "#ddd",
                      background: type === t ? (t === "income" ? "#e8f5e9" : "#ffebee") : "transparent",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                      color: type === t ? (t === "income" ? "var(--color-success)" : "var(--color-danger)") : "var(--color-text-secondary)",
                    }}
                  >
                    {t === "income" ? "💵 Доход" : "💸 Расход"}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Сумма (₽)</label>
                  <input className="input-field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1500" required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Дата</label>
                  <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Описание</label>
                <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Продукты в Пятёрочке" required />
              </div>

              {type === "expense" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Категория (авто)</label>
                  <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                    <option value="other">📦 Прочее (авто)</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{getCategoryLabel(c)}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>Категория определяется автоматически по описанию</p>
                </div>
              )}

              {formError && <div style={{ padding: "10px", background: "#fee", borderRadius: 8, color: "var(--color-danger)", fontSize: 13 }}>{formError}</div>}

              <button type="submit" className="btn-primary">{type === "income" ? "Добавить доход" : "Добавить расход"}</button>
            </form>
          </div>
        )}

        {activeTab === "list" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
              <div className="card" style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Доходы</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-success)" }}>{formatCurrency(analysis.totalIncome)}</p>
              </div>
              <div className="card" style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Расходы</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--color-danger)" }}>{formatCurrency(analysis.totalExpenses)}</p>
              </div>
            </div>

            {finances.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>Записей пока нет. Добавьте первую!</p>
                <button onClick={() => setActiveTab("add")} className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>Добавить запись</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {sortedDates.map((d) => (
                  <div key={d}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>{formatDate(d)}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {grouped[d].map((f) => (
                        <div key={f.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{f.description}</p>
                            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>{getCategoryLabel(f.category)}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 600, color: f.type === "income" ? "var(--color-success)" : "var(--color-danger)" }}>
                              {f.type === "income" ? "+" : "-"} {formatCurrency(f.amount)}
                            </span>
                            <button onClick={() => handleDelete(f.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ccc", padding: 0, lineHeight: 1 }}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}