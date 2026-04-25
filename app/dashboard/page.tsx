"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getUserByEmail,
  getFinancesByUserId,
  getProjectsByUserId,
  getGoalsByUserId,
} from "@/lib/storage";
import {
  analyzeExpenses,
  calculateProgress,
  calculateGoalTimeline,
  formatCurrency,
  getCategoryLabel,
  getStatusLabel,
  getHealthIndicator,
  getCategoryLabel as getCatLabel,
  getStatusLabel as getStatLabel,
} from "@/lib/finance";
import type { StoredProject, StoredGoal, StoredFinance } from "@/lib/storage";

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 16px",
        background: "transparent",
        border: "none",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        fontSize: 12,
        color: "var(--color-text-secondary)",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.color = "var(--color-accent)";
        (e.target as HTMLElement).style.background = "var(--color-surface-secondary)";
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.color = "var(--color-text-secondary)";
        (e.target as HTMLElement).style.background = "transparent";
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}

function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  return (
    <div style={{ width: "100%", height: 8, background: "var(--color-surface-secondary)", borderRadius: 4, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          height: "100%",
          background: color || "var(--color-accent)",
          borderRadius: 4,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function ProjectCard({ project, finances }: { project: StoredProject; finances: StoredFinance[] }) {
  const { progress } = calculateProgress(project.currentAmount, project.targetAmount);
  const { daysLeft, onTrack } = calculateGoalTimeline(
    project.currentAmount,
    project.targetAmount,
    project.deadline
  );
  const health = getHealthIndicator(progress);

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{project.name}</h3>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
            {project.description || "Без описания"}
          </p>
        </div>
        <span style={{ fontSize: 12, color: onTrack ? "var(--color-success)" : "var(--color-warning)" }}>
          {onTrack ? "🟢" : "🟡"} {daysLeft} дн.
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>{formatCurrency(project.currentAmount)}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(project.targetAmount)}</span>
        </div>
        <ProgressBar percent={progress} />
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "right" }}>
        {progress}% выполнено
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [finances, setFinances] = useState<StoredFinance[]>([]);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [goals, setGoals] = useState<StoredGoal[]>([]);
  const [analysis, setAnalysis] = useState<ReturnType<typeof analyzeExpenses> | null>(null);
  const [health, setHealth] = useState<ReturnType<typeof getHealthIndicator> | null>(null);
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "goals">("overview");

  const loadData = useCallback(() => {
    const email = localStorage.getItem("agent_business_user_email");
    if (!email) {
      router.push("/login");
      return;
    }
    const user = getUserByEmail(email);
    if (!user) {
      router.push("/login");
      return;
    }
    setUserEmail(email);
    setUserName(user.name);

    const userFinances = getFinancesByUserId(user.id);
    const userProjects = getProjectsByUserId(user.id);
    const userGoals = getGoalsByUserId(user.id);

    setFinances(userFinances);
    setProjects(userProjects);
    setGoals(userGoals);

    const analysisResult = analyzeExpenses(userFinances);
    setAnalysis(analysisResult);
    setHealth(getHealthIndicator(analysisResult.savingsRate));
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function logout() {
    localStorage.removeItem("agent_business_session");
    localStorage.removeItem("agent_business_user_email");
    router.push("/login");
  }

  if (!analysis) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--color-surface)", padding: "12px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>💰</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Agent Business</span>
        </div>
        <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}>
          Выйти
        </button>
      </header>

      <nav style={{ background: "var(--color-surface)", padding: "8px 16px", display: "flex", gap: 4, overflowX: "auto", borderBottom: "1px solid #eee" }}>
        <NavItem href="/dashboard" label="Главная" icon="🏠" />
        <NavItem href="/chat" label="AI-Чат" icon="🤖" />
        <NavItem href="/projects" label="Проекты" icon="📋" />
        <NavItem href="/finances" label="Финансы" icon="💳" />
      </nav>

      <main style={{ flex: 1, padding: 16, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Привет, {userName || "друг"}!
          </h1>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            Вот ваш финансовый статус на сегодня
          </p>
        </div>

        {health && (
          <div className="card" style={{ marginBottom: 24, background: health.color + "15", border: `1px solid ${health.color}30` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Финансовое здоровье: {health.label}</span>
              <span style={{ fontSize: 24 }}>{analysis.savingsRate >= 20 ? "🌟" : analysis.savingsRate >= 10 ? "👍" : analysis.savingsRate >= 0 ? "⚠️" : "🚨"}</span>
            </div>
            <p style={{ fontSize: 14, margin: 0, color: "var(--color-text)" }}>{health.message}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>Доходы</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-success)" }}>
              {formatCurrency(analysis.totalIncome)}
            </p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>Расходы</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-danger)" }}>
              {formatCurrency(analysis.totalExpenses)}
            </p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>Баланс</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: analysis.balance >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {formatCurrency(analysis.balance)}
            </p>
          </div>
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>Норма сбережений</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--color-accent)" }}>
              {analysis.savingsRate}%
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["overview", "projects", "goals"] as const).map((tab) => (
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
                background: activeTab === tab ? "var(--color-accent)" : "var(--color-surface-secondary)",
                color: activeTab === tab ? "white" : "var(--color-text)",
              }}
            >
              {tab === "overview" ? "📊 Анализ" : tab === "projects" ? "📋 Проекты" : "🎯 Цели"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Топ категорий расходов</h2>
            {analysis.topCategories.length === 0 ? (
              <p style={{ color: "var(--color-text-secondary)" }}>Нет данных о расходах</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {analysis.topCategories.map((cat) => (
                  <div key={cat.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{getCatLabel(cat.category)}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {formatCurrency(cat.amount)} <span style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>({cat.percentage}%)</span>
                      </span>
                    </div>
                    <ProgressBar percent={cat.percentage} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "projects" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Проекты</h2>
              <button
                onClick={() => router.push("/projects")}
                className="btn-primary"
                style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
              >
                + Новый проект
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>У вас пока нет проектов</p>
                <button onClick={() => router.push("/projects")} className="btn-primary" style={{ width: "auto", display: "inline-flex" }}>
                  Создать первый проект
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} finances={finances} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "goals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Финансовые цели</h2>
              <button
                onClick={() => router.push("/projects")}
                className="btn-primary"
                style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
              >
                + Новая цель
              </button>
            </div>
            {goals.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 32 }}>
                <p style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>У вас пока нет целей</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {goals.map((g) => {
                  const { progress } = calculateProgress(g.currentAmount, g.targetAmount);
                  return (
                    <div key={g.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{g.title}</h3>
                          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                            {getStatLabel(g.status)}
                          </p>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{progress}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13 }}>{formatCurrency(g.currentAmount)}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(g.targetAmount)}</span>
                      </div>
                      <ProgressBar percent={progress} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}