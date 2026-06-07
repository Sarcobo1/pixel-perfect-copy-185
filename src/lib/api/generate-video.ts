import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { formatScrapedForAI, scrapeWebsite } from "@/lib/scrape-website";
import { callOpenRouter } from "@/lib/api/openrouter";
import {
  JSON_MOTION_SYSTEM_PROMPT,
  buildUserPrompt,
  PREMIUM_PALETTES,
} from "@/lib/api/video-prompt";
import type { MotionVideoSchema } from "@/lib/motion/schema";
import { parseMotionVideoJson, stripJsonFences } from "@/lib/api/parse-video-json";
import { AnimationRegistry } from "@/lib/motion/AnimationRegistry";

// ─── ANIMATION SELF-EXTENSION HELPERS ─────────────────────────────────────────

function findUnknownAnimations(schema: MotionVideoSchema): Array<{ name: string; type: "headline" | "transition" }> {
  const unknowns = new Map<string, "headline" | "transition">();
  for (const scene of schema.scenes) {
    if (scene.headlineAnimation && !AnimationRegistry.has(scene.headlineAnimation)) {
      unknowns.set(scene.headlineAnimation, "headline");
    }
    for (const key of ["transition", "transition_in", "transition_out"] as const) {
      const val = scene[key];
      if (val && !AnimationRegistry.has(val)) {
        unknowns.set(val, "transition");
      }
    }
  }
  if (schema.globalAnimation && !AnimationRegistry.has(schema.globalAnimation)) {
    unknowns.set(schema.globalAnimation, "headline");
  }
  return [...unknowns.entries()].map(([name, type]) => ({ name, type }));
}

const IMPL_SYSTEM_PROMPT = `You are a motion graphics engineer. Implement the requested animations using vanilla JS only — no GSAP, no libraries.
Use requestAnimationFrame for timing. 
Each animation function signature must be EXACTLY:
  (element, opts) => { /* your code here */ }
where element is an HTMLElement and opts = { duration?: number, delay?: number, color?: string }.
Return ONLY valid JSON, no markdown, no explanation.
Format: { "animations": [ { "name": "...", "type": "headline"|"transition", "jsCode": "...", "description": "..." } ] }`;

