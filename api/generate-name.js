const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  try {
    // Разрешаем только POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Логируем входящий запрос
    console.log("Incoming request:", req.method, req.url);

    // Парсим тело
    const { keyword } = req.body || {};
    console.log("Parsed keyword:", keyword);

    if (!keyword) {
      return res.status(400).json({ error: "No keyword provided" });
    }

    // Запрос к OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Придумай 3 коротких названия бренда по слову "${keyword}". Без описаний.`,
        },
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    const result = completion.data.choices?.[0]?.message?.content || "";
    console.log("OpenAI result:", result);

    return res.status(200).json({ result });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message || "Unknown error",
    });
  }
};
