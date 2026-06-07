/** Robust GSAP autoplay for iframe blob preview */
export const PREVIEW_AUTOPLAY_SCRIPT = `<script>
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
  window.addEventListener("message", function(e){
    if(e.data && e.data.type === "FLOVO_PLAY") boot();
  });
  if(document.readyState === "complete") setTimeout(boot, 80);
  else window.addEventListener("load", function(){ setTimeout(boot, 80); });
})();
<\/script>`;

export function stripAutoplayScripts(html: string): string {
  return html
    .replace(/<script>\s*window\.addEventListener\(['"]load['"][\s\S]*?__timelines[\s\S]*?<\\\/script>/gi, "")
    .replace(/<script>\s*window\.addEventListener\(['"]load['"][\s\S]*?__timelines[\s\S]*?<\/script>/gi, "");
}

export function preparePreviewHtml(htmlCode: string): string {
  const cleaned = stripAutoplayScripts(htmlCode.trim());
  if (cleaned.includes("</body>")) {
    return cleaned.replace("</body>", PREVIEW_AUTOPLAY_SCRIPT + "</body>");
  }
  return cleaned + PREVIEW_AUTOPLAY_SCRIPT;
}

export function triggerIframePlay(iframe: HTMLIFrameElement | null) {
  iframe?.contentWindow?.postMessage({ type: "FLOVO_PLAY" }, "*");
}
