"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserByEmail, getProjectsByUserId, createProject, updateProject, deleteProject, getGoalsByUserId, createGoal, updateGoal, deleteGoal } from "@/lib/storage";
import { calculateProgress, formatCurrency, formatDate } from "@/lib/finance";
import type { StoredProject, StoredGoal } from "@/lib/storage";

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [goals, setGoals] = useState<StoredGoal[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "goals">("projects");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"project" | "goal">("project");
  const [editingItem, setEditingItem] = useState<StoredProject | StoredGoal | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "paused">("active");

  const [formError, setFormError] = useState("");

  const loadData = useCallback(() => {
    const email = localStorage.getItem("agent_business_user_email");
    if (!email) { router.push("/login"); return; }
    const userData = getUserByEmail(email);
    if (!userData) { router.push("/login"); return; }
    setUser({ id: userData.id });
    setProjects(getProjectsByUserId(userData.id));
    setGoals(getGoalsByUserId(userData.id));
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreateModal(type: "project" | "goal") {
    setModalType(type);
    setEditingItem(null);
    setName(""); setDescription(""); setTargetAmount(""); setCurrentAmount(""); setDeadline(""); setStatus("active");
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(item: StoredProject | StoredGoal) {
    setModalType("project" in item ? "project" : "goal");
    setEditingItem(item);
    setName(item.name || item.title);
    setDescription(item.description || "");
    setTargetAmount(String(item.targetAmount));
    setCurrentAmount(String(item.currentAmount));
    setDeadline(item.deadline.split("T")[0]);
    setStatus(item.status);
    setFormError("");
    setShowModal(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError("");

    const target = Number(targetAmount);
    const current = Number(currentAmount) || 0;

    if (!name.trim()) return setFormError("Введите название");
    if (!targetAmount || target <= 0) return setFormError("Введите целевую сумму");
    if (!deadline) return setFormError("Введите срок");

    if (modalType === "project") {
      if (editingItem) {
        updateProject(editingItem.id, user.id, {
          name: name.trim(),
          description: description.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: new Date(deadline).toISOString(),
          status,
        });
      } else {
        createProject({
          userId: user.id,
          name: name.trim(),
          description: description.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: new Date(deadline).toISOString(),
          status,
        });
      }
    } else {
      if (editingItem) {
        updateGoal(editingItem.id, user.id, {
          title: name.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: new Date(deadline).toISOString(),
          status,
        });
      } else {
        createGoal({
          userId: user.id,
          title: name.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: new Date(deadline).toISOString(),
          status,
        });
      }
    }

    setShowModal(false);
    loadData();
  }

  function handleDelete(id: string, type: "project" | "goal") {
    if (!user) return;
    if (!confirm("Удалить?")) return;
    if (type === "project") { deleteProject(id, user.id); } else { deleteGoal(id, user.id); }
    loadData();
  }

  function addToProject(project: StoredProject) {
    const amount = prompt("Сколько добавить?");
    if (!amount || !user) return;
    const num = Number(amount);
    if (!num || num <= 0) return;
    updateProject(project.id, user.id, { currentAmount: project.currentAmount + num });
    loadData();
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--color-surface)", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Проекты и цели</span>
        </div>
        <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}>
          ← Назад
        </button>
      </header>

      <div style={{ background: "var(--color-surface)", padding: "8px 16px", display: "flex", gap: 8, borderBottom: "1px solid #eee" }}>
        {(["projects", "goals"] as const).map((tab) => (
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
            {tab === "projects" ? "📋 Проекты" : "🎯 Цели"}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, padding: 16, maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {activeTab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Мои проекты</h2>
              <button onClick={() => openCreateModal("project")} className="btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}>
                + Новый проект
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>Проектов пока нет</p>
                <button onClick={() => openCreateModal("project")} className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                  Создать проект
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map((p) => {
                  const { progress } = calculateProgress(p.currentAmount, p.targetAmount);
                  return (
                    <div key={p.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{p.name}</h3>
                          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{p.description || "Без описания"}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openEditModal(p)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Ред.</button>
                          <button onClick={() => handleDelete(p.id, "project")} style={{ background: "none", border: "1px solid #fcc", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "var(--color-danger)" }}>Удал.</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{formatCurrency(p.currentAmount)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(p.targetAmount)}</span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: progress >= 100 ? "var(--color-success)" : "var(--color-accent)", borderRadius: 4, transition: "width 0.3s" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{progress}% • До {formatDate(p.deadline)}</span>
                        <button onClick={() => addToProject(p)} style={{ background: "none", border: "1px solid var(--color-accent)", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "var(--color-accent)" }}>+ Добавить</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "goals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Финансовые цели</h2>
              <button onClick={() => openCreateModal("goal")} className="btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}>
                + Новая цель
              </button>
            </div>
            {goals.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>Целей пока нет</p>
                <button onClick={() => openCreateModal("goal")} className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                  Создать цель
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {goals.map((g) => {
                  const { progress } = calculateProgress(g.currentAmount, g.targetAmount);
                  return (
                    <div key={g.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{g.title}</h3>
                          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{g.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openEditModal(g)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Ред.</button>
                          <button onClick={() => handleDelete(g.id, "goal")} style={{ background: "none", border: "1px solid #fcc", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, color: "var(--color-danger)" }}>Удал.</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13 }}>{formatCurrency(g.currentAmount)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(g.targetAmount)}</span>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: progress >= 100 ? "var(--color-success)" : "var(--color-accent)", borderRadius: 4, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{progress}% • До {formatDate(g.deadline)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 100 }} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="card" style={{ maxWidth: 480, width: "100%" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
              {editingItem ? "Редактировать" : "Создать"} {modalType === "project" ? "проект" : "цель"}
            </h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>{modalType === "project" ? "Название проекта" : "Название цели"}</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder={modalType === "project" ? "Накопить на ПК" : "Фонд на черный день"} required />
              </div>
              {modalType === "project" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Описание</label>
                  <input className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опционально" />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Целевая сумма (₽)</label>
                  <input className="input-field" type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="50000" required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Текущая (₽)</label>
                  <input className="input-field" type="number" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Срок</label>
                <input className="input-field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={today} required />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Статус</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as "active" | "completed" | "paused")}>
                  <option value="active">🟢 Активна</option>
                  <option value="paused">⏸️ Приостановлена</option>
                  <option value="completed">✅ Достигнута</option>
                </select>
              </div>
              {formError && <div style={{ padding: "10px", background: "#fee", borderRadius: 8, color: "var(--color-danger)", fontSize: 13 }}>{formError}</div>}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-primary" style={{ flex: 1, background: "#eee", color: "var(--color-text)" }}>Отмена</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingItem ? "Сохранить" : "Создать"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}