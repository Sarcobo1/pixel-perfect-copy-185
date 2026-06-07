import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import {
  StepIndicator,
  STEPS,
  type StepKey,
} from "@/components/editor/StepIndicator";
import {
  Play,
  Loader2,
  CheckCircle2,
  Sparkles,
  Mic,
  Palette as PaletteIcon,
  Type as TypeIcon,
  Image as ImageIcon,
  Upload,
  Globe,
  RefreshCw,
} from "lucide-react";
import type { Project } from "@/lib/db.server";
import { toast } from "sonner";
import * as si from "simple-icons";
import { extractBrand, type ExtractedBrand, type ExtractedLogo, brandContextForVideo } from "@/lib/api/extract-brand";
import { generateVideoJson } from "@/lib/api/generate-video";
import { getProject, updateProject } from "@/lib/api/server-fns";
import {
  buildTimelineFromBrand,
  timelineProgressWidth,
} from "@/lib/timeline";
import { MotionVideoPlayer } from "@/components/MotionVideoPlayer";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Editor — SOTA Flovo" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    brandUrl: typeof search.brandUrl === "string" ? search.brandUrl : undefined,
  }),
  component: ProjectEditor,
});

const VOICES = ["Cinematic", "Bold", "Warm", "Tech"];
const PALETTES = [
  { name: "Lime", colors: ["#a3e635", "#84cc16", "#0a0a0f", "#fafafa"] },
  { name: "Ocean", colors: ["#0ea5e9", "#0369a1", "#0c4a6e", "#f0f9ff"] },
  { name: "Sunset", colors: ["#f97316", "#dc2626", "#7c2d12", "#fff7ed"] },
  { name: "Royal", colors: ["#8b5cf6", "#6d28d9", "#1e1b4b", "#f5f3ff"] },
];

// Popular brand icons from simple-icons
const POPULAR_ICON_SLUGS = [
  "siInstagram",
  "siTiktok",
  "siYoutube",
  "siX",
  "siFacebook",
  "siLinkedin",
  "siTelegram",
  "siWhatsapp",
  "siSpotify",
  "siNetflix",
  "siApple",
  "siGoogle",
  "siAmazon",
  "siMeta",
  "siOpenai",
  "siGithub",
];

interface SelectedLogo {
  type: "icon" | "text" | "custom" | "website";
  slug?: string;
  svg?: string;
  title?: string;
  customSvg?: string;
  textValue?: string;
  imageUrl?: string;
  source?: string;
}

