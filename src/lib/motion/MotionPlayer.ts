import type { MotionVideoSchema, MotionScene } from "./schema";
import { aspectRatioClass, getCanvasDimensions, type AspectRatio } from "./aspect-ratio";
import { runWordStackReveal } from "./word-stack-reveal";

const TRANSITION_OVERLAP_S = 0.2; // 200ms parallel in/out

export class MotionPlayer {
  private static audioUnlocked = false;
  private static muted = false;

  private schema: MotionVideoSchema;
  private container: HTMLElement;
  private tl: any;
  private audioCtx: AudioContext | null = null;
  private particleRAF: number | null = null;
  private particles: Array<{
    x: number; y: number; vx: number; vy: number; r: number; a: number;
  }> = [];

  constructor(schema: MotionVideoSchema, container: HTMLElement) {
    this.schema = schema;
    this.container = container;
  }

  static setMuted(muted: boolean): void {
    MotionPlayer.muted = muted;
  }

  static isMuted(): boolean {
    return MotionPlayer.muted;
  }

  /** Call after user gesture to satisfy browser autoplay policy */
  static async ensureAudioUnlocked(): Promise<void> {
    if (MotionPlayer.audioUnlocked) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const probe = new Ctx();
    if (probe.state === "suspended") await probe.resume();
    await probe.close();
    MotionPlayer.audioUnlocked = true;
  }

  private getAspectRatio(): AspectRatio {
    return (this.schema.aspect_ratio ?? this.schema.aspectRatio ?? "16:9") as AspectRatio;
  }

  private getDimensions() {
    return getCanvasDimensions(this.getAspectRatio());
  }

  async build(): Promise<void> {
    this.container.innerHTML = this.renderHTML();
    await this.loadGSAP();
    this.buildTimeline();
  }

  play() { this.tl?.play(); }
  pause() { this.tl?.pause(); }
  seek(t: number) { this.tl?.seek(t); }
  destroy() {
    this.tl?.kill();
    this.stopParticles();
    this.container.innerHTML = "";
  }

