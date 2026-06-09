/** UI picker + AI prompt mapping for 2026 trending motion styles (9:16 vertical format) */
export const MOTION_TRENDS = [
  {
    id: "mixed_media",
    name: "Mixed Media",
    desc: "Adyen-style vectors + kinetic type on white grid",
    icon: "🎨",
    reference: "Adyen: Engineered for Ambition (PlusOne Studio)",
  },
  {
    id: "radical_metamorphosis",
    name: "Metamorphosis",
    desc: "3D morph synced to beats on clean background",
    icon: "🔮",
    reference: "Clim Studio Rebrand",
  },
  {
    id: "tactile_3d",
    name: "Tactile 3D",
    desc: "Squishy puff textures with grid overlay",
    icon: "🧸",
    reference: "Adobe Daily Creative Challenge",
  },
  {
    id: "seamless_flow_ui",
    name: "Flow UI",
    desc: "Morphing layout loops on white canvas",
    icon: "🔁",
    reference: "A New Era of No Code (Ordinary Folk)",
  },
  {
    id: "kinetic_geometric",
    name: "Geo Minimal",
    desc: "Circles, lines — center focus on grid",
    icon: "⭕",
    reference: "Meet Bixby (Awesome Inc.)",
  },
  {
    id: "neo_brutalist",
    name: "Neo Brutalist",
    desc: "Flicker strokes + bold type on white",
    icon: "⬛",
    reference: "SonduckFilm 2026 Trend",
  },
  {
    id: "analog_vhs",
    name: "Analog VHS",
    desc: "Grain, chromatic warmth over grid",
    icon: "📼",
    reference: "VHS / Envato loops",
  },
  {
    id: "immersive_pov",
    name: "Immersive POV",
    desc: "FPV + AR overlays on clean background",
    icon: "👁️",
    reference: "Meta / Insta360 GO style",
  },
  {
    id: "saas_explainer",
    name: "SaaS Hybrid",
    desc: "UI + abstract narrative on white grid",
    icon: "📊",
    reference: "Redley API showcase",
  },
  {
    id: "eco_minimal",
    name: "Eco Minimal",
    desc: "Organic slow fluid paths on white",
    icon: "🌿",
    reference: "Earthy narrative reels",
  },
] as const;

export type MotionTrendId = (typeof MOTION_TRENDS)[number]["id"];

