import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MotionVideoPlayer } from "@/components/MotionVideoPlayer";
import { toast } from "sonner";
import { Sparkles, Loader2, Globe, ArrowRight, RotateCcw } from "lucide-react";
import { extractBrand, type ExtractedBrand, brandContextForVideo } from "@/lib/api/extract-brand";
import { createProject } from "@/lib/api/server-fns";
import { generateVideoJson } from "@/lib/api/generate-video";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "New project — SOTA Flovo" }] }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "extracting" | "generating" | "done">("idle");
  const [genChars, setGenChars] = useState(0);
  const [htmlCode, setHtmlCode] = useState<string | null>(null);
  const [brand, setBrand] = useState<ExtractedBrand | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { toast.error("Website URL kiriting"); return; }

    try {
      setPhase("extracting");
      setGenChars(0);

      const extracted = await extractBrand({ data: { url: url.trim() } }).catch((err) => {
        console.error("Extraction failed, switching to fallback:", err);
        return null;
      });

      let domainFallback = "Brand";
      try {
        const u = new URL(url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
        domainFallback = u.hostname.replace(/^www\./, "").split(".")[0];
        domainFallback = domainFallback.charAt(0).toUpperCase() + domainFallback.slice(1);
      } catch {}

      const safeExtracted = extracted || {
        brand_name: domainFallback,
        description: "Innovative company",
        tagline: "Shaping the future",
        scraped_description: "",
        source_url: url.trim(),
        scraped_title: domainFallback,
      };

      setBrand(safeExtracted as ExtractedBrand);
      setPhase("generating");

      const brandCtx = brandContextForVideo(safeExtracted as ExtractedBrand) || {};

      const result = await generateVideoJson({
        data: {
          description: brandCtx.description || "",
          brandUrl: url.trim(),
          palette: (safeExtracted as ExtractedBrand).suggested_palette ?? "CloudDancer",
          logoDataUrl:
            (safeExtracted as ExtractedBrand).logo_data_url ??
            (safeExtracted as ExtractedBrand).logos?.[0]?.data_url,
          customPrompt: customPrompt.trim() || undefined,
          extractedBrand: brandCtx as any,
        },
      });

      const generatedHtml = JSON.stringify(result.schema);
      setHtmlCode(generatedHtml);

      const projectName =
        name.trim() || result.brandName || (safeExtracted as ExtractedBrand).brand_name || domainFallback || "Brand reel";

      let pid = `ai-${Date.now()}`;
      try {
        const saved = await createProject({
          data: {
            name: projectName,
            html_code: generatedHtml,
            prompt: url.trim(),
          },
        });
        if (saved?.project?.id) pid = saved.project.id;
      } catch (err) {
        console.warn("Failed to save project:", err);
      }

      setProjectId(pid);
      setPhase("done");
    } catch (err: any) {
      toast.error(err?.message ?? "Generation error");
      setPhase("idle");
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setHtmlCode(null);
    setBrand(null);
    setProjectId(null);
    setUrl("");
    setName("");
    setCustomPrompt("");
    setGenChars(0);
  };

  const isBusy = phase === "extracting" || phase === "generating";

  // ── Done state: full-screen video player ──────────────────
  if (phase === "done" && htmlCode) {
    return (
      <>
        <TopBar title={brand?.brand_name ?? "Video"} />
        <main className="mx-auto max-w-7xl px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top bar with actions */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <h1 
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}
              >
                {brand?.brand_name ?? "Motion Video"}
              </h1>
              {brand?.tagline && (
                <p 
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    marginTop: '4px'
                  }}
                >
                  &ldquo;{brand.tagline}&rdquo;
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {projectId && (
                <button
                  onClick={() =>
                    navigate({
                      to: "/projects/$id",
                      params: { id: projectId },
                      search: { brandUrl: url.trim() || undefined },
                    })
                  }
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Open Editor <ArrowRight className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleReset}
                className="btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw className="h-4 w-4" /> New Video
              </button>
            </div>
          </div>

          {/* Player — takes up most of the screen */}
          <MotionVideoPlayer
            htmlCode={htmlCode}
            brandName={brand?.brand_name ?? name ?? "video"}
          />
        </main>
      </>
    );
  }

  // ── Form state ────────────────────────────────────────────
  return (
    <>
      <TopBar title="New project" />
      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Hero Section with Gradient Background */}
        <div 
          style={{
            marginBottom: '48px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          {/* Background decoration */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(124, 184, 42, 0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
          
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary-300)',
              background: 'linear-gradient(135deg, rgba(124, 184, 42, 0.1) 0%, rgba(124, 184, 42, 0.05) 100%)',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--primary-700)',
              boxShadow: 'inset 0 1px 2px rgba(124, 184, 42, 0.1)'
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: 'var(--primary-600)' }} /> 
            <span>AI Motion Brand</span>
          </div>
          
          <h1 
            style={{
              fontSize: '42px',
              fontWeight: '800',
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: '16px',
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary-600) 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Create Your Brand Reel
          </h1>
          
          <p 
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              maxWidth: '500px',
              margin: '0 auto',
              fontWeight: '500'
            }}
          >
            Enter any website URL and our AI will automatically generate a stunning 30-second motion video with your brand colors, logo, and style.
          </p>
        </div>

        {/* Main Form Card with Enhanced Styling */}
        <form
          onSubmit={handleGenerate}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            borderRadius: '12px',
            border: '1px solid var(--primary-200)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(124, 184, 42, 0.03) 100%)',
            backdropFilter: 'blur(8px)',
            padding: '48px 40px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
          }}
        >
          {/* Section 1: Website URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primary-600)',
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  background: 'var(--primary-100)',
                  borderRadius: '50%',
                  textAlign: 'center',
                  lineHeight: '16px'
                }}
              >
                1
              </span>
              <label 
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--text-primary)'
                }}
              >
                Website URL <span style={{ color: 'var(--primary-600)' }}>*</span>
              </label>
            </div>
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <Globe 
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary-500)',
                  width: '18px',
                  height: '18px'
                }}
              />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                required
                placeholder="https://yourcompany.com"
                disabled={isBusy}
                style={{
                  width: '100%',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  padding: '14px 16px 14px 48px',
                  fontSize: '15px',
                  border: '2px solid var(--primary-200)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 184, 42, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--primary-200)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <p 
              style={{
                marginTop: '8px',
                fontSize: '13px',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ✨ Logo, colors, and brand data extracted automatically
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, var(--primary-200), transparent)' }} />

          {/* Section 2: Project Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Project Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--primary-600)',
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    background: 'var(--primary-100)',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '16px'
                  }}
                >
                  2
                </span>
                <label 
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: 'var(--text-primary)'
                  }}
                >
                  Project Name
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Optional</span>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Q1 brand campaign"
                disabled={isBusy}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid var(--primary-150)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-400)';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 184, 42, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--primary-150)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Style Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span 
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--primary-600)',
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    background: 'var(--primary-100)',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '16px'
                  }}
                >
                  3
                </span>
                <label 
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: 'var(--text-primary)'
                  }}
                >
                  Style Guide
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>Optional</span>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g: white background, red accent colors, cyberpunk style, minimalist design, add countdown timer..."
                rows={4}
                disabled={isBusy}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid var(--primary-150)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  lineHeight: '1.5'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-400)';
                  e.target.style.background = 'rgba(255, 255, 255, 1)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 184, 42, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--primary-150)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <p 
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚡ <span>Be specific about colors, layouts, and effects for better results</span>
              </p>
            </div>
          </div>

          {/* Submit Button - Premium Style */}
          <button
            type="submit"
            disabled={isBusy}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '16px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: '700',
              background: isBusy ? 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)' : 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(124, 184, 42, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: isBusy ? 0.9 : 1,
              transform: isBusy ? 'scale(0.98)' : 'scale(1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isBusy) {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 184, 42, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isBusy) {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 184, 42, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isBusy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {phase === "extracting"
                    ? "Extracting brand…"
                    : genChars > 0
                      ? `Generating… ${(genChars / 1000).toFixed(1)}k`
                      : "Creating your video…"}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate Video</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        {/* Trust indicators at bottom */}
        <div 
          style={{
            marginTop: '48px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
            ✓ No credit card required
          </div>
          <div style={{ width: '4px', height: '4px', background: 'var(--primary-300)', borderRadius: '50%' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
            ✓ Takes 2-3 minutes
          </div>
          <div style={{ width: '4px', height: '4px', background: 'var(--primary-300)', borderRadius: '50%' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>
            ✓ Fully editable
          </div>
        </div>
      </main>
    </>
  );
}
