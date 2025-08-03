const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { keyword } = req.body || {};

  if (!keyword) {
    return res.status(400).json({ error: "No keyword provided" });
  }

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Придумай 3 коротких названия бренда по ключевому слову "${keyword}". Без описаний.`,
        },
      ],
      max_tokens: 60,
      temperature: 0.8,
    });

    const result = completion.data.choices[0].message.content;
    res.status(200).json({ result });
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenAI error" });
  }
};
