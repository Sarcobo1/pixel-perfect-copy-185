import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  fetchBestLogo,
  fetchLogoGallery,
  formatScrapedForAI,
  logoToCustomSvg,
  scrapeWebsite,
  type FetchedLogo,
} from "@/lib/scrape-website";
import { callOpenRouter } from "@/lib/api/openrouter";

export type ExtractedLogo = {
  url: string;
  data_url: string;
  source: string;
  svg?: string;
};

export type ExtractedBrand = {
  brand_name?: string;
  tagline?: string;
  industry?: string;
  description?: string;
  brand_personality?: string;
  color_mood?: string;
  primary_color?: string;
  suggested_palette?: string;
  target_audience?: string;
  motion_preset?: string;
  suggested_voice?: string;
  headline?: string;
  features?: string[];
  cta_text?: string;
  source_url: string;
  scraped_title: string;
  scraped_description: string;
  logo_url?: string;
  logo_data_url?: string;
  logo_svg?: string;
  logo_source?: string;
  logos?: ExtractedLogo[];
  font_family?: string;
};

function toExtractedLogo(logo: FetchedLogo): ExtractedLogo {
  return {
    url: logo.url,
    data_url: logo.dataUrl,
    source: logo.source,
    svg: logo.svgContent ?? logoToCustomSvg(logo),
  };
}

export function brandContextForVideo(
  brand: ExtractedBrand,
): Record<string, string | string[]> {
  const skip = new Set(["logos", "logo_data_url", "logo_svg"]);
  const out: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(brand)) {
    if (skip.has(key)) continue;
    if (typeof value === "string") {
      out[key] = value;
    } else if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      out[key] = value;
    }
  }

  if (brand.logo_data_url || brand.logo_url) {
    out.logo_provided = "true";
    if (brand.logo_url) out.logo_url = brand.logo_url;
    out.logo_instruction =
      "MANDATORY: include empty <img id=\"brand-logo\" alt=\"Logo\" /> centered in scene-1 hero AND scene-6 outro. Real logo image is injected automatically — do NOT replace with text-only brand name.";
  }

  return out;
}

export const extractBrand = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      url: z.string().min(1, "URL is required"),
    }),
  )
  .handler(async ({ data }) => {
    let scraped;
    try {
      scraped = await scrapeWebsite(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch website";
      throw new Error(`Website scrape failed: ${message}`);
    }

    const [bestLogo, logoGallery] = await Promise.all([
      fetchBestLogo(scraped.logoCandidates),
      fetchLogoGallery(scraped.logoCandidates, 4),
    ]);

    const websiteContext = formatScrapedForAI(scraped);

    const raw = await callOpenRouter({
      model: "qwen3.7-plus",
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: `You are a brand intelligence AI. You receive REAL scraped data from a website.
Analyze the actual page content, meta tags, headings, and text to extract accurate brand information.
Do NOT guess or invent details that contradict the scraped content.
Return ONLY a JSON object — no markdown, no explanation:
{
  "brand_name": "Official brand name from the website",
  "tagline": "Their tagline or slogan from the site content",
  "industry": "e.g. E-commerce, SaaS, Fashion, Finance",
  "description": "2-sentence description based on actual page content",
  "brand_personality": "cinematic|energetic|minimal|bold",
  "color_mood": "dark|vibrant|pastel|neon",
  "primary_color": "#hexcode — use theme-color if available, else infer from brand",
  "suggested_palette": "RetroElectric|CloudDancer|Glassmorphism|MinimalMaximalism",
  "target_audience": "who their customers are based on content",
  "motion_preset": "mixed_media|radical_metamorphosis|tactile_3d|seamless_flow_ui|kinetic_geometric|neo_brutalist|analog_vhs|immersive_pov|saas_explainer|eco_minimal",
  "suggested_voice": "Cinematic|Bold|Warm|Tech",
  "headline": "punchy 6-8 word value proposition from site content",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4"],
  "cta_text": "action-oriented CTA under 4 words",
  "font_family": "primary Google Font or font-family from website CSS"
}`,
        },
        {
          role: "user",
          content: `Analyze this REAL website data and return brand JSON:\n\n${websiteContext}`,
        },
      ],
    });
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let brandData: Record<string, string | string[]> = {};
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      brandData = JSON.parse(match ? match[0] : cleaned);
    } catch {
      brandData = {
        brand_name: scraped.ogTitle || scraped.title || scraped.domain.split(".")[0],
        tagline: scraped.description?.slice(0, 80) || "Building something great",
        industry: "Technology",
        description:
          scraped.description ||
          `${scraped.domain} is a modern brand building great products.`,
        brand_personality: "cinematic",
        color_mood: "dark",
        primary_color: scraped.themeColor || "#6aff3d",
        suggested_palette: "CloudDancer",
        target_audience: "Forward-thinking individuals",
        motion_preset: "mixed_media",
        suggested_voice: "Cinematic",
        headline: scraped.headings[0] || "The future starts here",
        features: scraped.headings.slice(0, 4).length
          ? scraped.headings.slice(0, 4)
          : ["Fast", "Smart", "Beautiful", "Powerful"],
        cta_text: "Get started",
      };
    }

    const logos = logoGallery.map(toExtractedLogo);
    const fontFamily =
      typeof brandData.font_family === "string"
        ? brandData.font_family
        : scraped.fontFamilies[0];

    return {
      ...brandData,
      ...(fontFamily ? { font_family: fontFamily } : {}),
      source_url: scraped.url,
      scraped_title: scraped.title,
      scraped_description: scraped.description,
      logo_url: bestLogo?.url,
      logo_data_url: bestLogo?.dataUrl,
      logo_svg: bestLogo ? logoToCustomSvg(bestLogo) : undefined,
      logo_source: bestLogo?.source,
      logos,
    } satisfies ExtractedBrand;
  });
