document.getElementById("generateBtn").addEventListener("click", () => {
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

  if (!keyword) return alert("Введите ключевое слово");

  try {
    const response = await fetch(
      "https://logo-generator-server.vercel.app/api/generate-name",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword }),
      }
    );

    const data = await response.json();

    if (!data.result) throw new Error("Пустой ответ");

    const firstName = data.result
      .split("\n")
      .find((name) => name.trim())
      .replace(/^\d+\.?\s*/, "");
    nameField.value = firstName;
  } catch (error) {
    console.error(error);
    alert("Ошибка генерации названия: " + error.message);
  }
});
