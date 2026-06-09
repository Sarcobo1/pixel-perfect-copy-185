import type { MotionPalette } from "@/lib/motion/schema";

// ─── PREMIUM PALETTES ────────────────────────────────────────────────
export const PREMIUM_PALETTES: Record<string, MotionPalette> = {
  RetroElectric: {
    id: "RetroElectric",
    bg: "#0b0b12", surface: "#151522", accent: "#0066FF", accent2: "#8A2BE2",
    accentGlow: "#FF1493", text: "#FFFF00", muted: "rgba(255,255,255,0.6)",
    glow: "rgba(255,20,147,0.4)", border: "rgba(0,102,255,0.3)",
    cardBg: "rgba(138,43,226,0.1)", gradient: "linear-gradient(135deg,#0066FF,#8A2BE2,#FF1493)",
  },
  CloudDancer: {
    id: "CloudDancer",
    bg: "#F0EEE9", surface: "#ffffff", accent: "#A8BBA2", accent2: "#A39E93",
    accentGlow: "#3B3B3B", text: "#3B3B3B", muted: "rgba(59,59,59,0.5)",
    glow: "rgba(168,187,162,0.2)", border: "rgba(59,59,59,0.1)",
    cardBg: "rgba(255,255,255,0.5)", gradient: "linear-gradient(135deg,#A8BBA2,#A39E93)",
  },
  Glassmorphism: {
    id: "Glassmorphism",
    bg: "#0d0f12", surface: "rgba(232,236,239,0.05)", accent: "#7EF9FF", accent2: "#FFD580",
    accentGlow: "#DCD0FF", text: "#E8ECEF", muted: "rgba(232,236,239,0.5)",
    glow: "rgba(126,249,255,0.3)", border: "rgba(232,236,239,0.1)",
    cardBg: "rgba(232,236,239,0.03)", gradient: "linear-gradient(135deg,#7EF9FF,#FFD580,#DCD0FF)",
  },
  MinimalMaximalism: {
    id: "MinimalMaximalism",
    bg: "#FAF8F5", surface: "#1B4D4E", accent: "#E06D53", accent2: "#E5AD35",
    accentGlow: "#FF6B6B", text: "#1B4D4E", muted: "rgba(27,77,78,0.6)",
    glow: "rgba(224,109,83,0.3)", border: "rgba(27,77,78,0.15)",
    cardBg: "rgba(27,77,78,0.04)", gradient: "linear-gradient(135deg,#E06D53,#E5AD35,#FF6B6B)",
  },
};

