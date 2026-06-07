import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Film, Loader2, Maximize2, RefreshCw, Share2, Volume2, VolumeX } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CAPTURE_FPS,
  downloadVideoBlob,
  getExportDimensions,
  recordElementToVideo,
  recordHtmlToVideo,
  shareVideoBlob,
  videoExtension,
} from "@/lib/video-export";
import { MotionPlayer } from "@/lib/motion/MotionPlayer";
import type { AspectRatio } from "@/lib/motion/aspect-ratio";
import { preparePreviewHtml, triggerIframePlay } from "@/lib/preview-html";
import { checkVideoExportQuota, recordVideoExport } from "@/lib/api/server-fns";

interface MotionVideoPlayerProps {
  htmlCode: string;
  brandName?: string;
  autoExport?: boolean;
  aspectRatio?: AspectRatio;
  onVideoReady?: (blob: Blob, mimeType: string) => void;
}

function newVideoId(): string {
  return crypto.randomUUID();
}

export function MotionVideoPlayer({
  htmlCode,
  brandName = "brand-video",
  autoExport = false,
  aspectRatio: aspectRatioProp,
  onVideoReady,
}: MotionVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoMime, setVideoMime] = useState("video/webm");
  const [videoId] = useState(newVideoId);
  const [iframeKey, setIframeKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ used: 0, limit: 3 });
  const autoExportTriggered = useRef(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(aspectRatioProp ?? "16:9");
  const { width: NATIVE_W, height: NATIVE_H } = getExportDimensions(aspectRatio);

  useEffect(() => {
    if (aspectRatioProp) setAspectRatio(aspectRatioProp);
    else if (htmlCode?.trim().startsWith("{")) {
      try {
        const schema = JSON.parse(htmlCode);
        const ar = schema.aspect_ratio ?? schema.aspectRatio;
        if (ar === "9:16" || ar === "1:1" || ar === "16:9") setAspectRatio(ar);
      } catch {
        /* ignore */
      }
    }
  }, [htmlCode, aspectRatioProp]);

  useEffect(() => {
    MotionPlayer.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    void checkVideoExportQuota().then((q) => {
      setIsPremium(q.isPremium);
      setQuotaBlocked(!q.allowed);
      setQuotaInfo({ used: q.videosUsed, limit: q.videosLimit });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / NATIVE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [NATIVE_W]);

  useEffect(() => {
    if (!htmlCode) return;
    const isJson = htmlCode.trim().startsWith("{");
    if (isJson) {
      setPreviewUrl("/motion-preview");
    } else {
      const html = preparePreviewHtml(htmlCode);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewLoading(true);
    setExportDone(false);
    setVideoBlob(null);
    setShowVideo(false);
    autoExportTriggered.current = false;
  }, [htmlCode]);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data?.type === "FLOVO_MOTION_PREVIEW_MOUNTED") {
        const isJson = htmlCode?.trim().startsWith("{");
        if (isJson && iframeRef.current?.contentWindow) {
          try {
            const schema = JSON.parse(htmlCode);
            iframeRef.current.contentWindow.postMessage(
              { type: "PLAY_MOTION_SCHEMA", schema },
              "*",
            );
          } catch (err) {
            console.error("Invalid JSON schema", err);
            toast.error("Video schema noto'g'ri JSON formatda");
          }
        }
      } else if (e.data?.type === "FLOVO_MOTION_READY") {
        setPreviewLoading(false);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [htmlCode]);

  useEffect(() => {
    if (!videoBlob) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoBlob]);

  useEffect(() => {
    if (!showVideo || !videoUrl || !videoRef.current) return;
    const v = videoRef.current;
    v.load();
    void v.play().catch(() => {});
  }, [showVideo, videoUrl, iframeKey]);

  const kickIframePlay = useCallback(() => {
    triggerIframePlay(iframeRef.current);
    setTimeout(() => triggerIframePlay(iframeRef.current), 400);
    setTimeout(() => triggerIframePlay(iframeRef.current), 1200);
  }, []);

  const runExport = useCallback(async () => {
    if (!htmlCode || exporting) return;

    await MotionPlayer.ensureAudioUnlocked();

    const quota = await checkVideoExportQuota().catch(() => null);
    if (quota && !quota.allowed) {
      setQuotaBlocked(true);
      setQuotaInfo({ used: quota.videosUsed, limit: quota.videosLimit });
      toast.error("Oylik video limiti tugadi. Pro ga o'ting.");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    toast(`Rendering ${NATIVE_W}×${NATIVE_H} @ ${CAPTURE_FPS}fps…`, { duration: 6000 });

    try {
      const isJson = htmlCode.trim().startsWith("{");
      let blob: Blob;
      let mimeType: string;
      const showWatermark = !quota?.isPremium && !isPremium;

      if (isJson) {
        const schema = JSON.parse(htmlCode);
        const ar = (schema.aspect_ratio ?? schema.aspectRatio ?? aspectRatio) as AspectRatio;
        const dims = getExportDimensions(ar);
        const div = document.createElement("div");
        div.style.cssText = `width:${dims.width}px;height:${dims.height}px;position:fixed;left:-10000px;top:0;`;
        document.body.appendChild(div);
        const player = new MotionPlayer(schema, div);
        await player.build();
        player.seek(0);
        player.play();
        const res = await recordElementToVideo(div, {
          aspectRatio: ar,
          showWatermark,
          onProgress: setExportProgress,
        });
        blob = res.blob;
        mimeType = res.mimeType;
        player.destroy();
        div.remove();
      } else {
        const res = await recordHtmlToVideo(htmlCode, {
          aspectRatio,
          showWatermark,
          onProgress: setExportProgress,
        });
        blob = res.blob;
        mimeType = res.mimeType;
      }

      await recordVideoExport().catch(() => {});

      setVideoBlob(blob);
      setVideoMime(mimeType);
      setExportDone(true);
      setExportProgress(100);
      setShowVideo(true);
      onVideoReady?.(blob, mimeType);
      toast.success("Video tayyor! Download yoki Share qiling.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [htmlCode, exporting, onVideoReady, aspectRatio, NATIVE_W, NATIVE_H, isPremium]);

  useEffect(() => {
    if (autoExport && htmlCode && !autoExportTriggered.current && !exporting) {
      autoExportTriggered.current = true;
      void runExport();
    }
  }, [autoExport, htmlCode, exporting, runExport]);

  const handleDownload = () => {
    if (!videoBlob) {
      toast.error("Avval 'Render to Video' tugmasini bosing");
      return;
    }
    try {
      const safeName = brandName.replace(/[^\w\-]+/g, "-").toLowerCase();
      downloadVideoBlob(videoBlob, `${safeName}-${videoId}-flovo`, videoMime);
      toast.success(`Yuklandi: ${safeName}-${videoId}.${videoExtension(videoMime)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  const handleShare = async () => {
    if (!videoBlob) {
      toast.error("Avval videoni render qiling");
      return;
    }
    setSharing(true);
    try {
      await MotionPlayer.ensureAudioUnlocked();
      const safeName = brandName.replace(/[^\w\-]+/g, "-").toLowerCase();
      const result = await shareVideoBlob(videoBlob, `${safeName}-${videoId}-flovo`, videoMime);
      toast.success(result === "shared" ? "Ulashildi!" : "Yuklab olindi (Share API yo'q)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Share failed");
    } finally {
      setSharing(false);
    }
  };

  const handleReplay = () => {
    void MotionPlayer.ensureAudioUnlocked();
    if (showVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      void videoRef.current.play().catch(() => {});
      return;
    }
    setIframeKey((k) => k + 1);
    setPreviewLoading(true);
  };

  const handleFullscreen = () => {
    if (showVideo && videoRef.current) {
      void videoRef.current.requestFullscreen?.();
      return;
    }
    iframeRef.current?.requestFullscreen?.();
  };

  const displayH = Math.round(NATIVE_H * scale);
  const containerStyle =
    displayH > 0 ? { height: displayH } : { aspectRatio: `${NATIVE_W}/${NATIVE_H}` };

  return (
    <div className="w-full space-y-4">
      {quotaBlocked && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium text-amber-200">
            Oylik limit tugadi ({quotaInfo.used}/{quotaInfo.limit} video)
          </p>
          <Link to="/billing" className="mt-1 inline-block text-primary font-semibold hover:underline">
            Pro ga o&apos;ting → cheksiz export
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-2 px-1">
        {(["16:9", "9:16", "1:1"] as AspectRatio[]).map((ar) => (
          <button
            key={ar}
            type="button"
            disabled={exporting}
            onClick={() => setAspectRatio(ar)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              aspectRatio === ar
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-muted-foreground hover:border-primary"
            }`}
          >
            {ar}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl"
        style={containerStyle}
      >
        {previewLoading && !showVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {exporting && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-3">
            <div className="flex items-center gap-3 rounded-xl bg-black/80 backdrop-blur px-4 py-2.5">
              <Film className="h-4 w-4 text-primary animate-pulse shrink-0" />
              <div className="flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-white/70 shrink-0 min-w-[40px] text-right">
                {Math.round(exportProgress)}%
              </span>
            </div>
          </div>
        )}

        {showVideo && videoUrl ? (
          <video
            ref={videoRef}
            key={videoUrl}
            src={videoUrl}
            className="absolute inset-0 h-full w-full object-contain bg-black"
            autoPlay
            loop
            muted
            playsInline
            controls
            onLoadedData={() => setPreviewLoading(false)}
          />
        ) : (
          previewUrl &&
          scale > 0 && (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={previewUrl}
              style={{
                width: NATIVE_W,
                height: NATIVE_H,
                border: "none",
                transformOrigin: "top left",
                transform: `scale(${scale})`,
              }}
              title="Motion preview"
              allow="autoplay"
              onLoad={() => {
                setPreviewLoading(false);
                kickIframePlay();
              }}
            />
          )
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReplay}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary disabled:opacity-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Replay
          </button>

          <button
            type="button"
            onClick={() => {
              void MotionPlayer.ensureAudioUnlocked();
              setMuted((m) => !m);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-primary transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => void runExport()}
            disabled={exporting || quotaBlocked}
            className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Rendering {Math.round(exportProgress)}%
              </>
            ) : (
              <>
                <Film className="h-4 w-4" /> Render to Video
              </>
            )}
          </button>

          {exportDone && (
            <button
              type="button"
              onClick={() => setShowVideo((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                showVideo
                  ? "border-border bg-surface hover:border-primary"
                  : "border-primary bg-primary/10 text-primary"
              }`}
            >
              {showVideo ? "◀ Live Preview" : "▶ Play Video"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleFullscreen}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
          >
            <Maximize2 className="h-4 w-4" /> Fullscreen
          </button>

          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={!videoBlob || sharing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-primary disabled:opacity-40 transition-colors"
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Share
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!videoBlob}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>

      {exportDone && (
        <p className="text-xs text-muted-foreground px-1 break-all">
          ID: {videoId} · {NATIVE_W}×{NATIVE_H} · {CAPTURE_FPS}fps ·{" "}
          {videoExtension(videoMime).toUpperCase()} ·{" "}
          {videoBlob ? `${(videoBlob.size / 1024 / 1024).toFixed(1)} MB` : ""}
          {!isPremium && " · Watermark"}
        </p>
      )}
    </div>
  );
}

export default MotionVideoPlayer;
