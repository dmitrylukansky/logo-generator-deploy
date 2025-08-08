const { Configuration, OpenAIApi } = require("openai");

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", names: [] });
  }

  const { keyword } = req.body || {};
  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return res
      .status(400)
      .json({ error: "No valid keyword provided", names: [] });
  }

  const q = keyword.trim();
  let names = [];
  let debug = null;

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not set");
    }

    const openai = new OpenAIApi(
      new Configuration({ apiKey: process.env.OPENAI_API_KEY })
    );
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an assistant that outputs only JSON.",
        },
        {
          role: "user",
          content: `Придумай ровно 3 коротких варианта названия бренда по слову "${q}". Ответь строго в JSON: {"names":["название1","название2","название3"]}`,
        },
      ],
      max_tokens: 120,
      temperature: 0.8,
    });

    const raw = completion?.data?.choices?.[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.names)) {
        names = parsed.names
          .map((n) => String(n).trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      names = raw
        .split("\n")
        .map((line) =>
          line
            .replace(/^\s*\d+[\).\-]?\s*/, "")
            .replace(/^['"]|['"]$/g, "")
            .trim()
        )
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch (err) {
    console.error("OpenAI error:", err);
    debug = err?.message || String(err);
  }

  while (names.length < 3) {
    const idx = names.length + 1;
    names.push(`${q}${idx === 1 ? "" : " " + idx}`);
  }

  return res.status(200).json({ names, debug });
};