/** Curated font ↔ trend pairings with motion tricks (9:16 vertical optimized) */
export const FONT_TREND_PAIRINGS = {
  inter: {
    displayName: "Inter (Clean Grotesk)",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
    cssFamily: "'Inter', system-ui, sans-serif",
    cssWeight: "700",
    letterSpacing: "-0.03em",
    textTransform: "none" as const,
    bestForTrends: [
      "saas_explainer",
      "seamless_flow_ui",
      "immersive_pov",
      "mixed_media",
    ] as MotionTrendId[],
    motionTrick: `MOTION TRICK — Clip-path wipe + position shift:
  gsap.set(".saas-line",{clipPath:"inset(0 100% 0 0)",x:24,opacity:0});
  tl.to(".saas-line",{clipPath:"inset(0 0% 0 0)",x:0,opacity:1,duration:0.45,ease:"power3.out",stagger:0.08},t);
  // UI labels: simultaneous y shift
  gsap.fromTo(".ui-label",{y:20,opacity:0},{y:0,opacity:1,duration:0.4,ease:"expo.out",stagger:0.06},t);`,
  },
  space_grotesk: {
    displayName: "Space Grotesk (Tech Display)",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
    cssFamily: "'Space Grotesk', sans-serif",
    cssWeight: "700",
    letterSpacing: "-0.02em",
    textTransform: "none" as const,
    bestForTrends: [
      "kinetic_geometric",
      "immersive_pov",
      "radical_metamorphosis",
    ] as MotionTrendId[],
    motionTrick: `MOTION TRICK — 3D perspective flip + data flow:
  gsap.set(".tech-text",{rotateX:-90,transformOrigin:"center bottom",opacity:0});
  tl.to(".tech-text",{rotateX:0,opacity:1,duration:0.6,ease:"back.out(1.5)",stagger:0.1},t);
  // Data nodes: scale pulse
  gsap.fromTo(".data-node",{scale:0},{scale:1,duration:0.4,ease:"elastic.out(1,0.5)",stagger:0.08},t+0.3);`,
  },
  bebas_neue: {
    displayName: "Bebas Neue (Bold Display)",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    cssFamily: "'Bebas Neue', sans-serif",
    cssWeight: "400",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    bestForTrends: [
      "neo_brutalist",
      "tactile_3d",
      "kinetic_geometric",
    ] as MotionTrendId[],
    motionTrick: `MOTION TRICK — Scale punch over 3 frames (hard beat):
  gsap.set("#headline",{scale:1,transformOrigin:"center center"},t);
  gsap.set("#headline",{scale:1.25},t+0.033);
  gsap.set("#headline",{scale:1.5},t+0.066);
  gsap.to("#headline",{scale:1,duration:0.2,ease:"power4.out"},t+0.1);
  // Neo-brutalist: thick border + offset shadow
  .brutal-text { border:3px solid #000; box-shadow:5px 5px 0 #000; padding:8px 16px; }`,
  },
  roboto_mono: {
    displayName: "Roboto Mono (Code Terminal)",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap",
    cssFamily: "'Roboto Mono', monospace",
    cssWeight: "500",
    letterSpacing: "0",
    textTransform: "none" as const,
    bestForTrends: [
      "saas_explainer",
      "analog_vhs",
      "immersive_pov",
    ] as MotionTrendId[],
    motionTrick: `MOTION TRICK — Real-time CLI typewriter:
  const chars = "npm install motion".split("");
  let i = 0;
  const typeInt = setInterval(()=>{
    if(i < chars.length){ el.textContent += chars[i]; playType(); i++; }
    else { clearInterval(typeInt); cursor.style.animation = "blink 1s infinite"; }
  }, 80);
  // Terminal block: monospace, dark bg, green text
  .terminal { background:#0a0a0a; color:#10B981; font-family:'Roboto Mono'; padding:16px; border-radius:8px; }`,
  },
} as const;

export type FontPairingKey = keyof typeof FONT_TREND_PAIRINGS;

const TREND_TO_FONT: Record<MotionTrendId, FontPairingKey> = {
  mixed_media: "inter",
  radical_metamorphosis: "space_grotesk",
  tactile_3d: "bebas_neue",
  seamless_flow_ui: "inter",
  kinetic_geometric: "bebas_neue",
  neo_brutalist: "bebas_neue",
  analog_vhs: "roboto_mono",
  immersive_pov: "space_grotesk",
  saas_explainer: "inter",
  eco_minimal: "inter",
};