async function implementNewAnimations(
  unknowns: Array<{ name: string; type: "headline" | "transition" }>,
): Promise<void> {
  if (unknowns.length === 0) return;
  const list = unknowns.map((u) => `- name: "${u.name}", type: "${u.type}"`).join("\n");
  const userMsg = `Implement these animations:\n${list}\n\nReturn JSON with all implementations.`;

  try {
    const raw = await callOpenRouter({
      model: "qwen3.7-plus",
      temperature: 0.7,
      max_tokens: 3000,
      messages: [
        { role: "system", content: IMPL_SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
    });
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { animations: Array<{ name: string; type: "headline" | "transition"; jsCode: string; description?: string }> };
    for (const anim of parsed.animations || []) {
      AnimationRegistry.registerFromCode(anim.name, anim.type, anim.jsCode, anim.description);
    }
  } catch (err) {
    console.warn("[AnimationRegistry] Failed to implement new animations (non-fatal):", err);
  }
}


export const generateVideo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      description: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      telegram: z.string().optional().default(""),
      brandUrl: z.string().optional(),
      palette: z.string().optional(),
      projectId: z.string().optional(),
      animationStyle: z.string().optional(),
      voice: z.string().optional(),
      logoDataUrl: z.string().optional(),
      extractedBrand: z.record(z.union([z.string(), z.array(z.string())])).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const description =
      data.description?.trim() ||
      data.brandUrl?.trim() ||
      "Premium Brand";

    let websiteContext = "";
    if (data.brandUrl) {
      try {
        const scraped = await scrapeWebsite(data.brandUrl);
        websiteContext = formatScrapedForAI(scraped);
      } catch (err) {
        console.warn("Website scrape failed (non-fatal):", err);
      }
    }

    const preExtracted = data.extractedBrand ?? {};
    const hasPreExtracted = Object.keys(preExtracted).length > 0;

    const instagram = data.instagram?.trim() ?? "";
    const telegram = data.telegram?.trim() ?? "";
    const socialLine = [instagram && `@${instagram}`, telegram && `t.me/${telegram}`]
      .filter(Boolean)
      .join("  ·  ");

    const brandInfo = hasPreExtracted
      ? `Brand data: ${JSON.stringify(preExtracted, null, 2)}`
      : `Business description: ${description}\n\nWebsite intelligence:\n${websiteContext || "(none provided)"}`;

    const userPrompt = buildUserPrompt({
      brandInfo,
      palette: data.palette ?? "CloudDancer",
      socialLine,
      brandUrl: data.brandUrl,
    });

    let htmlContent = await callOpenRouter({
      model: "qwen3.7-plus",
      temperature: 0.9,
      max_tokens: 6000,
      messages: [
        { role: "system", content: JSON_MOTION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    htmlContent = htmlContent.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/i, "").trim();

    const brandName = description.split(/[\s,./]+/)[0] || "Brand";

    return {
      success: true,
      projectId: data.projectId ?? `ai-${Date.now()}`,
      htmlCode: htmlContent,
      brandContext: { brand_name: brandName, description },
      brandName,
      message: "Video generated successfully!",
    };
  });

// ─── JSON-mode generation ──────────────────────────────────────────────────────
// Uses the new compact JSON prompt → MotionPlayer renders on the frontend.
// ~400 token response vs ~16k for HTML → 3-5s generation time.

export const generateVideoJson = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      description: z.string().optional().default(""),
      instagram: z.string().optional().default(""),
      telegram: z.string().optional().default(""),
      brandUrl: z.string().optional(),
      palette: z.string().optional().default("RetroElectric"),
      projectId: z.string().optional(),
      animationStyle: z.string().optional(),
      logoDataUrl: z.string().optional(),
      extractedBrand: z.record(z.union([z.string(), z.array(z.string())])).optional(),
      customPrompt: z.string().optional(),
      aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const description =
      data.description?.trim() ||
      data.brandUrl?.trim() ||
      "Premium Brand";

    let websiteContext = "";
    if (data.brandUrl) {
      try {
        const scraped = await scrapeWebsite(data.brandUrl);
        websiteContext = formatScrapedForAI(scraped);
      } catch (err) {
        console.warn("Website scrape failed (non-fatal):", err);
      }
    }

    const preExtracted = data.extractedBrand ?? {};
    const hasPreExtracted = Object.keys(preExtracted).length > 0;

    const instagram = data.instagram?.trim() ?? "";
    const telegram = data.telegram?.trim() ?? "";
    const socialLine = [
      instagram && `@${instagram}`,
      telegram && `t.me/${telegram}`,
    ]
      .filter(Boolean)
      .join("  ·  ");

    // Always combine both pre-extracted brand data AND live website context
    // This ensures the AI has maximum information to create content-rich videos
    let brandInfo = "";
    if (hasPreExtracted && websiteContext) {
      brandInfo = `BRAND DATA (pre-extracted):\n${JSON.stringify(preExtracted, null, 2)}\n\nLIVE WEBSITE CONTENT (use this for specific features, pricing, headlines, stats):\n${websiteContext}`;
    } else if (hasPreExtracted) {
      brandInfo = `BRAND DATA:\n${JSON.stringify(preExtracted, null, 2)}`;
    } else if (websiteContext) {
      brandInfo = `Business: ${description}\n\nLIVE WEBSITE CONTENT:\n${websiteContext}`;
    } else {
      brandInfo = `Business: ${description}. No website data available — INVENT a premium brand story around this topic in the style of Apple, Stripe, or Nike.`;
    };

    // Build animation hint list for the AI prompt
    const headlineAnims = AnimationRegistry.getList("headline").map((a) => a.name);
    const transitionAnims = AnimationRegistry.getList("transition").map((a) => a.name);
    const animHint = `\n\nAVAILABLE HEADLINE ANIMATIONS: ${headlineAnims.join(", ")}\nAVAILABLE TRANSITIONS: ${transitionAnims.join(", ")}\nYou may also PROPOSE new animation names — the system will auto-implement them.`;

    const availableLayouts = [
      "center_hero",
      "cards_3",
      "cards_4",
      "stats_3",
      "terminal",
      "split_horizontal",
      "quote",
      "kinetic_push",
      "center_push_stack",
      "text_morph",
      "split_screen",
      "zoom_data",
    ];

    // Detect pacing from user's custom prompt
    const promptLower = (data.customPrompt || "").toLowerCase();
    const isFast = /fast|quick|energetic|dynamic|punchy|rapid|snappy/.test(promptLower);
    const isSlow = /slow|cinematic|elegant|luxury|calm|serene|relaxed/.test(promptLower);

    // All videos ALWAYS have exactly 8 scenes totaling 20 seconds
    const numScenes = 8;

    // Generate random sequence without consecutive repeats
    // Always include at least 2 special layouts (kinetic, morph, etc.)
    const forcedLayouts: string[] = [];
    let lastLayout = "";
    const specialLayouts = ["kinetic_push", "center_push_stack", "text_morph", "zoom_data", "split_screen"];
    const trendLayouts = ["title_card", "bento_grid", "popup_social", "callout_card", "lower_third", "retro_paper"];
    const regularLayouts = availableLayouts.filter(l => !specialLayouts.includes(l));
    const allLayouts = [...regularLayouts, ...trendLayouts];

    let specialCount = 0;
    for (let i = 0; i < numScenes; i++) {
      let pool: string[];
      // Force a special layout at positions 3 and 6
      if ((i === 2 || i === 5) && specialCount < 2) {
        pool = specialLayouts;
        specialCount++;
      } else {
        pool = allLayouts;
      }

      // Ensure the last scene is a strong outro, NOT cards or search
      if (i === numScenes - 1) {
        const outroPool = ["center_hero", "split_horizontal", "kinetic_push", "zoom_data", "center_push_stack"];
        forcedLayouts.push(outroPool[Math.floor(Math.random() * outroPool.length)]);
        break;
      }

      let layout = pool[Math.floor(Math.random() * pool.length)];
      let attempts = 0;
      while (layout === lastLayout && pool.length > 1 && attempts < 10) {
        layout = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      }
      forcedLayouts.push(layout);
      lastLayout = layout;
    }

    const userPrompt = buildUserPrompt({
      brandInfo: brandInfo + animHint,
      palette: data.palette ?? "CloudDancer",
      socialLine,
      brandUrl: data.brandUrl,
      customPrompt: data.customPrompt,
      forcedLayouts,
      aspectRatio: data.aspectRatio,
    });

    let schema!: MotionVideoSchema;
    let lastRaw = "";
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const rawJson = await callOpenRouter({
          model: "qwen3.7-plus",
          temperature: 0.85,
          max_tokens: 6000,
          messages: [
            { role: "system", content: JSON_MOTION_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        });
        lastRaw = rawJson;
        schema = parseMotionVideoJson(rawJson);
        break;
      } catch (parseErr) {
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `AI returned invalid JSON after ${maxAttempts} attempts: ${
              parseErr instanceof Error ? parseErr.message : "parse error"
            }. Raw: ${lastRaw.slice(0, 300)}`,
          );
        }
      }
    }

    // ── Self-extending animation system ───────────────────────────────────────
    // Find any animation names the AI proposed that aren't in the registry,
    // ask AI to implement them, register + embed in schema for the client.
    const unknownAnims = findUnknownAnimations(schema);
    if (unknownAnims.length > 0) {
      console.log(`[AnimationRegistry] Found ${unknownAnims.length} unknown animation(s):`, unknownAnims.map((a) => a.name));
      await implementNewAnimations(unknownAnims);
      // Embed all newly-registered custom animations into the schema so MotionPlayer can use them
      const customEntries = unknownAnims
        .map(({ name, type }) => {
          const code = AnimationRegistry.getCode(name);
          const entry = AnimationRegistry.getEntry(name);
          if (!code) return null;
          return { name, type, jsCode: code, description: entry?.description ?? "" };
        })
        .filter(Boolean) as Array<{ name: string; type: "headline" | "transition"; jsCode: string; description: string }>;
      if (customEntries.length > 0) {
        schema.customAnimations = customEntries;
        console.log(`[AnimationRegistry] Embedded ${customEntries.length} custom animation(s) into schema.`);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const basePalette = PREMIUM_PALETTES[data.palette ?? "RetroElectric"] || PREMIUM_PALETTES.CloudDancer;
    schema.palette = { ...basePalette, ...(schema.palette || {}) };
    // AI has full control over colors, no forced text colors

    // Inject logo if provided
    if (data.logoDataUrl) {
      schema.logoUrl = data.logoDataUrl;
    }

    // Ensure version field is present
    if (!schema.version) {
      (schema as any).version = "1.0";
    }

    if (data.aspectRatio) {
      schema.aspectRatio = data.aspectRatio;
      schema.aspect_ratio = data.aspectRatio;
    }

    const brandName =
      schema.brandName ||
      description.split(/[\s,./]+/)[0] ||
      "Brand";

    return {
      success: true,
      projectId: data.projectId ?? `ai-json-${Date.now()}`,
      schema,
      brandName,
      message: "Motion schema generated successfully!",
    };
  });