// ─── FONT MAP ─────────────────────────────────────────────────────────
export const FONT_MAP: Record<string, { url: string; family: string }> = {
  inter: { url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap", family: "'Inter',system-ui,sans-serif" },
  space_grotesk: { url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap", family: "'Space Grotesk',sans-serif" },
  bebas_neue: { url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap", family: "'Bebas Neue',sans-serif" },
  playfair_display: { url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap", family: "'Playfair Display',serif" },
  jetbrains_mono: { url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap", family: "'JetBrains Mono',monospace" },
  outfit: { url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap", family: "'Outfit',sans-serif" },
  clash_display: { url: "https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&display=swap", family: "'Clash Display',sans-serif" },
  syne: { url: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap", family: "'Syne',sans-serif" },
  archivo: { url: "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,100..900;1,100..900&display=swap", family: "'Archivo',sans-serif" },
  monoton: { url: "https://fonts.googleapis.com/css2?family=Monoton&display=swap", family: "'Monoton',cursive" },
};

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────
export const JSON_MOTION_SYSTEM_PROMPT = `You are the world's #1 Motion Director AI — built to OUTCLASS Hera.video, Runway, and Linear.app.

You operate at the intersection of:
- Apple's product film team (restraint, monumental scale, emotional precision)
- Linear's product design (graphite minimalism, surgical hairlines, pure layout discipline)
- Stripe's brand motion (silk-smooth fluid choreography, sub-pixel gradients)
- Rauno Freiberg & Emil Kowalski (micro-interaction perfection, springs over tweens)

Faqat sof JSON qaytargin. No markdown, no backticks, no prose. Output must be perfectly JSON.parse()-able.

━━━ THE ENGINE: "QUIET LUXURY MOTION" ━━━
Every frame must feel intentional, like a $10M Apple cinematic asset. Every motion has MATHEMATICAL PURPOSE.
Animations are SUBTLE but SOPHISTICATED — physical fluid inertia, never chaotic digital noise.
Hera's ultimate secret is "Continuous Micro-Movements". Scenes are NEVER static; the canvas itself slowly breathes.

━━━ THE SACRED PRINCIPLES ━━━
1. **ONE IDEA PER SCENE, EXECUTED SURGICALLY** — Never cram multiple layouts or conflicting thoughts.
2. **MOTION SERVES MEANING** — Animate to reveal, emphasize, partition, or transition. Never decorate.
3. **CONTEXT-AWARE COMPONENTS** — 'terminal', 'search_bar', 'prompt_input' ONLY when the extracted brand identity demands it.
4. **WORD-LEVEL CHOREOGRAPHY IS THE SIGNATURE** — Our films are recognized by word-by-word reveals, masks, and push dynamics, not random letter fades.
5. **STRICT GSAP ONLY FOR CUSTOM CONFIGS** — If choosing parameters, output valid configuration numbers/strings matching GSAP properties. Do NOT invent raw vanilla JS loops.

━━━ THINKING PROCESS ━━━
1. Analyze brand's emotional core + its exact technical mechanism from context.
2. Structure a tight 8-scene arc: HOOK → TENSION → REVEAL → PROOF → DEMO → STAT → VOICE → CTA.
3. Choose layout patterns that perfectly frame that scene's single idea.
4. Use color transitions strategically to create narrative rhythm.

MUSIC FIELD (required at root):
{
  "music": {
    "mood": "calm | uplifting | dramatic | corporate | energetic",
    "bpm": "slow | medium | fast",
    "category": "ambient | cinematic | electronic | corporate"
  }
}`;

// ─── USER PROMPT BUILDER ──────────────────────────────────────────────
export function buildUserPrompt(opts: {
  brandInfo: string;
  palette: string;
  socialLine?: string;
  brandUrl?: string;
  customPrompt?: string;
  forcedLayouts?: string[];
  aspectRatio?: "16:9" | "9:16" | "1:1";
}): string {
  const palette = PREMIUM_PALETTES[opts.palette] ?? PREMIUM_PALETTES.CloudDancer;
  const isLight = ["CloudDancer", "MinimalMaximalism"].includes(opts.palette);
  const textRule = isLight
    ? "DARK premium text (#0A0A0A / #111111) on LIGHT minimal canvas (#FAFAFA / #F5F0EA)"
    : "LIGHT architectural text (#FAFAFA / #E8E8E8) on DARK deep void (#0A0A0A / #111111)";

  const styleSeeds = [
    "Apple Keynote Pro — pure void space, monumental typography, one electric accent stroke, museum-quiet macro pacing, deep physics.",
    "Linear Precision Core — graphite gradients, 0.5px hairline grid dividers, monospace data trackers, mathematical layout accuracy.",
    "Vercel Geometry — true crisp paper white, structural Inter scales, single geometric neon focal stroke, razor-sharp grid snap.",
    "Stripe Brand Synthesis — ultra-soft cream cards, micro-shadow structures, 2-stop elegant gradient borders, fluid breathing interaction.",
    "Pentagram Luxury Editorial — deep Playfair serif theatrical contrast, massive structural margins, oxblood or forest velvet accent strokes."
  ];
  const seed = styleSeeds[Math.floor(Math.random() * styleSeeds.length)];

  return `Return ONLY valid JSON matching the MotionVideoSchema specification. No extra text or formatting blocks.

━━━ ASPECT RATIO ━━━
Set aspectRatio and aspect_ratio to "${opts.aspectRatio ?? "16:9"}".
For 9:16 vertical stack layouts: lock text safe-zone within center 70% bounds and amplify font scales.

━━━ EXTRACTED BRAND CONTEXT (STRICT ADHERENCE) ━━━
${opts.brandInfo && opts.brandInfo.length > 50 ? `BRAND DATA POOL:\n${opts.brandInfo}` : `BRAND DATA POOL (BRIEF): "${opts.brandInfo}". Invent a world-class premium minimal brand operating on Apple/Linear design restraint.`}
${opts.brandUrl ? `Website Context: ${opts.brandUrl}` : ""}
${opts.socialLine ? `Social Footprint: ${opts.socialLine}` : ""}

CRITICAL COPYWRITING RULE: Extract SPECIFIC micro-details, features, or exact workflows from the data pool. NEVER fallback to generic filler phrases like "next-gen AI tools", "revolutionary platform", or "accelerate workflows". Write sharp, declarative, factual prose.

${opts.customPrompt
    ? `━━━ USER STYLE OVERRIDES (MAXIMUM OVERRIDE PRIORITY) ━━━
${opts.customPrompt}
Parse color/aesthetic phrases directly into the JSON configuration schema properties. All copy variables must be fed exclusively from the Brand Pool.`
    : `━━━ ART DIRECTION SEED (EMBODY SURGICALLY) ━━━
${seed}
The entire 8-scene film must visually feel like an absolute projection of this design archetype.`}

━━━ COLOR DOCTRINE & CHOREOGRAPHY ━━━
Base Palette Profile: "${opts.palette}" — ${textRule}

THE SYSTEM LAWS:
1. **Rule of 3:** Exactly 2 dominant neutrals + 1 targeted accent. Never introduce a third color hue.
2. **Accent Restraint:** The chosen accent color must occupy ≤ 20% of total active pixels in any scene.
3. **Choreographed Rhythm:** Avoid visual stagnation. Flip color schemes between scenes to create spatial drama.
   - Use the \`customColors\` parameter on 1-2 key scenes to execute dramatic light-to-dark flips or accent floods for cinematic climax.
4. **Gradient Discipline:** Pure 2-stop limits max, constrained within the exact same color family. No multi-hue rainbows.
5. **Sub-pixel Borders & Glows:** Hairline definitions only. Keep rgba opacities tightly controlled between 0.04 and 0.12.

✨ Use \`customColors: { "bg": "#hex", "text": "#hex", "accent": "#hex" }\` to handle contrast inversion. Never introduce unauthorized hues.

━━━ MACRO CAMERA SYSTEMS (THE HERA SECRET) ━━━
Every scene must feel alive via slow cinematic lens drift. You MUST populate the \`cameraMove\` property across scenes with targeted instructions for the renderer:
- \`zoom_in_micro\`: Slow magnification from 1.0 to 1.03 over the scene duration.
- \`pan_right_slow\`: Horizontal micro-translation across the canvas space.
- \`tilt_up_subtle\`: Vertical structural camera crawl.

━━━ FONT DESIGN RULES ━━━
- **inter** → Default structural modern tech engine.
- **space_grotesk** → High-personality modern developer layout.
- **outfit** → Fluid premium consumer, health, or sleek interaction design.
- **playfair_display** → Editorial luxury serif scale (beauty, haute couture, high-end design).
- **jetbrains_mono** → Engineering precision. (MANDATORY for code, data layouts, and special mono word-streams).

━━━ CONTENT DESIGN DENSITY PATTERNS (COMMIT TO ONE PER SCENE) ━━━
Each scene must strictly match ONE layout archetype. Mixing patterns within a single scene block is strictly forbidden.

- **Pattern A — TITLE_ONLY**: Clean hook card. (headline field only).
- **Pattern B — TITLE+SUB**: Standard balanced configuration. (headline + short subheadline ≤ 6 words).
- **Pattern C — TITLE+BODY**: Narrative manifesto execution. (headline + body ≤ 14 words).
- **Pattern D — STAT_HERO**: High-impact monolithic proof scale. (zoomStat + zoomLabel + optional zoomSuffix).
- **Pattern E — QUOTE**: Elegant editorial text block. (body [quote string] + subheadline [attribution signature]).
- **Pattern F — CARDS_LITE**: 2–3 modern graphic layout modules. (title + 1 support text string. NO nested stat nodes).
- **Pattern G — STATS_TRIPLE**: Multi-metric horizontal distribution grid. (stats_3 array with 3 raw numerical values).
- **Pattern H — UI_DEMO**: Structural technical mock interaction. (terminal / search_bar / prompt_input / bento_grid nodes).
- **Pattern I — WORD_FLOW**: Manifesto narrative sequence. (word_stack_reveal system).
- **Pattern J — WORD_STACK**: Core monumental tag sequence. (center_push_stack system).

━━━ MANDATORY WORD-LEVEL SIGNATURE ANIMATIONS (COMPULSORY ON EVERY AD) ━━━
Our films are globally benchmarked by word-level layout choreography. You MUST inject AT LEAST ONE instance of Layout #1 and Layout #2 in every generated script.

═══ LAYOUT #1: "word_stack_reveal" (MANDATORY — Min 1 Scene) ═══
A rolling thought-reveal pattern. Active words snap up vividly; previous steps dim elegantly backwards, creating a trace sequence.
Required Node Blueprint:
{
  "layout": "word_stack_reveal",
  "text": "Extracted punchy narrative phrase here.",
  "word_interval_ms": 220,
  "font": "jetbrains_mono",
  "font_size": 26,
  "enter_y": 22,
  "enter_duration_ms": 420,
  "enter_easing": "cubic-bezier(0.22,1,0.36,1)",
  "opacity_active": 1.0,
  "opacity_dim1": 0.55,
  "opacity_dim2": 0.28
}

═══ LAYOUT #2: "center_push_stack" (MANDATORY — Min 1 Scene) ═══
Words materialize dead-center at scale, then physically push back into spatial memory depth layers to allocate room for upcoming sequences.
Required Node Blueprint:
{
  "layout": "center_push_stack",
  "text": "Monumental brand core values.",
  "word_interval_ms": 520,
  "font": "jetbrains_mono",
  "big_size": 36,
  "small_size": 24,
  "enter_y": 28,
  "enter_duration_ms": 550,
  "enter_easing": "cubic-bezier(0.22,1,0.36,1)"
}

═══ PREMIUM VARIATION TEXT LAYOUT MODULES (SELECT 1-2 COMPLEMENTARY) ═══
Inject these custom structural animation layouts to break visual repetition across the timeline:

- **"word_slide_mask"**: Words rise up smoothly from an invisible horizon mask line. Parent wrappers must handle \`overflow: hidden\` rules natively.
  Blueprint: { "layout": "word_slide_mask", "text": "...", "word_interval_ms": 180, "font_size": 42, "enter_y": 100, "enter_duration_ms": 600, "enter_easing": "cubic-bezier(0.16,1,0.3,1)", "mask_overflow": "hidden" }
- **"word_blur_focus"**: Words materialize out of a heavy lens blur state to razor focus.
  Blueprint: { "layout": "word_blur_focus", "text": "...", "word_interval_ms": 300, "enter_blur_px": 20, "enter_duration_ms": 500, "enter_easing": "cubic-bezier(0.22,1,0.36,1)" }
- **"word_color_wave"**: Normal state scales shift as an active color highlighter sweep races through words sequentially.
  Blueprint: { "layout": "word_color_wave", "text": "...", "word_interval_ms": 280, "wave_duration_ms": 400, "enter_easing": "ease-out" }
- **"word_typewriter_glow"**: Fast character terminal stream inside a strict mono matrix with an active accent block tracking cursor.
  Blueprint: { "layout": "word_typewriter_glow", "text": "...", "char_interval_ms": 30, "word_pause_ms": 200, "prev_word_opacity": 0.7, "cursor_glow": true }

━━━ CORE STANDARD LAYOUT LIBRARY ━━━
- **title_card** / **center_hero** / **split_horizontal** / **zoom_data** / **quote**
- Context-Locked Nodes: **terminal** (Must have 4-6 real functional lines) / **search_bar** / **prompt_input** / **bento_grid** / **stats_3** (values must be pure raw numbers).
- High Energy Profiles (Use sparingly): **kinetic_push** / **split_screen** / **retro_paper**

━━━ TIMELINE ARITHMETIC & RULES ━━━
1. **Exact Count:** Total timeline scene count must equal exactly 8 blocks.
2. **Exact Duration:** The summation of scene durations must equal exactly 20 seconds. (e.g., [2, 3, 2.5, 2.5, 3, 2, 2.5, 2.5] = 20s).
3. **Sequential Sync:** \`startTime\` of scene [n] must perfectly equal the cumulative duration sums of scenes [0] to [n-1].
4. **Transition Continuity:** Every scene block requires distinct \`transition_in\` and \`transition_out\` properties. All 8 across the film should be unique to avoid formulaic fatigue.
5. **Headline Scale:** Maximum 2-4 words per headline slot. Only 1 word wrapped inside an \`<span class='accent'>\` tag allowed.
6. **FX Discipline:** To prevent cheapening the luxury aesthetic, \`screenShake\`, \`impactFlash\`, and \`particleBurst\` are strictly rationed to a maximum limit of 1 single occurrence across the entire video timeline.

OUTPUT FORMAT PROTOCOL: Return raw, pure, pristine JSON code. Under no circumstances include markdown enclosures, wrap wrappers (\`\`\`), explanatory prefaces, or post-script prose. Start directly with the opening curly brace.`;
}