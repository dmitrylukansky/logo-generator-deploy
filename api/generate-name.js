const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      const { keyword } = JSON.parse(body || "{}");

      if (!keyword) {
        return res.status(400).json({ error: "No keyword provided" });
      }

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

      const answer = completion.data.choices[0].message.content;
      res.status(200).json({ result: answer });
    });
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenAI error" });
  }
};
