import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/nutrition/ai-parse
// Body: { description: string }
// Returns: { name, kcal, proteinG, carbsG, fatG, quantity, unit, confidence, reasoning }

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let description: string
  try {
    const body = await req.json()
    description = (body.description || '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 })
  }
  if (description.length > 500) {
    return NextResponse.json({ error: 'Description too long (max 500 chars)' }, { status: 400 })
  }

  const prompt = `You are a precise nutrition analyst. The user will describe a meal or food item they ate. Estimate its nutritional content as accurately as possible.

User's description: "${description}"

Respond with ONLY a valid JSON object (no markdown, no explanation outside the JSON):
{
  "name": "concise food name (max 40 chars)",
  "kcal": <integer, total calories>,
  "proteinG": <number, grams of protein, 1 decimal>,
  "carbsG": <number, grams of carbohydrates, 1 decimal>,
  "fatG": <number, grams of fat, 1 decimal>,
  "quantity": <number, serving size>,
  "unit": "<g|ml|oz|cup|tbsp|pcs|serving>",
  "confidence": "<high|medium|low>",
  "reasoning": "one sentence explaining your estimate"
}

Rules:
- Be realistic and accurate; use typical portion sizes if size is unspecified
- If the description is ambiguous, estimate for a standard portion and note this
- kcal should be consistent with the macros (protein × 4 + carbs × 4 + fat × 9 ≈ kcal)
- confidence: high = specific food with known values, medium = reasonable estimate, low = very vague
- Do NOT include any text before or after the JSON`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''

    // Extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[ai-parse] No JSON in response:', raw)
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    let parsed: {
      name: string; kcal: number; proteinG: number; carbsG: number; fatG: number;
      quantity: number; unit: string; confidence: string; reasoning: string;
    }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (e) {
      console.error('[ai-parse] JSON parse error:', e, raw)
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
    }

    // Validate and sanitise
    const result = {
      name:       String(parsed.name      || description.slice(0, 40)),
      kcal:       Math.round(Math.max(0, Number(parsed.kcal)     || 0)),
      proteinG:   Math.round(Math.max(0, Number(parsed.proteinG) || 0) * 10) / 10,
      carbsG:     Math.round(Math.max(0, Number(parsed.carbsG)   || 0) * 10) / 10,
      fatG:       Math.round(Math.max(0, Number(parsed.fatG)     || 0) * 10) / 10,
      quantity:   Math.max(1, Number(parsed.quantity) || 1),
      unit:       String(parsed.unit      || 'serving'),
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      reasoning:  String(parsed.reasoning || ''),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ai-parse] Anthropic error:', error)
    return NextResponse.json({ error: 'AI service unavailable. Try again or enter manually.' }, { status: 503 })
  }
}
