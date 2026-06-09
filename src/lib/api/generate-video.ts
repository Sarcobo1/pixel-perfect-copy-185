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

// ─── MUSIC SELECTION ──────────────────────────────────────────────────────────

const MOOD_MAP: Record<string, { q: string; order: string }> = {
  energetic:  { q: "energetic upbeat",   order: "popular" },
  calm:       { q: "calm ambient",        order: "popular" },
  dramatic:   { q: "dramatic cinematic",  order: "popular" },
  uplifting:  { q: "uplifting inspiring", order: "popular" },
  dark:       { q: "dark powerful",       order: "popular" },
  corporate:  { q: "corporate modern",    order: "popular" },
};

async function fetchMusicFallback(mood: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return null;
  const params = MOOD_MAP[mood] ?? MOOD_MAP.corporate;
  try {
    const res = await fetch(
      `https://pixabay.com/api/videos/music/?key=${apiKey}&q=${encodeURIComponent(params.q)}&order=${params.order}&per_page=10`,
    );
    if (!res.ok) return null;
    const data = await res.json() as { hits?: Array<{ audio: string }> };
    if (!data.hits?.length) return null;
    const top = data.hits.slice(0, 5);
    return top[Math.floor(Math.random() * top.length)].audio;
  } catch {
    return null;
  }
}

