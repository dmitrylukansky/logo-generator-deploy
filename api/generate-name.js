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

    // Агент для прокси
    const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:8080");

    // Клиент OpenAI с прокси
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    });

    // Запрос к GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Придумай 3 коротких названия бренда по слову "${keyword}". Без описаний, только список.`,
        },
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    const rawText = completion.choices?.[0]?.message?.content || "";
    const names = rawText
      .split("\n")
      .map((n) => n.trim().replace(/^\d+\.?\s*/, ""))
      .filter(Boolean);

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