export const FONT_TYPOGRAPHY_BLOCK = `
═══════════════════════════════════════════════════════
FONT ↔ TREND PAIRINGS — MANDATORY TYPOGRAPHY SYSTEM (9:16)
═══════════════════════════════════════════════════════

Load ALL four font families in <head> (required CDN links):

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">

CSS classes — assign per scene based on trend:
  .font-inter       { font-family:'Inter',system-ui,sans-serif; font-weight:700; letter-spacing:-0.03em; }
  .font-space       { font-family:'Space Grotesk',sans-serif; font-weight:700; letter-spacing:-0.02em; }
  .font-bebas       { font-family:'Bebas Neue',sans-serif; font-weight:400; text-transform:uppercase; letter-spacing:0.05em; }
  .font-mono        { font-family:'Roboto Mono',monospace; font-weight:500; }

PAIRING TABLE (use the font + motion trick for each trend):
┌─────────────────────────┬──────────────────────────┬─────────────────────────────────────┐
│ Font                    │ Best Motion Trends       │ Motion Trick                        │
├─────────────────────────┼──────────────────────────┼─────────────────────────────────────┤
│ Inter (Clean Grotesk)   │ SaaS, Flow UI, Mixed     │ clip-path wipe + x shift            │
│ Space Grotesk (Tech)    │ Geo, POV, Metamorphosis  │ 3D perspective flip + data flow   │
│ Bebas Neue (Bold)       │ Neo-Brutalism, Tactile   │ Scale 150% over 3 frames + thick border│
│ Roboto Mono (Code)      │ VHS, Terminal, Explainer │ Real-time typewriter + terminal block│
└─────────────────────────┴──────────────────────────┴─────────────────────────────────────┘

Trend → Font mapping (apply automatically):
  saas_explainer, seamless_flow_ui, mixed_media, eco_minimal → .font-inter + clip-path wipe
  kinetic_geometric, immersive_pov, radical_metamorphosis   → .font-space + 3D flip
  neo_brutalist, tactile_3d                                 → .font-bebas + scale punch
  analog_vhs, saas_explainer (terminal scenes)             → .font-mono + typewriter

NEVER use Arial, Helvetica, system-ui alone. Headlines MUST use one of the four pairing fonts.
Each scene headline MUST use its trend-matched font class AND motion trick — not plain fade-in text.
`;

export function getFontPromptForTrend(styleId?: string): string {
  const trend = (styleId && styleId in TREND_TO_FONT
    ? styleId
    : "mixed_media") as MotionTrendId;
  const fontKey = TREND_TO_FONT[trend];
  const font = FONT_TREND_PAIRINGS[fontKey];
  return `TYPOGRAPHY FOR THIS VIDEO (9:16 vertical):
Font: ${font.displayName} → class .font-${fontKey === "inter" ? "inter" : fontKey === "space_grotesk" ? "space" : fontKey === "bebas_neue" ? "bebas" : "mono"}
Load: ${font.googleFontsUrl}
CSS: font-family:${font.cssFamily}; font-weight:${font.cssWeight}; letter-spacing:${font.letterSpacing};
${font.motionTrick}`;
}

