# **Elite Motion HTML — Reference**

## **Scene checklist (8 scenes, 30s)**

### **Scene 1 — Hook (0–3s)**

- CSS grid + film grain + vignette (always visible)
- Logo #brand-logo elastic scale (Scene 1 + Scene 8)
- Chromatic 2–4 word tagline (each word different color)
- 3 floating SVG icons (opacity 0.2, drift animation)
- Underline draw animation
- Mask reveal text entrance
- playSlam() on big text

### **Scene 2 — Kinetic Title (3–6s)**

- 3 words max, clip-path + rotate
- One word gets accent color (#FF2D55)
- Elastic pop entrance
- playPop() on each word
- Subtitle fade in

### **Scene 3 — UI Showcase (6–10s)**

- 3 cards with icon + title + description
- Slide-left + blur entrance, stagger 0.15s
- Dot icons scale(0)→1 with back.out(2)
- Inner bar animation (width 0→100%)
- playWhoosh() on each card
- Fade out transition

### **Scene 4 — Metric (10–14s)**

- One massive number (96px+ font)
- Elastic.out scale entrance
- Counter 0→N via GSAP object interpolation
- Progress bar fill (width 0→100%)
- playSlam() on number
- playClick() on bar fill

### **Scene 5 — Search (14–18s)**

- Search bar scaleX reveal (transform-origin: left center)
- Icon rotate(-45deg)→0 + scale(0)→1
- Typewriter effect: real character-by-character
- playType() on every keystroke
- Results drop-in: translateY(20px) + rotateX(45deg)→0
- playClick() on each result
- Cursor blink animation

### **Scene 6 — Typography (18–22s)**

- Font showcase: 4 stacked rows or 2×2 grid
- Each row: glyph + name + weights + sample
- Different font per row (Inter, Space Grotesk, Roboto, Mono)
- Elastic pop on glyphs
- Color accent per row (#FF2D55, #3B82F6, #10B981, #F59E0B)
- playPop() on each glyph

### **Scene 7 — Bento Stats (22–26s)**

- 2–3 stat cards in grid
- Scale(0.6) + blur(8px)→scale(1) + blur(0)
- Staggered entrance
- Bar fill animation per card
- playWhoosh() on each card
- Camera zoom (scale 1.05 on container)

### **Scene 8 — CTA (26–30s)**

- "START NOW" or "FOLLOW" text
- Slide-from-sides entrance
- Pulse button: scale(1.04) yoyo repeat
- Logo #brand-logo elastic scale
- playSlam() on main text
- playPop() on button
- Camera shake on impact

---

## **GSAP snippets**

### **Stat counter**

**JavaScript**

```javascript
el.textContent = "0";
tl.add(function(){
  var o = { v: 0 };
  gsap.to(o, { v: 98, duration: 1.5, ease: "expo.out",
    onUpdate: function(){ el.textContent = Math.round(o.v) + "%"; }
  });
}, 10.5);
```

### **Progress bar**

**JavaScript**

```javascript
gsap.fromTo(".stat-fill", 
  { width: "0%" }, 
  { width: "98%", duration: 1.2, ease: "expo.out", stagger: 0.1 }, 
  10.6
);
```

### **Icon stroke draw**

**JavaScript**

```javascript
gsap.fromTo(".icon-path", 
  { strokeDashoffset: 300 }, 
  { strokeDashoffset: 0, duration: 0.8, stagger: 0.06, ease: "expo.out" }, 
  t
);
```

### **Scene visibility toggle**

**JavaScript**

```javascript
tl.to("#scene-1", { opacity: 0, duration: 0.3, ease: "power2.in" }, 2.7);
tl.to("#scene-2", { opacity: 1, pointerEvents: "all", duration: 0.3 }, 3.0);
```

### **Mask reveal text**

**JavaScript**

```javascript
gsap.to(".hook-line span", { 
  y: 0, 
  duration: 0.5, 
  ease: "power3.out", 
  stagger: 0.15 
});
```

### **Clip-path wipe**

**JavaScript**

```javascript
gsap.to(".kinetic-word", { 
  clipPath: "inset(0% 0 0% 0)", 
  rotate: 0, 
  duration: 0.6, 
  ease: "power3.out" 
});
```

### **Scale + blur**

**JavaScript**

```javascript
gsap.to(".ui-card", { 
  x: 0, 
  opacity: 1, 
  filter: "blur(0px)", 
  duration: 0.5, 
  ease: "power3.out", 
  stagger: 0.2 
});
```

### **Elastic pop**

**JavaScript**

```javascript
gsap.to(".metric-num", { 
  scale: 1, 
  opacity: 1, 
  duration: 0.7, 
  ease: "elastic.out(1, 0.4)" 
});
```

### **Typewriter**

**JavaScript**

```javascript
const text = "motion graphics";
let i = 0;
const typeInt = setInterval(() => {
  if (i <= text.length) {
    el.textContent = text.slice(0, i);
    playType();
    i++;
  } else {
    clearInterval(typeInt);
    cursor.style.animation = "blink 1s infinite";
  }
}, 100);
```

### **3D Flip**

**JavaScript**

```javascript
gsap.to(".flip-text", { 
  rotateX: 0, 
  y: 0, 
  duration: 0.5, 
  ease: "back.out(1.5)", 
  stagger: 0.1 
});
```

### **Camera shake**

**JavaScript**

```javascript
gsap.to("#camera-rig", { 
  x: "random(-4, 4)", 
  y: "random(-4, 4)", 
  duration: 0.05, 
  repeat: 15, 
  yoyo: true, 
  ease: "none" 
});
```

### **Bento card stagger**

**JavaScript**

```javascript
gsap.to(".bento-card", { 
  scale: 1, 
  opacity: 1, 
  filter: "blur(0px)", 
  duration: 0.5, 
  ease: "power3.out", 
  stagger: 0.15 
});
```

---

## **Audio engine (Web Audio API)**

**JavaScript**

```javascript
let ctx = null;
function initAudio() { 
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); 
}

function playSlam() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "triangle";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(50, t + 0.2);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  o.start(t); o.stop(t + 0.25);
}

function playPop() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(800, t);
  o.frequency.exponentialRampToValueAtTime(1200, t + 0.06);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.start(t); o.stop(t + 0.1);
}

function playClick() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "square";
  o.frequency.setValueAtTime(1000, t);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  o.start(t); o.stop(t + 0.04);
}

function playWhoosh() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(); n.buffer = buf;
  const ng = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(300, t);
  f.frequency.linearRampToValueAtTime(2000, t + 0.1);
  n.connect(f); f.connect(ng); ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.08, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  n.start(t); n.stop(t + 0.12);
}

function playType() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(1200, t);
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  o.start(t); o.stop(t + 0.03);
}

function playChirp() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(1500, t);
  o.frequency.exponentialRampToValueAtTime(2800, t + 0.05);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  o.start(t); o.stop(t + 0.07);
}

function playBass() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(60, t);
  o.frequency.exponentialRampToValueAtTime(30, t + 0.3);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  o.start(t); o.stop(t + 0.35);
}

function playGlitch() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const n = ctx.createBufferSource(); n.buffer = buf;
  const ng = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(2000, t);
  f.Q.value = 0.5;
  n.connect(f); f.connect(ng); ng.connect(ctx.destination);
  ng.gain.setValueAtTime(0.1, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.start(t); n.stop(t + 0.08);
}
```

---

## **Token budget**

- Model: qwen-max (best quality for complex HTML)
- max_tokens: 16000 (increased for 30s HTML)
- Target HTML: 400–600 lines (complete closing tags)
- If truncated: fail validation, retry with higher max_tokens

## **Brand colors in prompt**

Always pass primary_color via buildPaletteHint().  
AI must derive background from primary — not use preset black.  
For white backgrounds: use "Clean" palette with #FF2D55 accent.

## **Frozen video fixes**

1. HTML truncated → increase max_tokens to 16000, validate `</html>` + `__timelines`
2. Timeline not playing → check `paused: true` and start screen click handler
3. Grid not visible → check `.scene { background: transparent }`
4. Audio not working → check AudioContext unlock on user interaction (click/touch)
5. After export → user clicks ▶ for screen recording (OBS, QuickTime, etc.)

## **Format specification**

- Canvas: 450×800px (9:16 vertical)
- Safe zone: Center 70% (avoid top 10% and bottom 15% for text)
- Background: #fff (white) + 40px CSS grid + film grain + vignette
- All scenes: background: transparent (grid always visible)
- No build tools: Single self-contained HTML file
- GSAP CDN: [https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js)

