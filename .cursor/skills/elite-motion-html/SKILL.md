name: elite-motion-html

description: >-  
Generates elite GSAP motion HTML for viral short-form video (Instagram Reels, TikTok, YouTube Shorts).  
Use when generating, fixing, or reviewing AI motion code, video-prompt, frozen animations,  
logos, chromatic typography, stats, icons, UI components, or when the user says motion is too simple  
or background is black.

Elite Motion HTML — Viral Short-Form Video Generator

Read src/lib/api/motion-design-spec.ts for the canonical AI prompt block.  
When editing prompts, keep that file and video-prompt.ts in sync.

When to apply

User generates motion from website URL

Output is text+cards only, black background, or frozen preview

User wants Apple/trending motion, chromatic words, stats, icons, zoom

User wants 9:16 vertical format for Instagram/TikTok

User says "motion is too simple" or "background is black"

Quality bar

Must have

Minimum

GSAP tweens

40+

Inline SVG icons

8

Stat cards with counters

3

UI (search bar or CTA button)

1+

Camera zoom per scene

1

Background layers

CSS grid + film grain + vignette (never #000)

Chromatic headline

each word different brand color

Timeline

window.__timelines["sota-video"] paused, scene opacity toggles

Audio engine

8 Web Audio API synthesizers synced to visuals

Start screen

▶ PLAY button + ↻ restart after end

Progress bar

2px bottom bar tracking master.progress()

Format specification

Canvas: 450×800px (9:16 vertical)

Safe zone: Center 70% (avoid top 10% and bottom 15% for text)

Background: #fff (white) + 40px CSS grid + film grain + vignette

All scenes: background:transparent (grid always visible)

No build tools: Single self-contained HTML file

GSAP CDN: [https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js)

Chromatic text pattern

Each word = separate <span>

<span style="color:#FF2D55">  
<span style="color:#3B82F6">  
<span style="color:#F59E0B">

Background rule

Use white (#fff) as base. Never background:#000.  
Always overlay:

1. CSS grid: 40px lines, rgba(0,0,0,0.06)
2. Film grain: SVG feTurbulence, mix-blend-mode:overlay, opacity:0.1
3. Vignette: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.4) 100%)
4. Corner marks: 2px L-shaped borders in all 4 corners
5. Frame info: "001", "30fps", "450×800", "00:00" in corners

Logo rule

Always <img id="brand-logo"> in Scene 1 and Scene 8 (CTA).  
Post-process injects real src. Do not pass base64 logo in AI prompt.

Fonts (by trend)

Font

Trends

Trick

Inter (300–900)

clean / saas_explainer / minimal

clip-path wipe + mask reveal

Space Grotesk (300–700)

tech / futuristic / data

3D flip + rotateX

Bebas Neue (400)

neo_brutalist / bold / impact

150% scale + elastic pop

Roboto Mono (100–700)

code / terminal / engineering

typewriter effect + mech ticks

Playfair Display (400–900)

luxury / editorial / premium

liquid gradient + deep glow

Audio engine (8 synthesizers)

Sound

Oscillator

Trigger

playSlam()

Triangle, 150→50Hz, 0.25s

Big text entrances

playPop()

Sine, 800→1200Hz, 0.1s

Icons, badges, dots

playClick()

Square, 1000Hz, 0.04s

List items, results

playWhoosh()

Noise + lowpass sweep 300→2000Hz, 0.12s

Transitions, cards

playType()

Sine, 1200Hz, 0.03s

Every keystroke

playChirp()

Sine, 1500→2800Hz, 0.07s

Bubbles, arrows

playBass()

Sine, 60→30Hz, 0.35s

Countdowns, reveals

playGlitch()

Bandpass noise, 2000Hz, 0.08s

Glitch text

Scene structure (30s viral reel)

Scene 1 (0–3s)

HOOK: Shocking question or bold statement. Mask reveal + underline draw. Chromatic words.

Scene 2 (3–6s)

KINETIC TITLE: 3 words max. Clip-path + rotate. One word gets accent color. Elastic pop.

Scene 3 (6–10s)

UI SHOWCASE: 3 cards or search bar. Slide-left + blur + stagger. 8 inline SVG icons.

Scene 4 (10–14s)

METRIC: One massive number. Elastic.out scale + bar fill. 3 stat cards with counters.

Scene 5 (14–18s)

SEARCH: Typing effect + results drop-in. scaleX reveal + rotateX results. playType() on every char.

Scene 6 (18–22s)

TYPOGRAPHY: Font showcase or design system. Stacked rows or 2×2 grid. Different font per row.

