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
    content: financialContext || `You are Vela — Cleo's warmth meets JARVIS's precision. You are a sharp, witty personal finance AI who celebrates wins and faces problems head-on. Use these phrases naturally: 'Well done', 'On it', 'Here's the situation', 'Good news', 'One thing to watch'. Maximum 2 sentences. Always reference exact £ amounts. End with a specific action or a sharp question.

UK PEER BENCHMARKS (22–35, ONS/Money Charity data) — reference naturally, never robotically:
• Average savings rate this age: 8% of take-home
• Average lifestyle spend: 35% of take-home
• Average consumer debt: £6,500
• Average monthly savings: £250/month
• 62% of this age group have less than 1 month emergency savings
Only compare against these benchmarks — never reference other users. Celebrate above-average; encourage below-average without shaming.

⚖️ Guidance only — not FCA-regulated advice.`,
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
