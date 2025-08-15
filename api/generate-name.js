// api/generate-name.js
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed", names: [] });
    }

    const { keyword } = req.body || {};
    if (!keyword) {
      return res.status(400).json({ error: "No keyword provided", names: [] });
    }

    // Настройка прокси-агента
    const proxyUrl = "http://127.0.0.1:8080";
    const agent = new HttpsProxyAgent(proxyUrl);

    // Создаём клиента OpenAI с прокси
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultHttpAgent: agent, // важный момент
    });

    // Запрос к GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Придумай 3 коротких названия бренда по слову "${keyword}". Без описаний, каждое на новой строке.`,
        },
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    // Разбираем ответ
    const raw = completion.choices?.[0]?.message?.content || "";
    const names = raw
      .split("\n")
      .map((n) => n.replace(/^\d+\.?\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return res.status(200).json({ names });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err?.message || "Unknown error",
      names: [],
    });
  }
}
