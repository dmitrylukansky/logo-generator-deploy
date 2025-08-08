// /pages/api/generate-name.js

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { keyword } = req.body || {};
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({ error: "No valid keyword provided" });
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Придумай ровно 3 коротких варианта названия бренда по слову "${keyword}". Ответь в JSON формате: {"names": ["название1", "название2", "название3"]}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    let rawContent = completion.data.choices?.[0]?.message?.content || "";
    let names = [];

    try {
      const parsed = JSON.parse(rawContent);
      if (parsed?.names && Array.isArray(parsed.names)) {
        names = parsed.names;
      }
    } catch {
      // fallback: извлекаем названия построчно
      names = rawContent
        .split("\n")
        .map((n) => n.replace(/^\d+\.?\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    if (names.length < 3) {
      // добиваем до трёх безопасными вариантами
      while (names.length < 3) {
        names.push(`${keyword} ${names.length + 1}`);
      }
    }

    return res.status(200).json({ names });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err?.message || "Unknown error",
      names: [],
    });
  }
};
