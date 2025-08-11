// test-openai-proxy.js
import "dotenv/config";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";

// Адрес локального прокси Psiphon
const proxyUrl = "http://127.0.0.1:8080";
const httpsAgent = new HttpsProxyAgent(proxyUrl);

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY не найден. Укажи его в .env");
    process.exit(1);
  }

  // 1. Проверяем IP через прокси
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      agent: httpsAgent,
    });
    const data = await res.json();
    console.log("🌐 IP через HTTP-прокси Psiphon:", data.ip);
  } catch (err) {
    console.error("❌ Ошибка проверки IP через прокси:", err.message);
    return;
  }

  // 2. Запрос к OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: httpsAgent, // Для HTTP
    httpsAgent: httpsAgent, // Для HTTPS
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: 'Скажи "Привет" и укажи страну, где ты думаешь я нахожусь',
        },
      ],
      max_tokens: 20,
    });

    console.log(
      "✅ Ответ OpenAI через прокси:",
      completion.choices[0].message.content
    );
  } catch (err) {
    console.error("❌ Ошибка запроса к OpenAI:", err.message);
  }
}

testOpenAI();
