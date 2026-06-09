import { getCanvasDimensions, type AspectRatio } from "@/lib/motion/aspect-ratio";

const DEFAULT_DURATION_MS = 30_000;
export const CAPTURE_FPS = 60;
/** ~45 Mbps — high quality 1080p @ 60fps WebM */
const VIDEO_BITRATE = 45_000_000;
const FRAME_MIME = "image/webp";
const FRAME_QUALITY = 0.98;

export function getExportDimensions(aspectRatio: AspectRatio = "16:9") {
  return getCanvasDimensions(aspectRatio);
}

export const EXPORT_WIDTH = 1920;
export const EXPORT_HEIGHT = 1080;

export function hasWebCodecs(): boolean {
  return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "video/webm";
}

export function videoExtension(mimeType: string): string {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  show = true,
) {
  if (!show) return;
  const margin = 12;
  ctx.save();
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("Made with Sota Folovo", width - margin, height - margin);
  ctx.restore();
}

function injectCaptureScript(html: string, renderW: number, renderH: number): string {
  const snippet = `
<canvas id="__flovo_cap__" width="${renderW}" height="${renderH}"
  style="position:fixed;left:-99999px;top:0;width:${renderW}px;height:${renderH}px;pointer-events:none;z-index:-9999;opacity:0;"></canvas>
<script>
(function(){
  var W=${renderW},H=${renderH};
  var cap=document.getElementById('__flovo_cap__');
  var capCtx=cap.getContext('2d');
  capCtx.fillStyle='#000';
  capCtx.fillRect(0,0,W,H);

  function getTl(){return window.__timelines&&window.__timelines['sota-video']||null;}

  function seekTimeline(t){
    var tl=getTl();
    if(!tl) return false;
    tl.pause();
    tl.time(t);
    return true;
  }

  function doCapture(cb){
    html2canvas(document.documentElement,{
      canvas:cap,
      width:W, height:H,
      windowWidth:W, windowHeight:H,
      x:0, y:0, scrollX:0, scrollY:0,
      backgroundColor:'#000000',
      logging:false, scale:1,
      useCORS:true, allowTaint:true,
      foreignObjectRendering:true,
      ignoreElements:function(el){return el===cap;}
    }).then(function(){cb();}).catch(function(){cb();});
  }

  window.addEventListener('message',function(e){
    if(!e.data||e.data.type!=='FLOVO_SEEK') return;
    var t=e.data.t;
    seekTimeline(t);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        doCapture(function(){
          parent.postMessage({type:'FLOVO_FRAME_READY',t:t},'*');
        });
      });
    });
  });

  var s=document.createElement('script');
  s.crossOrigin='anonymous';
  s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  s.onload=function(){
    (function waitForReady(){
      if(typeof html2canvas!=='function'||!getTl()){
        setTimeout(waitForReady,50);
        return;
      }
      seekTimeline(0);
      parent.postMessage({type:'FLOVO_READY'},'*');
    })();
  };
  s.onerror=function(){
    parent.postMessage({type:'FLOVO_H2C_ERROR'},'*');
  };
  document.head.appendChild(s);
})();
<\/script>`;

  if (html.includes("</body>")) return html.replace("</body>", snippet + "</body>");
  if (html.includes("</html>")) return html.replace("</html>", snippet + "</html>");
  return html + snippet;
}

async function encodeFrames(
  frames: string[],
  fps: number,
  renderW: number,
  renderH: number,
  mimeType: string,
  options?: { onProgress?: (p: number) => void; showWatermark?: boolean },
): Promise<{ blob: Blob; mimeType: string }> {
  if (frames.length === 0) {
    throw new Error("No frames captured for video export");
  }

  if (hasWebCodecs() && mimeType.includes("webm")) {
    try {
      return await encodeWithWebCodecs(frames, fps, renderW, renderH, mimeType, options);
    } catch (err) {
      console.warn("WebCodecs export failed, falling back to MediaRecorder:", err);
    }
  }

  return encodeWithMediaRecorder(frames, fps, renderW, renderH, mimeType, options);
}