export const TREND_PROMPT_DETAILS: Record<MotionTrendId, string> = {
  mixed_media: `TREND: High-Energy Mixed Media (Adyen / PlusOne Studio).
FONT: Inter (Clean Grotesk) — clip-path wipe + position shift (see font-inter motion trick).
Layer SVG vector accents, cel-animation stroke reveals, and kinetic typography on a FAST timeline (cuts every 0.8–1.2s).
Use inline SVG paths with stroke-dashoffset draw-on, floating geometric shards, and overlapping type at varied scales.
BACKGROUND: White #fff + 40px CSS grid + film grain overlay. NEVER pure black.
Scene rhythm: punchy — never hold a static frame >1s. Blend 2D vectors + bold type + grid BG simultaneously.`,

  radical_metamorphosis: `TREND: Radical Metamorphosis (Clim Studio Rebrand).
FONT: Space Grotesk (Tech Display) — 3D perspective flip + data flow (see font-space motion trick).
Abstract brand shapes morph via scale+rotate+skew+blur chains — each morph hits on a beat (every 0.5–0.7s).
Use CSS clip-path or SVG morph paths between circle→blob→logo silhouette.
Synchronize transforms: gsap.to(shape,{scale:1.4,rotate:180,borderRadius:"50%",duration:0.6,ease:"power2.inOut"}).
BACKGROUND: White #fff + subtle grid + soft radial gradient blobs (brand colors at 5% opacity).
Orchestral energy — dramatic pauses then explosive transitions.`,

  tactile_3d: `TREND: Tactile 3D / Squishy Textures (Adobe Showcase).
FONT: Bebas Neue (Bold Display) — scale punch + thick border (see font-bebas motion trick).
Replace flat glass with PUFFY 3D: filter:drop-shadow(0 20px 40px rgba(0,0,0,0.15)), large border-radius blobs.
CSS perspective:1200px; transform-style:preserve-3d; rotateX/rotateY subtle drift on cards.
Squish on entry: scaleY:0.85→1.05→1 with elastic.out. Matte soft gradients — NOT flat glass.
BACKGROUND: White #fff + grid + warm tint overlay (brand primary at 3% opacity).
Mobile-friendly: all elements within 450px width, safe zones respected.`,

  seamless_flow_ui: `TREND: Seamless Flow UI (Ordinary Folk / No-Code).
FONT: Inter (Clean Grotesk) — UI panel labels use linear wipe + x shift stagger (see font-inter motion trick).
UI panels morph, rotate, reconfigure in continuous loops — cards slide into grids, sidebars expand, dashboards rearrange.
Use gsap.timeline with overlapping tweens on .ui-panel elements — no hard cuts.
Show software mechanics as satisfying visual metamorphosis. Minimum 4 UI components animating per scene.
BACKGROUND: White #fff + grid + subtle shadow layers (0 2px 8px rgba(0,0,0,0.04)).
9:16 optimized: panels stack vertically, not side-by-side.`,

  kinetic_geometric: `TREND: Kinetic Geometric Minimalism (Meet Bixby).
FONT: Bebas Neue (Bold Display) — punchy scale hits on geometric labels (see font-bebas motion trick).
ONLY circles, lines, squares — no photos. Center-anchored composition (225px horizontal center of 450px canvas).
Orbit elements around center: gsap.to(".geo",{rotate:360,transformOrigin:"225px 400px",duration:8,ease:"none"}).
Apple-like restraint: max 3 colors, max 6 words on screen, motion carries the story.
BACKGROUND: White #fff + grid + single accent color geometric shapes.
Vertical rhythm: elements flow top-to-bottom, not left-to-right.`,

  neo_brutalist: `TREND: Flickering Neo-Brutalist (SonduckFilm 2026).
FONT: Bebas Neue (Bold Display) — scale headline 150% over 3 frames on every beat entry (see font-bebas motion trick).
Thick 4–8px borders, high-contrast fill/stroke, raw typography paired with Bebas Neue.
Rapid frame-skip flicker: alternate opacity 1→0 every 2–3 frames on entry, then stabilize.
Bold asymmetric layouts — break the grid intentionally. Mobile-feed energy.
BACKGROUND: White #fff + grid + thick black borders on all elements.
9:16 safe: text stays within center 70%, no edge bleeding.`,

  analog_vhs: `TREND: Analog VHS Nostalgia.
FONT: Roboto Mono (Code Terminal) — monospace headlines with grain overlay (see font-mono motion trick).
Overlay: film grain (CSS noise SVG), scanlines, chromatic aberration (text-shadow RGB split).
Warm tungsten grade: filter:sepia(0.15) hue-rotate(-10deg) contrast(1.1).
Deliberate imperfections: slight jitter gsap.to(el,{x:"+=2",duration:0.05,repeat:5,yoyo:true}).
BACKGROUND: White #fff + heavy grain + vignette + occasional chromatic shift.
Terminal blocks: dark rectangles on white grid, green monospace text.`,

  immersive_pov: `TREND: Immersive POV + AR Overlays (Meta / Insta360).
FONT: Space Grotesk (Tech Display) — HUD labels with linear wipe + position shift (see font-space motion trick).
Simulate first-person: perspective skew on BG, floating HUD elements track center focal point.
AR frames: dashed corners, floating labels with parallax (fg moves faster than bg).
Depth layers: bg blur increases as fg UI slides in — faux camera movement.
BACKGROUND: White #fff + grid + subtle gradient blobs (depth simulation).
Vertical HUD: info panels stack on right side, safe zone respected.`,

  saas_explainer: `TREND: High-Fidelity SaaS Explainer Hybrid (Redley API).
FONT: Inter (Clean Grotesk) — ALL UI text uses .font-inter with clip-path linear wipe reveals (see font-inter motion trick).
Split screen: top abstract narrative shapes, bottom polished UI mockup (glass dashboard).
Bridge B2B friction with animated data flows — lines connecting API nodes, counters, status badges.
Premium product-video polish — Stripe/Linear/Vercel quality bar.
BACKGROUND: White #fff + grid + soft shadows. Glass cards: backdrop-filter:blur(16px), border:1px solid rgba(0,0,0,0.1).
9:16 layout: narrative top 40%, UI bottom 60%.`,

  eco_minimal: `TREND: Minimalist Eco-Aesthetics.
FONT: Inter (Clean Grotesk) — soft weight transitions, elegant spacing (see font-inter motion trick).
SLOW pacing (2–3s holds), earthy palette (sage #10B981, sand #F59E0B, clay + brand accent).
Organic motion paths — bezier curve y drift with sine.inOut.
Fluid camera: subtle scale 1→1.03 over 4s. Lower sensory clutter — breathe between moments.
BACKGROUND: White #fff + grid + soft organic blobs (SVG paths with low opacity).
Vertical flow: single focal element per scene, generous whitespace.`,
};

