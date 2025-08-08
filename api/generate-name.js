// Файл: /pages/api/generate-name.js
// Надёжный серверный endpoint, который всегда возвращает JSON { names: [..] }
// Если OpenAI недоступен — используется безопасный fallback (3 варианта).

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

module.exports = async function handler(req, res) {
  // Всегда отвечаем JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", names: [] });
  }

  try {
    const { keyword } = req.body || {};
    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return res
        .status(400)
        .json({ error: "No valid keyword provided", names: [] });
    }

    const q = keyword.trim();

    // Попытка вызвать OpenAI — но любой провал не должен давать 500 клиенту
    let names = [];
    let debug = null;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY not set");
      }

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an assistant that outputs only JSON.",
          },
          {
            role: "user",
            content: `Придумай ровно 3 коротких варианта названия бренда по слову "${q}". Ответь строго в JSON формате: {"names":["название1","название2","название3"]}`,
          },
        ],
        max_tokens: 120,
        temperature: 0.8,
      });

      const raw = completion?.data?.choices?.[0]?.message?.content || "";

      // Попытка распарсить JSON (OpenAI иногда отдаёт невалидный JSON)
      try {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.names)) {
          names = parsed.names
            .map((n) => String(n).trim())
            .filter(Boolean)
            .slice(0, 3);
        }
      } catch (parseErr) {
        // fallback: извлекаем построчно, убираем нумерацию и кавычки
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
    } catch (aiErr) {
      // Логируем ошибку внутри сервера — но не возвращаем HTML/текст клиенту
      console.error(
        "OpenAI error (will use fallback):",
        aiErr?.message || aiErr
      );
      debug = aiErr?.message || String(aiErr);
    }

    // Если получилось меньше 3, добиваем безопасными вариантами
    while (names.length < 3) {
      const idx = names.length + 1;
      // Делаем осмысленные fallback-имена
      names.push(`${q}${idx === 1 ? "" : " " + idx}`);
    }

    // Возвращаем 200 и гарантируем JSON-ответ
    return res.status(200).json({ names, debug: debug ? String(debug) : null });
  } catch (err) {
    // Любая непредвиденная ошибка — логируем и возвращаем безопасный JSON вместо 500 HTML
    console.error("Unhandled server error:", err);
    const fallback = ["Brand One", "Brand Two", "Brand Three"].map(
      (v, i) => `${req.body?.keyword?.trim() || "Brand"} ${i + 1}`
    );
    return res
      .status(200)
      .json({ names: fallback, debug: String(err?.message || err) });
  }
};

// ---------------------------
// Файл: /public/js/client.js
// Надёжный клиентский код: проверяет content-type, корректно обрабатывает ошибки и отображает 3 варианта

document.getElementById("aiNameBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keywordInput").value.trim();
  const nameField = document.getElementById("brandName");
  const resultsContainer = document.getElementById("nameResults"); // опциональный блок для показа всех вариантов

  if (!keyword) {
    alert("Введите ключевое слово");
    return;
  }

  try {
    const response = await fetch("/api/generate-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });

    // Читаем content-type — если сервер вернул не-JSON, получим текст и покажем понятную ошибку
    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();

    let data;
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (parseErr) {
        // Сервер сказал JSON, но тело — некорректно
        const rawText = await response.text();
        throw new Error(
          `Ошибка разбора JSON: ${
            parseErr.message
          }. Сервер вернул: "${rawText.slice(0, 300)}"`
        );
      }
    } else {
      const rawText = await response.text();
      // Обычно это HTML-страница ошибки от провайдера (Vercel, Netlify и т.п.)
      throw new Error(
        `Ожидался JSON, сервер вернул другой тип: ${
          contentType || "unknown"
        }. Тело: "${rawText.slice(0, 300)}"`
      );
    }

    if (!response.ok) {
      // Сервер вернул статус ошибки, но тело — JSON (см. error/debug поля)
      throw new Error(
        data?.error ||
          data?.message ||
          `Ошибка сервера: ${response.status} ${response.statusText}`
      );
    }

    const names = Array.isArray(data.names) ? data.names : [];
    if (!names.length) {
      throw new Error("Сервер не вернул варианты названий.");
    }

    // Подставляем первый вариант
    nameField.value = names[0];

    // Если есть контейнер результатов — рендерим кнопки для выбора
    if (resultsContainer) {
      resultsContainer.innerHTML = "";
      names.forEach((n) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ai-name-option";
        btn.textContent = n;
        btn.addEventListener("click", () => {
          nameField.value = n;
        });
        resultsContainer.appendChild(btn);
      });
    }

    console.log("Сгенерированные названия:", names);
  } catch (err) {
    console.error("Ошибка генерации названия:", err);
    // Показываем краткое сообщение пользователю
    alert("Ошибка генерации названия: " + (err.message || String(err)));
  }
});
