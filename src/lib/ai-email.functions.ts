import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  businessType: z.string().max(200).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const generateOutreachEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const tags = data.tags?.length ? data.tags.join(", ") : "none";
    const prompt = `You are a warm, professional outreach assistant for a solo business owner.
Generate a concise outreach email (under 150 words) for the following client.

Client name: ${data.name}
Business type: ${data.businessType || "unknown"}
Tags: ${tags}
Notes: ${data.notes || "none"}

Return ONLY a strict JSON object with two keys: "subject" (max 80 chars) and "body" (plain text, no greeting placeholders, sign off as "Best,").`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write concise, friendly B2B outreach emails. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in your workspace settings.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI request failed: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    let parsed: { subject: string; body: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: use raw content as body
      parsed = { subject: `Quick hello, ${data.name.split(" ")[0]}`, body: cleaned };
    }
    return { subject: parsed.subject || "", body: parsed.body || "" };
  });
