import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scrapeWebsite, formatScrapedForAI } from "@/lib/scrape-website";
import { callOpenRouter } from "@/lib/api/openrouter";
import { buildUserPrompt, JSON_MOTION_SYSTEM_PROMPT, PREMIUM_PALETTES } from "@/lib/api/video-prompt";
import { MotionVideoSchema } from "@/lib/motion/schema";

function stripJsonFences(raw: string): string {
  return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
}

function enforceContrast(schema: any) {
  if (!schema?.palette?.bg) return;
  const hex = schema.palette.bg.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 155;

  if (isLight) {
    schema.palette.text = "#0f172a";
    schema.palette.muted = "rgba(15,23,42,0.55)";
    if (!schema.palette.border?.includes("0")) schema.palette.border = "rgba(0,0,0,0.12)";
    if (!schema.palette.cardBg?.includes("0")) schema.palette.cardBg = "rgba(0,0,0,0.04)";
  } else {
    schema.palette.text = "#f8fafc";
    schema.palette.muted = "rgba(248,250,252,0.55)";
  }
}

function autoSelectPalette(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("coffee") || p.includes("warm") || p.includes("food") || p.includes("sunset") || p.includes("minimal")) return "MinimalMaximalism";
  if (p.includes("tech") || p.includes("ai") || p.includes("app") || p.includes("retro") || p.includes("neon") || p.includes("cyber")) return "RetroElectric";
  if (p.includes("clean") || p.includes("white") || p.includes("cloud") || p.includes("light")) return "CloudDancer";
  if (p.includes("glass") || p.includes("blur") || p.includes("ocean") || p.includes("blue")) return "Glassmorphism";
  return "CloudDancer";
}

export const generateVideoJson = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      description: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      telegram: z.string().optional().default(""),
      brandUrl: z.string().optional(),
      palette: z.string().optional(),
      projectId: z.string().optional(),
      animationStyle: z.string().optional(),
      logoDataUrl: z.string().optional(),
      extractedBrand: z.record(z.union([z.string(), z.array(z.string())])).optional(),
      customPrompt: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const description = data.description?.trim() || data.brandUrl?.trim() || "Premium Brand";

    let websiteContext = "";
    if (data.brandUrl) {
      try {
        const scraped = await scrapeWebsite(data.brandUrl);
        websiteContext = formatScrapedForAI(scraped);
      } catch (err) {
        console.warn("Scrape failed:", err);
      }
    }

    const preExtracted = data.extractedBrand ?? {};
    const hasPreExtracted = Object.keys(preExtracted).length > 0;

    const instagram = data.instagram?.trim() ?? "";
    const telegram = data.telegram?.trim() ?? "";
    const socialLine = [instagram && `@${instagram}`, telegram && `t.me/${telegram}`].filter(Boolean).join("  ·  ");

    const brandInfo = hasPreExtracted
      ? `Brand data: ${JSON.stringify(preExtracted)}`
      : `Business: ${description}\n${websiteContext || ""}`;

    const selectedPalette = data.palette || autoSelectPalette(description + (data.customPrompt || ""));
    const palette = PREMIUM_PALETTES[selectedPalette] || PREMIUM_PALETTES.CloudDancer;

    const userPrompt = buildUserPrompt({
      brandInfo,
      palette: selectedPalette,
      socialLine,
      brandUrl: data.brandUrl,
      animationStyle: data.animationStyle,
      customPrompt: data.customPrompt,
    });

    const rawJson = await callOpenRouter({
      model: "qwen3.7-plus",
      temperature: 0.7,
      max_tokens: 4096,
      messages: [
        { role: "system", content: JSON_MOTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    let schema: any;
    try {
      schema = JSON.parse(stripJsonFences(rawJson));
    } catch (parseErr) {
      throw new Error(`Invalid JSON from AI: ${rawJson.slice(0, 300)}`);
    }

    // Validate and fix
    schema.version = "1.0";
    schema.duration = schema.duration || 30;
    schema.palette = { ...palette, ...schema.palette };
    enforceContrast(schema);

    if (data.logoDataUrl) schema.logoUrl = data.logoDataUrl;

    // Validate with Zod
    const parsed = MotionVideoSchema.safeParse(schema);
    if (!parsed.success) {
      console.error("Schema validation failed:", parsed.error);
      throw new Error(`Schema validation failed: ${parsed.error.message}`);
    }

    return {
      success: true,
      projectId: data.projectId ?? `motion-${Date.now()}`,
      schema: parsed.data,
      brandName: schema.brandName || description.split(/[\s,./]+/)[0] || "Brand",
      message: "Motion schema generated!",
    };
  });
