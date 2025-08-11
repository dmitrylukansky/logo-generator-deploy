import "dotenv/config";
import { Configuration, OpenAIApi } from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

// Адрес локального прокси Psiphon
const proxyUrl = "http://127.0.0.1:8080";
const httpsAgent = new HttpsProxyAgent(proxyUrl);

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY не найден в переменных окружения");
    process.exit(1);
  }

  const openai = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
      baseOptions: { httpsAgent },
    })
  );

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: 'Скажи "Привет" и страну, в которой ты думаешь я нахожусь',
        },
      ],
      max_tokens: 20,
    });

    console.log(
      "✅ Ответ OpenAI через прокси:",
      completion.data.choices[0].message.content
    );
  } catch (err) {
    console.error("❌ Ошибка запроса:", err.message);
  }
}

testOpenAI();