function ProjectEditor() {
  const { id } = useParams({ from: "/_authenticated/projects/$id" });
  const { brandUrl: initialBrandUrl } = Route.useSearch();
  const [project, setProject] = useState<Project | null>(null);
  const [step, setStep] = useState<StepKey>("brand");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  // form state
  const [brandUrl, setBrandUrl] = useState("");
  const [palette, setPalette] = useState(PALETTES[0].name);
  const [voice, setVoice] = useState(VOICES[0]);
  const [selectedLogo, setSelectedLogo] = useState<SelectedLogo | null>(null);
  const [logoTextValue, setLogoTextValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Brand extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractedBrand, setExtractedBrand] = useState<ExtractedBrand | null>(
    null,
  );
  const [renderError, setRenderError] = useState<string | null>(null);
  const [websiteLogos, setWebsiteLogos] = useState<ExtractedLogo[]>([]);

  const applyBrandExtraction = (result: ExtractedBrand, goToLogo = true) => {
    setExtractedBrand(result);

    if (result.suggested_palette) {
      const matched = PALETTES.find(
        (p) =>
          p.name.toLowerCase() ===
          String(result.suggested_palette).toLowerCase(),
      );
      if (matched) setPalette(matched.name);
    }
    if (result.suggested_voice) {
      const matched = VOICES.find(
        (v) =>
          v.toLowerCase() === String(result.suggested_voice).toLowerCase(),
      );
      if (matched) setVoice(matched);
    }
    if (result.brand_name) {
      setLogoTextValue(String(result.brand_name));
    }

    const logos = result.logos ?? [];
    setWebsiteLogos(logos);

    const primaryLogo = logos[0];
    if (primaryLogo) {
      setSelectedLogo({
        type: "website",
        imageUrl: primaryLogo.data_url,
        customSvg: primaryLogo.svg,
        title: String(result.brand_name ?? "Website logo"),
        source: primaryLogo.source,
      });
    } else if (result.logo_data_url) {
      setSelectedLogo({
        type: "website",
        imageUrl: result.logo_data_url,
        customSvg: result.logo_svg,
        title: String(result.brand_name ?? "Website logo"),
        source: result.logo_source,
      });
    }

    if (goToLogo && (primaryLogo || result.logo_data_url)) {
      setStep("logo");
    }
  };

  useEffect(() => {
    if (initialBrandUrl) {
      setBrandUrl(initialBrandUrl);
    }
  }, [initialBrandUrl]);

  useEffect(() => {
    if (!initialBrandUrl || extractedBrand || extracting) return;
    void (async () => {
      setExtracting(true);
      try {
        const result = await extractBrand({ data: { url: initialBrandUrl } });
        applyBrandExtraction(result);
        toast.success(
          `Brand extracted: ${result.brand_name ?? initialBrandUrl}${result.logo_data_url ? " + logo" : ""}`,
        );
      } catch {
        // User can retry manually from Brand step
      } finally {
        setExtracting(false);
      }
    })();
  }, [initialBrandUrl, extractedBrand, extracting]);

  useEffect(() => {
    getProject({ data: { id } })
      .then(({ project: data }) => {
        if (!data) return;
        setProject(data);
        if (data.brand_identity && typeof data.brand_identity === "object") {
          setExtractedBrand((prev) =>
            prev ?? (data.brand_identity as ExtractedBrand),
          );
        }
        if (data.prompt && String(data.prompt).startsWith("http")) {
          setBrandUrl((prev) => prev || String(data.prompt));
        }
      })
      .catch(() => {});
  }, [id]);

  const handleExtractBrand = async () => {
    if (!brandUrl.trim()) {
      toast.error("Please enter a website URL");
      return;
    }
    setExtracting(true);
    setExtractedBrand(null);
    try {
      const result = await extractBrand({ data: { url: brandUrl } });
      applyBrandExtraction(result);
      toast.success(
        `Brand extracted: ${result.brand_name ?? brandUrl}${result.logo_data_url ? " — logo loaded" : ""} ✨`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      toast.error(msg);
    } finally {
      setExtracting(false);
    }
  };

  const saveProjectHtml = async (
    htmlCode: string,
    brandContext: Record<string, string | string[]>,
  ) => {
    const updated = {
      ...project,
      html_code: htmlCode,
      brand_identity: brandContext,
      status: "done" as const,
      duration_ms: 30000,
      updated_at: new Date().toISOString(),
    };
    setProject(updated as Project);

    try {
      await updateProject({
        data: {
          id,
          html_code: htmlCode,
          brand_identity: brandContext,
          status: "done",
          duration_ms: 30000,
        },
      });
    } catch (err) {
      console.error("Failed to save project:", err);
    }
  };

  const startRender = async () => {
    if (!extractedBrand && !brandUrl.trim()) {
      toast.error("Extract brand from a website URL first (Brand step)");
      setStep("brand");
      return;
    }

    setRendering(true);
    setProgress(5);
    setDone(false);
    setRenderError(null);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 800);

    try {
      const description =
        (typeof extractedBrand?.description === "string" && extractedBrand.description) ||
        (typeof extractedBrand?.tagline === "string" && extractedBrand.tagline) ||
        project?.name ||
        "Brand motion video";

      const result = await generateVideoJson({
        data: {
          description,
          brandUrl: brandUrl || undefined,
          palette,
          projectId: id,
          animationStyle: extractedBrand?.motion_preset,
          logoDataUrl:
            selectedLogo?.imageUrl ??
            extractedBrand?.logo_data_url ??
            websiteLogos[0]?.data_url,
          extractedBrand: extractedBrand
            ? brandContextForVideo(extractedBrand)
            : undefined,
          customPrompt: customPrompt || undefined,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      await saveProjectHtml(JSON.stringify(result.schema), {});

      setRendering(false);
      setDone(true);
      toast.success("Motion video generated! ✨");
    } catch (err) {
      clearInterval(progressInterval);
      setRendering(false);
      setProgress(0);
      const msg = err instanceof Error ? err.message : "Render failed";
      setRenderError(msg);
      toast.error(msg);
    }
  };

  const handleCustomSvgUpload = (file: File) => {
    if (!file.name.endsWith(".svg") && file.type !== "image/svg+xml") {
      toast.error("Please upload an SVG file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgContent = e.target?.result as string;
      setSelectedLogo({ type: "custom", customSvg: svgContent });
      toast.success("Custom SVG uploaded");
    };
    reader.readAsText(file);
  };

  const htmlCode = (project as any)?.html_code as string | undefined;

  const timelineScenes = buildTimelineFromBrand(extractedBrand, {
    brandName: project?.name,
    logoTitle: selectedLogo?.title ?? selectedLogo?.textValue,
    motionPreset: extractedBrand?.motion_preset,
  });

  if (!project) {
    return (
      <>
        <TopBar title="Loading…" />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={project.name} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <StepIndicator current={step} onSelect={setStep} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          {/* Step panel */}
          <div className="rounded-3xl border border-border bg-surface p-8">
            {step === "brand" && (
              <StepPanel
                icon={Sparkles}
                title="Extract your brand"
                body="Drop your website URL — we'll infer your brand identity in seconds."
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={brandUrl}
                      onChange={(e) => setBrandUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExtractBrand()}
                      placeholder="https://yourcompany.com"
                      className="block w-full rounded-xl border border-input bg-surface pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <button
                    onClick={handleExtractBrand}
                    disabled={extracting}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-all"
                  >
                    {extracting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Extract brand</>
                    )}
                  </button>
                </div>

                {/* Extracted brand results */}
                {extractedBrand && (
                  <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(extractedBrand.logo_data_url || websiteLogos[0]?.data_url) && (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-white p-1.5">
                            <img
                              src={
                                extractedBrand.logo_data_url ??
                                websiteLogos[0]?.data_url
                              }
                              alt="Brand logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-primary">
                            {extractedBrand.brand_name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setExtractedBrand(null);
                          setBrandUrl("");
                          setWebsiteLogos([]);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        title="Clear"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                    {extractedBrand.tagline && (
                      <p className="text-sm italic text-muted-foreground">"{extractedBrand.tagline}"</p>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {extractedBrand.industry && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <div className="text-xs text-muted-foreground mb-0.5 font-medium">Industry</div>
                          <div className="font-semibold">{extractedBrand.industry}</div>
                        </div>
                      )}
                      {extractedBrand.brand_personality && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <div className="text-xs text-muted-foreground mb-0.5 font-medium">Personality</div>
                          <div className="font-semibold capitalize">{extractedBrand.brand_personality}</div>
                        </div>
                      )}
                      {extractedBrand.suggested_palette && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <div className="text-xs text-muted-foreground mb-0.5 font-medium">Palette ✓ applied</div>
                          <div className="font-semibold">{extractedBrand.suggested_palette}</div>
                        </div>
                      )}
                      {extractedBrand.suggested_voice && (
                        <div className="rounded-xl border border-border bg-surface p-3">
                          <div className="text-xs text-muted-foreground mb-0.5 font-medium">Voice ✓ applied</div>
                          <div className="font-semibold">{extractedBrand.suggested_voice}</div>
                        </div>
                      )}
                    </div>

                    {extractedBrand.primary_color && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full border border-border shadow-sm"
                          style={{
                            background: String(extractedBrand.primary_color),
                          }}
                        />
                        <span className="text-xs font-mono text-muted-foreground">
                          {String(extractedBrand.primary_color)}
                        </span>
                        <span className="text-xs text-muted-foreground">— signature color</span>
                      </div>
                    )}

                    {extractedBrand.description && (
                      <p className="text-sm text-muted-foreground border-t border-border pt-3">
                        {extractedBrand.description}
                      </p>
                    )}

                    {(extractedBrand.logo_data_url || websiteLogos.length > 0) && (
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          Logo topildi — Logo qadamiga o&apos;tkazildi
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep("logo")}
                          className="text-xs font-semibold text-primary hover:text-primary-hover"
                        >
                          Logo sahifasini ochish →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </StepPanel>
            )}

            {step === "logo" && (
              <StepPanel icon={ImageIcon} title="Choose your logo">
                {websiteLogos.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                      Website Logos (extracted)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {websiteLogos.map((logo, idx) => {
                        const isSelected =
                          selectedLogo?.type === "website" &&
                          selectedLogo.imageUrl === logo.data_url;
                        return (
                          <button
                            key={`${logo.url}-${idx}`}
                            type="button"
                            onClick={() =>
                              setSelectedLogo({
                                type: "website",
                                imageUrl: logo.data_url,
                                customSvg: logo.svg,
                                title: extractedBrand?.brand_name
                                  ? String(extractedBrand.brand_name)
                                  : "Website logo",
                                source: logo.source,
                              })
                            }
                            className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-lime-glow"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex h-14 w-full items-center justify-center rounded-lg bg-white p-2">
                              <img
                                src={logo.data_url}
                                alt={`Logo ${idx + 1}`}
                                className="max-h-12 max-w-full object-contain"
                              />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground capitalize">
                              {logo.source.replace(/-/g, " ")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Popular brand icons */}
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                  Popular Brand Icons
                </p>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {POPULAR_ICON_SLUGS.map((slug) => {
                    const icon = (si as any)[slug];
                    if (!icon) return null;
                    const isSelected =
                      selectedLogo?.type === "icon" &&
                      selectedLogo.slug === slug;
                    return (
                      <button
                        key={slug}
                        onClick={() =>
                          setSelectedLogo({
                            type: "icon",
                            slug,
                            svg: icon.svg,
                            title: icon.title,
                          })
                        }
                        className={`group flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-lime-glow"
                            : "border-border hover:border-primary/50"
                        }`}
                        title={icon.title}
                      >
                        <div
                          className="w-8 h-8 flex items-center justify-center"
                          style={{ color: `#${icon.hex}` }}
                          dangerouslySetInnerHTML={{
                            __html: icon.svg
                              .replace(/<svg/, '<svg width="32" height="32"')
                              .replace(
                                /fill="[^"]*"/g,
                                `fill="#${icon.hex}"`,
                              ),
                          }}
                        />
                        <span className="text-xs font-medium truncate w-full text-center">
                          {icon.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload custom SVG */}
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                  Upload Custom SVG
                </p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleCustomSvgUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mb-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all ${
                    dragOver
                      ? "border-primary bg-primary/10"
                      : selectedLogo?.type === "custom"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCustomSvgUpload(file);
                    }}
                  />
                  {selectedLogo?.type === "custom" && selectedLogo.customSvg ? (
                    <div
                      className="w-16 h-16"
                      dangerouslySetInnerHTML={{
                        __html: selectedLogo.customSvg,
                      }}
                    />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Drag & drop SVG or click to browse
                      </span>
                    </>
                  )}
                </div>

                {/* Text logo option */}
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                  Text Logo
                </p>
                <div className="flex gap-3">
                  <input
                    value={logoTextValue}
                    onChange={(e) => setLogoTextValue(e.target.value)}
                    placeholder="Your brand name"
                    className="flex-1 rounded-xl border border-input bg-surface px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => {
                      if (!logoTextValue.trim()) {
                        toast.error("Enter a brand name first");
                        return;
                      }
                      setSelectedLogo({
                        type: "text",
                        textValue: logoTextValue,
                      });
                      toast.success("Text logo selected");
                    }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      selectedLogo?.type === "text"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    Use text
                  </button>
                </div>

                {/* Selected indicator */}
                {selectedLogo && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary bg-primary/10 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {selectedLogo.type === "website" && selectedLogo.imageUrl ? (
                      <img
                        src={selectedLogo.imageUrl}
                        alt="Selected logo"
                        className="h-8 w-8 object-contain rounded bg-white p-0.5"
                      />
                    ) : null}
                    <span className="text-sm font-medium text-primary">
                      {selectedLogo.type === "icon"
                        ? `${selectedLogo.title} icon selected`
                        : selectedLogo.type === "custom"
                          ? "Custom SVG selected"
                          : selectedLogo.type === "website"
                            ? `Website logo: ${selectedLogo.title ?? "extracted"}`
                            : `Text logo: "${selectedLogo.textValue}"`}
                    </span>
                  </div>
                )}
              </StepPanel>
            )}

            {step === "palette" && (
              <StepPanel icon={PaletteIcon} title="Pick a palette">
                <div className="grid grid-cols-2 gap-3">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setPalette(p.name)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        palette === p.name
                          ? "border-primary shadow-lime-glow"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="mb-3 flex h-12 overflow-hidden rounded-lg">
                        {p.colors.map((c) => (
                          <div
                            key={c}
                            className="flex-1"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <div className="text-sm font-semibold">{p.name}</div>
                    </button>
                  ))}
                </div>
              </StepPanel>
            )}

            {step === "voice" && (
              <StepPanel icon={Mic} title="Choose a voice">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {VOICES.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVoice(v)}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                        voice === v
                          ? "border-primary bg-primary-soft"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Mic className="h-6 w-6 text-primary-hover" />
                      <span className="text-sm font-semibold">{v}</span>
                    </button>
                  ))}
                </div>
              </StepPanel>
            )}

            {step === "timeline" && (
              <StepPanel
                icon={TypeIcon}
                title="Compose your timeline"
                body={
                  extractedBrand
                    ? "30-second motion reel — scenes built from your extracted brand data."
                    : "Extract brand first to populate the timeline with real content."
                }
              >
                {!extractedBrand && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Brand ma&apos;lumotlari yo&apos;q.{" "}
                    <button
                      type="button"
                      onClick={() => setStep("brand")}
                      className="font-semibold underline hover:no-underline"
                    >
                      Brand qadamida URL extract qiling
                    </button>
                  </div>
                )}
                <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total duration</span>
                  <span className="font-mono font-semibold text-foreground">
                    0:30
                  </span>
                </div>
                <div className="space-y-2">
                  {timelineScenes.map((scene) => (
                    <div
                      key={scene.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
                    >
                      <span className="text-label-mono shrink-0 text-muted-foreground pt-0.5">
                        {scene.timeLabel}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium leading-snug">
                          {scene.title}
                        </div>
                        {scene.subtitle && (
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {scene.subtitle}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${timelineProgressWidth(scene)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {scene.durationLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </StepPanel>
            )}

            {step === "render" && (
              <StepPanel icon={Play} title="Render your reel">
                {!extractedBrand && !brandUrl.trim() && (
                  <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                    Go to the Brand step and extract your website data first — AI needs real brand info to generate motion code.
                  </p>
                )}
                {renderError && (
                  <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {renderError}
                  </div>
                )}
                {!rendering && !done && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-foreground">Style instructions (optional)</label>
                      <p className="mb-2 text-xs text-muted-foreground">Faqat dizayn, rang va animatsiyaga ta'sir qiladi. Web-sayt ma'lumotlari o'zgarmaydi.</p>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Masalan: Oq fon ishlat, faqat gsap slider animatsiya qil..."
                        className="w-full rounded-xl border border-input bg-surface p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={startRender}
                      disabled={!extractedBrand && !brandUrl.trim()}
                      className="lime-glow flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" /> Generate motion video
                    </button>
                  </div>
                )}
                {rendering && (
                  <div>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        AI generating motion code…
                      </span>
                      <span className="text-label-mono text-primary-hover">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Building 30s motion reel from your brand data…
                    </p>
                  </div>
                )}
                {done && htmlCode && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-primary bg-primary-soft p-4">
                      <CheckCircle2 className="h-6 w-6 text-primary-hover shrink-0" />
                      <div>
                        <div className="font-semibold">Video tayyor</div>
                        <div className="text-xs text-muted-foreground">
                          O&apos;ng panelda ko&apos;ring va .webm sifatida yuklab oling.
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <label className="mb-2 block text-sm font-semibold text-foreground">Video sizga yoqmadimi? AI orqali o'zgartiring:</label>
                      <p className="mb-2 text-xs text-muted-foreground">Masalan: <i>"Cardlarni kattaroq qil, faqat ko'k rang ishlat, harakatlar tezlashsin"</i></p>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Sizning xohishlaringiz..."
                        className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={3}
                      />
                      <button
                        onClick={startRender}
                        disabled={rendering}
                        className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" /> Yangidan render qilish
                      </button>
                    </div>

                    <Link
                      to="/projects/$id/preview"
                      params={{ id }}
                      search={{ brandUrl: undefined }}
                      className="block text-center text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                      To&apos;liq preview →
                    </Link>
                  </div>
                )}
              </StepPanel>
            )}

            <div className="mt-8 flex justify-between border-t border-border pt-6">
              <button
                onClick={() => {
                  const i = STEPS.findIndex((s) => s.key === step);
                  if (i > 0) setStep(STEPS[i - 1].key);
                }}
                disabled={step === STEPS[0].key}
                className="rounded-full border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary-hover disabled:opacity-30"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  const i = STEPS.findIndex((s) => s.key === step);
                  if (i < STEPS.length - 1) setStep(STEPS[i + 1].key);
                }}
                disabled={step === "render"}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-30"
              >
                Continue →
              </button>
            </div>
          </div>

          {/* Preview panel */}
          <aside className="space-y-4">
            {htmlCode && done ? (
              <MotionVideoPlayer
                htmlCode={htmlCode}
                brandName={
                  extractedBrand?.brand_name ?? project.name ?? "video"
                }
                autoExport
              />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-canvas">
                <div className="relative aspect-video w-full">
                  {htmlCode ? (
                    <iframe
                      srcDoc={htmlCode}
                      className="absolute inset-0 w-full h-full border-0"
                      style={{ borderRadius: "inherit" }}
                      sandbox="allow-scripts allow-same-origin"
                      title="Generated Video Preview"
                      allow="autoplay; accelerometer; gyroscope"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-canvas to-canvas" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                        {selectedLogo?.type === "website" &&
                        selectedLogo.imageUrl ? (
                          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/95 p-3 shadow-lg">
                            <img
                              src={selectedLogo.imageUrl}
                              alt="Brand logo"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <button className="lime-glow flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-transform hover:scale-110">
                            <Play className="ml-1 h-7 w-7 fill-primary-foreground text-primary-foreground" />
                          </button>
                        )}
                        {extractedBrand?.brand_name && (
                          <p className="font-display text-lg font-semibold text-canvas-foreground text-center">
                            {extractedBrand.brand_name}
                          </p>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 text-canvas-foreground">
                        <div className="text-label-mono opacity-70">Preview</div>
                        <div className="font-display text-base font-semibold">
                          {project.name}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* removed HTML download */}

            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="text-label-mono mb-2 text-muted-foreground">
                Project info
              </div>
              <Row k="Status" v={project.status} />
              <Row k="Duration" v={`${Math.round(project.duration_ms / 1000)}s`} />
              <Row k="Palette" v={palette} />
              <Row k="Voice" v={voice} />
            </div>
            <Link
              to="/projects"
              className="block text-center text-sm text-muted-foreground hover:text-primary-hover"
            >
              ← Back to projects
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}

function StepPanel({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ElementType;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-hover">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {body && <p className="mt-2 mb-6 text-sm text-muted-foreground">{body}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between border-t border-border py-2 text-sm first:border-t-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium capitalize">{String(v)}</span>
    </div>
  );
}


