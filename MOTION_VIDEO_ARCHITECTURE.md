# Motion Video Generation Architecture - SOTA flovo

## 🎯 Project Overview
**SOTA flovo** is an AI-powered motion video generator that creates premium 30-second cinematic ads using a sophisticated multi-agent pipeline. It generates beautifully choreographed videos inspired by Apple, Linear, Stripe, and Pentagram design principles.

---

## 🏗️ Core Architecture

### **Three-Layer Pipeline**

#### 1. **Brand Extraction Layer** (`extract-brand.ts`)
- Scrapes user's website (via `scrapeWebsite`)
- Extracts brand identity (name, tagline, colors, industry, description)
- Retrieves logos and converts them to SVG format
- Creates structured `ExtractedBrand` data
- Uses OpenRouter API to intelligently parse brand context

#### 2. **Video Generation Layer** (`generate-video.ts`)
- Takes brand context + user description + palette selection
- Calls Qwen AI (via DashScope API) with sophisticated prompts
- Generates motion video schema as JSON
- Handles music selection (Pixabay API - mood-based)
- Auto-implements missing animations dynamically
- Returns `MotionVideoSchema` with complete scene descriptions

#### 3. **Rendering/Playback Layer** (`MotionPlayer.ts`)
- Converts JSON schema into interactive HTML5 canvas
- Uses GSAP for timeline-based animations
- Renders scenes with CSS-in-JS styling
- Plays video with synchronized audio
- Supports multiple aspect ratios (16:9, 9:16, 1:1)

---

## 🤖 AI/ML Technologies

### **Large Language Models**
- **Primary**: Qwen 3.7+ (via DashScope API)
- **Fallback Models**: qwen-plus, qwen-max
- **Use Cases**:
  - Brand analysis & insights extraction
  - Motion video JSON generation
  - Dynamic animation implementation
  - Text copywriting for video

### **Prompting Strategy**
- **System Prompt**: `JSON_MOTION_SYSTEM_PROMPT` (video-prompt.ts)
  - Trained for "Quiet Luxury Motion" aesthetic
  - Follows 8-scene narrative arc (HOOK → TENSION → REVEAL → PROOF → DEMO → STAT → VOICE → CTA)
  - Enforces ONE idea per scene
  - Controls word-level text animations

- **User Prompt Builder**: `buildUserPrompt()` function
  - Injects brand-specific details
  - Applies color choreography rules
  - Selects editorial design seeds (Apple/Linear/Vercel/Pentagram styles)
  - Handles aspect ratio optimization
  - Supports custom style overrides

---

## 🎨 Design System

### **Premium Color Palettes** (4 predefined + custom)
1. **RetroElectric**: Neon synthwave (cyan, magenta on dark)
2. **CloudDancer**: Minimalist cream (sage, charcoal on light)
3. **Glassmorphism**: Cyber elegance (cyan, gold on near-black)
4. **MinimalMaximalism**: Warm editorial (terracotta, gold on light)

**Color Discipline**:
- 2 dominant neutrals + 1 accent
- Accent ≤ 20% of pixels per scene
- Gradient max 2 stops (same color family)
- Glow/shadow opacity: 0.04–0.12 range

### **Typography System** (10+ Google Fonts)
- **Inter**: Default sans (versatile)
- **Space Grotesk**: Tech precision
- **Playfair Display**: Editorial drama
- **JetBrains Mono**: Code/terminal aesthetic
- **Bebas Neue**: Bold headlines
- **Outfit, Clash Display, Syne, Archivo**: Specialty variants

---

## 🎬 Motion Video Schema

### **MotionVideoSchema Structure**
```typescript
{
  version: "1.0"
  aspects: "16:9" | "9:16" | "1:1"
  palette: MotionPalette
  globalFont: FontKey
  globalAnimation?: string
  
  scenes: MotionScene[]
  music?: {
    mood: "calm" | "uplifting" | "dramatic" | "corporate" | "energetic"
    bpm: "slow" | "medium" | "fast"
    category: "ambient" | "cinematic" | "electronic" | "corporate"
  }
}
```

### **Scene Layouts** (23+ supported)
- **Hero**: `center_hero`, `title_card`, `lower_third`
- **Data**: `cards_3`, `cards_4`, `stats_3`, `bento_grid`, `bento`
- **Terminal**: `terminal`, `search_bar`
- **Advanced**: `word_stack_reveal`, `text_morph`, `split_screen`, `kinetic_push`, `zoom_data`
- **Social**: `popup_social`, `carousel`, `quote`
- **Retro**: `retro_paper`

### **Each Scene Contains**
```typescript
{
  id: number
  duration_ms: number
  layout_type: string
  
  // Text content
  headline?: string
  subheadline?: string
  body?: string
  cta?: string
  
  // Data elements
  cards?: Card[]        // For card layouts
  stats?: Stat[]        // For stat displays
  tags?: string[]       // Pill/badge labels
  
  // Special animations
  headlineAnimation?: string  // From AnimationRegistry
  transition?: string         // Exit animation
  transition_in?: string      // Entry animation
  
  // Custom colors (can override palette per scene)
  customColors?: {
    bg?: string
    text?: string
    accent?: string
  }
  
  // Layout-specific fields
  kineticWords?: string[]           // kinetic_push
  morphPairs?: [string, string][]   // text_morph
  stackWords?: string[]             // word_stack_reveal
  terminalLines?: string[]          // terminal
  searchQuery?: string              // search_bar
}
```

---

## ✨ Animation System