export const APPLE_QUALITY_MANDATE = `
═══════════════════════════════════════════════════════
APPLE / STRIPE / LINEAR QUALITY BAR — NON-NEGOTIABLE (9:16)
═══════════════════════════════════════════════════════

You are a Senior Motion Director at an Apple-caliber studio. Simple = REJECTED.

REFERENCE LEVEL: Apple keynote graphics, Stripe Sessions, Linear launches, Adyen brand films.

MANDATORY CRAFT:
- Center-anchored hero compositions on scenes 1, 5, 8 (225px horizontal center of 450px canvas)
- Generous whitespace — 40%+ of frame is intentional negative space
- 3+ simultaneous visual layers every scene: (grid BG) + (grain/vignette) + (fg content)
- Micro-timing: entries 0.35–0.55s expo.out, exits 0.25–0.35s power3.in
- Every transition is a MOTION DESIGN moment — not a CSS fade
- 9:16 SAFE ZONES: Text only in center 70% (avoid top 10% and bottom 15%)

ABSOLUTELY FORBIDDEN (instant fail):
- Plain black background with centered white text sliding in
- Single-element scenes (only headline, no supporting visuals)
- PowerPoint-style fade transitions
- Generic "fadeIn" with no secondary motion
- system-ui / Arial typography
- Static cards without inner animation (icons, numbers, bars must move)
- Scene longer than 2s with zero element movement
- Horizontal layouts (side-by-side cards) — stack vertically in 9:16

DEFAULT IF NO STYLE SPECIFIED: mixed_media + saas_explainer blend.
`;

