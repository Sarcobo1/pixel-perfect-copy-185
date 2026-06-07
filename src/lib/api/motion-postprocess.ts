import { finalizeMotionHtml } from "@/lib/api/motion-html-validate";

const AUTO_PLAY_SCRIPT = `<script>
(function(){
  function findTimeline(){
    if(!window.__timelines) return null;
    if(window.__timelines["sota-video"]) return window.__timelines["sota-video"];
    var keys = Object.keys(window.__timelines);
    return keys.length ? window.__timelines[keys[0]] : null;
  }
  function playMotion(){
    var tl = findTimeline();
    if(tl && typeof tl.play === "function"){
      try { tl.pause(); tl.time(0); tl.play(0); } catch(e) { tl.play(); }
      return true;
    }
    if(window.gsap){
      try { gsap.globalTimeline.restart(true); return true; } catch(e2) {}
    }
    return false;
  }
  function boot(){
    if(playMotion()) return;
    var n = 0;
    var iv = setInterval(function(){
      n++;
      if(playMotion() || n > 120) clearInterval(iv);
    }, 100);
  }
  if(document.readyState === "complete") setTimeout(boot, 80);
  else window.addEventListener("load", function(){ setTimeout(boot, 80); });
})();
<\/script>`;

const LOGO_ANIM_SCRIPT = `<script>
/* FLOVO_LOGO_ANIM */
(function(){
  function pulseLogo(){
    var logo = document.getElementById("brand-logo");
    if(!logo || !window.gsap) return;
    gsap.fromTo(logo,
      { scale: 0, opacity: 0, filter: "blur(10px)" },
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.85, ease: "elastic.out(1,0.4)", delay: 0.2 }
    );
    gsap.to(logo, { scale: 1.04, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.2 });
  }
  function boot(){ setTimeout(pulseLogo, 350); setTimeout(pulseLogo, 1500); }
  if(document.readyState === "complete") boot();
  else window.addEventListener("load", boot);
})();
<\/script>`;

export type MotionPostProcessOptions = {
  logoDataUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function logoHeroMarkup(safeSrc: string): string {
  return `<div id="flovo-logo-hero" style="position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);z-index:50;width:340px;height:170px;display:flex;align-items:center;justify-content:center;pointer-events:none"><img id="brand-logo" alt="Brand logo" src="${safeSrc}" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 12px 40px rgba(0,0,0,0.45))"/></div>`;
}

function logoOutroMarkup(safeSrc: string): string {
  return `<div id="flovo-logo-outro" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:50;width:280px;height:140px;display:flex;align-items:center;justify-content:center;pointer-events:none"><img id="brand-logo-outro" alt="Brand logo" src="${safeSrc}" style="max-width:100%;max-height:100%;object-fit:contain"/></div>`;
}

function injectLogo(html: string, logoDataUrl: string): string {
  const safeSrc = escapeAttr(logoDataUrl);
  let out = html;

  if (out.includes('id="brand-logo"') || out.includes("id='brand-logo'")) {
    out = out.replace(
      /(<img[^>]*id=["']brand-logo["'][^>]*\ssrc=["'])[^"']*(["'][^>]*>)/gi,
      `$1${safeSrc}$2`,
    );
    out = out.replace(
      /(<img[^>]*id=["']brand-logo["'])([^>]*>)/gi,
      (match, start, rest) =>
        rest.includes("src=") ? match : `${start} src="${safeSrc}"${rest}`,
    );
  }

  if (!out.includes('id="brand-logo"')) {
    if (out.includes('id="scene-1"')) {
      out = out.replace(
        /(<div[^>]*id=["']scene-1["'][^>]*>)/i,
        `$1\n${logoHeroMarkup(safeSrc)}`,
      );
    } else {
      out = out.replace(/<body[^>]*>/i, (m) => `${m}\n${logoHeroMarkup(safeSrc)}`);
    }
  }

  if (out.includes('id="scene-6"') && !out.includes('id="brand-logo-outro"')) {
    out = out.replace(
      /(<div[^>]*id=["']scene-6["'][^>]*>)/i,
      `$1\n${logoOutroMarkup(safeSrc)}`,
    );
  }

  return out;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function injectBrandColors(html: string, primaryColor: string, secondaryColor?: string): string {
  const accent = primaryColor.startsWith("#") ? primaryColor : `#${primaryColor}`;
  let out = html.replace(/#a3e635/gi, accent).replace(/#84cc16/gi, accent);

  const rgb = hexToRgb(accent);
  if (rgb) {
    out = out.replace(/163,\s*230,\s*53/g, `${rgb.r},${rgb.g},${rgb.b}`);
  }

  if (secondaryColor) {
    const sec = secondaryColor.startsWith("#") ? secondaryColor : `#${secondaryColor}`;
    out = out.replace(/#38bdf8/gi, sec).replace(/#0ea5e9/gi, sec);
  }

  out = out.replace(
    /background:\s*#000(?:000)?(?![0-9a-f])/gi,
    `background: linear-gradient(145deg, ${accent}18 0%, #0a0a12 45%, #060610 100%)`,
  );
  out = out.replace(
    /background-color:\s*#000(?:000)?(?![0-9a-f])/gi,
    "background-color: #0a0a12",
  );

  return out;
}

function ensureAutoPlay(html: string): string {
  let out = html;
  if (!out.includes("findTimeline")) {
    out = out.includes("</body>")
      ? out.replace("</body>", AUTO_PLAY_SCRIPT + "</body>")
      : out + AUTO_PLAY_SCRIPT;
  }
  if (out.includes('id="brand-logo"') && !out.includes("FLOVO_LOGO_ANIM")) {
    out = out.includes("</body>")
      ? out.replace("</body>", LOGO_ANIM_SCRIPT + "</body>")
      : out + LOGO_ANIM_SCRIPT;
  }
  return out;
}

export function postProcessMotionHtml(
  html: string,
  opts: MotionPostProcessOptions = {},
): string {
  let out = html.trim();

  if (opts.logoDataUrl) {
    out = injectLogo(out, opts.logoDataUrl);
  }
  if (opts.primaryColor) {
    out = injectBrandColors(out, opts.primaryColor, opts.secondaryColor);
  }
  out = ensureAutoPlay(out);
  return out;
}

export function postProcessWithValidation(
  html: string,
  opts: MotionPostProcessOptions = {},
) {
  const processed = postProcessMotionHtml(html, opts);
  return finalizeMotionHtml(processed);
}
