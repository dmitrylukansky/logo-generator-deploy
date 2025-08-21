import https from "https";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", names: [] });
  }

  try {
    const {
      keyword,
      length = "short",
      style = "creative",
      lang = "ru",
    } = req.body || {};

    if (!keyword) {
      return res.status(400).json({ error: "No keyword provided", names: [] });
    }

    // Формируем промпт
    const prompt = `Придумай 3 ${length === "short" ? "коротких" : "длинных"} 
${style === "formal" ? "официальных" : "креативных"} 
названия бренда на ${
      lang === "en" ? "английском" : "русском"
    } по слову "${keyword}". 
Только список, без описаний.`.replace(/\s+/g, " ");

    console.log("Prompt:", prompt);

    // Если есть ключ OpenRouter → пробуем вызвать
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.8,
              max_tokens: 100,
            }),
            agent: process.env.PROXY_URL
              ? new https.Agent({ proxy: process.env.PROXY_URL })
              : undefined,
          }
        );

        const data = await response.json();
        console.log("OpenRouter result:", data);

        const text = data?.choices?.[0]?.message?.content || "";
        const names = text
          .split("\n")
          .map((n) => n.replace(/^\d+\.?\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3);

        if (names.length) {
          return res.status(200).json({ names });
        }
      } catch (err) {
        console.error("OpenRouter error:", err);
      }
    }

    // === Fallback: случайные названия из словаря ===
    const fallbackWords = [
      "Nova",
      "Lumo",
      "Энерго",
      "Вижн",
      "Skyline",
      "Aurora",
      "Вектор",
    ];
    const names = Array.from({ length: 3 }, () => {
      const w1 =
        fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
      return `${w1} ${keyword}`;
    });

    return res.status(200).json({ names, fallback: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error", names: [] });
  }
}
