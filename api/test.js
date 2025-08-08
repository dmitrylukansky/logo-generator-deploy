import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Придумай 3 коротких названия бренда по слову 'кофе утром'",
      },
    ],
    max_tokens: 50,
    temperature: 0.8,
  });
  console.log(response.choices[0].message.content);
}

main();
