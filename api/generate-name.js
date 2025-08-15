// api/generate-name.js
import dotenv from "dotenv";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";

dotenv.config();

// Прокси Psiphon (локальный)
const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:8080");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  try {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return res.status(400).json({ error: "Не передан keyword" });
    }
    const prompt = keyword.trim();

    console.log("📡 Запрос к OpenRouter через Psiphon-прокси...");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        agent: proxyAgent,
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Ты — генератор креативных коротких названий для бренда.",
            },
            {
              role: "user",
              content: `${prompt}. Сгенерируй 3 коротких и уникальных названия в JSON-массиве без пояснений.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Ошибка OpenRouter: ${response.status} ${text}`,
      });
    }

    const data = await response.json();

    let result;
    try {
      // Парсим содержимое, ожидаем JSON-массив
      result = JSON.parse(data.choices[0].message.content.trim());
    } catch (err) {
      console.error("Ошибка парсинга ответа OpenRouter:", err);
      return res
        .status(500)
        .json({ error: "Ответ OpenRouter не в формате JSON" });
    }

    // ✅ Возвращаем массив названий
    return res.status(200).json({ names: result });
  } catch (error) {
    console.error("Ошибка генерации названия:", error);
    return res
      .status(500)
      .json({ error: error.message || "Внутренняя ошибка сервера" });
  }
}