  // ── HTML RENDERER ───────────────────────────────────────
  private renderHTML(): string {
    const { palette, globalFont } = this.schema;
    const font = this.getFont(globalFont);
    const { width: W, height: H } = this.getDimensions();
    const arClass = aspectRatioClass(this.getAspectRatio());

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="${font.url}" rel="stylesheet">
<style>
  .sota-motion-root {
    --bg:${palette.bg};--surface:${palette.surface};--accent:${palette.accent};
    --accent2:${palette.accent2};--accent-glow:${palette.accentGlow};--text:${palette.text};
    --muted:${palette.muted};--glow:${palette.glow};--border:${palette.border};
    --card-bg:${palette.cardBg};--gradient:${palette.gradient};--font:${font.family};
    width:${W}px;height:${H}px;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--font);
    position:relative;
  }
  .sota-motion-root.aspect-9-16 .cards-wrap{flex-direction:column;align-items:center;gap:20px}
  .sota-motion-root.aspect-9-16 .card{min-width:unset;width:88%}
  .sota-motion-root.aspect-9-16 .stats-wrap{flex-direction:column;gap:40px}
  .sota-motion-root.aspect-9-16 .split-left,.sota-motion-root.aspect-9-16 .split-right{flex:unset;width:100%;padding:48px 36px;border-right:none;border-bottom:1px solid var(--border)}
  .sota-motion-root.aspect-9-16 .scene>div[style*="display:flex"][style*="width:100%"]{flex-direction:column!important}
  .sota-motion-root.aspect-1-1 .headline{font-size:clamp(40px,5.5vw,88px)}
  .sota-motion-root *{margin:0;padding:0;box-sizing:border-box}
  .scene{position:absolute;inset:0;opacity:0;display:flex;align-items:center;justify-content:center}
  .scene-first{opacity:1}
  @keyframes meshScan{0%{background-position:0 0}100%{background-position:0 44px}}
  .mesh-bg{position:absolute;inset:0;z-index:0;background-image:linear-gradient(${palette.glow.replace(")",",0.06)")} 1px,transparent 1px),linear-gradient(90deg,${palette.glow.replace(")",",0.06)")} 1px,transparent 1px);background-size:44px 44px;animation:meshScan 4s linear infinite}
  .ambient-orb{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,${palette.glow.replace(")",",0.12)")} 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);z-index:0;pointer-events:none;filter:blur(80px)}
  .vignette{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 30%,${palette.bg}f2 100%)}
  .content{position:relative;z-index:10;text-align:center;width:100%}
  .headline{font-size:clamp(56px,6.5vw,120px);font-weight:900;letter-spacing:-0.04em;line-height:1.1;color:var(--text)}
  .headline .accent{color:var(--accent);text-shadow:0 0 40px var(--glow)}
  .headline .mark{background:var(--accent);color:var(--bg);padding:0.05em 0.25em;border-radius:12px;display:inline-block;transform:rotate(-2deg);box-shadow:0 12px 32px var(--glow);line-height:1}
  .subheadline{font-size:clamp(22px,2.2vw,36px);font-weight:400;color:var(--muted);margin-top:24px;letter-spacing:0.02em}
  .cards-wrap{display:flex;gap:28px;justify-content:center;margin-top:48px;perspective:1400px;align-items:stretch}
  .card{
    background:linear-gradient(145deg,var(--card-bg) 0%,rgba(0,0,0,0.15) 100%);
    border:1px solid var(--border);
    box-shadow:0 0 0 1px rgba(255,255,255,0.06) inset,0 24px 64px rgba(0,0,0,0.35),0 0 48px var(--glow);
    border-radius:28px;padding:52px 36px;min-width:300px;flex:1;
    backdrop-filter:blur(32px) saturate(180%);
    position:relative;overflow:hidden;
    transform-style:preserve-3d;
    transition:transform 0.4s ease,box-shadow 0.4s ease;
  }
  .card::before{
    content:'';position:absolute;inset:0;border-radius:inherit;
    background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.14) 0%,transparent 65%);
    pointer-events:none;
  }
  .card::after{
    content:'';position:absolute;top:-1px;left:10%;right:10%;height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
  }
  .card-shine{position:absolute;inset:0;border-radius:inherit;background:conic-gradient(from 180deg at 50% 50%,transparent 60%,rgba(255,255,255,0.04) 100%);pointer-events:none}
  .card-icon{font-size:64px;margin-bottom:28px;filter:drop-shadow(0 0 20px var(--glow));display:block}
  .card-title{font-size:26px;font-weight:800;color:var(--text);letter-spacing:-0.03em;line-height:1.2}
  .card-desc{font-size:15px;color:var(--muted);margin-top:14px;line-height:1.65}
  .stats-wrap{display:flex;gap:80px;justify-content:center;margin-top:40px;align-items:flex-start}
  .stat-item{text-align:center;position:relative}
  .stat-item::after{content:'';position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);width:40px;height:2px;background:var(--accent);border-radius:2px;box-shadow:0 0 12px var(--glow)}
  .stat-number{font-size:clamp(72px,7.5vw,140px);font-weight:900;color:var(--accent);line-height:1;letter-spacing:-0.06em;text-shadow:0 0 60px var(--glow),0 0 120px var(--glow)}
  .stat-label{font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-top:16px;font-weight:600}
  .cta-btn{
    display:inline-block;background:var(--gradient);color:var(--bg);
    font-size:22px;font-weight:900;padding:22px 72px;
    border-radius:999px;margin-top:48px;position:relative;overflow:hidden;
    border:none;box-shadow:inset 0 2px 0 rgba(255,255,255,0.3),0 20px 48px var(--glow),0 4px 16px rgba(0,0,0,0.3);
    letter-spacing:-0.01em;
  }
  .cta-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,0.15),transparent 60%);pointer-events:none}
  .pill{display:inline-block;background:var(--card-bg);border:1px solid var(--border);border-radius:999px;padding:8px 20px;font-size:14px;font-weight:600;color:var(--accent);margin:6px}
  .terminal-wrap{
    background:rgba(10,10,15,0.85);
    border:1px solid rgba(255,255,255,0.1);
    border-radius:16px;
    padding:0;
    font-family:'JetBrains Mono',monospace;
    font-size:18px;
    color:#a9b1d6;
    text-align:left;
    min-width:600px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset;
    overflow:hidden;
    backdrop-filter:blur(40px);
  }
  .glass-panel {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 32px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
  }
  .retro-paper {
    background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.4"/%3E%3C/svg%3E'), radial-gradient(#e0d6c8, #b8a892);
    background-blend-mode: multiply;
  }
  .terminal-header {
    background:rgba(255,255,255,0.03);
    border-bottom:1px solid rgba(255,255,255,0.05);
    padding:16px 20px;
    display:flex;
    gap:8px;
  }
  .terminal-dot { width:12px; height:12px; border-radius:50%; }
  .dot-r { background:#ff5f56; }
  .dot-y { background:#ffbd2e; }
  .dot-g { background:#27c93f; }
  .terminal-body { padding:32px; }
  .terminal-line{opacity:0;margin-bottom:8px;display:flex;gap:16px;}
  .term-prompt { color:var(--accent); opacity:0.8; }
  .term-text { color:#fff; text-shadow:0 0 10px rgba(255,255,255,0.2); }
  .search-bar-wrap{
    display:flex;align-items:center;
    background:linear-gradient(135deg,var(--card-bg),rgba(0,0,0,0.2));
    border:1px solid var(--border);
    border-radius:99px;padding:14px 14px 14px 36px;
    box-shadow:0 32px 80px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06) inset,0 0 64px var(--glow);
    backdrop-filter:blur(40px) saturate(200%);
    width:860px;max-width:92%;margin:0 auto;
    position:relative;
  }
  .search-bar-wrap::before{
    content:'';position:absolute;top:-1px;left:15%;right:15%;height:1px;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
  }
  .search-icon{color:var(--accent);display:flex;align-items:center;justify-content:center;margin-right:20px;filter:drop-shadow(0 0 8px var(--glow))}
  .search-text{
    flex:1;text-align:left;color:var(--text);
    font-family:'JetBrains Mono',monospace;font-size:30px;font-weight:600;
    white-space:nowrap;overflow:hidden;
    border-right:3px solid var(--accent);padding-right:4px;
    text-shadow:0 0 20px var(--glow);
  }
  .search-btn{
    background:var(--gradient);border-radius:99px;
    padding:18px 36px;font-size:20px;font-weight:900;color:var(--bg);
    box-shadow:0 0 48px var(--glow),0 8px 24px rgba(0,0,0,0.3);
    display:flex;align-items:center;white-space:nowrap;letter-spacing:-0.01em;
    border:none;
  }
  #cursor-dot{width:10px;height:10px;background:var(--accent);border-radius:50%;position:fixed;top:0;left:0;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);mix-blend-mode:difference}
  #cursor-ring{width:48px;height:48px;border:2px solid ${palette.glow.replace(")",",0.5)")};border-radius:50%;position:fixed;top:0;left:0;pointer-events:none;z-index:9998;transform:translate(-50%,-50%)}
  canvas#particles{position:absolute;inset:0;z-index:2;pointer-events:none}
  /* text_morph */
  .morph-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow:hidden}
  .morph-word{position:absolute;font-size:clamp(80px,10vw,180px);font-weight:900;letter-spacing:-0.05em;text-align:center;width:100%;will-change:transform,opacity,filter;color:var(--accent)}
  /* split_screen */
  .split-left{flex:1;padding:80px 60px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid var(--border)}
  .split-right{flex:1;padding:80px 60px;display:flex;flex-direction:column;justify-content:center}
  .split-headline{font-size:clamp(48px,5.5vw,88px);font-weight:900;letter-spacing:-0.04em;line-height:1.05;color:var(--text)}
  .split-headline .accent{color:var(--accent);text-shadow:0 0 40px var(--glow)}
  .split-body{font-size:clamp(18px,1.8vw,28px);color:var(--muted);margin-top:28px;line-height:1.65;max-width:520px}
  /* zoom_data */
  .zoom-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .zoom-number{font-size:clamp(120px,18vw,320px);font-weight:900;letter-spacing:-0.06em;line-height:0.85;color:var(--accent);text-shadow:0 0 80px var(--glow),0 0 160px var(--glow);will-change:transform,filter}
  .zoom-label{font-size:clamp(24px,2.5vw,44px);letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin-top:32px;font-weight:600}
</style>
</head>
<body>
<div class="sota-motion-root ${arClass}">
<canvas id="particles" width="${W}" height="${H}"></canvas>
${this.schema.scenes.map((s, i) => this.renderScene(s, i)).join("\n")}
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script>
window.__motionSchema=${JSON.stringify(this.schema)};
window.__timelines=window.__timelines||{};
window.__sota_animations=${JSON.stringify(
  Object.fromEntries(
    (this.schema.customAnimations || []).map((a: { name: string; jsCode: string }) => [a.name, a.jsCode])
  )
)};
</script>
</body></html>`;
  }

  private renderScene(scene: MotionScene, index: number): string {
    const id = `scene-${scene.id}`;
    const isFirst = index === 0;
    
    // Process customColors override
    let bgStyle = this.getBgStyle(scene);
    let inlineVars = "";
    if (scene.customColors) {
      if (scene.customColors.bg) bgStyle = `background:${scene.customColors.bg}`;
      if (scene.customColors.text) inlineVars += `--text:${scene.customColors.text};`;
      if (scene.customColors.accent) inlineVars += `--accent:${scene.customColors.accent};--glow:${scene.customColors.accent}55;--accentGlow:${scene.customColors.accent}AA;`;
    }

    let inner = "";

    switch (scene.layout) {
      case "center_hero":
        inner = `<div class="content">${scene.headline ? `<div class="headline" id="${id}-headline">${this.wrapWords(scene.headline)}</div>` : ""}${scene.subheadline ? `<div class="subheadline" id="${id}-sub">${scene.subheadline}</div>` : ""}${scene.body ? `<p style="color:var(--muted);font-size:20px;margin-top:24px" id="${id}-body">${scene.body}</p>` : ""}${scene.tags ? `<div style="margin-top:32px">${scene.tags.map(t => `<span class="pill">${t}</span>`).join("")}</div>` : ""}${scene.cta ? `<button class="cta-btn" id="${id}-cta">${scene.cta}</button>` : ""}</div>`;
        break;
      case "cards_3":
      case "cards_4":
        const renderIcon = (icon: string) => {
          if (!icon) return "";
          if (icon.startsWith("http") || icon.includes(".svg") || icon.includes(".png")) {
            return `<img src="${icon}" style="width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 0 20px var(--glow))" />`;
          }
          return `<div class="card-icon">${icon}</div>`;
        };
        inner = `<div class="content" style="width:100%">${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:52px">${scene.headline}</div>` : ""}${scene.cards && scene.cards.length > 0 ? `<div class="cards-wrap">${scene.cards.map((c, ci) => `<div class="card" id="${id}-card-${ci}"><div class="card-shine"></div>${c.icon ? renderIcon(c.icon) : ""}<div class="card-title">${c.title}</div>${c.description ? `<div class="card-desc">${c.description}</div>` : ""}${c.stat ? `<div style="font-size:48px;font-weight:900;color:var(--accent);margin-top:16px">${c.stat}</div>` : ""}${c.statLabel ? `<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)">${c.statLabel}</div>` : ""}</div>`).join("")}</div>` : ""}</div>`;
        break;
      case "stats_3":
        inner = `<div class="content" style="width:100%">${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:48px">${scene.headline}</div>` : ""}${scene.stats && scene.stats.length > 0 ? `<div class="stats-wrap">${scene.stats.map((s, si) => `<div class="stat-item" id="${id}-stat-${si}"><div class="stat-number" id="${id}-num-${si}">${s.prefix || ""}0${s.suffix || ""}</div><div class="stat-label">${s.label}</div></div>`).join("")}</div>` : ""}</div>`;
        break;
      case "terminal":
        inner = `<div class="content">${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:48px;margin-bottom:32px">${scene.headline}</div>` : ""}${scene.terminalLines && scene.terminalLines.length > 0 ? `<div class="terminal-wrap" id="${id}-terminal"><div class="terminal-header"><div class="terminal-dot dot-r"></div><div class="terminal-dot dot-y"></div><div class="terminal-dot dot-g"></div></div><div class="terminal-body">${scene.terminalLines.map((l, li) => `<div class="terminal-line" id="${id}-tl-${li}"><span class="term-prompt">~</span><span class="term-text">${l}</span></div>`).join("")}</div></div>` : ""}</div>`;
        break;
      case "split_horizontal":
        inner = `<div style="display:flex;align-items:center;width:100%;height:100%"><div style="flex:1;padding:80px;border-right:1px solid var(--border)">${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:clamp(64px, 7vw, 90px);line-height:1.05;text-align:left">${this.wrapWords(scene.headline)}</div>` : ""}${scene.body ? `<p style="color:var(--muted);font-size:24px;line-height:1.6;margin-top:32px;text-align:left" id="${id}-body">${scene.body}</p>` : ""}</div><div style="flex:1;padding:80px;display:flex;align-items:center;justify-content:center">${scene.subheadline ? `<div style="font-size:clamp(60px, 8vw, 130px);font-weight:900;color:var(--accent);text-align:center;line-height:1.1;word-break:break-word;text-shadow:0 0 60px var(--glow)" id="${id}-right">${scene.subheadline}</div>` : ""}</div></div>`;
        break;
      case "search_bar":
        inner = `<div class="content" style="width:100%">${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:64px;margin-bottom:48px">${this.wrapWords(scene.headline)}</div>` : ""}<div class="search-bar-wrap" id="${id}-search"><div class="search-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div><div class="search-text" id="${id}-search-text"></div><div class="search-btn">Generate ✨</div></div>${scene.subheadline ? `<div class="subheadline" id="${id}-sub" style="margin-top:40px">${scene.subheadline}</div>` : ""}</div>`;
        break;

      case "title_card":
        inner = `<div class="content" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);">
  ${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:160px;line-height:0.9;text-transform:uppercase;font-weight:900;letter-spacing:-0.04em;">${this.wrapWords(scene.headline)}</div>` : ""}
  ${scene.subheadline ? `<div class="subheadline" id="${id}-sub" style="margin-top:40px;font-size:32px;letter-spacing:0.2em;color:var(--accent);">${scene.subheadline}</div>` : ""}
</div>`;
        break;

      case "lower_third":
        inner = `<div style="position:absolute;bottom:80px;left:80px;display:flex;flex-direction:column;align-items:flex-start;max-width:800px;text-align:left;" id="${id}-lt-container">
  <div class="glass-panel" style="padding:40px 60px;border-radius:24px;border-left:8px solid var(--accent);">
    ${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:64px;margin-bottom:16px;">${this.wrapWords(scene.headline)}</div>` : ""}
    ${scene.subheadline ? `<div style="font-size:28px;color:var(--accent2);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;" id="${id}-sub">${scene.subheadline}</div>` : ""}
    ${scene.body ? `<div style="font-size:22px;color:var(--muted);margin-top:20px;line-height:1.5;" id="${id}-body">${scene.body}</div>` : ""}
  </div>
</div>`;
        break;

      case "callout_card":
        inner = `<div style="width:100%;height:100%;position:relative;">
  <div style="position:absolute;top:30%;left:25%;width:12px;height:12px;background:var(--accent);border-radius:50%;box-shadow:0 0 20px var(--accentGlow);" id="${id}-dot"></div>
  <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" id="${id}-line-svg">
    <path id="${id}-line" d="M 490 324 L 750 200 L 900 200" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="1000" stroke-dashoffset="1000" />
  </svg>
  <div class="glass-panel" style="position:absolute;top:150px;left:920px;padding:40px;border-radius:20px;max-width:500px;text-align:left;opacity:0;transform:translateX(40px);" id="${id}-card">
    ${scene.subheadline ? `<div style="color:var(--accent);font-weight:700;font-size:20px;letter-spacing:0.1em;margin-bottom:12px;">${scene.subheadline}</div>` : ""}
    ${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:48px;line-height:1.1;margin-bottom:16px;">${this.wrapWords(scene.headline)}</div>` : ""}
    ${scene.body ? `<div style="color:var(--muted);font-size:20px;line-height:1.5;">${scene.body}</div>` : ""}
  </div>
</div>`;
        break;

      case "popup_social":
        inner = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
  <div class="glass-panel" style="width:540px;border-radius:32px;overflow:hidden;box-shadow:0 60px 100px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.1) inset;" id="${id}-popup">
    <div style="background:rgba(255,255,255,0.03);padding:24px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:16px;">
      <div style="width:48px;height:48px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
      <div class="headline" style="font-size:28px;" id="${id}-headline">${scene.headline || "Notification"}</div>
    </div>
    <div style="padding:40px;">
      ${scene.body ? `<div style="color:var(--muted);font-size:22px;line-height:1.5;margin-bottom:32px;" id="${id}-body">${scene.body}</div>` : ""}
      ${scene.cta ? `<button class="cta-btn" style="width:100%;font-size:24px;padding:20px;" id="${id}-cta">${scene.cta}</button>` : ""}
    </div>
  </div>
</div>`;
        break;

      case "bento_grid":
        inner = `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px;">
  ${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:80px;margin-bottom:60px;">${this.wrapWords(scene.headline)}</div>` : ""}
  <div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:32px;width:100%;height:600px;" id="${id}-bento">
    ${(scene.cards || []).slice(0,3).map((c, ci) => `
      <div class="glass-panel" style="padding:48px;border-radius:40px;display:flex;flex-direction:column;justify-content:${ci === 0 ? 'flex-end' : 'center'};${ci === 0 ? 'grid-row:span 2;' : ''}" id="${id}-bento-${ci}">
        ${c.icon ? `<div style="font-size:64px;margin-bottom:24px;">${c.icon}</div>` : ""}
        ${c.title ? `<div style="font-size:40px;font-weight:700;margin-bottom:16px;">${c.title}</div>` : ""}
        ${c.description ? `<div style="font-size:20px;color:var(--muted);line-height:1.5;">${c.description}</div>` : ""}
        ${c.stat ? `<div style="font-size:72px;font-weight:900;color:var(--accent);margin-top:auto;">${c.stat}</div>` : ""}
      </div>
    `).join("")}
  </div>
</div>`;
        break;

      case "retro_paper":
        inner = `<div style="width:100%;height:100%;position:relative;background:var(--bg);">
  <div class="retro-paper" style="position:absolute;inset:0;opacity:0.8;mix-blend-mode:overlay;pointer-events:none;"></div>
  <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:2;">
    ${scene.headline ? `<div class="headline" id="${id}-headline" style="font-size:140px;font-family:'Times New Roman',serif;font-weight:bold;letter-spacing:-0.02em;color:var(--text);text-transform:uppercase;filter:contrast(150%);">${this.wrapWords(scene.headline)}</div>` : ""}
    ${scene.body ? `<div style="font-size:32px;color:var(--muted);margin-top:40px;max-width:800px;text-align:center;font-family:'Courier New',monospace;border-top:2px solid var(--accent);border-bottom:2px solid var(--accent);padding:20px 0;" id="${id}-body">${scene.body}</div>` : ""}
  </div>
</div>`;
        break;

      case "kinetic_push": {
        const kWords = scene.kineticWords || (scene.headline ? scene.headline.replace(/<[^>]+>/g,"").split(" ") : ["Motion","Design","Studio"]);
        const kColors = scene.kineticColors || [this.schema.palette.accent, this.schema.palette.text, this.schema.palette.accent2];
        inner = `<div id="${id}-kinetic" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
  <div id="${id}-kinetic-stage" style="position:relative;width:100%;text-align:center;height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;"></div>
  ${scene.subheadline ? `<div id="${id}-sub" style="position:absolute;bottom:80px;color:var(--muted);font-size:28px;letter-spacing:0.1em;">${scene.subheadline}</div>` : ""}
</div>
<script id="${id}-kinetic-data" type="application/json">${JSON.stringify({words:kWords,colors:kColors,wordDurationMs:scene.kineticWordDurationMs||700,exitDurationMs:scene.kineticExitDurationMs||400,staggerMs:60})}</script>`;
        break;
      }

      case "center_push_stack":
      case "word_stack_reveal": {
        const stackWords =
          scene.stackWords ??
          (scene.pushStackText || scene.headline?.replace(/<[^>]+>/g, "") || "Motion Video Studio").split(/\s+/);
        const wordInterval =
          scene.wordIntervalMs ??
          scene.word_interval_ms ??
          scene.pushStackInterval ??
          220;
        inner = `<div id="${id}-stack" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;">
  <div id="${id}-stack-stage" style="position:relative;text-align:center;width:100%;min-height:320px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:40px;"></div>
  ${scene.subheadline ? `<div id="${id}-sub" style="margin-top:24px;color:var(--muted);font-size:26px;letter-spacing:0.08em;">${scene.subheadline}</div>` : ""}
</div>
<script id="${id}-stack-data" type="application/json">${JSON.stringify({ words: stackWords, wordIntervalMs: wordInterval })}</script>`;
        break;
      }

      case "text_morph": {
        const pairs = scene.morphPairs || [["Fast","Smart"],["Bold","Clean"]];
        inner = `<div class="morph-stage" id="${id}-morph">
  <div id="${id}-morph-a" class="morph-word" style="transform:translateY(0);opacity:1;filter:blur(0px);"></div>
  <div id="${id}-morph-b" class="morph-word" style="transform:translateY(60px);opacity:0;filter:blur(20px);"></div>
  ${scene.subheadline ? `<div style="position:absolute;bottom:120px;font-size:28px;color:var(--muted);letter-spacing:0.08em;font-weight:500;">${scene.subheadline}</div>` : ""}
</div>
<script id="${id}-morph-data" type="application/json">${JSON.stringify({pairs,intervalMs:scene.morphInterval||2000})}</script>`;
        break;
      }

      case "split_screen": {
        inner = `<div style="display:flex;width:100%;height:100%;">
  <div class="split-left" id="${id}-left">
    ${scene.leftHeadline ? `<div class="split-headline" id="${id}-lh">${this.wrapWords(scene.leftHeadline)}</div>` : ""}
    ${scene.leftBody ? `<div class="split-body" id="${id}-lb">${scene.leftBody}</div>` : ""}
  </div>
  <div class="split-right" id="${id}-right">
    ${scene.rightHeadline ? `<div class="split-headline" id="${id}-rh" style="color:var(--accent);text-shadow:0 0 40px var(--glow)">${this.wrapWords(scene.rightHeadline)}</div>` : ""}
    ${scene.rightBody ? `<div class="split-body" id="${id}-rb">${scene.rightBody}</div>` : ""}
  </div>
</div>`;
        break;
      }

      case "zoom_data": {
        const zPre = scene.zoomPrefix || "";
        const zSuf = scene.zoomSuffix || "";
        const zLabel = scene.zoomLabel || "";
        inner = `<div class="zoom-stage">
  <div id="${id}-zoom-num" class="zoom-number" style="opacity:0;filter:blur(32px);transform:scale(2.8);">${zPre}<span id="${id}-zoom-val">0</span>${zSuf}</div>
  ${zLabel ? `<div id="${id}-zoom-label" class="zoom-label" style="opacity:0;transform:translateY(20px)">${zLabel}</div>` : ""}
  ${scene.subheadline ? `<div style="margin-top:40px;font-size:26px;color:var(--muted);letter-spacing:0.06em;opacity:0;transform:translateY(16px)" id="${id}-sub">${scene.subheadline}</div>` : ""}
</div>`;
        break;
      }

      default:
        inner = `<div class="content">${scene.headline ? `<div class="headline" id="${id}-headline">${this.wrapWords(scene.headline)}</div>` : ""}${scene.subheadline ? `<div class="subheadline" id="${id}-sub">${scene.subheadline}</div>` : ""}</div>`;
    }

    return `<div class="scene ${isFirst ? "scene-first" : ""}" id="${id}" style="${bgStyle};${inlineVars}">
  ${scene.bgMesh !== false ? `<div class="mesh-bg"></div><div class="ambient-orb" id="${id}-orb"></div>` : ""}<div class="vignette"></div>${inner}
</div>`;
  }

  // ── TIMELINE BUILDER ──────────────────────────────────
  private buildTimeline(): void {
    const gsap = (window as any).gsap;
    if (!gsap) return;
    this.tl = gsap.timeline({ paused: true });
    (window as any).__timelines = (window as any).__timelines || {};
    (window as any).__timelines["sota-video"] = this.tl;

    const { scenes } = this.schema;
    scenes.forEach((scene, i) => {
      const id = `scene-${scene.id}`;
      const t = scene.startTime;
      const prev = scenes[i - 1];

      // Transition from previous scene (200ms overlap, schema-driven)
      if (prev) {
        const transitionOut = scene.transition_out ?? scene.transition ?? "fade";
        const transitionIn = scene.transition_in ?? scene.transition ?? "fade";
        this.applySceneTransition(
          `#scene-${prev.id}`,
          `#${id}`,
          transitionOut,
          transitionIn,
          t,
        );
      }

      // Sound on enter — 50ms BEFORE scene entry animations
      if (scene.soundOnEnter && scene.soundOnEnter !== "none") {
        this.tl.add(() => this.playSound(scene.soundOnEnter!), t - 0.05);
      }

      // Screen shake
      if (scene.screenShake) this.addScreenShake(t);
      if (scene.impactFlash) this.addImpactFlash(t);

      // Camera move
      if (scene.cameraMove && scene.cameraMove !== "none") {
        this.addCameraMove(`#${id}`, scene.cameraMove, t, scene.duration);
      }

      // Ambient orb
      const orb = document.querySelector(`#${id}-orb`);
      if (orb) {
        this.tl.fromTo(orb, { scale: 0.8, opacity: 0 }, { scale: 1.2, opacity: 1, duration: 2, ease: "power2.out" }, t);
        this.tl.to(orb, { x: 120, y: -60, scale: 1.5, duration: scene.duration, ease: "sine.inOut" }, t);
      }

      // Headline animation
      const headline = document.querySelector(`#${id}-headline`);
      if (headline) {
        // Query .word elements directly (not .word span)
        const words = headline.querySelectorAll(".word");
        if (scene.soundOnHeadline && scene.soundOnHeadline !== "none") {
          this.tl.add(() => this.playSound(scene.soundOnHeadline!), t + 0.15);
        }
        if (words.length > 0) {
          this.animateText(words, scene.headlineAnimation || "slam_drop", t + 0.2, gsap);
        } else {
          // Fallback: animate the headline element itself
          this.tl.fromTo(headline, { y: 60, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, t + 0.2);
        }
        if (scene.particleBurst) {
          this.tl.add(() => {
            const rect = headline.getBoundingClientRect();
            this.particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
          }, t + 0.7);
        }
      }

      // Body & sub
      const body = document.querySelector(`#${id}-body`);
      if (body) this.tl.fromTo(body, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, t + 0.6);
      const sub = document.querySelector(`#${id}-sub`);
      if (sub) this.tl.fromTo(sub, { opacity: 0, letterSpacing: "0.3em" }, { opacity: 1, letterSpacing: "0.05em", duration: 0.8, ease: "expo.out" }, t + 0.7);

      // Cards
      scene.cards?.forEach((_, ci) => {
        const card = document.querySelector(`#${id}-card-${ci}`);
        if (card) {
          this.tl.fromTo(card, { y: 60, opacity: 0, scale: 0.92, rotationX: 15 }, { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 0.7, ease: "back.out(1.4)", transformPerspective: 800 }, t + 0.3 + ci * 0.12);
          this.addCardTilt(card as HTMLElement);
          gsap.to(card, { boxShadow: `0 0 0 1px ${this.schema.palette.border}, 0 0 28px ${this.schema.palette.glow}`, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: ci * 0.3 });
        }
      });

      // Stats
      scene.stats?.forEach((stat, si) => {
        const numEl = document.querySelector(`#${id}-num-${si}`);
        const statEl = document.querySelector(`#${id}-stat-${si}`);
        if (numEl && statEl) {
          this.tl.fromTo(statEl, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, t + 0.2 + si * 0.15);
          const numericValue = typeof stat.value === "string" ? parseFloat(stat.value) : stat.value;
          const finalValue = isNaN(numericValue) ? 0 : numericValue;
          const obj = { val: 0 };
          this.tl.to(obj, { val: finalValue, duration: 1.8, ease: "expo.out", onUpdate: () => { numEl.textContent = `${stat.prefix || ""}${Math.round(obj.val).toLocaleString()}${stat.suffix || ""}`; } }, t + 0.4 + si * 0.15);
        }
      });

      // Terminal
      scene.terminalLines?.forEach((_, li) => {
        const line = document.querySelector(`#${id}-tl-${li}`);
        if (line) this.tl.to(line, { opacity: 1, duration: 0.1 }, t + 0.5 + li * 0.3);
      });

      // Search Bar
      if (scene.layout === "search_bar") {
        const searchBox = document.querySelector(`#${id}-search`);
        const searchText = document.querySelector(`#${id}-search-text`);
        if (searchBox && searchText) {
          this.tl.fromTo(searchBox, { y: 60, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, t + 0.3);
          const q = scene.searchQuery || "How to optimize SEO?";
          const obj = { p: 0 };
          this.tl.to(obj, { p: 1, duration: q.length * 0.04, ease: "none", onUpdate: () => {
            searchText.textContent = q.substring(0, Math.floor(obj.p * q.length));
          }}, t + 0.8);
          this.tl.to(searchText, { borderRightColor: "transparent", duration: 0.1, repeat: -1, yoyo: true }, t + 0.8 + q.length * 0.04);
          if (scene.soundOnHeadline && scene.soundOnHeadline !== "none") {
            for (let k = 0; k < q.length; k += 2) {
               this.tl.add(() => this.playSound("soft_click"), t + 0.8 + k * 0.04);
            }
          }
        }
      }

      // Title Card Subheadline
      if (scene.layout === "title_card" && sub) {
        this.tl.fromTo(sub, { opacity: 0, y: 40, letterSpacing: "0.5em" }, { opacity: 1, y: 0, letterSpacing: "0.2em", duration: 1, ease: "expo.out" }, t + 0.8);
      }

      // Lower Third
      const ltContainer = document.querySelector(`#${id}-lt-container`);
      if (ltContainer) {
        this.tl.fromTo(ltContainer, { y: 100, opacity: 0, clipPath: "inset(100% 0 0 0)" }, { y: 0, opacity: 1, clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "power3.out" }, t + 0.3);
      }

      // Callout Card
      const calloutDot = document.querySelector(`#${id}-dot`);
      const calloutLine = document.querySelector(`#${id}-line`);
      const calloutCard = document.querySelector(`#${id}-card`);
      if (calloutDot && calloutLine && calloutCard) {
        this.tl.fromTo(calloutDot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }, t + 0.2);
        this.tl.to(calloutLine, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, t + 0.5);
        this.tl.to(calloutCard, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out" }, t + 1.0);
      }

      // Popup Social
      const popup = document.querySelector(`#${id}-popup`);
      if (popup) {
        this.tl.fromTo(popup, { y: 150, scale: 0.8, opacity: 0, rotationX: 20 }, { y: 0, scale: 1, opacity: 1, rotationX: 0, duration: 0.8, ease: "back.out(1.2)", transformPerspective: 1000 }, t + 0.2);
      }

      // Bento Grid
      const bento = document.querySelector(`#${id}-bento`);
      if (bento) {
        scene.cards?.forEach((_, ci) => {
          const bCard = document.querySelector(`#${id}-bento-${ci}`);
          if (bCard) {
            this.tl.fromTo(bCard, { scale: 0.8, opacity: 0, y: 40 }, { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.2)" }, t + 0.3 + ci * 0.15);
            gsap.to(bCard, { boxShadow: `0 0 0 1px ${this.schema.palette.border}, 0 20px 40px rgba(0,0,0,0.4)`, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: ci * 0.2 });
          }
        });
      }

      // CTA
      const cta = document.querySelector(`#${id}-cta`);
      if (cta) {
        this.tl.fromTo(cta, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }, t + 0.8);
        gsap.to(cta, { boxShadow: `0 0 0 2px ${this.schema.palette.accent}, 0 0 48px ${this.schema.palette.glow}`, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
        this.addButtonRipple(cta as HTMLElement);
      }

      // kinetic_push rAF loop
      if (scene.layout === "kinetic_push") {
        this.tl.add(() => {
          const stage = document.getElementById(`${id}-kinetic-stage`);
          const dataEl = document.getElementById(`${id}-kinetic-data`);
          if (!stage || !dataEl || dataEl.dataset.init) return;
          dataEl.dataset.init = "true";
          const cfg = JSON.parse(dataEl.textContent || "{}");
          const { words, colors, wordDurationMs, exitDurationMs, staggerMs } = cfg;
          let wordIndex = 0;
          const wordEls: HTMLElement[] = [];

          const getFontSize = (w: string) => {
            const l = w.length;
            if (l <= 4) return "72px";
            if (l <= 6) return "56px";
            if (l <= 9) return "44px";
            return "34px";
          };

          const spring = "cubic-bezier(0.34,1.56,0.64,1)";
          const sharpExit = "cubic-bezier(0.55,0,1,0.45)";

          const showNext = () => {
            const word = words[wordIndex % words.length];
            const color = colors[wordIndex % colors.length];
            const el = document.createElement("div");
            el.style.cssText = `position:absolute;width:100%;text-align:center;font-size:${getFontSize(word)};font-weight:900;color:${color};transform:translateY(80px) scale(0.7);opacity:0;transition:transform ${wordDurationMs}ms ${spring}, opacity ${wordDurationMs * 0.6}ms ease, scale ${wordDurationMs}ms ${spring};letter-spacing:-0.04em;text-shadow:0 0 40px ${color}88;`;
            el.textContent = word;
            stage.appendChild(el);
            wordEls.push(el);

            // Push back previous words
            for (let pi = 0; pi < wordEls.length - 1; pi++) {
              const prev = wordEls[pi];
              const dist = wordEls.length - 1 - pi;
              const delay = dist * staggerMs;
              setTimeout(() => {
                prev.style.transition = `transform ${exitDurationMs}ms ${sharpExit}, opacity ${exitDurationMs}ms ${sharpExit}, scale ${exitDurationMs}ms ${sharpExit}`;
                prev.style.transform = "translateY(-28%) scale(0.72)";
                prev.style.opacity = "0";
              }, delay);
              setTimeout(() => { if (prev.parentNode) prev.parentNode.removeChild(prev); }, delay + exitDurationMs + 50);
            }

            // Trigger enter
            requestAnimationFrame(() => requestAnimationFrame(() => {
              el.style.transform = "translateY(0) scale(1)";
              el.style.opacity = "1";
            }));

            wordIndex++;
          };

          showNext();
          const interval = setInterval(showNext, wordDurationMs + exitDurationMs * 0.5);
          // Stop after scene ends
          setTimeout(() => { clearInterval(interval); }, scene.duration * 1000 - 100);
        }, t + 0.2);
      }

      // word_stack_reveal / center_push_stack — spec-compliant engine
      if (scene.layout === "center_push_stack" || scene.layout === "word_stack_reveal") {
        this.tl.add(() => {
          const stage = document.getElementById(`${id}-stack-stage`);
          const dataEl = document.getElementById(`${id}-stack-data`);
          if (!stage || !dataEl || dataEl.dataset.init) return;
          dataEl.dataset.init = "true";
          const cfg = JSON.parse(dataEl.textContent || "{}") as {
            words: string[];
            wordIntervalMs: number;
          };
          const wordIntervalMs =
            scene.wordIntervalMs ??
            scene.word_interval_ms ??
            cfg.wordIntervalMs ??
            220;
          const words =
            cfg.words ??
            scene.stackWords ??
            (scene.pushStackText || "").split(/\s+/).filter(Boolean);

          runWordStackReveal({
            stage,
            words,
            wordIntervalMs,
            sceneDurationMs: scene.duration * 1000,
            onWordEnter: () => this.playSound("soft_click"),
          });
        }, t + 0.1);
      }

      // text_morph animation
      if (scene.layout === "text_morph") {
        this.tl.add(() => {
          const elA = document.getElementById(`${id}-morph-a`);
          const elB = document.getElementById(`${id}-morph-b`);
          const dataEl = document.getElementById(`${id}-morph-data`);
          if (!elA || !elB || !dataEl || dataEl.dataset.init) return;
          dataEl.dataset.init = "true";
          const { pairs, intervalMs } = JSON.parse(dataEl.textContent || "{}");
          const appleEase = "cubic-bezier(0.16,1,0.3,1)";
          const sharpEase = "cubic-bezier(0.55,0,1,0.45)";
          let idx = 0;
          const showPair = (first: boolean) => {
            const pair = pairs[idx % pairs.length];
            const active = first ? elA : (idx % 2 === 0 ? elA : elB);
            const incoming = first ? elA : (idx % 2 === 0 ? elB : elA);
            const outgoing = first ? null : (idx % 2 === 0 ? elA : elB);
            
            // Hide outgoing word
            if (outgoing) {
              outgoing.style.transition = `transform ${intervalMs * 0.4}ms ${sharpEase}, opacity ${intervalMs * 0.4}ms ${sharpEase}, filter ${intervalMs * 0.4}ms ${sharpEase}`;
              outgoing.style.transform = "translateY(60px)";
              outgoing.style.opacity = "0";
              outgoing.style.filter = "blur(20px)";
            }
            
            // Set incoming word
            incoming.textContent = pair[0];
            incoming.style.transition = `transform ${intervalMs * 0.5}ms ${appleEase}, opacity ${intervalMs * 0.5}ms ${appleEase}, filter ${intervalMs * 0.5}ms ${appleEase}`;
            incoming.style.transform = "translateY(0)";
            incoming.style.opacity = "1";
            incoming.style.filter = "blur(0px)";
            // Morph to pair[1] mid-interval
            setTimeout(() => {
              incoming.textContent = pair[1];
              incoming.style.transition = `transform ${intervalMs * 0.35}ms ${sharpEase}, opacity ${intervalMs * 0.35}ms ${sharpEase}, filter ${intervalMs * 0.35}ms ${sharpEase}`;
              incoming.style.transform = "translateY(-20px)";
              incoming.style.opacity = "0.7";
              incoming.style.filter = "blur(4px)";
              setTimeout(() => {
                incoming.textContent = pair[1];
                incoming.style.transition = `transform ${intervalMs * 0.3}ms ${appleEase}, opacity ${intervalMs * 0.3}ms ${appleEase}, filter ${intervalMs * 0.3}ms ${appleEase}`;
                incoming.style.transform = "translateY(0)";
                incoming.style.opacity = "1";
                incoming.style.filter = "blur(0px)";
              }, intervalMs * 0.35);
            }, intervalMs * 0.55);
            idx++;
          };
          // init
          elA.style.transition = "none";
          elB.style.transition = "none";
          elA.style.transform = "translateY(0)"; elA.style.opacity = "1"; elA.style.filter = "blur(0px)";
          elB.style.transform = "translateY(60px)"; elB.style.opacity = "0"; elB.style.filter = "blur(20px)";
          showPair(true);
          const iv = setInterval(() => showPair(false), intervalMs);
          setTimeout(() => clearInterval(iv), scene.duration * 1000 - 100);
        }, t + 0.1);
      }

      // split_screen animation
      if (scene.layout === "split_screen") {
        const apple = "cubic-bezier(0.16,1,0.3,1)";
        const lhEl = `#${id}-lh`;
        const lbEl = `#${id}-lb`;
        const rhEl = `#${id}-rh`;
        const rbEl = `#${id}-rb`;
        const lhWords = document.querySelectorAll(`${lhEl} .word`);
        const rhWords = document.querySelectorAll(`${rhEl} .word`);
        // Left side: slide in from left
        this.tl.fromTo(`#${id}-left`, { x: -120, opacity: 0, filter: "blur(16px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: apple }, t + 0.1);
        // Right side: slide in from right
        this.tl.fromTo(`#${id}-right`, { x: 120, opacity: 0, filter: "blur(16px)" }, { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: apple }, t + 0.25);
        // Body text fades in after
        if (document.getElementById(`${id}-lb`)) {
          this.tl.fromTo(lbEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: apple }, t + 0.65);
        }
        if (document.getElementById(`${id}-rb`)) {
          this.tl.fromTo(rbEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: apple }, t + 0.8);
        }
      }

      // zoom_data animation
      if (scene.layout === "zoom_data") {
        const apple = "cubic-bezier(0.16,1,0.3,1)";
        const numEl = document.getElementById(`${id}-zoom-num`);
        const labelEl = document.getElementById(`${id}-zoom-label`);
        const subEl = document.getElementById(`${id}-sub`);
        // Big number zooms in from huge scale
        this.tl.to(`#${id}-zoom-num`, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.2, ease: apple }, t + 0.1);
        if (labelEl) {
          this.tl.to(`#${id}-zoom-label`, { opacity: 1, y: 0, duration: 0.7, ease: apple }, t + 0.9);
        }
        if (subEl) {
          this.tl.to(`#${id}-sub`, { opacity: 1, y: 0, duration: 0.6, ease: apple }, t + 1.1);
        }
        // Sound sync: play soft tick when number appears
        this.tl.add(() => this.playSound("soft_click"), t + 0.2);
      }

      // Particles
      if (scene.bgParticles && scene.bgParticles !== "none") {
        this.tl.add(() => this.startParticles(scene.bgParticles!), t);
        this.tl.add(() => this.stopParticles(), t + scene.duration - 0.5);
      }
    });

    // Guarantee the timeline lasts exactly 30 seconds
    this.tl.set({}, {}, 30);
  }

  // ── TRANSITIONS ───────────────────────────────────────
  private applySceneTransition(
    from: string,
    to: string,
    outType: string,
    inType: string,
    t: number,
  ): void {
    const overlap = TRANSITION_OVERLAP_S;
    this.applyTransitionHalf(from, outType, t, "out", overlap);
    this.applyTransitionHalf(to, inType, t, "in", overlap);
  }

  private applyTransitionHalf(
    selector: string,
    type: string,
    t: number,
    direction: "in" | "out",
    overlap: number,
  ): void {
    const apple = "cubic-bezier(0.16, 1, 0.3, 1)";
    const bounce = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const sharp = "cubic-bezier(0.55, 0, 1, 0.45)";
    const smooth = "cubic-bezier(0.22, 1, 0.36, 1)";
    const start = t - overlap;

    const core: Record<string, () => void> = {
      fade: () => {
        if (direction === "out") {
          this.tl.to(selector, { opacity: 0, duration: overlap, ease: sharp }, start);
        } else {
          this.tl.fromTo(selector, { opacity: 0 }, { opacity: 1, duration: overlap + 0.1, ease: smooth }, start);
        }
      },
      slide_up: () => {
        if (direction === "out") {
          this.tl.to(selector, { y: "-40%", opacity: 0, filter: "blur(6px)", duration: overlap, ease: sharp }, start);
        } else {
          this.tl.fromTo(selector, { y: "40%", opacity: 0, filter: "blur(6px)" }, { y: "0%", opacity: 1, filter: "blur(0px)", duration: overlap + 0.12, ease: apple }, start);
        }
      },
      scale_punch: () => {
        if (direction === "out") {
          this.tl.to(selector, { scale: 0.88, opacity: 0, filter: "blur(10px)", duration: overlap, ease: sharp }, start);
        } else {
          this.tl.fromTo(selector, { scale: 1.18, opacity: 0, filter: "blur(12px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: overlap + 0.15, ease: bounce }, start);
        }
      },
      blur_dissolve: () => {
        if (direction === "out") {
          this.tl.to(selector, { opacity: 0, filter: "blur(24px)", duration: overlap, ease: sharp }, start);
        } else {
          this.tl.fromTo(selector, { opacity: 0, filter: "blur(24px)" }, { opacity: 1, filter: "blur(0px)", duration: overlap + 0.15, ease: smooth }, start);
        }
      },
      clip_wipe: () => {
        if (direction === "out") {
          this.tl.to(selector, { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", duration: overlap, ease: apple }, start);
        } else {
          this.tl.fromTo(selector, { clipPath: "polygon(0 0,0 0,0 100%,0 100%)", opacity: 1 }, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1, duration: overlap + 0.12, ease: apple }, start);
        }
      },
    };

    core[type]?.();
  }

  private applyTransition(from: string, to: string, type: string, t: number): void {
    this.applySceneTransition(from, to, type, type, t);
  }

  private applyTransitionLegacy(from: string, to: string, type: string, t: number): void {
    const apple  = "cubic-bezier(0.16, 1, 0.3, 1)";
    const bounce = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const sharp  = "cubic-bezier(0.55, 0, 1, 0.45)";
    const smooth = "cubic-bezier(0.22, 1, 0.36, 1)";
    const transitions: Record<string, () => void> = {
      circle_sweep: () => {
        this.tl.to(from, { filter: "blur(12px)", duration: 0.3, ease: sharp }, t - 0.2);
        this.tl.fromTo(to, { clipPath: "circle(0% at 50% 50%)", opacity: 1 }, { clipPath: "circle(150% at 50% 50%)", opacity: 1, duration: 0.8, ease: apple }, t - 0.1);
      },
      rapid_cut: () => {
        this.tl.set(from, { opacity: 0 }, t);
        this.tl.fromTo(to, { opacity: 1, scale: 1.15, filter: "blur(8px)" }, { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.4, ease: "power4.out" }, t);
      },
      shape_morph: () => {
        this.tl.to(from, { x: -100, opacity: 0, duration: 0.5, ease: sharp }, t - 0.3);
        this.tl.fromTo(to, { clipPath: "polygon(0 0, 0 0, -20% 100%, -20% 100%)", opacity: 1 }, { clipPath: "polygon(0 0, 120% 0, 100% 100%, -20% 100%)", opacity: 1, duration: 0.7, ease: apple }, t - 0.2);
      },
      fade: () => {
        this.tl.to(from, { opacity: 0, duration: 0.35, ease: sharp }, t - 0.25);
        this.tl.fromTo(to, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: smooth }, t);
      },
      wipe_right: () => {
        this.tl.to(from, { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", duration: 0.55, ease: apple }, t - 0.4);
        this.tl.fromTo(to, { clipPath: "polygon(0 0,0 0,0 100%,0 100%)", opacity: 1 }, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1, duration: 0.55, ease: apple }, t - 0.2);
      },
      wipe_left: () => {
        this.tl.to(from, { clipPath: "polygon(0 0,0 0,0 100%,0 100%)", duration: 0.55, ease: apple }, t - 0.4);
        this.tl.fromTo(to, { clipPath: "polygon(100% 0,100% 0,100% 100%,100% 100%)", opacity: 1 }, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", opacity: 1, duration: 0.55, ease: apple }, t - 0.2);
      },
      depth_push: () => {
        this.tl.to(from, { z: -600, scale: 0.6, opacity: 0, filter: "blur(14px)", duration: 0.55, ease: sharp }, t - 0.45);
        this.tl.fromTo(to, { z: 400, scale: 1.15, opacity: 0, filter: "blur(18px)" }, { z: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.65, ease: apple }, t - 0.15);
      },
      zoom_blur: () => {
        this.tl.to(from, { scale: 1.45, filter: "blur(32px)", opacity: 0, duration: 0.45, ease: sharp }, t - 0.35);
        this.tl.fromTo(to, { scale: 0.72, filter: "blur(32px)", opacity: 0 }, { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.65, ease: apple }, t);
      },
      chromatic_split: () => {
        this.tl.to(from, { opacity: 0, x: 48, filter: "blur(10px) hue-rotate(90deg)", duration: 0.3, ease: sharp }, t - 0.25);
        this.tl.fromTo(to, { opacity: 0, x: -48, filter: "blur(10px) hue-rotate(-90deg)" }, { opacity: 1, x: 0, filter: "blur(0px) hue-rotate(0deg)", duration: 0.5, ease: apple }, t);
      },
      slide_up: () => {
        this.tl.to(from, { y: "-55%", opacity: 0, filter: "blur(8px)", duration: 0.42, ease: sharp }, t - 0.32);
        this.tl.fromTo(to, { y: "55%", opacity: 0, filter: "blur(8px)" }, { y: "0%", opacity: 1, filter: "blur(0px)", duration: 0.58, ease: apple }, t);
      },
      slide_down: () => {
        this.tl.to(from, { y: "55%", opacity: 0, filter: "blur(8px)", duration: 0.42, ease: sharp }, t - 0.32);
        this.tl.fromTo(to, { y: "-55%", opacity: 0, filter: "blur(8px)" }, { y: "0%", opacity: 1, filter: "blur(0px)", duration: 0.58, ease: apple }, t);
      },
      scale_out: () => {
        this.tl.to(from, { scale: 0.65, opacity: 0, filter: "blur(14px)", duration: 0.42, ease: sharp }, t - 0.32);
        this.tl.fromTo(to, { scale: 1.35, opacity: 0, filter: "blur(14px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.58, ease: bounce }, t);
      },
      rotate_out: () => {
        this.tl.to(from, { rotationY: 90, opacity: 0, filter: "blur(10px)", transformPerspective: 1200, duration: 0.45, ease: sharp }, t - 0.35);
        this.tl.fromTo(to, { rotationY: -90, opacity: 0, filter: "blur(10px)", transformPerspective: 1200 }, { rotationY: 0, opacity: 1, filter: "blur(0px)", duration: 0.62, ease: apple }, t);
      },

      // ── 2026 SOTA PREMIUM TRANSITIONS ──────────────────────

      // 1. Liquid Glass & Chromatic Refraction (Apple / Stripe quality)
      liquid_glass: () => {
        // From scene: saturate and blur out
        this.tl.to(from, {
          filter: "blur(0px) saturate(300%) brightness(1.8)",
          duration: 0.15, ease: "power4.in"
        }, t - 0.5);
        this.tl.to(from, {
          filter: "blur(40px) saturate(500%) brightness(3)",
          scale: 1.12, opacity: 0,
          duration: 0.4, ease: "power4.in"
        }, t - 0.35);

        // To scene: emerge from liquid glass
        this.tl.fromTo(to, {
          filter: "blur(60px) saturate(400%) brightness(2.5)",
          scale: 0.88, opacity: 0,
          clipPath: "ellipse(30% 30% at 50% 50%)"
        }, {
          filter: "blur(0px) saturate(100%) brightness(1)",
          scale: 1, opacity: 1,
          clipPath: "ellipse(100% 100% at 50% 50%)",
          duration: 0.75, ease: apple
        }, t - 0.25);

        // Rainbow light streak overlay (temporary DOM element, safe with raw gsap)
        this.tl.add(() => {
          const streak = document.createElement("div");
          streak.style.cssText = `
            position:fixed;inset:0;z-index:9999;pointer-events:none;
            background:linear-gradient(105deg,
              rgba(255,0,128,0) 0%,rgba(255,0,128,0.25) 20%,
              rgba(0,200,255,0.35) 40%,rgba(128,0,255,0.3) 60%,
              rgba(255,200,0,0.2) 80%,rgba(255,200,0,0) 100%);
            transform:translateX(-100%);
          `;
          document.body.appendChild(streak);
          const g = (window as any).gsap;
          g.to(streak, { x: "200%", duration: 0.5, ease: "power2.inOut", onComplete: () => streak.remove() });
        }, t - 0.3);
      },

      // 2. Data Flow / Particle Stream (AI, Crypto, Cybersecurity)
      particle_stream: () => {
        // Scene transitions on the timeline (no conflicts)
        this.tl.to(from, { filter: "blur(20px) saturate(0%)", scale: 1.05, opacity: 0, duration: 0.45, ease: sharp }, t - 0.4);
        this.tl.fromTo(to, { filter: "blur(30px) brightness(2)", scale: 0.95, opacity: 0 },
          { filter: "blur(0px) brightness(1)", scale: 1, opacity: 1, duration: 0.6, ease: apple }, t - 0.1);

        // Particle overlay (temporary DOM, safe with raw gsap)
        this.tl.add(() => {
          const g = (window as any).gsap;
          const colors = [this.schema.palette.accent, this.schema.palette.accent2, this.schema.palette.accentGlow];
          for (let i = 0; i < 28; i++) {
            const p = document.createElement("div");
            const size = Math.random() * 5 + 2;
            const color = colors[i % 3];
            p.style.cssText = `position:fixed;width:${size}px;height:${size * (Math.random() * 8 + 3)}px;
              background:${color};border-radius:${size}px;
              left:${Math.random() * 1920}px;top:${Math.random() * 1080}px;
              z-index:9998;pointer-events:none;opacity:0;
              box-shadow:0 0 ${size * 3}px ${color};`;
            document.body.appendChild(p);
            const delay = i * 0.018;
            g.fromTo(p, { opacity: 0, scaleY: 0 }, {
              opacity: 0.85, scaleY: 1,
              y: `${-(Math.random() * 200 + 80)}`,
              x: `${(Math.random() * 300 - 150)}`,
              duration: Math.random() * 0.25 + 0.25,
              delay, ease: "power2.in",
              onComplete: () => g.to(p, { opacity: 0, duration: 0.1, onComplete: () => p.remove() })
            });
          }
        }, t - 0.4);
      },

      // 3. Echo Trail / Smear Frame (2026 After Effects trend)
      echo_trail: () => {
        // Main scene animations on the timeline
        this.tl.to(from, { x: "-110%", scaleX: 1.45, filter: "blur(20px)", opacity: 0, duration: 0.35, ease: "power4.in" }, t - 0.4);
        this.tl.fromTo(to, { x: "110%", scaleX: 1.45, filter: "blur(20px)", opacity: 0 },
          { x: "0%", scaleX: 1, filter: "blur(0px)", opacity: 1, duration: 0.55, ease: bounce }, t - 0.1);

        // Echo ghost overlays (temporary DOM, safe with raw gsap)
        this.tl.add(() => {
          const g = (window as any).gsap;
          const fromEl = document.querySelector(from) as HTMLElement;
          if (!fromEl) return;
          for (let i = 0; i < 4; i++) {
            const echo = document.createElement("div");
            echo.style.cssText = `position:fixed;inset:0;z-index:${9988 + i};pointer-events:none;
              background:${[this.schema.palette.accent, this.schema.palette.accent2, this.schema.palette.accentGlow, this.schema.palette.glow][i]};
              opacity:${0.18 - i * 0.03};filter:blur(${i * 4 + 2}px);
              transform:translateX(${i * 20}px);`;
            document.body.appendChild(echo);
            g.to(echo, { x: `-${220 + i * 70}px`, scaleX: 1.4, opacity: 0, duration: 0.22 + i * 0.04, delay: i * 0.035, ease: "power4.in", onComplete: () => echo.remove() });
          }
        }, t - 0.4);
      },

      // 4. Temporal Camera Flow (Continuous cinematic camera)
      temporal_flow: () => {
        // Scene animations on the timeline (critical: use this.tl not raw gsap)
        this.tl.to(from, { scale: 1.22, filter: "blur(8px)", opacity: 0,
          transformPerspective: 2000, z: 280, duration: 0.55, ease: "power2.in" }, t - 0.45);
        this.tl.fromTo(to, { scale: 0.84, filter: "blur(14px)", opacity: 0,
          transformPerspective: 2000, z: -380 }, {
          scale: 1, filter: "blur(0px)", opacity: 1, z: 0,
          duration: 0.7, ease: apple }, t - 0.1);

        // Vignette overlay (temporary DOM, safe with raw gsap)
        this.tl.add(() => {
          const g = (window as any).gsap;
          const vig = document.createElement("div");
          vig.style.cssText = "position:fixed;inset:0;z-index:9997;pointer-events:none;background:radial-gradient(ellipse at center,transparent 0%,rgba(0,0,0,0.9) 100%);opacity:0;";
          document.body.appendChild(vig);
          g.to(vig, { opacity: 1, duration: 0.22, yoyo: true, repeat: 1, ease: "sine.inOut", onComplete: () => vig.remove() });
        }, t - 0.4);
      },

      // 5. Hand-Drawn / Mixed Media Wipe (Creative agencies, retro-futurism)
      hand_drawn_wipe: () => {
        // Scene animations on the timeline
        this.tl.to(from, { opacity: 0, scale: 0.97, duration: 0.3, ease: sharp }, t - 0.35);
        this.tl.fromTo(to, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.45, ease: apple }, t - 0.1);

        // Brush-stroke SVG overlay (temporary DOM, safe with raw gsap)
        this.tl.add(() => {
          const g = (window as any).gsap;
          const svgNS = "http://www.w3.org/2000/svg";
          const svg = document.createElementNS(svgNS, "svg");
          svg.setAttribute("style", "position:fixed;inset:0;width:100%;height:100%;z-index:9998;pointer-events:none;");
          svg.setAttribute("viewBox", "0 0 1920 1080");
          svg.setAttribute("preserveAspectRatio", "none");
          const path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", "M-100,0 C180,0 200,90 400,65 C600,40 620,105 820,75 C1020,45 1040,110 1240,75 C1440,40 1460,95 1660,65 C1860,35 1900,85 2050,55 L2050,1130 L-100,1130 Z");
          path.setAttribute("fill", this.schema.palette.accent);
          svg.appendChild(path);
          document.body.appendChild(svg);
          g.fromTo(svg, { x: "-110%" }, { x: "115%", duration: 0.52, ease: "power2.inOut", onComplete: () => svg.remove() });
        }, t - 0.35);
      },
    };
    // ── Custom (dynamically registered) transition fallback ─────────────────
    if (!transitions[type]) {
      const customAnims: Record<string, string> = (window as any).__sota_animations ?? {};
      if (customAnims[type]) {
        try {
          const fn = new Function("el", "direction", "start", "overlap", "tl", `
            try {
              const animFn = ${customAnims[type]};
              animFn(document.querySelector(el) || document.body, { duration: overlap, delay: 0 });
            } catch(e) { console.warn('[CustomTransition] runtime error:', e); }
          `);
          fn(selector, direction, start, overlap, this.tl);
        } catch (e) {
          console.warn("[AnimationRegistry] Failed to run custom transition, using fade fallback:", e);
          if (direction === "out") {
            this.tl.to(selector, { opacity: 0, duration: overlap, ease: sharp }, start);
          } else {
            this.tl.fromTo(selector, { opacity: 0 }, { opacity: 1, duration: overlap + 0.1 }, start);
          }
        }
      } else {
        // Unknown transition with no implementation — graceful fade fallback
        if (direction === "out") {
          this.tl.to(selector, { opacity: 0, duration: overlap }, start);
        } else {
          this.tl.fromTo(selector, { opacity: 0 }, { opacity: 1, duration: overlap + 0.1 }, start);
        }
      }
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────
    transitions[type]?.();
  }

  // ── TEXT ANIMATIONS ───────────────────────────────────
  private animateText(words: NodeListOf<Element>, anim: string, t: number, gsap: any): void {
    if (!words.length) return;

    // ── Custom (dynamically registered) animation check ──────────────────────
    const customAnims: Record<string, string> = (window as any).__sota_animations ?? {};
    if (customAnims[anim]) {
      try {
        // jsCode is a function body: (element, opts) => { ... }
        // We adapt it to operate on all word elements via GSAP timeline
        const fn = new Function("words", "tl", "t", "gsap", `
          try {
            const animFn = ${customAnims[anim]};
            Array.from(words).forEach(function(el, i) {
              animFn(el, { duration: 0.7, delay: i * 0.08, color: getComputedStyle(el).color });
            });
          } catch(e) { console.warn('[CustomAnim] runtime error:', e); }
        `);
        fn(words, this.tl, t, gsap);
        return;
      } catch (e) {
        console.warn("[AnimationRegistry] Failed to run custom headline animation, falling back:", e);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Apple-quality bezier curves for every animation
    const apple  = "cubic-bezier(0.16, 1, 0.3, 1)";
    const bounce = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const sharp  = "cubic-bezier(0.55, 0, 1, 0.45)";
    const smooth = "cubic-bezier(0.22, 1, 0.36, 1)";
    switch (anim) {
      case "slam_drop":
        gsap.set(words, { y: "-160%", rotationX: 120, rotationZ: 8, opacity: 0, scale: 2.2, filter: "blur(16px)", transformPerspective: 900 });
        this.tl.to(words, { y: "0%", rotationX: 0, rotationZ: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.75, stagger: 0.08, ease: bounce }, t);
        break;
      case "kinetic_smash":
        gsap.set(words, { scale: 8, opacity: 0, z: -1000, filter: "blur(24px)" });
        this.tl.to(words, { scale: 1, opacity: 1, z: 0, filter: "blur(0px)", duration: 0.25, stagger: 0.05, ease: "power4.inOut" }, t);
        // Add extreme punch effect to the entire screen when smash lands
        this.tl.fromTo(".motion-canvas-wrapper", { scale: 1.05, rotationZ: () => (Math.random() - 0.5) * 4 }, { scale: 1, rotationZ: 0, duration: 0.4, ease: bounce }, t + 0.25);
        break;
      case "fluid_vector":
        gsap.set(words, { y: 60, opacity: 0, rotationZ: -4, scale: 0.9, filter: "blur(8px)" });
        this.tl.to(words, { y: 0, opacity: 1, rotationZ: 0, scale: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.08, ease: apple }, t);
        break;
      case "isometric_float":
        gsap.set(words, { rotationX: 45, rotationZ: -30, rotationY: 20, y: 150, z: -500, opacity: 0, filter: "blur(12px)", transformPerspective: 1200 });
        this.tl.to(words, { rotationX: 0, rotationZ: 0, rotationY: 0, y: 0, z: 0, opacity: 1, filter: "blur(0px)", duration: 1.1, stagger: 0.12, ease: bounce }, t);
        break;
      case "waterfall":
        words.forEach((word, i) => {
          gsap.set(word, { x: 500, opacity: 0, skewX: -25, filter: "blur(12px)" });
          this.tl.to(word, { x: 0, opacity: 1, skewX: 0, filter: "blur(0px)", duration: 0.55, ease: apple }, t + i * 0.055);
        });
        break;
      case "kinetic_scale":
        gsap.set(words, { scale: 5, opacity: 0, filter: "blur(32px)" });
        this.tl.to(words, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.14, ease: apple }, t);
        break;
      case "glitch_reveal":
        words.forEach((word, i) => {
          this.tl.fromTo(word,
            { clipPath: "polygon(0 0,100% 0,100% 0,0 0)", filter: "blur(8px) hue-rotate(90deg)" },
            { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", filter: "blur(0px) hue-rotate(0deg)", duration: 0.35, ease: "steps(5)" }, t + i * 0.1);
          this.tl.to(word, { x: 10, duration: 0.03, yoyo: true, repeat: 4, ease: "none" }, t + i * 0.1 + 0.15);
          this.tl.to(word, { x: 0, duration: 0.1 }, t + i * 0.1 + 0.27);
        });
        break;
      case "clip_wipe":
        gsap.set(words, { clipPath: "polygon(0 100%,100% 100%,100% 100%,0 100%)", y: 30, filter: "blur(10px)" });
        this.tl.to(words, { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)", y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.09, ease: apple }, t);
        break;
      case "tracking_stretch":
        gsap.set(words, { letterSpacing: "1.4em", opacity: 0, filter: "blur(12px)", scale: 1.15 });
        this.tl.to(words, { letterSpacing: "normal", opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.4, stagger: 0.09, ease: smooth }, t);
        break;
      case "3d_flip":
        gsap.set(words, { rotationX: 90, y: 60, opacity: 0, filter: "blur(12px)", transformPerspective: 800 });
        this.tl.to(words, { rotationX: 0, y: 0, opacity: 1, filter: "blur(0px)", duration: 0.85, stagger: 0.1, ease: bounce }, t);
        break;
      case "char_shatter":
        gsap.set(words, { z: () => Math.random()*1200-600, x: () => Math.random()*500-250, y: () => Math.random()*500-250, rotationX: () => Math.random()*360, rotationY: () => Math.random()*360, opacity: 0, scale: 0, filter: "blur(20px)", transformPerspective: 1200 });
        this.tl.to(words, { z: 0, x: 0, y: 0, rotationX: 0, rotationY: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.3, stagger: { amount: 0.9, from: "random" }, ease: apple }, t);
        break;
      case "blur_slide":
        gsap.set(words, { x: -140, opacity: 0, filter: "blur(24px)", scale: 1.08 });
        this.tl.to(words, { x: 0, opacity: 1, filter: "blur(0px)", scale: 1, duration: 1.05, stagger: 0.09, ease: apple }, t);
        break;
      case "matte_reveal":
        gsap.set(words, { y: "160%", rotationZ: 12, opacity: 0, scale: 0.85, filter: "blur(10px)", transformOrigin: "left bottom" });
        this.tl.to(words, { y: "0%", rotationZ: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.0, stagger: 0.075, ease: apple }, t);
        break;
      case "scramble_text":
        words.forEach((word, i) => {
          const text = (word as HTMLElement).textContent || "";
          const chars = "!@#$%^&*()_+ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          const obj = { p: 0 };
          this.tl.to(obj, {
            p: 1, duration: 0.5 + text.length * 0.025, ease: "none",
            onUpdate: () => {
              const revealed = text.slice(0, Math.floor(obj.p * text.length));
              const scrambled = Array.from({ length: text.length - revealed.length })
                .map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
              (word as HTMLElement).textContent = revealed + scrambled;
            }
          }, t + i * 0.16);
        });
        break;
      case "elastic_pop":
        gsap.set(words, { scale: 0, opacity: 0, rotationZ: -12, filter: "blur(10px)" });
        this.tl.to(words, { scale: 1, opacity: 1, rotationZ: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.09, ease: bounce }, t);
        break;
      case "perspective_fly":
        gsap.set(words, { z: -900, rotationY: 90, opacity: 0, filter: "blur(20px)", transformPerspective: 1200 });
        this.tl.to(words, { z: 0, rotationY: 0, opacity: 1, filter: "blur(0px)", duration: 1.0, stagger: 0.13, ease: apple }, t);
        break;
      case "wave_text":
        gsap.set(words, { y: 70, opacity: 0, scale: 0.5, filter: "blur(8px)" });
        this.tl.to(words, { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, stagger: { each: 0.07, from: "center" }, ease: bounce }, t);
        break;
      default:
        gsap.set(words, { y: 30, opacity: 0, filter: "blur(8px)" });
        this.tl.to(words, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.07, ease: apple }, t);
    }
  }

  // ── SOUND ENGINE ────────────────────────────────────────
  private getAudioCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  playSound(id: string): void {
    if (MotionPlayer.muted) return;
    try {
      const c = this.getAudioCtx();
      if (c.state === "suspended") void c.resume();
      const now = c.currentTime;
      const sounds: Record<string, () => void> = {
        whoosh: () => {
          const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / d.length);
          const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          f.type = "bandpass"; f.frequency.value = 800; f.Q.value = 0.5;
          s.buffer = buf; s.connect(f); f.connect(g); g.connect(c.destination);
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.5, now + 0.1); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          s.start();
        },
        impact: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(120, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.15);
          g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          o.start(); o.stop(now + 0.15);
        },
        pop: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(60, now + 0.08);
          g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          o.start(); o.stop(now + 0.1);
        },
        ping: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = 1400; o.connect(g); g.connect(c.destination);
          g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          o.start(); o.stop(now + 0.5);
        },
        glitch: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sawtooth"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(200, now); o.frequency.setValueAtTime(150, now + 0.1);
          g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          o.start(); o.stop(now + 0.25);
        },
        sweep: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sawtooth"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(100, now); o.frequency.exponentialRampToValueAtTime(2000, now + 0.35);
          g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          o.start(); o.stop(now + 0.35);
        },
        snap: () => {
          const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp((-i * 80) / c.sampleRate);
          const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          f.type = "highpass"; f.frequency.value = 3000;
          s.buffer = buf; s.connect(f); f.connect(g); g.connect(c.destination);
          g.gain.value = 0.5; s.start();
        },
        soft_click: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(1800, now); o.frequency.exponentialRampToValueAtTime(1400, now + 0.03);
          g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          o.start(); o.stop(now + 0.04);
        },
        airy_whoosh: () => {
          const buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
          const d = buf.getChannelData(0);
          for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3 * Math.sin((Math.PI * i) / d.length);
          const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
          f.type = "highpass"; f.frequency.value = 3000;
          s.buffer = buf; s.connect(f); f.connect(g); g.connect(c.destination);
          g.gain.value = 0.2; s.start();
        },
        glass_tap: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.frequency.value = 2200; o.connect(g); g.connect(c.destination);
          g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          o.start(); o.stop(now + 0.25);
        },
        screen_shake_rumble: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(80, now); o.frequency.exponentialRampToValueAtTime(20, now + 0.2);
          g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          o.start(); o.stop(now + 0.2);
        },
        bass_drop: () => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = "sine"; o.connect(g); g.connect(c.destination);
          o.frequency.setValueAtTime(60, now); o.frequency.exponentialRampToValueAtTime(20, now + 1.5);
          g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.5, now + 1.2); g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          o.start(); o.stop(now + 1.5);
        },
      };
      sounds[id]?.();
    } catch (e) { /* audio blocked */ }
  }

  // ── VISUAL EFFECTS ────────────────────────────────────
  private addScreenShake(t: number): void {
    const body = document.body;
    this.tl.to(body, { x: 8, duration: 0.05, ease: "none" }, t)
      .to(body, { x: -8, duration: 0.05 })
      .to(body, { x: 4, duration: 0.05 })
      .to(body, { x: -4, duration: 0.05 })
      .to(body, { x: 0, duration: 0.1, ease: "elastic.out(1,0.3)" });
    this.tl.add(() => this.playSound("screen_shake_rumble"), t);
  }

  private addImpactFlash(t: number): void {
    const flash = document.createElement("div");
    flash.style.cssText = "position:fixed;inset:0;background:#fff;pointer-events:none;z-index:8888;opacity:0";
    document.body.appendChild(flash);
    this.tl.to(flash, { opacity: 0.7, duration: 0.04 }, t)
      .to(flash, { opacity: 0, duration: 0.2, ease: "power2.out", onComplete: () => flash.remove() });
  }

  private particleBurst(x: number, y: number): void {
    const { accent } = this.schema.palette;
    const gsap = (window as any).gsap;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:fixed;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;border-radius:50%;background:${accent};left:${x}px;top:${y}px;pointer-events:none;z-index:7777`;
      document.body.appendChild(p);
      const angle = (i / 20) * Math.PI * 2;
      const dist = 50 + Math.random() * 120;
      gsap.to(p, {
        x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0,
        duration: 0.5 + Math.random() * 0.3, ease: "power2.out", onComplete: () => p.remove()
      });
    }
  }

  private addCameraMove(selector: string, move: string, t: number, dur: number): void {
    const gsap = (window as any).gsap;
    const el = document.querySelector(selector);
    if (!el) return;
    const moves: Record<string, object> = {
      zoom_in: { scale: 1.08, duration: dur, ease: "none" },
      zoom_out: { scale: 0.94, duration: dur, ease: "none" },
      push_through: { scale: 1.2, filter: "blur(20px)", duration: 0.3, ease: "power3.in" },
      pan_left: { x: -40, duration: dur, ease: "none" },
      pan_right: { x: 40, duration: dur, ease: "none" },
      shake: { x: 6, duration: 0.05, yoyo: true, repeat: 6 },
    };
    if (moves[move]) this.tl.to(el, moves[move], t);
  }

  private startParticles(type: string): void {
    const canvas = document.getElementById("particles") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width: W, height: H } = this.getDimensions();
    const { accent } = this.schema.palette;
    const rgb = accent.startsWith("#") ? `${parseInt(accent.slice(1, 3), 16)},${parseInt(accent.slice(3, 5), 16)},${parseInt(accent.slice(5, 7), 16)}` : "99,102,241";
    const count = type === "snow" || type === "rain" ? 100 : 60;
    this.particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * (type === "sparks" ? 3 : 1.5),
      vy: type === "snow" ? Math.random() * 2 + 0.5 : type === "rain" ? Math.random() * 8 + 4 : (Math.random() - 0.5) * 1.5,
      r: Math.random() * 3 + 1, a: Math.random() * 0.6 + 0.1,
    }));
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      this.particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.fill();
      });
      this.particleRAF = requestAnimationFrame(loop);
    };
    loop();
  }

  private stopParticles(): void {
    if (this.particleRAF) { cancelAnimationFrame(this.particleRAF); this.particleRAF = null; }
    const canvas = document.getElementById("particles") as HTMLCanvasElement;
    const { width: W, height: H } = this.getDimensions();
    canvas?.getContext("2d")?.clearRect(0, 0, W, H);
  }

  private addCardTilt(card: HTMLElement): void {
    const gsap = (window as any).gsap;
    card.addEventListener("mousemove", (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: x * 18, rotationX: -y * 18, transformPerspective: 800, duration: 0.4 });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.7, ease: "elastic.out(1,0.4)" });
    });
  }

  private addButtonRipple(btn: HTMLElement): void {
    const gsap = (window as any).gsap;
    btn.addEventListener("click", (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const rip = document.createElement("span");
      rip.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);pointer-events:none;width:10px;height:10px;left:${e.clientX - r.left - 5}px;top:${e.clientY - r.top - 5}px`;
      btn.appendChild(rip);
      gsap.fromTo(rip, { scale: 0, opacity: 1 }, { scale: 20, opacity: 0, duration: 0.6, ease: "power2.out", onComplete: () => rip.remove() });
    });
  }

  private setupCursor(): void {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;
    const gsap = (window as any).gsap;
    let mx = 960, my = 540;
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    gsap.ticker.add(() => {
      gsap.set(dot, { x: mx, y: my });
      gsap.to(ring, { x: mx, y: my, duration: 0.14, ease: "power3.out" });
    });
  }

  // ── HELPERS ─────────────────────────────────────────────
  private wrapWords(text: string): string {
    // A much safer word wrapper that doesn't collapse spaces or break tags
    if (!/<[a-z][\s\S]*>/i.test(text)) {
      return text.split(" ").map(w => `<span class="word" style="display:inline-block;white-space:pre;">${w} </span>`).join("");
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        const textContent = node.nodeValue || "";
        const words = textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        words.forEach(w => {
          if (w.trim().length === 0) {
            frag.appendChild(document.createTextNode(w));
          } else {
            const wrapper = document.createElement("span");
            wrapper.className = "word";
            wrapper.style.cssText = "display:inline-block;white-space:pre;";
            wrapper.textContent = w;
            frag.appendChild(wrapper);
          }
        });
        node.parentNode?.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        const el = node as HTMLElement;
        if (!el.classList.contains("word")) {
          Array.from(node.childNodes).forEach(walk);
        }
      }
    };
    Array.from(doc.body.childNodes).forEach(walk);
    return doc.body.innerHTML;
  }

  private getBgStyle(scene: MotionScene): string {
    const { palette } = this.schema;
    const bgs: Record<string, string> = {
      primary: `background:${palette.bg}`,
      surface: `background:${palette.surface}`,
      accent: `background:${palette.accent}`,
      gradient: `background:${palette.gradient}`,
    };
    return bgs[scene.bgVariant] || `background:${palette.bg}`;
  }

  private getFont(id: string) {
    const fonts: Record<string, { url: string; family: string }> = {
      inter: { url: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap", family: "'Inter',system-ui,sans-serif" },
      space_grotesk: { url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap", family: "'Space Grotesk',sans-serif" },
      bebas_neue: { url: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap", family: "'Bebas Neue',sans-serif" },
      playfair_display: { url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap", family: "'Playfair Display',serif" },
      jetbrains_mono: { url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap", family: "'JetBrains Mono',monospace" },
      outfit: { url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap", family: "'Outfit',sans-serif" },
      clash_display: { url: "https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&display=swap", family: "'Clash Display',sans-serif" },
      syne: { url: "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap", family: "'Syne', sans-serif" },
      archivo: { url: "https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,100..900;1,100..900&display=swap", family: "'Archivo', sans-serif" },
      monoton: { url: "https://fonts.googleapis.com/css2?family=Monoton&display=swap", family: "'Monoton', cursive" },
    };
    return fonts[id] || fonts.inter;
  }

  private async loadGSAP(): Promise<void> {
    if ((window as any).gsap) return;
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js";
      s.onload = () => res();
      document.head.appendChild(s);
    });
  }
}
