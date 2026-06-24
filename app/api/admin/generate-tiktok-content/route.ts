// TikTok content generator — uses Anthropic Claude to produce:
// 5 hooks, 3 captions, 3 benefit bullets, 1 video script, hashtags
// Called from the admin product detail panel.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GenerateRequest {
  title: string
  category?: string
  description?: string
  price?: number
  selling_price?: number
  tags?: string[]
  why_trending?: string
  main_benefit?: string
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: GenerateRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, category, description, price, selling_price, tags, why_trending, main_benefit } = body
  const displayPrice = price ?? selling_price
  const priceStr = displayPrice ? `$${displayPrice.toFixed(2)}` : ''

  const prompt = `You are a viral TikTok Shop content strategist. Generate content for this product that will drive clicks and sales.

Product: ${title}
Category: ${category ?? 'General'}
Price: ${priceStr}
Description: ${description ?? 'No description provided'}
Tags: ${tags?.join(', ') ?? 'none'}
Why it's trending: ${why_trending ?? 'unknown'}
Main benefit: ${main_benefit ?? 'unknown'}

Generate the following — be casual, urgent, and sales-driven. No fluff. Real TikTok tone.

Return ONLY valid JSON in this exact format:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "captions": ["caption1", "caption2", "caption3"],
  "benefit_bullets": ["bullet1", "bullet2", "bullet3"],
  "video_script": "full short video script here (15-30 seconds read time)",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5 #tag6 #tag7 #tag8 #tag9 #tag10"
}

Rules:
- Hooks: Start with a pattern interrupt. Make the viewer stop scrolling. Under 12 words each.
- Captions: 1-2 sentences. End with a CTA like "Link in bio" or "Tap to shop."
- Benefit bullets: Start with an action word. Focus on the transformation, not the feature.
- Video script: Include a hook, problem, solution, and CTA. Natural spoken language.
- Hashtags: Mix niche-specific and broad TikTok commerce tags.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      hooks: string[]
      captions: string[]
      benefit_bullets: string[]
      video_script: string
      hashtags: string
    }

    return NextResponse.json({
      hooks: parsed.hooks?.slice(0, 5) ?? [],
      captions: parsed.captions?.slice(0, 3) ?? [],
      benefit_bullets: parsed.benefit_bullets?.slice(0, 3) ?? [],
      video_script: parsed.video_script ?? '',
      hashtags: parsed.hashtags ?? '',
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error }, { status: 500 })
  }
}