export const TRENDING_TECHNIQUES_BLOCK = `
═══════════════════════════════════════════════════════
TRENDING MOTION TECHNIQUES 2026 — 9:16 VERTICAL OPTIMIZED
═══════════════════════════════════════════════════════

── T17: MIXED MEDIA VECTOR LAYER (Adyen-style) ──
Inline SVG accents with stroke-draw + floating shards on white grid:
  gsap.fromTo(".vec-path",{strokeDashoffset:800},{strokeDashoffset:0,duration:0.8,ease:"expo.out",stagger:0.06});
  gsap.fromTo(".shard",{scale:0,rotation:-40,opacity:0},{scale:1,rotation:0,opacity:1,duration:0.5,stagger:0.04,ease:"back.out(1.7)"},t);
9:16: shards float vertically, not horizontally.

── T18: METAMORPHOSIS MORPH ──
  tl.to("#blob",{borderRadius:"60% 40% 55% 45%",scale:1.3,rotate:90,duration:0.55,ease:"power2.inOut"},t)
    .to("#blob",{borderRadius:"50%",scale:1,rotate:180,duration:0.55,ease:"power2.inOut"},t+0.55);
9x16: morph stays within 400px width, center at 225px.

── T19: TACTILE 3D SQUISH CARD ──
  .squish-card{transform-style:preserve-3d;filter:drop-shadow(0 16px 32px rgba(0,0,0,0.15));border-radius:24px;}
  gsap.fromTo(".squish-card",{scaleY:0.7,rotateX:25,opacity:0},{scaleY:1.05,rotateX:0,opacity:1,duration:0.6,ease:"elastic.out(1,0.35)"},t);
9x16: cards stack vertically, full width (400px), 16px margin.

── T20: FLOW UI MORPH ──
  Panels rearrange vertically: gsap.to(".ui-panel",{y:i*140,x:0,width:400,height:120,borderRadius:12,duration:0.7,stagger:0.08,ease:"power3.inOut"});
9x16: vertical stack, not horizontal grid.

── T21: KINETIC GEOMETRY ORBIT ──
  Center orbit at 225,400 (canvas center):
  gsap.to(".ring-dot",{rotate:360,transformOrigin:"225px 400px",duration:6,ease:"none",stagger:0.15});

── T22: NEO-BRUTALIST FLICKER ──
  for(var f=0;f<8;f++) tl.to(".brut-block",{opacity:f%2?1:0,duration:0.04,ease:"none"},t+f*0.04);
  tl.to(".brut-block",{opacity:1,borderWidth:"4px",duration:0.2,ease:"power2.out"},t+0.35);
9x16: blocks full width (400px), thick borders, offset shadow.

── T23: VHS GRAIN OVERLAY ──
  .vhs-grain{pointer-events:none;mix-blend-mode:overlay;opacity:0.12;background:url('data:image/svg+xml,...noise...');animation:grainShift 0.1s steps(2) infinite;}
  .vhs-chroma{text-shadow:2px 0 #ff000088,-2px 0 #00ffff88;}
9x16: grain covers full 450x800, chromatic on text only.

── T24: POV PARALLAX HUD ──
  tl.to(".hud-fg",{y:-20,scale:1.05,duration:2,ease:"none"},0)
    .to(".hud-bg",{y:10,scale:1.02,duration:2,ease:"none"},0);
9x16: HUD elements anchor to top-right, safe zone respected.

── T25: SAAS SPLIT DASHBOARD ──
  Top: abstract shapes morph. Bottom: .dash-panel with animated chart bars:
  gsap.fromTo(".bar",{scaleY:0,transformOrigin:"bottom"},{scaleY:1,duration:0.6,stagger:0.05,ease:"expo.out"},t);
9x16: 40% top narrative, 60% bottom UI. Bars grow upward.

── T26: ECO FLUID DRIFT ──
  gsap.to(".organic-blob",{x:20,y:-10,borderRadius:"58% 42% 61% 39% / 44% 56% 48% 52%",duration:4,ease:"sine.inOut",repeat:-1,yoyo:true});
9x16: blobs drift vertically, anchor to center 225px.
`;

export const TREND_STYLE_MAP = `
mixed_media          → T17 dominant — fast cuts, vectors + kinetic type in 4+ scenes
radical_metamorphosis→ T18 dominant — shape morphs on every scene transition
tactile_3d           → T19 dominant — squish 3D cards, drop shadows, perspective
seamless_flow_ui     → T20 dominant — UI panels morph vertically scene 3–5
kinetic_geometric    → T21 dominant — circles/lines only, center orbit at 225,400
neo_brutalist        → T22 dominant — flicker entry, thick borders, high contrast
analog_vhs           → T23 overlay on ALL scenes + warm grade
immersive_pov        → T24 dominant — parallax HUD layers scene 1–4
saas_explainer       → T25 dominant — split dashboard + abstract narrative
eco_minimal          → T26 dominant — slow organic drift, earthy palette

When a trend is specified it MUST dominate 4+ scenes and appear in scene transitions.
`;

export function getTrendPromptDetail(styleId?: string): string {
  if (!styleId) return TREND_PROMPT_DETAILS.mixed_media;
  if (styleId in TREND_PROMPT_DETAILS) {
    return TREND_PROMPT_DETAILS[styleId as MotionTrendId];
  }
  return "";
}