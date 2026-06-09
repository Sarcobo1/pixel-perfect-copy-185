import type { ExtractedBrand } from "@/lib/api/extract-brand";

export interface TimelineScene {
  id: string;
  timeMs: number;
  timeLabel: string;
  title: string;
  subtitle?: string;
  durationMs: number;
  durationLabel: string;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number): string {
  const sec = ms / 1000;
  return sec % 1 === 0 ? `${sec}s` : `${sec.toFixed(1)}s`;
}

export function buildTimelineFromBrand(
  brand: ExtractedBrand | null,
  options?: {
    brandName?: string;
    logoTitle?: string;
    motionPreset?: string;
  },
): TimelineScene[] {
  const brandName =
    brand?.brand_name ?? options?.brandName ?? options?.logoTitle ?? "Your brand";
  const headline = brand?.headline ?? brand?.tagline ?? "Your value proposition";
  const tagline =
    brand?.tagline && brand.tagline !== headline ? brand.tagline : undefined;
  const features =
    brand?.features && brand.features.length > 0
      ? brand.features.slice(0, 4)
      : ["Feature one", "Feature two", "Feature three", "Feature four"];
  const cta = brand?.cta_text ?? "Get started";
  const preset = brand?.motion_preset ?? options?.motionPreset ?? "cinematic";

  const featureStaggerMs = [9000, 9180, 9360, 9540];

  const scenes: TimelineScene[] = [
    {
      id: "logo-reveal",
      timeMs: 0,
      timeLabel: formatTime(0),
      title: `${brandName} — Logo reveal`,
      subtitle: options?.logoTitle
        ? `Logo: ${options.logoTitle}`
        : "Brand mark scales in with glow",
      durationMs: 4000,
      durationLabel: formatDuration(4000),
    },
    {
      id: "headline",
      timeMs: 4000,
      timeLabel: formatTime(4000),
      title: headline,
      subtitle: tagline ?? "Headline + tagline stagger animation",
      durationMs: 5000,
      durationLabel: formatDuration(5000),
    },
    ...features.map((feature, i) => ({
      id: `feature-${i + 1}`,
      timeMs: featureStaggerMs[i] ?? 9000 + i * 180,
      timeLabel: formatTime(featureStaggerMs[i] ?? 9000 + i * 180),
      title: `Feature ${String(i + 1).padStart(2, "0")}: ${feature}`,
      subtitle: "Card reveal in 2×2 grid",
      durationMs: i === 0 ? 9000 : 180,
      durationLabel: i === 0 ? "9s block" : "0.2s stagger",
    })),
    {
      id: "cta",
      timeMs: 18000,
      timeLabel: formatTime(18000),
      title: cta,
      subtitle: "CTA button with pulse rings",
      durationMs: 7000,
      durationLabel: formatDuration(7000),
    },
    {
      id: "outro",
      timeMs: 25000,
      timeLabel: formatTime(25000),
      title: `${brandName} — Outro`,
      subtitle: `Social handles · ${preset} preset · 30s total`,
      durationMs: 5000,
      durationLabel: formatDuration(5000),
    },
  ];

  return scenes;
}

export function timelineProgressWidth(
  scene: TimelineScene,
  totalMs = 30000,
): number {
  return Math.max(8, Math.round((scene.durationMs / totalMs) * 100));
}