async function encodeWithWebCodecs(
  frames: string[],
  fps: number,
  renderW: number,
  renderH: number,
  mimeType: string,
  options?: { onProgress?: (p: number) => void; showWatermark?: boolean },
): Promise<{ blob: Blob; mimeType: string }> {
  const support = await VideoEncoder.isConfigSupported({
    codec: "vp8",
    width: renderW,
    height: renderH,
    bitrate: VIDEO_BITRATE,
    framerate: fps,
  });
  if (!support.supported) throw new Error("WebCodecs VP8 not supported");

  // Probe encoder lifecycle; production mux uses MediaRecorder @ 60fps
  let probeError: Error | null = null;
  const probe = new VideoEncoder({
    output: () => {},
    error: (e) => {
      probeError = e;
    },
  });
  probe.configure({ codec: "vp8", width: renderW, height: renderH, bitrate: VIDEO_BITRATE, framerate: fps });
  const probeCanvas = document.createElement("canvas");
  probeCanvas.width = renderW;
  probeCanvas.height = renderH;
  const vf = new VideoFrame(probeCanvas, { timestamp: 0 });
  probe.encode(vf);
  vf.close();
  await probe.flush();
  probe.close();
  if (probeError) throw probeError;

  return encodeWithMediaRecorder(frames, fps, renderW, renderH, mimeType, options);
}

async function encodeWithMediaRecorder(
  frames: string[],
  fps: number,
  renderW: number,
  renderH: number,
  mimeType: string,
  options?: { onProgress?: (p: number) => void; showWatermark?: boolean },
): Promise<{ blob: Blob; mimeType: string }> {
  const frameInterval = 1000 / fps;
  const encCanvas = document.createElement("canvas");
  encCanvas.width = renderW;
  encCanvas.height = renderH;
  const encCtx = encCanvas.getContext("2d", { alpha: false })!;
  encCtx.imageSmoothingEnabled = true;
  encCtx.imageSmoothingQuality = "high";

  const stream = encCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: VIDEO_BITRATE,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start(100);

  for (let i = 0; i < frames.length; i++) {
    const img = new Image();
    img.src = frames[i];
    await new Promise<void>((r) => {
      img.onload = () => r();
      img.onerror = () => r();
    });
    encCtx.drawImage(img, 0, 0, renderW, renderH);
    drawWatermark(encCtx, renderW, renderH, options?.showWatermark !== false);
    options?.onProgress?.(80 + Math.round((i / frames.length) * 20));
    await new Promise((r) => setTimeout(r, frameInterval));
  }

  recorder.stop();

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 1024) {
        reject(new Error("Video export produced an empty file"));
        return;
      }
      resolve({ blob, mimeType });
    };
  });
}

function liveCapture(
  iframe: HTMLIFrameElement,
  overlay: HTMLDivElement,
  blobUrl: string,
  options: {
    durationMs: number;
    fps: number;
    mimeType: string;
    renderW: number;
    renderH: number;
    showWatermark?: boolean;
    onProgress?: (p: number) => void;
  },
): Promise<{ blob: Blob; mimeType: string }> {
  const { durationMs, fps, mimeType, onProgress, renderW, renderH, showWatermark } = options;
  const frameInterval = 1000 / fps;

  return new Promise((resolve, reject) => {
    import("html2canvas").then(({ default: html2canvas }) => {
      const recordingCanvas = document.createElement("canvas");
      recordingCanvas.width = renderW;
      recordingCanvas.height = renderH;
      const ctx = recordingCanvas.getContext("2d", { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const stream = recordingCanvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: VIDEO_BITRATE,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const cleanup = () => {
        clearInterval(captureTimer);
        clearInterval(progressTimer);
        URL.revokeObjectURL(blobUrl);
        overlay.remove();
      };

      let capturing = false;
      const captureTimer = setInterval(async () => {
        if (capturing) return;
        capturing = true;
        try {
          const doc = iframe.contentDocument;
          if (!doc?.body) return;
          await html2canvas(doc.body, {
            canvas: recordingCanvas,
            width: renderW,
            height: renderH,
            windowWidth: renderW,
            windowHeight: renderH,
            backgroundColor: "#000",
            logging: false,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
          });
          drawWatermark(ctx, renderW, renderH, showWatermark !== false);
        } finally {
          capturing = false;
        }
      }, frameInterval);

      const started = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - started;
        onProgress?.(Math.min(95, Math.round((elapsed / durationMs) * 100)));
      }, 300);

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1024) {
          reject(new Error("Live capture produced an empty file"));
          return;
        }
        resolve({ blob, mimeType });
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error("Recording failed"));
      };

      recorder.start(200);
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, durationMs);
    }).catch(reject);
  });
}

