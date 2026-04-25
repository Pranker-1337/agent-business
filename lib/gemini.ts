import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { AIModelMessage, ChatResponse } from "@/types";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

let genAI: GoogleGenerativeAI | null = null;
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getModel() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to .env.local");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!model) {
    model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
  }
  return model;
}

const SYSTEM_PROMPT = `Ты — финансовый AI-советник Agent Business. Твоя задача — помогать пользователю управлять личными финансами.

Ключевые правила:
1. Отвечай на русском языке кратко и по делу
2. Дай конкретные, практичные советы по экономии и накоплению
3. Если нужны числа — используй примерные суммы
4. Предлагай конкретные действия, а не абстрактные советы
5. Будь дружелюбным и мотивирующим
6. Есл�� пользователь спрашивает про накопления/инвестиции — предупреждай, что это не финансовая консультация

Формат ответов:
- Краткие абзацы (2-4 предложения)
- Эмодзи для наглядности
- Конкретные числа и сроки
- Если нужен список — используй маркеры`;

export async function generateChatResponse(
  messages: AIModelMessage[],
  userMessage: string,
  userProfile?: {
    totalIncome?: number;
    totalExpenses?: number;
    balance?: number;
    savingsRate?: number;
  }
): Promise<ChatResponse> {
  const m = getModel();
  
  const contextParts: string[] = [];
  if (userProfile) {
    const profileContext = `Контекст пользователя:
- Доход: ${userProfile.totalIncome ?? 0} ₽
- Расходы: ${userProfile.totalExpenses ?? 0} ₽
- Баланс: ${userProfile.balance ?? 0} ₽
- Норма сбережений: ${userProfile.savingsRate ?? 0}%`;
    contextParts.push(profileContext);
  }

  const historyText = messages
    .slice(-10)
    .map((msg) => `${msg.role === "user" ? "Пользователь" : "Ассистент"}: ${msg.parts[0]?.text ?? ""}`)
    .join("\n");

  const prompt = `${SYSTEM_PROMPT}

${contextParts.length ? contextParts.join("\n") + "\n" : ""}
История диалога:
${historyText}

Пользователь: ${userMessage}`;

  try {
    const result = await m.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const suggestions: string[] = [];
    if (text.includes("?")) {
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      suggestions.push(...sentences.slice(0, 3).map((s: string) => s.trim() + "?"));
    }

    return {
      reply: text || "Извините, не удалось сформировать ответ. Попробуйте переформулировать вопрос.",
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      throw new Error("Превышен лимит запросов к API. Попробуйте позже.");
    }
    if (errorMessage.includes("api key") || errorMessage.includes("key")) {
      throw new Error("Ошибка API ключа. Проверьте GEMINI_API_KEY в .env.local");
    }
    throw new Error(`Ошибка AI: ${errorMessage}`);
  }
}

export async function generateAnalysis(
  income: number,
  expenses: number,
  categories: Record<string, number>
): Promise<string> {
  const m = getModel();

  const prompt = `${SYSTEM_PROMPT}

Проанализируй финансовую ситуацию пользователя:

Доход: ${income} ₽
Расходы: ${expenses} ₽
Баланс: ${income - expenses} ₽

Категории расходов:
${Object.entries(categories)
  .map(([cat, amount]) => `- ${cat}: ${amount} ₽ (${income > 0 ? Math.round((amount / income) * 100) : 0}%)`)
  .join("\n")}

Дай краткий анализ (3-4 предложения) с конкретными рекомендациями по сокращению расходов.`;

  try {
    const result = await m.generateContent(prompt);
    return result.response.text();
  } catch (error: unknown) {
    console.error("Gemini analysis error:", error);
    return "Не удалось сгенерировать анализ. Попробуйте позже.";
  }
}

export async function generateGoalAdvice(
  goalTitle: string,
  currentAmount: number,
  targetAmount: number,
  daysLeft: number
): Promise<string> {
  const m = getModel();

  const remaining = targetAmount - currentAmount;
  const dailyNeeded = daysLeft > 0 ? Math.round(remaining / daysLeft) : remaining;
  const monthlyNeeded = Math.round(remaining / Math.max(daysLeft / 30, 1));

  const prompt = `${SYSTEM_PROMPT}

Пользователь копит на: "${goalTitle}"
Текущая сумма: ${currentAmount} ₽
Цель: ${targetAmount} ₽
Осталось: ${remaining} ₽
Дней осталось: ${daysLeft}

Нужно откладывать: ~${dailyNeeded} ₽/день или ~${monthlyNeeded} ₽/месяц

Дай краткую мотивационную рекомендацию (2-3 предложения) как достичь этой цели.`;

  try {
    const result = await m.generateContent(prompt);
    return result.response.text();
  } catch {
    return `Для достижения цели "${goalTitle}" нужно откладывать примерно ${monthlyNeeded} ₽ в месяц.`;
  }
}