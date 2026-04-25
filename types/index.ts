export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string;
  date: string;
  category: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
}

export type ExpenseCategory =
  | "housing"
  | "food"
  | "transport"
  | "healthcare"
  | "entertainment"
  | "subscriptions"
  | "utilities"
  | "education"
  | "savings"
  | "other";

export interface Project {
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  projectId?: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface FinanceProfile {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  topCategories: { category: ExpenseCategory; amount: number; percentage: number }[];
  inefficientSpending: { category: ExpenseCategory; amount: number }[];
}

export interface Goal {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: "active" | "completed" | "paused";
}

export interface ProgressMetrics {
  progressPercent: number;
  remainingPercent: number;
  successRate: number;
  actualVsPlanned: number;
  daysRemaining: number;
  projectedCompletion: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "warning" | "info" | "success" | "recommendation";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  projectId?: string;
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  expensesByCategory: Record<ExpenseCategory, number>;
  monthlyData: { month: string; income: number; expenses: number }[];
  goals: Goal[];
  projects: Project[];
}

export interface AIModelMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
}