export function recordElementToVideo(
  element: HTMLElement,
  options?: {
    durationMs?: number;
    fps?: number;
    aspectRatio?: AspectRatio;
    showWatermark?: boolean;
    onProgress?: (percent: number) => void;
  },
): Promise<{ blob: Blob; mimeType: string }> {
  const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
  const fps = options?.fps ?? CAPTURE_FPS;
  const mimeType = pickMimeType();
  const frameInterval = 1000 / fps;
  const { width: RENDER_W, height: RENDER_H } = getExportDimensions(
    options?.aspectRatio ?? "16:9",
  );

  return new Promise((resolve, reject) => {
    import("html2canvas").then(({ default: html2canvas }) => {
      const recordingCanvas = document.createElement("canvas");
      recordingCanvas.width = RENDER_W;
      recordingCanvas.height = RENDER_H;
      const ctx = recordingCanvas.getContext("2d", { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const stream = recordingCanvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: VIDEO_BITRATE,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const cleanup = () => {
        clearInterval(captureTimer);
        clearInterval(progressTimer);
      };

      let capturing = false;
      const captureTimer = setInterval(async () => {
        if (capturing) return;
        capturing = true;
        try {
          await html2canvas(element, {
            canvas: recordingCanvas,
            width: RENDER_W,
            height: RENDER_H,
            windowWidth: RENDER_W,
            windowHeight: RENDER_H,
            backgroundColor: "#000",
            logging: false,
            scale: 1,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
          });
          drawWatermark(ctx, RENDER_W, RENDER_H, options?.showWatermark !== false);
        } finally {
          capturing = false;
        }
      }, frameInterval);

      const started = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - started;
        options?.onProgress?.(Math.min(95, Math.round((elapsed / durationMs) * 100)));
      }, 300);

      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size < 1024) {
          reject(new Error("Live capture produced an empty file"));
          return;
        }
        resolve({ blob, mimeType });
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error("Recording failed"));
      };

      recorder.start(200);
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, durationMs);
    }).catch(reject);
  });
}

