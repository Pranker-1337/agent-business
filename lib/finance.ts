import type { ExpenseCategory } from "@/types";
import type { StoredFinance } from "./storage";

export function categorizeExpense(description: string): ExpenseCategory {
  const desc = description.toLowerCase();
  const patterns: Record<ExpenseCategory, string[]> = {
    housing: ["аренда", "квартира", "ипотека", "жилье", "дом", "rent", "housing"],
    food: ["еда", "продукты", "магазин", "кафе", "ресторан", "столовая", "food", "супермаркет", "groceries"],
    transport: ["метро", "автобус", "такси", "топливо", "бензин", "транспорт", "transport", "uber", "яндекс"],
    healthcare: ["аптека", "врач", "больница", "медицина", "лекарства", "здоровье", "health", "pharmacy"],
    entertainment: ["кино", "театр", "концерт", "игры", "развлечения", "playstation", "netflix", "spotify", "entertainment"],
    subscriptions: ["подписка", "subscription", "netflix", "spotify", "apple", "google one", "microsoft"],
    utilities: ["коммуналка", "коммунальные", "electricity", "gas", "water", "utilities", "интернет", "wifi"],
    education: ["курсы", "обучение", "книги", "учеба", "образование", "education", "course", "training"],
    savings: ["накопления", "вклад", "депозит", "сбережения", "savings", "deposit"],
    other: [],
  };

  for (const [category, keywords] of Object.entries(patterns)) {
    if (category === "other") continue;
    if (keywords.some((kw) => desc.includes(kw))) {
      return category as ExpenseCategory;
    }
  }
  return "other";
}

export function analyzeExpenses(finances: StoredFinance[]): {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  byCategory: Record<ExpenseCategory | "income", number>;
  topCategories: { category: ExpenseCategory; amount: number; percentage: number }[];
  inefficientSpending: { category: ExpenseCategory; amount: number }[];
} {
  const income = finances.filter((f) => f.type === "income");
  const expenses = finances.filter((f) => f.type === "expense");

  const totalIncome = income.reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses.reduce((sum, f) => sum + f.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

  const byCategory: Record<ExpenseCategory | "income", number> = {
    income: totalIncome,
    housing: 0,
    food: 0,
    transport: 0,
    healthcare: 0,
    entertainment: 0,
    subscriptions: 0,
    utilities: 0,
    education: 0,
    savings: 0,
    other: 0,
  };

  for (const exp of expenses) {
    byCategory[exp.category as ExpenseCategory | "income"] =
      (byCategory[exp.category as ExpenseCategory | "income"] || 0) + exp.amount;
  }

  const topCategories = (Object.entries(byCategory) as [ExpenseCategory, number][])
    .filter(([cat]) => cat !== "income" && cat !== "savings")
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const inefficientSpending = topCategories
    .filter((c) => c.percentage > 25)
    .map((c) => ({ category: c.category, amount: c.amount }));

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    byCategory,
    topCategories,
    inefficientSpending,
  };
}

export function calculateProgress(
  currentAmount: number,
  targetAmount: number
): { progress: number; remaining: number; successRate: number } {
  if (targetAmount <= 0) {
    return { progress: 0, remaining: 100, successRate: 0 };
  }
  const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  const remaining = 100 - progress;
  const successRate = progress;
  return { progress, remaining, successRate };
}

export function calculateGoalTimeline(
  currentAmount: number,
  targetAmount: number,
  deadline: string
): { daysLeft: number; onTrack: boolean; dailyNeeded: number; projectedCompletion: string } {
  const now = new Date();
  const end = new Date(deadline);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const remaining = targetAmount - currentAmount;

  let onTrack = false;
  let dailyNeeded = remaining / Math.max(daysLeft, 1);

  if (daysLeft <= 0) {
    onTrack = currentAmount >= targetAmount;
    dailyNeeded = remaining;
  } else {
    onTrack = dailyNeeded <= 0;
  }

  const projectedDate = new Date(now.getTime() + (remaining > 0 ? (remaining / (dailyNeeded || 1)) * 24 * 60 * 60 * 1000 : 0));
  const projectedCompletion = projectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

  return { daysLeft, onTrack, dailyNeeded: Math.round(dailyNeeded), projectedCompletion };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    housing: "🏠 Жилье",
    food: "🍔 Еда",
    transport: "🚗 Транспорт",
    healthcare: "🏥 Здоровье",
    entertainment: "🎬 Развлечения",
    subscriptions: "📱 Подписки",
    utilities: "💡 Коммуналка",
    education: "📚 Образование",
    savings: "💰 Сбережения",
    income: "💵 Доходы",
    other: "📦 Прочее",
  };
  return labels[category] || category;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "🟢 Активна",
    completed: "✅ Достигнута",
    paused: "⏸️ Приостановлена",
  };
  return labels[status] || status;
}

export function calculateMonthlyData(
  finances: StoredFinance[],
  monthsBack = 6
): { month: string; income: number; expenses: number }[] {
  const now = new Date();
  const result: { month: string; income: number; expenses: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const monthFinances = finances.filter((f) => {
      const fd = new Date(f.date);
      return fd >= monthStart && fd <= monthEnd;
    });

    const income = monthFinances.filter((f) => f.type === "income").reduce((s, f) => s + f.amount, 0);
    const expenses = monthFinances.filter((f) => f.type === "expense").reduce((s, f) => s + f.amount, 0);

    result.push({
      month: d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" }).replace(" г.", ""),
      income,
      expenses,
    });
  }

  return result;
}

export function getHealthIndicator(savingsRate: number): { label: string; color: string; message: string } {
  if (savingsRate >= 20) {
    return {
      label: "Отличное",
      color: "var(--color-success)",
      message: "Вы отлично управляете финансами! Продолжайте в том же духе.",
    };
  } else if (savingsRate >= 10) {
    return {
      label: "Хорошее",
      color: "#34c759",
      message: "Неплохо! Попробуйте увеличить норму сбережений до 20%.",
    };
  } else if (savingsRate >= 0) {
    return {
      label: "Среднее",
      color: "var(--color-warning)",
      message: "Старайтесь откладывать хотя бы 10-20% дохода.",
    };
  } else {
    return {
      label: "Требует внимания",
      color: "var(--color-danger)",
      message: "Расходы превышают доходы. Срочно сократите траты!",
    };
  }
}