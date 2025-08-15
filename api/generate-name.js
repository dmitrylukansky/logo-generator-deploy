// =============================================
// File: /api/generate-name.js  (Vercel/Node ESM)
// Goal: Always return 3 names without throwing, even if OpenAI fails (403/429/etc.).
// - OpenAI is OPTIONAL. Enable via USE_OPENAI=1 + OPENAI_API_KEY
// - Optional proxy via FORCE_PROXY=1 + PROXY_URL (e.g. http://127.0.0.1:8080)
// =============================================

// NOTE: Do NOT import https-proxy-agent statically. We dynamically import it only when needed
// to avoid "is not a constructor" issues across versions/environments.

import OpenAI from "openai";

/** Capitalize first letter of each word (handles Latin/Cyrillic) */
function toTitle(str) {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Build 3 distinct locally-generated brand names */
function generateLocalNames(keyword) {
  const q = toTitle(String(keyword || "Brand").trim());
  const tokens = q.split(/\s+/).filter(Boolean);
  const core = tokens[0] || "Brand";
  const tail = tokens[1] || "";

  const ruSuffixes = [
    "Лаб",
    "Студия",
    "Фабрика",
    "Про",
    "Плюс",
    "Маркет",
    "Арт",
  ];
  const enSuffixes = [
    "Lab",
    "Studio",
    "Works",
    "Craft",
    "Hub",
    "Forge",
    "Space",
    "Flow",
    "Pulse",
    "Vibe",
  ];
  const prefixes = [
    "Neo",
    "Astra",
    "Nova",
    "Ultra",
    "Prime",
    "Meta",
    "Vita",
    "Luxe",
    "Next",
  ];

  const variants = new Set();

  // 1) CamelCase из исходных слов
  variants.add(
    tokens.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("")
  ); // КофеУтром

  // 2) Core + RU суффикс
  variants.add(
    `${core} ${ruSuffixes[Math.floor(Math.random() * ruSuffixes.length)]}`
  );

  // 3) Core + EN суффикс (без пробела -> брендово)
  variants.add(
    `${core}${enSuffixes[Math.floor(Math.random() * enSuffixes.length)]}`
  );

  // 4) Prefix + Core
  variants.add(
    `${prefixes[Math.floor(Math.random() * prefixes.length)]}${core}`
  );

  // 5) Tail впереди, если есть
  if (tail) variants.add(`${tail}${core}`);

  // Собираем первые 3 уникальные
  const out = Array.from(variants).filter(Boolean).slice(0, 3);
  while (out.length < 3) out.push(`${core} ${out.length + 1}`);
  return out;
}

/** Try to parse up to 3 names from a free-form text */
function parseNamesFromText(text) {
  return String(text || "")
    .split(/\r?\n+/)
    .map((n) =>
      n
        .replace(/^\s*\d+[)\].-]?\s*/, "")
        .replace(/^['"]|['"]$/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 3);
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", names: [] });
  }

  try {
    const { keyword } = req.body || {};
    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return res.status(200).json({ names: generateLocalNames(keyword) });
    }

    const useOpenAI =
      process.env.USE_OPENAI === "1" && !!process.env.OPENAI_API_KEY;
    let names = [];
    const debug = [];

    if (useOpenAI) {
      try {
        const clientOptions = { apiKey: process.env.OPENAI_API_KEY };

        // Optional proxy (only if explicitly requested)
        if (process.env.FORCE_PROXY === "1") {
          const proxyUrl = process.env.PROXY_URL || "http://127.0.0.1:8080";
          const mod = await import("https-proxy-agent");
          const AgentCtor = mod.HttpsProxyAgent || mod.default || mod; // support various exports
          const agent = new AgentCtor(proxyUrl);
          clientOptions.httpAgent = agent;
          clientOptions.httpsAgent = agent;
          debug.push(`proxy:${proxyUrl}`);
        }

        const openai = new OpenAI(clientOptions);
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You output only JSON." },
            {
              role: "user",
              content:
                `Придумай ровно 3 очень коротких, брендовых названия по слову "${keyword.trim()}". ` +
                `Ответь строго JSON: {"names":["n1","n2","n3"]}`,
            },
          ],
          max_tokens: 100,
          temperature: 0.8,
        });

        const raw = completion?.choices?.[0]?.message?.content || "";
        // Try JSON first
        try {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.names)) names = parsed.names;
        } catch {
          names = parseNamesFromText(raw);
        }

        debug.push("openai:ok");
      } catch (e) {
        // Any OpenAI error: 403, 429, network — fall back locally
        debug.push(`openai_error:${e?.code || e?.status || e?.message || e}`);
      }
    } else {
      debug.push("openai:disabled");
    }

    if (!Array.isArray(names)) names = [];
    // Ensure 3 names
    if (names.length < 3) {
      const extra = generateLocalNames(keyword);
      // Merge uniquely
      const seen = new Set(names.map((n) => String(n).trim()));
      for (const n of extra) {
        if (seen.size >= 3) break;
        if (!seen.has(n)) {
          names.push(n);
          seen.add(n);
        }
      }
      names = Array.from(seen).slice(0, 3);
    }

    return res.status(200).json({ names });
  } catch (err) {
    // Never leak HTML, always JSON
    console.error("Unhandled server error:", err);
    return res
      .status(200)
      .json({ names: generateLocalNames(req.body?.keyword) });
  }
}
