const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { keyword } = req.body || {};

    if (!keyword) {
      return res.status(400).json({ error: "No keyword provided" });
    }

    const completion = await openai.chat.completions.create({
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

    const result = completion.choices[0].message.content;
    res.status(200).json({ result });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
