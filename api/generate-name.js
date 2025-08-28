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

    const prompt = `Придумай 3 ${length === "short" ? "коротких" : "длинных"} 
${style === "formal" ? "официальных" : "креативных"} 
названия бренда на ${
      lang === "en" ? "английском" : "русском"
    } по слову "${keyword}". 
Только список, без описаний.`.replace(/\s+/g, " ");

    console.log("Prompt:", prompt);

    if (!process.env.OPENROUTER_API_KEY) {
      return res
        .status(500)
        .json({ error: "OPENROUTER_API_KEY is not set", names: [] });
    }

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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data);
      return res
        .status(response.status)
        .json({
          error: data.error?.message || "OpenRouter API error",
          names: [],
        });
    }

    const text = data?.choices?.[0]?.message?.content || "";
    const names = text
      .split("\n")
      .map((n) => n.replace(/^\d+\.?\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!names.length) {
      return res
        .status(500)
        .json({ error: "ИИ не вернул названия", names: [] });
    }

    return res.status(200).json({ names });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error", names: [] });
  }
}