export function recordHtmlToVideo(
  htmlCode: string,
  options?: {
    durationMs?: number;
    fps?: number;
    aspectRatio?: AspectRatio;
    showWatermark?: boolean;
    onProgress?: (percent: number) => void;
  },
): Promise<{ blob: Blob; mimeType: string }> {
  const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
  const fps = options?.fps ?? CAPTURE_FPS;
  const mimeType = pickMimeType();
  const totalFrames = Math.ceil((durationMs / 1000) * fps);
  const { width: RENDER_W, height: RENDER_H } = getExportDimensions(
    options?.aspectRatio ?? "16:9",
  );

  const modifiedHtml = injectCaptureScript(htmlCode, RENDER_W, RENDER_H);

  return new Promise((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `position:fixed;left:-10000px;top:0;width:${RENDER_W}px;height:${RENDER_H}px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1;`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = [`width:${RENDER_W}px`, `height:${RENDER_H}px`, "border:0"].join(";");
    overlay.appendChild(iframe);

    const htmlBlob = new Blob([modifiedHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(htmlBlob);

    let messageHandler: ((e: MessageEvent) => void) | null = null;
    let readyTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (messageHandler) window.removeEventListener("message", messageHandler);
      if (readyTimeout) clearTimeout(readyTimeout);
      URL.revokeObjectURL(blobUrl);
      overlay.remove();
    };

    iframe.onload = () => {
      const capturedFrames: string[] = [];
      let currentFrame = 0;

      const sendNextSeek = () => {
        if (currentFrame > totalFrames) {
          if (capturedFrames.length === 0) {
            cleanup();
            reject(new Error("No frames captured — animation timeline may be missing"));
            return;
          }
          cleanup();
          encodeFrames(capturedFrames, fps, RENDER_W, RENDER_H, mimeType, {
            onProgress: options?.onProgress,
            showWatermark: options?.showWatermark,
          })
            .then(resolve)
            .catch(reject);
          return;
        }
        const t = (currentFrame / totalFrames) * (durationMs / 1000);
        iframe.contentWindow?.postMessage({ type: "FLOVO_SEEK", t }, "*");
      };

      messageHandler = (e: MessageEvent) => {
        if (!e.data) return;

        if (e.data.type === "FLOVO_READY") {
          if (readyTimeout) {
            clearTimeout(readyTimeout);
            readyTimeout = null;
          }
          sendNextSeek();
        } else if (e.data.type === "FLOVO_FRAME_READY") {
          const capCanvas = iframe.contentDocument?.getElementById(
            "__flovo_cap__",
          ) as HTMLCanvasElement | null;

          if (capCanvas) {
            const dataUrl = capCanvas.toDataURL(FRAME_MIME, FRAME_QUALITY);
            capturedFrames.push(
              dataUrl.startsWith("data:image/webp")
                ? dataUrl
                : capCanvas.toDataURL("image/jpeg", FRAME_QUALITY),
            );
          }
          currentFrame++;
          options?.onProgress?.(Math.min(78, Math.round((currentFrame / totalFrames) * 78)));
          sendNextSeek();
        } else if (e.data.type === "FLOVO_H2C_ERROR") {
          if (readyTimeout) {
            clearTimeout(readyTimeout);
            readyTimeout = null;
          }
          if (messageHandler) {
            window.removeEventListener("message", messageHandler);
            messageHandler = null;
          }
          liveCapture(iframe, overlay, blobUrl, {
            durationMs,
            fps,
            mimeType,
            renderW: RENDER_W,
            renderH: RENDER_H,
            showWatermark: options?.showWatermark,
            onProgress: options?.onProgress,
          })
            .then(resolve)
            .catch(reject);
        }
      };

      window.addEventListener("message", messageHandler);

      readyTimeout = setTimeout(() => {
        if (messageHandler) {
          window.removeEventListener("message", messageHandler);
          messageHandler = null;
        }
        liveCapture(iframe, overlay, blobUrl, {
          durationMs,
          fps,
          mimeType,
          renderW: RENDER_W,
          renderH: RENDER_H,
          showWatermark: options?.showWatermark,
          onProgress: options?.onProgress,
        })
          .then(resolve)
          .catch(reject);
      }, 12_000);
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("Failed to load animation"));
    };

    iframe.src = blobUrl;
    document.body.appendChild(overlay);
  });
}

export function downloadVideoBlob(blob: Blob, filename: string, mimeType: string) {
  if (!blob || blob.size === 0) {
    throw new Error("Video file is empty — export again first");
  }
  const ext = videoExtension(mimeType);
  const safeName = filename.replace(/[^\w\-]+/g, "-").toLowerCase() || "flovo-video";
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;

  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = finalName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export async function shareVideoBlob(
  blob: Blob,
  filename: string,
  mimeType: string,
): Promise<"shared" | "downloaded"> {
  const ext = videoExtension(mimeType);
  const safeName = filename.replace(/[^\w\-]+/g, "-").toLowerCase() || "flovo-video";
  const finalName = safeName.endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;
  const file = new File([blob], finalName, { type: mimeType });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Sota Folovo Video",
      text: "Made with Sota Folovo",
    });
    return "shared";
  }

  downloadVideoBlob(blob, finalName, mimeType);
  return "downloaded";
}
