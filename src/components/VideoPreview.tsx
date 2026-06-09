import { useEffect, useRef, useState } from 'react';
import { preparePreviewHtml, triggerIframePlay } from '@/lib/preview-html';

const NATIVE_W = 1920;
const NATIVE_H = 1080;

interface VideoPreviewProps {
  htmlCode: string;
}

export function VideoPreview({ htmlCode }: VideoPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / NATIVE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!htmlCode) {
      setBlobUrl(null);
      setIsLoading(false);
      setError('No HTML code provided');
      return;
    }
    try {
      const html = preparePreviewHtml(htmlCode);
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setError(null);
      setIsLoading(true);
      return () => URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process HTML code');
      setBlobUrl(null);
      setIsLoading(false);
    }
  }, [htmlCode]);

  const displayH = Math.round(NATIVE_H * scale);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl bg-black border border-slate-800/50"
        style={{ height: displayH || undefined }}
      >
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="text-center px-6">
              <svg className="w-16 h-16 text-red-400/70 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400/70 font-medium text-sm">{error}</p>
            </div>
          </div>
        )}

        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 border-r-purple-500 animate-spin" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Rendering video...</p>
            </div>
          </div>
        )}

        {blobUrl && !error && scale > 0 && (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            style={{
              width: NATIVE_W,
              height: NATIVE_H,
              border: 'none',
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
            title="Generated Video Preview"
            onLoad={() => {
              setTimeout(() => setIsLoading(false), 500);
              triggerIframePlay(iframeRef.current);
              setTimeout(() => triggerIframePlay(iframeRef.current), 800);
            }}
            onError={() => { setIsLoading(false); setError('Failed to load video preview'); }}
            allow="autoplay"
          />
        )}
      </div>

      <div className="mt-4 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
        <p className="text-xs text-slate-400">
          <span className="text-cyan-400/70 font-semibold">16:9 Preview</span> • GSAP animations enabled • Premium HD canvas rendering
        </p>
      </div>
    </div>
  );
}

export default VideoPreview;
