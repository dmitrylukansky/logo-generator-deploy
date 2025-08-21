/* import "dotenv/config";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyUrl = "http://127.0.0.1:8080"; // твой локальный прокси Psiphon
const agent = new HttpsProxyAgent(proxyUrl);

// Ключ OpenRouter
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  httpAgent: agent,
  httpsAgent: agent,
});

console.log("Проверка IP через Psiphon...");

try {
  const ipCheck = await fetch("https://api.ipify.org?format=json", { agent });
  console.log("IP через HTTP-прокси Psiphon:", await ipCheck.json());
} catch (err) {
  console.error("❌ Ошибка получения IP:", err.message);
}

console.log("Проверка запроса к OpenRouter...");

try {
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Скажи одним словом, работает ли прокси?" },
    ],
    max_tokens: 20,
  });

  console.log("✅ Ответ OpenRouter:", response.choices[0].message.content);
} catch (err) {
  console.error("❌ Ошибка запроса к OpenRouter:", err.message);
}
 */
