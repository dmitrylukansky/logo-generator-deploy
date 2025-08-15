import dotenv from "dotenv";
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { keyword } = req.body;
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return res.status(400).json({ error: "Не передан keyword" });
  }

  const prompt = keyword.trim();

  try {
    const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:8080"); // Psiphon HTTP прокси

    const openrouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                'Ты генератор креативных названий. Отвечай ТОЛЬКО в JSON формате: {"name": "..."}.',
            },
            {
              role: "user",
              content: `Придумай креативное название для: ${prompt}`,
            },
          ],
          temperature: 0.7,
        }),
        agent: proxyAgent,
      }
    );

    const data = await openrouterRes.json();

    let name = null;
    try {
      // Пытаемся найти JSON в ответе модели
      const match = data.choices?.[0]?.message?.content?.match(/\{.*\}/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        name = parsed.name;
      }
    } catch (e) {
      console.error("Ошибка парсинга JSON от OpenRouter:", e);
    }

    if (!name) {
      return res
        .status(500)
        .json({ error: "Ответ OpenRouter не в формате JSON" });
    }

    res.status(200).json({ name });
  } catch (error) {
    console.error("Ошибка запроса к OpenRouter:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
}
