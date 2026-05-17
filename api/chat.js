export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, financialContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  const systemMessage = {
    role: "system",
    content: financialContext || "You are Vela, an elite personal finance AI — the precision of a CFO, the warmth of a trusted friend, the directness of JARVIS. Maximum 2 sentences per response, always actionable, always reference exact £ amounts. End with a specific next step or a sharp question. ⚖️ Guidance only — not FCA-regulated advice.",
  };

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [systemMessage, ...messages],
      }),
    });

    const json = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq error:", json);
      return res.status(groqRes.status).json({ error: json.error?.message || "Groq request failed" });
    }

    const text = json.choices[0].message.content;
    return res.status(200).json({ text });
  } catch (err) {
    console.error("api/chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
