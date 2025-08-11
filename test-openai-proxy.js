// test-openai-proxy.js
const { Configuration, OpenAIApi } = require("openai");
const { HttpsProxyAgent } = require("https-proxy-agent");

// !!! ЗАМЕНИ на свой реальный ключ OpenAI !!!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "ВСТАВЬ_СВОЙ_API_KEY";

// Создаём HTTP-прокси агент для Psiphon (порт 8080)
const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:8080");

// Конфигурация OpenAI с прокси
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
  baseOptions: {
    httpsAgent: proxyAgent,
  },
});

const openai = new OpenAIApi(configuration);

async function test() {
  try {
    console.log("Отправляем тестовый запрос в OpenAI через Psiphon-прокси...");

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Привет! Скажи просто слово 'успех'." },
      ],
      max_tokens: 10,
    });

    console.log(
      "Ответ OpenAI:",
      completion.data.choices[0].message.content.trim()
    );
  } catch (err) {
    console.error("Ошибка при запросе к OpenAI:", err.message);
  }
}

test();
