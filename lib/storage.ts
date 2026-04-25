import type { ExpenseCategory } from "@/types";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface StoredFinance {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: ExpenseCategory | "income";
  date: string;
}

export interface StoredProject {
  id: string;
  userId: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: "active" | "completed" | "paused";
  createdAt: string;
}

export interface StoredGoal {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: "active" | "completed" | "paused";
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const DB_KEY = "agent_business_db";

function getDb(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return { users: [], finances: [], projects: [], goals: [], chatMessages: [] };
  }
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    return { users: [], finances: [], projects: [], goals: [], chatMessages: [] };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { users: [], finances: [], projects: [], goals: [], chatMessages: [] };
  }
}

function saveDb(db: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "hash_" + Math.abs(hash).toString(16) + "_" + password.length;
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateId(): string {
  return Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
}

export function getUserByEmail(email: string): StoredUser | null {
  const db = getDb();
  const users = (db.users || []) as StoredUser[];
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string): StoredUser | null {
  const db = getDb();
  const users = (db.users || []) as StoredUser[];
  return users.find((u) => u.id === id) || null;
}

export function createUser(email: string, name: string, password: string): StoredUser {
  const db = getDb();
  const users = (db.users || []) as StoredUser[];
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("Email already registered");
  }
  const user: StoredUser = {
    id: generateId(),
    email,
    name,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  db.users = users;
  saveDb(db);
  return user;
}

export function getFinancesByUserId(userId: string): StoredFinance[] {
  const db = getDb();
  const finances = (db.finances || []) as StoredFinance[];
  return finances.filter((f) => f.userId === userId);
}

export function addFinance(data: Omit<StoredFinance, "id">): StoredFinance {
  const db = getDb();
  const finances = (db.finances || []) as StoredFinance[];
  const finance: StoredFinance = { ...data, id: generateId() };
  finances.push(finance);
  db.finances = finances;
  saveDb(db);
  return finance;
}

export function deleteFinance(id: string, userId: string): boolean {
  const db = getDb();
  const finances = (db.finances || []) as StoredFinance[];
  const index = finances.findIndex((f) => f.id === id && f.userId === userId);
  if (index === -1) return false;
  finances.splice(index, 1);
  db.finances = finances;
  saveDb(db);
  return true;
}

export function getProjectsByUserId(userId: string): StoredProject[] {
  const db = getDb();
  const projects = (db.projects || []) as StoredProject[];
  return projects.filter((p) => p.userId === userId);
}

export function createProject(data: Omit<StoredProject, "id" | "createdAt">): StoredProject {
  const db = getDb();
  const projects = (db.projects || []) as StoredProject[];
  const project: StoredProject = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  projects.push(project);
  db.projects = projects;
  saveDb(db);
  return project;
}

export function updateProject(id: string, userId: string, updates: Partial<StoredProject>): StoredProject | null {
  const db = getDb();
  const projects = (db.projects || []) as StoredProject[];
  const index = projects.findIndex((p) => p.id === id && p.userId === userId);
  if (index === -1) return null;
  projects[index] = { ...projects[index], ...updates };
  db.projects = projects;
  saveDb(db);
  return projects[index];
}

export function deleteProject(id: string, userId: string): boolean {
  const db = getDb();
  const projects = (db.projects || []) as StoredProject[];
  const index = projects.findIndex((p) => p.id === id && p.userId === userId);
  if (index === -1) return false;
  projects.splice(index, 1);
  db.projects = projects;
  saveDb(db);
  return true;
}

export function getGoalsByUserId(userId: string): StoredGoal[] {
  const db = getDb();
  const goals = (db.goals || []) as StoredGoal[];
  return goals.filter((g) => g.userId === userId);
}

export function createGoal(data: Omit<StoredGoal, "id">): StoredGoal {
  const db = getDb();
  const goals = (db.goals || []) as StoredGoal[];
  const goal: StoredGoal = { ...data, id: generateId() };
  goals.push(goal);
  db.goals = goals;
  saveDb(db);
  return goal;
}

export function updateGoal(id: string, userId: string, updates: Partial<StoredGoal>): StoredGoal | null {
  const db = getDb();
  const goals = (db.goals || []) as StoredGoal[];
  const index = goals.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return null;
  goals[index] = { ...goals[index], ...updates };
  db.goals = goals;
  saveDb(db);
  return goals[index];
}

export function deleteGoal(id: string, userId: string): boolean {
  const db = getDb();
  const goals = (db.goals || []) as StoredGoal[];
  const index = goals.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return false;
  goals.splice(index, 1);
  db.goals = goals;
  saveDb(db);
  return true;
}

export function getChatMessages(sessionId: string): StoredChatMessage[] {
  const db = getDb();
  const messages = (db.chatMessages || []) as StoredChatMessage[];
  return messages.filter((m) => m.sessionId === sessionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function addChatMessage(data: Omit<StoredChatMessage, "id">): StoredChatMessage {
  const db = getDb();
  const messages = (db.chatMessages || []) as StoredChatMessage[];
  const msg: StoredChatMessage = { ...data, id: generateId() };
  messages.push(msg);
  db.chatMessages = messages;
  saveDb(db);
  return msg;
}

export function clearUserData(userId: string) {
  const db = getDb();
  const finances = (db.finances || []) as StoredFinance[];
  const projects = (db.projects || []) as StoredProject[];
  const goals = (db.goals || []) as StoredGoal[];
  const messages = (db.chatMessages || []) as StoredChatMessage[];

  db.finances = finances.filter((f) => f.userId !== userId);
  db.projects = projects.filter((p) => p.userId !== userId);
  db.goals = goals.filter((g) => g.userId !== userId);
  db.chatMessages = messages;
  saveDb(db);
}

export function exportUserData(userId: string): Record<string, unknown> {
  const db = getDb();
  const users = (db.users || []) as StoredUser[];
  const user = users.find((u) => u.id === userId);
  if (!user) return {};

  const { passwordHash: _, ...safeUser } = user;
  const finances = (db.finances || []) as StoredFinance[];
  const projects = (db.projects || []) as StoredProject[];
  const goals = (db.goals || []) as StoredGoal[];

  return {
    user: safeUser,
    finances: finances.filter((f) => f.userId === userId),
    projects: projects.filter((p) => p.userId === userId),
    goals: goals.filter((g) => g.userId === userId),
    exportedAt: new Date().toISOString(),
  };
}