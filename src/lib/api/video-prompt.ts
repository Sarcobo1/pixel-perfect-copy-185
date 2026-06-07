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
export const JSON_MOTION_SYSTEM_PROMPT = `You are an elite Motion Director AI at Sota Folovo — world-class design studio quality (Apple, Nike, Stripe).

Faqat sof JSON qaytargin. No markdown fences, no backticks, no prose, no explanation.
The JSON must be directly parseable by JSON.parse().

FIKRLASH TARTIBI (har safar):
1. Brendni tahlil qil (mahsulot, auditoriya, ovoz, rang)
2. Xabar zanjiri: muammo → yechim → dalil → CTA
3. Har sahna uchun layout_type tanla (ketma-ket bir xil layout qilma)
4. transition_in / transition_out + easing + sound_cues belgilа
5. aspect_ratio ni saqla (16:9 | 9:16 | 1:1)

ZARUR MAYDONLAR (har sahna): id, layout yoki layout_type, duration yoki duration_ms, content yoki headline/cards/stats.

CORE PRINCIPLES:
- Every generation must feel CINEMATIC, AVANT-GARDE, and PREMIUM — like a Super Bowl commercial or Apple product reveal.
- You must break out of rigid templates. Each output must be RADICALLY DIFFERENT in layout sequencing, animation pacing, and style.
- Colors, layout pacing, font choices, and transitions must feel intentional and editorial.
- Avoid generic corporate SaaS copy. Headlines must be SHORT (2–4 words), PUNCHY, and EMOTIONAL.
- You are a master of typography and 3D space. Use depth, bold contrasts, and asymmetrical layouts where appropriate.
- CONTENT DENSITY IS CRITICAL: Each scene must be packed with brand-specific information. Do not waste a scene on just 2 words.
- If the user gives style instructions, follow them EXACTLY. User instructions override everything.

MUSIC FIELD (required at root level):
Add a "music" object to the JSON root with these fields:
{
  "music": {
    "mood": "energetic | calm | dramatic | uplifting | dark | corporate",
    "bpm": "slow | medium | fast",
    "category": "electronic | cinematic | corporate | ambient"
  }
}
Rules for choosing music:
- Brand technical/professional (SaaS, fintech, B2B) → mood: "corporate", category: "electronic"
- Brand creative/agency/design → mood: "uplifting", category: "cinematic"
- Brand bold/sports/gaming → mood: "energetic", category: "electronic"
- Brand calm/wellness/minimal → mood: "calm", category: "ambient"
- Dark background scenes dominant → mood: "dramatic", category: "cinematic"
- Luxury/fashion/beauty brand → mood: "dramatic", category: "cinematic"
Always include this field. It will be used to fetch matching background music.`;

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
    ? "DARK text (#0f172a) on LIGHT backgrounds — NEVER use light text on light bg"
    : "LIGHT text (#f8fafc) on DARK backgrounds — NEVER use dark text on dark bg";

  const styleSeeds = [
    "neo-brutalist: bold black borders, raw oversized typography, high contrast blocks",
    "ultra-minimal: extreme whitespace, thin lines, single accent color, calm pacing",
    "cinematic dark: deep blacks, vivid neon accent pops, film grain texture feel",
    "editorial magazine: large asymmetric type, overlapping elements, dynamic layout shifts",
    "glassmorphism: frosted semi-transparent panels, soft blurred backgrounds, pastel glows",
    "high-energy sports: dynamic diagonal lines, intense color, fast cuts, bold stats",
    "luxury brand: gold/cream palette, elegant serif fonts, slow cinematic reveals",
    "retro-futuristic: terminal green, scanline effects, monospaced fonts, pixel accents",
  ];
  const seed = styleSeeds[Math.floor(Math.random() * styleSeeds.length)];

  return `Return ONLY valid JSON matching the MotionVideoSchema shape below. No extra text.

━━━ ASPECT RATIO ━━━
Set aspectRatio and aspect_ratio to "${opts.aspectRatio ?? "16:9"}".
For 9:16: stack layouts vertically, keep text in center 70% safe zone.

━━━ BRAND INFO & ASSETS ━━━
${opts.brandInfo && opts.brandInfo.length > 50 ? `BRAND CONTEXT: ${opts.brandInfo}` : `BRAND CONTEXT (INCOMPLETE): "${opts.brandInfo}". Since this is too brief, you MUST INVENT a highly creative, premium brand around this topic. Give it a high-end feel (like Apple, Stripe, or Nike).`}
${opts.brandUrl ? `Website: ${opts.brandUrl}` : ""}
${opts.socialLine ? `Social: ${opts.socialLine}` : ""}

${opts.customPrompt
    ? `━━━ USER STYLE OVERRIDES (STRICT RULE) ━━━
