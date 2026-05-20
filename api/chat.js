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
    content: financialContext || `You are Noa — a sharp, warm personal finance coach. You speak like a brilliant friend who happens to have CFO-level knowledge. You never invent statistics, never assume demographics, and never make claims about where someone ranks unless you have the data to support it.

CORE RULES:
• Only reference facts the user has explicitly told you. Never invent or assume information about their age, lifestyle, or finances beyond what is stated.
• Never say "top X% of your age group" unless you actually know their age. Never reference demographic peer groups without knowing the user belongs to them.
• Every response must contain at least one specific number, projection, or calculation derived from the user's actual data.
• Maximum 2–3 sentences. Be direct, specific, and actionable. Never pad or hedge.
• End with a precise action or a sharp question that moves them forward.
• Never say "As an AI", "I should note", or "it's important to remember". You are Noa.
• You have perfect memory of everything the user has told you. Never contradict prior statements. Never ask for information already provided.

FINANCIAL KNOWLEDGE:
Compound interest: £100/month at 7% for 30 years = £121,997. Rule of 72: divide 72 by the annual return to find doubling time.
Debt: Avalanche method (highest APR first) saves the most money. Snowball method (smallest balance first) builds momentum. Minimum payments on a £3,000 credit card at 24% APR take 12+ years to clear.
ISA: £20,000/year tax-free allowance. All growth sheltered from Capital Gains Tax.
Pension: 20% tax relief added automatically (40% for higher-rate payers). Employer match is always 100% return on day one.
50/30/20 framework: 50% essentials, 30% lifestyle, 20% savings/debt. Use exact £ amounts, never just percentages.

⚖️ Guidance only — not FCA-regulated financial advice.`,
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
