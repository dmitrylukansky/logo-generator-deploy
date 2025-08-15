/* document.getElementById("generateBtn").addEventListener("click", () => {
  const name = document.getElementById("brandName").value.trim();
  const color = document.getElementById("colorPicker").value;
  const font = document.getElementById("fontSelect").value;
  const icon = document.getElementById("iconSelect").value;
  const logoArea = document.getElementById("logoArea");

  if (!name) {
    logoArea.innerHTML = "<p>Введите название бренда</p>";
    return;
  }

  const fullText = icon ? `${icon} ${name}` : name;

  const svgLogo = `
    <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none" />
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-size="36" fill="${color}" font-family="${font}, sans-serif">
        ${fullText}
      </text>
    </svg>
  `;

  logoArea.innerHTML = svgLogo;
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const svgElement = document.querySelector("#logoArea svg");
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "logo.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById("randomColorBtn").addEventListener("click", () => {
  const randomColor =
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0");
  document.getElementById("colorPicker").value = randomColor;
});

//Подключим к OpenAI API (local server)

document.getElementById("aiNameBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keywordInput").value.trim();
  const nameField = document.getElementById("brandName");
  const resultsContainer = document.getElementById("nameResults");

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

    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    if (!contentType.includes("application/json")) {
      const rawText = await response.text();
      throw new Error(
        `Сервер вернул не-JSON (${
          contentType || "unknown"
        }). Тело: ${rawText.slice(0, 200)}`
      );
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `Ошибка сервера: ${response.status}`);
    }

    if (!data.names || !Array.isArray(data.names) || data.names.length === 0) {
      throw new Error("Сервер не вернул названия");
    }

    nameField.value = data.names[0];

    if (resultsContainer) {
      resultsContainer.innerHTML = "";
      data.names.forEach((n) => {
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

    console.log("Сгенерированные названия:", data.names, "Debug:", data.debug);
  } catch (err) {
    console.error("Ошибка генерации названия:", err);
    alert("Ошибка генерации названия: " + (err.message || String(err)));
  }
});
 */

// =============================================
// File: /public/js/client.js  (browser)
// - Robust fetch: checks content-type, no JSON parse crash
// - Renders 3 options as buttons (auto-creates container if absent)
// =============================================

document.getElementById("aiNameBtn").addEventListener("click", async () => {
  const keyword = document.getElementById("keywordInput").value.trim();
  const nameField = document.getElementById("brandName");
  let resultsContainer = document.getElementById("nameResults");

  if (!keyword) {
    alert("Введите ключевое слово");
    return;
  }

  // Create container if not exists
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.id = "nameResults";
    resultsContainer.style.marginTop = "8px";
    const target = nameField?.parentElement || document.body;
    target.appendChild(resultsContainer);
  }

  try {
    const response = await fetch("/api/generate-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });

    const ct = (response.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Ожидался JSON, получено: ${ct || "unknown"}. Тело: ${text.slice(
          0,
          160
        )}`
      );
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || `Ошибка сервера: ${response.status}`);
    }

    const names = Array.isArray(data.names) ? data.names.filter(Boolean) : [];
    if (names.length < 1) throw new Error("Сервер не вернул названия");

    // Autofill first
    if (nameField) nameField.value = names[0];

    // Render all three as buttons
    resultsContainer.innerHTML = "";
    names.forEach((n) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = n;
      btn.style.marginRight = "6px";
      btn.style.marginBottom = "6px";
      btn.style.padding = "6px 10px";
      btn.style.borderRadius = "8px";
      btn.style.border = "1px solid #ddd";
      btn.style.cursor = "pointer";
      btn.addEventListener("click", () => {
        if (nameField) nameField.value = n;
      });
      resultsContainer.appendChild(btn);
    });

    console.log("Сгенерированные названия:", names);
  } catch (error) {
    console.error("Ошибка генерации названия:", error);
    alert("Ошибка генерации названия: " + (error.message || String(error)));
  }
});