${opts.customPrompt}
CRITICAL CONTENT RULE: These instructions are STRICTLY for styling, motions, layouts, and colors. 
You MUST STILL rely completely on the BRAND DATA above for all actual text, headlines, stats, features, and content.
Do NOT invent new features, use generic placeholder text, or lose the brand's original messaging.
→ "white background" = set palette.bg:"#ffffff", palette.text:"#111111"
→ Follow every styling instruction here exactly, but PRESERVE the brand's data.`
    : `━━━ CREATIVE DIRECTION (randomized for visual diversity) ━━━
Style vibe: ${seed}
Design this video to authentically feel like: ${seed}
DO NOT produce a generic corporate template. Be bold, asymmetrical, and highly unexpected.
You must use a completely different sequence of layouts than you typically do.`}

━━━ COLOR SYSTEM ━━━
Base palette reference: "${opts.palette}" — ${textRule}
Reference gradient: ${palette.gradient}
RULES:
- palette.bg and palette.text MUST have strong contrast (never similar hues)
- palette.accent must stand out strongly against palette.bg
- palette.cardBg should be very subtle (low opacity overlay of accent)
- palette.glow should be a semi-transparent version of accent for glow effects
- palette.border should be subtle (rgba with low opacity)
- ✨ 2026 TREND: If the user provides specific custom colors in their prompt, you MUST prioritize them.
- ✨ DYNAMIC COLOR OVERRIDE: Do not make every scene look the same! You can override the global palette for any scene using the \`customColors\` object in the JSON: \`{ "bg": "#hex", "text": "#hex", "accent": "#hex" }\`. Use this to create high-contrast shifts (e.g. Scene 1 is dark, Scene 2 is pure accent color background, Scene 3 is minimal white).

━━━ FONT SELECTION ━━━
Choose globalFont intentionally to match the brand vibe:
- inter / space_grotesk / outfit → clean modern tech
- bebas_neue / syne → bold, impactful display (great for sports, agencies)
- playfair_display → luxury, editorial, fashion
- jetbrains_mono / monoton → developer tools, terminal, crypto
- archivo → strong, versatile, editorial

━━━ HEADLINE RULES ━━━
- 2–5 words MAX per headline. Think billboard, not paragraph.
- Wrap 1 key word with <span class='accent'>word</span> for glowing color emphasis
- OR wrap 1 key word with <span class='mark'>word</span> for highlighted box (rotated -2deg)
- Example: "Ship <span class='accent'>10x</span> faster" or "Built for <span class='mark'>scale</span>"
- SUBHEADLINES ARE MANDATORY: Every scene MUST have a subheadline with 6–10 words of real brand info.
- BODY TEXT: For center_hero and split_horizontal, also add a body field with 1–2 sentences of real brand description.
- TAGS: For center_hero scenes, add a tags array with 3–5 real feature/keyword tags.

━━━ MANDATORY LAYOUT SEQUENCE ━━━
${opts.forcedLayouts && opts.forcedLayouts.length > 0 ? `You MUST use EXACTLY these layouts in this order for your scenes: ${opts.forcedLayouts.join(" -> ")}. DO NOT DEVIATE.` : `Randomize your layouts completely (e.g. quote, cards_3, split_horizontal, terminal).`}

━━━ AVAILABLE LAYOUTS (pick creatively, never repeat the same one twice) ━━━
✨ 2026 DESIGN TRENDS (HIGHLY RECOMMENDED):
- title_card: Massive block text taking over the screen. Perfect for opening titles or chapter transitions. Fields: headline, subheadline.
- lower_third: Elegant glassmorphic panel sliding in from the bottom corner with a person's name, title, or key info. Fields: headline (Name), subheadline (Title), body (Info).
- callout_card: A sleek floating card with a line pointing to an object, displaying features or pricing. Fields: headline (Feature), subheadline (Value/Price), body (Description).
- popup_social: A floating macOS-style or social media notification pop-up. Fields: headline (Notification title), body (Notification text), cta ("Subscribe", "Follow").
- bento_grid: Apple-style modular layout. 3-4 rounded rectangles packing different stats/icons. Fields: cards (array of CardSchema), headline.
- retro_paper: Analog torn paper / vintage print aesthetic. Adds noise and paper textures. Fields: headline, body.

STANDARD LAYOUTS:
- center_hero: Full center layout. headline + subheadline + body + tags + optional cta
- cards_3: 3 feature cards. Each needs icon, title, description, stat, statLabel
- cards_4: 4 smaller cards. Each needs icon, title, description
- stats_3: 3 large animated counter numbers. Needs headline + 3 stats with value/suffix/label
- terminal: CLI typing animation. Needs headline + 4–6 terminalLines of real code/CLI
- split_horizontal: Left=headline+body, Right=big accent stat/emoji
- quote: Large centered pull-quote. headline + body (the actual quote text)
- search_bar: ONLY if user explicitly asks for search UI
- kinetic_push: FULL-SCREEN single-word kinetic animation. Each word slams in then pushes back. Use for high-energy brand moments. Schema fields:
    kineticWords: ["word1","word2",...] (5–10 short punchy words from brand messaging)
    kineticColors: ["#hex1","#hex2","#hex3"] (cycle through accent colors)
    kineticWordDurationMs: 600–1000 (fast=600, slow=1000)
    kineticExitDurationMs: 300–500
    subheadline: optional tagline shown at bottom
- center_push_stack: Words stack up one-by-one in monospace, older ones fade back. Use for brand taglines/manifestos. Schema fields:
    pushStackText: "full sentence of brand words" (10–20 words)
    pushStackInterval: 400–700 (ms between words, fast prompt=400, slow=700)
    subheadline: optional subtitle shown below
- text_morph: One bold word transforms into another word using blur crossfade. Use for dual-concept moments (Fast→Smart, Build→Scale). Schema fields:
    morphPairs: [["word1","word2"],["word3","word4"]] (3–5 pairs of contrasting brand words)
    morphInterval: 2000–3000 (ms per pair)
    subheadline: optional label shown at bottom
- split_screen: Two panels animate in from opposite sides simultaneously. Left=problem/before, Right=solution/after. Schema fields:
    leftHeadline: bold left panel headline (can use <span class='accent'>)
    leftBody: 1–2 sentence left panel description
    rightHeadline: bold right panel headline
    rightBody: 1–2 sentence right panel description
    subheadline: optional shared caption
- zoom_data: Single dramatic stat fills full screen, zooming in from huge scale with glow. Best for most impressive single metric. Schema fields:
    zoomStat: "the number" (e.g. "1.2M", "99.9", "4.8")
    zoomLabel: "what it means" (e.g. "Active Users", "Uptime %", "★ Rating")
    zoomPrefix: optional prefix (e.g. "$", "+")
    zoomSuffix: optional suffix (e.g. "%", "K", "+")
    subheadline: optional secondary metric or context

━━━ GSAP ANIMATION ENGINE ━━━
Each headline word animates individually via GSAP timeline. Choose headlineAnimation:
- kinetic_smash → words smash into screen from huge scale, screen shake (NETFLIX STYLE RAPID CUTS)
- fluid_vector → Apple-smooth elastic drop-in from top, bouncy and polished (SLACK/APPLE STYLE)
- isometric_float → 3D float from deep perspective, highly dynamic (PAYPAL/DROPBOX STYLE)
- slam_drop → words crash from above with 3D rotation, settle with elastic bounce (IMPACT)
- waterfall → words race in from the right with stagger, cascading rapidly (ENERGY)  
- kinetic_scale → words zoom in from 4x scale with extreme blur dissolve (CINEMATIC)
- glitch_reveal → harsh clip-path wipes + color channel glitch + screen shake (TECH/HACKER)
- clip_wipe → smooth asymmetrical wipe from rotated clip-path with blur (PREMIUM)
- tracking_stretch → ultra-wide letter-spacing collapses to normal (ELEGANT)
- 3d_flip → words flip in from 90deg X-axis with deep perspective (MODERN 3D)
- char_shatter → individual characters fly from random 3D Z-space positions and assemble (DRAMATIC)
- blur_slide → elegant slow slide from left with heavy blur clearing (SMOOTH)
- matte_reveal → text rises from invisible matte floor with slight tilt (CINEMATIC)
- elastic_pop → words bounce from 0 scale with heavy elastic overshoot (PLAYFUL)
- perspective_fly → words fly from deep 3D Z-space (3D DRAMATIC)
- scramble_text → characters rapidly cycle random letters before settling (HACKER)

━━━ TRANSITION BETWEEN SCENES ━━━
Each scene MUST include transition_in and transition_out (200ms overlap) from:
fade | slide_up | scale_punch | blur_dissolve | clip_wipe
Legacy field "transition" is accepted as both in/out fallback.

⚡ 2026 SOTA PREMIUM TRANSITIONS (optional extras):
- liquid_glass → Liquid glass shatters + chromatic rainbow light streak (APPLE / STRIPE QUALITY)
- particle_stream → 30 glowing data particles stream across + scene materializes (AI / CRYPTO / TECH)
- echo_trail → Scene smears out leaving 5 echo ghost copies with color trails (AFTER EFFECTS 2026)
- temporal_flow → Seamless 3D camera dolly push-through with vignette pulse (CINEMATIC 3D)
- hand_drawn_wipe → Jagged SVG brush-stroke wipes across screen in accent color (CREATIVE / RETRO)

STANDARD TRANSITIONS:
- circle_sweep → massive Google Material style expanding circle (CLEAN/GEOMETRIC)
- rapid_cut → aggressive Netflix style hard cut with zero fade, scale punch (INTENSE/FAST)
- shape_morph → Dropbox style diagonal abstract shape wipe (PLAYFUL/MODERN)
- depth_push → old scene pushes into depth, new emerges (CINEMATIC)
- wipe_right / wipe_left → horizontal clip-path wipe (CLEAN)
- zoom_blur → scale+blur in/out (DRAMATIC)
- chromatic_split → color channel offset glitch transition (TECH)
- slide_up / slide_down → vertical slide (SMOOTH)
- scale_out → old scene scales out, new scales in (PUNCHY)
- rotate_out → rotation exit/entry (CREATIVE)
- fade → simple opacity crossfade (ELEGANT)

━━━ EXTRA EFFECTS (use at least 2–3 across scenes) ━━━
- screenShake: true → brief camera shake (use on intense moments)
- impactFlash: true → white flash on scene entry (use for dramatic reveals)
- particleBurst: true → particle explosion from headline (use for climax scenes)
- bgParticles: "dot_grid" | "sparks" | "snow" | "rain" → ambient background particles
- cameraMove: "zoom_in" | "zoom_out" | "pan_left" | "pan_right" → subtle camera drift
- soundOnEnter: "airy_whoosh" | "sweep" | "soft_click" | "glass_tap" | "glitch" (Use smooth sounds like airy_whoosh or soft_click for elegant/cinematic vibes)
- soundOnHeadline: "soft_click" | "glass_tap" | "pop" (Prefer smooth, subtle clicks)

━━━ REQUIRED JSON SHAPE (EXAMPLE) ━━━
{
  "version": "1.0",
  "duration": 30,
  "brandName": "REAL BRAND NAME",
  "tagline": "REAL TAGLINE",
  "palette": {
    "id": "custom",
    "bg": "#HEXCODE",
    "surface": "#HEXCODE",
    "accent": "#HEXCODE",
    "accent2": "#HEXCODE",
    "accentGlow": "#HEXCODE",
    "text": "#HEXCODE",
    "muted": "rgba(R,G,B,0.5)",
    "glow": "rgba(R,G,B,0.35)",
    "border": "rgba(R,G,B,0.18)",
    "cardBg": "rgba(R,G,B,0.09)",
    "gradient": "linear-gradient(135deg, #HEX 0%, #HEX 100%)"
  },
  "globalFont": "CHOSEN_FONT",
  "scenes": [
    {
      "id": 1,
      "startTime": 0,
      "duration": 4,
      "layout": "center_hero",
      "headline": "Real <span class='accent'>Bold</span> Title",
      "subheadline": "Real 6–10 word supporting description here",
      "body": "One or two sentences of real brand description.",
      "tags": ["Feature 1", "Feature 2", "Feature 3"],
      "cta": "Get Started",
      "headlineAnimation": "slam_drop",
      "bgVariant": "primary",
      "bgMesh": true,
      "bgParticles": "dot_grid",
      "transition": "depth_push",
      "cameraMove": "zoom_in",
      "soundOnEnter": "airy_whoosh",
      "soundOnHeadline": "soft_click",
      "screenShake": false,
      "impactFlash": true,
      "particleBurst": true
    }
    // ... ADD THE REST OF THE SCENES HERE FOLLOWING THE MANDATORY LAYOUT SEQUENCE ...
  ]
}

━━━ FINAL STRICT RULES ━━━
1. ⚡ SCENE COUNT: You MUST generate EXACTLY 8 scenes. Not 4. Not 6. EIGHT (8) scenes. Each 2–3 seconds.
2. PACING: Durations must sum to EXACTLY 20 seconds. Example: [2.5, 2, 2.5, 2, 2.5, 2.5, 3, 3] = 20s
3. Calculate startTime correctly: each scene's startTime = sum of all previous durations.
4. ⚡ HEADLINE ANIMATION IS MANDATORY: Every scene MUST have a headlineAnimation field.
   NEVER omit it. Pick a DIFFERENT one for each scene from:
   kinetic_smash | fluid_vector | isometric_float | slam_drop | waterfall | kinetic_scale |
   glitch_reveal | clip_wipe | tracking_stretch | 3d_flip | char_shatter | blur_slide |
   matte_reveal | elastic_pop | perspective_fly | scramble_text
5. ⚡ EVERY SCENE MUST USE A DIFFERENT transition type. All 8 must be different.
6. EVERY SCENE MUST BE CONTENT-RICH from the brand website data:
   - center_hero → headline + subheadline + body + tags (3–5 tags) + cta
   - cards_3 / cards_4 → 3–4 cards each with icon, title, description, and stat (NUMBER), statLabel
   - stats_3 → 3 stats where "value" is a plain NUMBER (e.g. 120000 not "120K"), suffix: "K", label: "text"
   - split_horizontal → headline + body + subheadline (large stat/emoji on right)
   - terminal → 4–6 terminalLines of real CLI/code commands about the brand
   - quote → headline + body text (the actual quote)
   - kinetic_push → kineticWords (5–10 brand words) + kineticColors array + kineticWordDurationMs + kineticExitDurationMs
   - center_push_stack → pushStackText + pushStackInterval + subheadline
7. stats_3 "value" field MUST always be a plain NUMBER. String values like "120K" will break the animation.
8. NEVER use similar colors for bg and text (minimum 4.5:1 contrast ratio).
9. NEVER use "search_bar" unless user explicitly requests it.
10. globalFont must match brand personality.
11. Headlines: 2–5 words MAX. Use accent or mark span on 1 word.
12. Output ONLY raw JSON. No markdown. No prose. No backticks.`;
}
