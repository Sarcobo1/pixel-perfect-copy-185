import { z } from "zod";

// ─── PALETTE ─────────────────────────────────────────────
export const PaletteSchema = z.object({
  id: z.string(),
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent2: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentGlow: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  muted: z.string(),
  glow: z.string(),
  border: z.string(),
  cardBg: z.string(),
  gradient: z.string(),
});

// ─── SCENE ELEMENTS ──────────────────────────────────────
export const CardSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  stat: z.string().optional(),
  statLabel: z.string().optional(),
});

export const StatSchema = z.object({
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  label: z.string(),
});

export const SceneSchema = z.object({
  id: z.number(),
  startTime: z.number(),
  duration: z.number(),
  layout: z.enum([
    "center_hero",
    "cards_3",
    "cards_4",
    "stats_3",
    "terminal",
    "split_horizontal",
    "split_vertical",
    "bento",
    "carousel",
    "quote",
    "search_bar",
    "kinetic_push",
    "center_push_stack",
    "word_stack_reveal",
    "text_morph",
    "split_screen",
    "zoom_data",
    "title_card",
    "lower_third",
    "callout_card",
    "popup_social",
    "bento_grid",
    "retro_paper",
  ]),
  /** Alias for director JSON schema */
  layout_type: z.string().optional(),
  duration_ms: z.number().optional(),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  customColors: z.object({
    bg: z.string().optional(),
    text: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  cards: z.array(CardSchema).optional(),
  stats: z.array(StatSchema).optional(),
  terminalLines: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  // kinetic_push fields
  kineticWords: z.array(z.string()).optional(),
  kineticColors: z.array(z.string()).optional(),
  kineticWordDurationMs: z.number().optional(),
  kineticExitDurationMs: z.number().optional(),
  // center_push_stack fields
  pushStackText: z.string().optional(),
  pushStackInterval: z.number().optional(),
  /** word_stack_reveal: ms between words (schema: word_interval_ms) */
  wordIntervalMs: z.number().optional(),
  word_interval_ms: z.number().optional(),
  stackWords: z.array(z.string()).optional(),
  // text_morph fields
  morphPairs: z.array(z.array(z.string())).optional(), // [["Fast","Smart"],["Build","Scale"]]
  morphInterval: z.number().optional(), // ms per pair, default 2000
  // split_screen fields
  leftHeadline: z.string().optional(),
  leftBody: z.string().optional(),
  rightHeadline: z.string().optional(),
  rightBody: z.string().optional(),
  // zoom_data fields
  zoomStat: z.string().optional(),      // e.g. "1.2M"
  zoomLabel: z.string().optional(),     // e.g. "Active Users"
  zoomPrefix: z.string().optional(),    // e.g. "$"
  zoomSuffix: z.string().optional(),    // e.g. "%"
  headlineAnimation: z.string().default("slam_drop"),
  bgVariant: z.enum(["primary", "surface", "accent", "gradient"]).default("primary"),
  bgMesh: z.boolean().default(true),
  bgParticles: z.enum(["none", "dot_grid", "trail", "sparks", "snow", "rain"]).default("none"),
  cameraMove: z.enum([
    "none",
    "zoom_in",
    "zoom_out",
    "push_through",
    "pan_left",
    "pan_right",
    "shake",
  ]).default("none"),
  transition: z.string().default("fade"),
  transition_in: z.string().optional(),
  transition_out: z.string().optional(),
  soundOnEnter: z.enum([
    "none",
    "whoosh",
    "impact",
    "pop",
    "ping",
    "glitch",
    "sweep",
    "snap",
    "soft_click",
    "airy_whoosh",
    "glass_tap",
    "screen_shake_rumble",
    "bass_drop",
  ]).default("none"),
  soundOnHeadline: z.enum([
    "none",
    "whoosh",
    "impact",
    "pop",
    "ping",
    "glitch",
    "sweep",
    "snap",
    "soft_click",
    "airy_whoosh",
    "glass_tap",
    "screen_shake_rumble",
    "bass_drop",
  ]).default("none"),
  screenShake: z.boolean().default(false),
  impactFlash: z.boolean().default(false),
  particleBurst: z.boolean().default(false),
});

// ─── MUSIC METADATA ──────────────────────────────────────
export const MusicSchema = z.object({
  mood: z.enum(["energetic", "calm", "dramatic", "uplifting", "dark", "corporate"]).default("corporate"),
  bpm: z.enum(["slow", "medium", "fast"]).default("medium"),
  category: z.enum(["electronic", "cinematic", "corporate", "ambient"]).default("corporate"),
});

// ─── CUSTOM (DYNAMIC) ANIMATION ENTRIES ──────────────────
export const CustomAnimationSchema = z.object({
  name: z.string(),
  type: z.enum(["headline", "transition"]),
  jsCode: z.string(),
  description: z.string().optional(),
});

// ─── MAIN SCHEMA ─────────────────────────────────────────
export const MotionVideoSchema = z.object({
  version: z.literal("1.0"),
  duration: z.number().default(30),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  brandName: z.string(),
  tagline: z.string().optional(),
  website: z.string().optional(),
  social: z.string().optional(),
  palette: PaletteSchema,
  globalFont: z.enum([
    "inter",
    "space_grotesk",
    "bebas_neue",
    "playfair_display",
    "jetbrains_mono",
    "outfit",
    "clash_display",
    "syne",
    "archivo",
    "monoton",
  ]).default("inter"),
  globalAnimation: z.string().default("slam_drop"),
  logoUrl: z.string().optional(),
  scenes: z.array(SceneSchema).min(3).max(10),
  customAnimations: z.array(CustomAnimationSchema).optional(),
  music: MusicSchema.optional(),
  musicUrl: z.string().optional(),
});

export type MotionVideoSchema = z.infer<typeof MotionVideoSchema>;
export type MotionScene = z.infer<typeof SceneSchema>;
export type MotionPalette = z.infer<typeof PaletteSchema>;
export type MotionCard = z.infer<typeof CardSchema>;
export type MotionStat = z.infer<typeof StatSchema>;