Scene 7 (22–26s)

BENTO STATS: 2–3 stat cards. Scale + blur stagger + bar animation. Camera zoom.

Scene 8 (26–30s)

CTA: "START NOW" or "FOLLOW". Slide-from-sides + pulse button. Logo + camera shake.

Animation arsenal (use ALL, never repeat across scenes)

TEXT ENTRANCES:

- Mask Reveal: overflow:hidden parent + child translateY(100%)→0
- Clip-Path Wipe: clip-path:inset(100% 0 0 0)→inset(0)
- Clip-Path Directional: inset(0 100% 0 0) [right→left], inset(0 0 100% 0) [bottom→top]
- Rotate+Clip: rotate(-5deg) + clip-path for kinetic energy
- Scale+Blur: scale(0.8) + filter:blur(8px) → scale(1) + blur(0)
- Character Stagger: Split words into <span>
- Typewriter: Real character-by-character with setInterval + cursor blink
- 3D Flip: rotateX(90deg)→0, transform-origin:center bottom
- Elastic Pop: scale(0.3)→1, ease:"elastic.out(1, 0.5)"
- Slide from Edge: translateX(-100%)→0 or translateX(100%)→0

TRANSITIONS:

- Fade Out: opacity→0, [power2.in](http://power2.in), 0.3–0.4s
- Wipe Mask: solid color div slides across, power4.inOut
- Zoom Out: scale(1.5) + opacity:0
- Blur Exit: filter:blur(0)→blur(10px) + opacity:0

UI COMPONENTS:

- Cards: translateX(-60px) + blur(6px) → translateX(0) + blur(0)
- Dots/Icons: scale(0)→1, back.out(2)
- Search Bar: scaleX(0.5) + scaleY(0.8) → scaleX(1) + scaleY(1), transform-origin:left center
- Bars: width:0%→X%, steps(N) for stop-motion or power2.out for smooth
- Results: translateY(20px) + rotateX(45deg) → translateY(0) + rotateX(0), back.out(1.4)
- Bento Grid: scale(0.6) + blur(8px) → scale(1) + blur(0), staggered

TYPOGRAPHY EFFECTS:

- 3D Bubble: 12-layer text-shadow simulating depth + breathe animation scale(1.05)
- Glitch Text: ::before + ::after with clip-path animation + text-shadow:-2px 0 #FF2D55, 2px 0 #3B82F6
- Liquid Gradient: background:linear-gradient + background-clip:text + background-size:300% + animated background-position
- Deep Glow: 5-layer text-shadow from 10px to 120px blur
- Neo-Brutalism: border:3px solid #000, box-shadow:5px 5px 0 #000, Bebas Neue font
- Ticker Tape: white-space:nowrap inside overflow:hidden with CSS @keyframes scroll

EASINGS (GSAP):

- "power3.out" / "power4.out" — Primary entrances
- "power2.inOut" — Wipe transitions and bar fills
- "elastic.out(1, 0.5)" — Big text, badges, bubbles
- "back.out(1.6)" / "back.out(2)" — UI cards, icons, search bars
- "rough({strength:2, points:8})" — Stop-motion / jagged kinetic text
- "steps(N)" — Bar charts, pixel-art feel
- "none" — Camera shake frames

Color palette

Primary Accent: #FF2D55 (hot pink) — CTAs, highlights, verdicts

Secondary: #3B82F6 (blue), #10B981 (green), #F59E0B (yellow)

Purple: #BF5AF2 — premium/futuristic scenes

Text: #000 (primary), rgba(0,0,0,0.35) (secondary), rgba(0,0,0,0.25) (tertiary)

Borders: rgba(0,0,0,0.1)

Shadows: 0 2px 8px rgba(0,0,0,0.04)

Frozen video fixes

HTML truncated → increase max_tokens to 16000, validate  + __timelines

Timeline not playing → check paused:true and start screen click handler

Grid not visible → check .scene background:transparent

Audio not working → check AudioContext unlock on user interaction

After export → user clicks ▶ for screen recording

Files to edit

src/lib/api/motion-design-spec.ts — motion rules for AI

src/lib/api/video-prompt.ts — system prompt assembly

src/lib/api/motion-trends.ts — trend + font map

src/lib/api/motion-postprocess.ts — logo inject, colors, autoplay

Output contract

Return ONLY raw HTML starting with <!DOCTYPE html>.  
No markdown blocks, no commentary, no introduction. 100% complete code.  
Target: 400–600 lines. Must include all 8 scenes, all 8 audio functions, start screen, progress bar.