### **AnimationRegistry** (40+ prebuilt)

#### **Headline Animations** (20+)
- `slam_drop` - Words drop from top with bounce
- `waterfall` - Slide in from right with skew
- `kinetic_scale` - Scale down from 5x with blur
- `glitch_reveal` - Clip-path reveal with glitch jitter
- `char_shatter` - Characters fly from 3D positions
- `typewriter` - Classic character-by-character reveal
- `3d_flip` - Words flip in on X axis
- `wave_text` - Words wave in from center-out
- `elastic_pop` - Words pop with elastic overshoot
- `scramble_text` - Characters scramble then resolve
- And 10+ more...

#### **Transition Animations** (17+)
- `fade` - Simple opacity crossfade
- `slide_up` / `slide_down` - Vertical slides
- `scale_punch` - Punches in with scale and blur
- `blur_dissolve` - Cross-blur dissolve
- `clip_wipe` - Diagonal wipe
- `depth_push` - Camera push through depth
- `zoom_blur` - Zoom with radial blur
- `chromatic_split` - RGB channel split effect
- `glitch_slice` - Horizontal glitch slices
- And 8+ more...

### **Dynamic Animation Implementation**
If AI generates unknown animation names:
1. System detects missing animations
2. Calls Qwen to implement them as vanilla JS
3. Registers them in `AnimationRegistry`
4. No external libraries (no GSAP required)

---

## 🔄 Data Flow

```
User Input (Business Description)
    ↓
[Extract Brand Agent]
  - Scrapes website
  - Extracts colors, logo, industry
  - Creates brand context
    ↓
[Video Generation Agent]
  - Calls Qwen with system + user prompts
  - Generates MotionVideoSchema (JSON)
  - Fetches background music
  - Auto-implements unknown animations
    ↓
[Rendering Layer]
  - Converts schema to HTML5/Canvas
  - GSAP timeline orchestration
  - Plays video with audio sync
  - Generates Blob URL for preview
    ↓
[VideoPreview Component]
  - Renders in iframe
  - Responsive scaling
  - User can download/share
```

---

## 📚 Key APIs & External Services

| Service | Purpose | Key Method |
|---------|---------|-----------|
| **DashScope (Alibaba Qwen)** | LLM for video schema generation | `callOpenRouter()` → DashScope |
| **Pixabay** | Background music/audio | `fetchMusic(mood, category)` |
| **Google Fonts** | Typography loading | Injected via `<link>` tags |
| **Web Audio API** | Audio context & playback | `AudioContext` (browser native) |
| **GSAP** | Animation timeline | `gsap.timeline()` |
| **Canvas/SVG** | Video rendering | HTML5 canvas + inline SVG |

---

## 💾 Frontend Components

### **Main Components**
- **VideoGeneratorDemo.tsx**: Full UI with form + preview
- **VideoPreview.tsx**: iframe-based video player
- **MotionVideoPlayer.tsx**: Schema renderer (MotionPlayer class)

### **Custom Hooks**
- `useGenerateVideo()` - Manages API call state + video generation
- `useGsap()` - GSAP initialization & cleanup
- `useCountUp()` - Number animation for stats

---

## 🛠️ Backend Infrastructure

### **Server Functions** (TanStack Start)
- `generateVideo()` - Main video generation endpoint
- `generateVideoJson()` - Lower-level JSON schema generation
- `extractBrand()` - Brand info extraction

### **Tech Stack**
- **Framework**: TanStack Start + React Router
- **Build**: Vite + esbuild
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Query (@tanstack/react-query)
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Radix UI (accessible primitives)

---

## 🎯 Video Generation Quality Principles

### **"Quiet Luxury Motion" Philosophy**
1. **ONE idea per scene** - Never cram content
2. **Motion serves meaning** - Animate to reveal, emphasize, transition
3. **Context-aware components** - Search bars, terminals only when relevant
4. **Word-level text animations** - Our signature move

### **Color Choreography**
- Each of 8 scenes strategically uses palette colors
- Can flip between light/dark modes mid-video
- Penultimate/final scene floods with accent color for climax

### **Design References**
- Apple keynote: void background, monolithic type, electric accents
- Linear: graphite gradients, hairline dividers, surgical typography
- Stripe: soft cream cards, micro-shadows, gradient strokes
- Pentagram: serif drama, generous margins, editorial luxury

---

## 📊 Current Limitations & Opportunities

### **Known Constraints**
- Music fallback if Pixabay unavailable
- 8-scene fixed structure (could be variable)
- Aspect ratio locked at generation time
- Brand extraction depends on website quality

### **Potential Enhancements**
- Real-time preview during generation
- Custom animation editor
- Multi-language support
- Watermark/branding overlay customization
- Stock footage integration
- Voice-over generation (speech synthesis)

---

## 🚀 Getting Started

### **Local Development**
```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run lint         # ESLint check
npm run format       # Prettier formatting
```

### **Environment Variables Required**
```
DASHSCOPE_API_KEY    # Alibaba Qwen API
PIXABAY_API_KEY      # Music/audio source
```

### **Example Usage**
```tsx
const { loading, data, generateVideo } = useGenerateVideo();

await generateVideo({
  userPrompt: "We build AI tools for content creators",
  instagram: "@aitools",
  telegram: "t.me/aitools_channel"
});

// data.htmlCode contains the generated video schema
// Render with <VideoPreview htmlCode={data.htmlCode} />
```

---

**Generated**: 2026-06-08  
**Project**: SOTA flovo - Motion Video Generation System