async function fetchMusic(mood: string, category: string): Promise<string | null> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    console.warn("[Music] PIXABAY_API_KEY not set — skipping music fetch");
    return null;
  }
  const params = MOOD_MAP[mood] ?? MOOD_MAP.corporate;
  try {
    const res = await fetch(
      `https://pixabay.com/api/videos/music/?key=${apiKey}&q=${encodeURIComponent(params.q)}&category=${category}&order=${params.order}&per_page=20`,
    );
    if (!res.ok) {
      console.warn(`[Music] Pixabay error ${res.status}, trying fallback`);
      return fetchMusicFallback(mood);
    }
    const data = await res.json() as { hits?: Array<{ audio: string }> };
    if (!data.hits?.length) {
      console.log("[Music] No results with category, trying fallback");
      return fetchMusicFallback(mood);
    }
    const top5 = data.hits.slice(0, 5);
    const track = top5[Math.floor(Math.random() * top5.length)];
    console.log(`[Music] Selected track for mood="${mood}" category="${category}"`);
    return track.audio;
  } catch (err) {
    console.warn("[Music] Fetch failed (non-fatal):", err);
    return null;
  }
}

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
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error(
        "AI generation is not configured. Please add your DASHSCOPE_API_KEY secret to enable video generation.",
      );
    }

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
    if (!process.env.DASHSCOPE_API_KEY) {
      throw new Error(
        "AI generation is not configured. Please add your DASHSCOPE_API_KEY secret to enable video generation.",
      );
    }

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
    const animHint = `\n\nAVAILABLE HEADLINE ANIMATIONS: ${headlineAnims.join(", ")}\nAVAILABLE TRANSITIONS: ${transitionAnims.join(", ")}\nDO NOT propose new animations. Use ONLY the ones listed above.`;

    const VALID_LAYOUTS = new Set([
      "center_hero", "cards_3", "cards_4", "stats_3", "terminal",
      "split_horizontal", "split_vertical", "bento", "carousel", "quote",
      "search_bar", "kinetic_push", "center_push_stack", "word_stack_reveal",
      "text_morph", "split_screen", "zoom_data", "title_card", "lower_third",
      "callout_card", "popup_social", "bento_grid", "retro_paper",
    ]);

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
    const isMinimal = /minimal|simple|ideogram|toza|qisqa|sodda|kamroq/.test(promptLower);

    // All videos ALWAYS have exactly 8 scenes totaling 20 seconds
    const numScenes = 8;

    // Generate random sequence without consecutive repeats
    // Always include at least 2 special layouts (kinetic, morph, etc.)
    const forcedLayouts: string[] = [];
    const recentLayouts: string[] = [];
    const specialLayouts = ["kinetic_push", "center_push_stack", "text_morph", "zoom_data", "split_screen"];
    const trendLayouts = ["title_card", "bento_grid", "cards_3", "cards_4", "retro_paper"];
    const regularLayouts = availableLayouts.filter(l => !specialLayouts.includes(l));
    
    let allLayouts = [...regularLayouts, ...trendLayouts];
    let currentSpecialLayouts = specialLayouts;

    if (isMinimal || isSlow) {
      allLayouts = ["title_card", "center_hero", "text_morph", "zoom_data", "quote"];
      currentSpecialLayouts = ["text_morph", "zoom_data"];
    }

    let specialCount = 0;
    for (let i = 0; i < numScenes; i++) {
      let pool: string[];
      // Force scene 0 to be a strong intro
      if (i === 0) {
        pool = ["title_card", "center_hero"];
      } else if ((i === 2 || i === 5) && specialCount < 2) {
        pool = currentSpecialLayouts;
        specialCount++;
      } else {
        pool = allLayouts;
      }

      // Ensure the last scene is a strong outro, NOT cards or search
      if (i === numScenes - 1) {
        const outroPool = isMinimal ? ["title_card", "center_hero", "zoom_data"] : ["center_hero", "split_horizontal", "kinetic_push", "zoom_data", "center_push_stack"];
        forcedLayouts.push(outroPool[Math.floor(Math.random() * outroPool.length)]);
        break;
      }

      let layout = pool[Math.floor(Math.random() * pool.length)];
      let attempts = 0;
      while (recentLayouts.includes(layout) && pool.length > recentLayouts.length && attempts < 20) {
        layout = pool[Math.floor(Math.random() * pool.length)];
        attempts++;
      }
      forcedLayouts.push(layout);
      recentLayouts.push(layout);
      if (recentLayouts.length > 2) recentLayouts.shift();
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
      console.log(`[AnimationRegistry] Found ${unknownAnims.length} unknown animation(s), falling back to safe defaults:`, unknownAnims.map((a) => a.name));
      for (const scene of schema.scenes) {
        if (scene.headlineAnimation && !AnimationRegistry.has(scene.headlineAnimation)) {
          scene.headlineAnimation = "slam_drop";
        }
        for (const key of ["transition", "transition_in", "transition_out"] as const) {
          const val = scene[key];
          if (val && !AnimationRegistry.has(val)) {
             (scene as any)[key] = "fade";
          }
        }
      }
    }

    // ── Post-parse scene sanitization ────────────────────────────────────────
    // Fix cards_3/cards_4 scenes that don't have enough cards
    const PLACEHOLDER_ICONS = ["⚡", "🚀", "✨", "🎯", "🔥", "💡", "🛡️", "⚙️"];
    for (const scene of schema.scenes) {
      if (scene.layout === "cards_3") {
        const cards = scene.cards || [];
        while (cards.length < 3) {
          cards.push({ title: "Feature", icon: PLACEHOLDER_ICONS[cards.length % PLACEHOLDER_ICONS.length] });
        }
        scene.cards = cards.slice(0, 3);
      }
      if (scene.layout === "cards_4") {
        const cards = scene.cards || [];
        while (cards.length < 4) {
          cards.push({ title: "Feature", icon: PLACEHOLDER_ICONS[cards.length % PLACEHOLDER_ICONS.length] });
        }
        scene.cards = cards.slice(0, 4);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const basePalette = PREMIUM_PALETTES[data.palette ?? "RetroElectric"] || PREMIUM_PALETTES.CloudDancer;
    schema.palette = { ...basePalette, ...(schema.palette || {}) };

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

    // ── Music selection ────────────────────────────────────────────────────
    // Runs in parallel with no blocking — non-fatal if Pixabay key is missing
    const musicMeta = schema.music;
    if (musicMeta) {
      const musicUrl = await fetchMusic(musicMeta.mood, musicMeta.category);
      if (musicUrl) {
        schema.musicUrl = musicUrl;
        console.log(`[Music] Attached track: ${musicUrl.slice(0, 60)}…`);
      }
    }
    // ──────────────────────────────────────────────────────────────────────

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
