export interface ScrapedWebsite {
  url: string;
  domain: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  themeColor: string;
  keywords: string;
  headings: string[];
  bodyText: string;
  links: string[];
  logoCandidates: LogoCandidate[];
  fontFamilies: string[];
}

export interface LogoCandidate {
  url: string;
  source: string;
  score: number;
}

export interface FetchedLogo {
  url: string;
  dataUrl: string;
  mimeType: string;
  svgContent?: string;
  source: string;
}

function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith("data:")) return trimmed;
    if (trimmed.startsWith("mailto:") || trimmed.startsWith("javascript:"))
      return null;
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

function extractFonts(html: string): string[] {
  const found = new Set<string>();
  const skip = /^(inherit|initial|unset|serif|sans-serif|monospace|system-ui|cursive|fantasy)$/i;

  const gfMatches = html.matchAll(/fonts\.googleapis\.com\/css2?\?[^"'\s>]+/gi);
  for (const m of gfMatches) {
    const familyMatch = m[0].match(/family=([^&"'\s>]+)/i);
    if (familyMatch) {
      decodeURIComponent(familyMatch[1])
        .split("|")
        .forEach((f) => {
          const name = f.split(":")[0]?.replace(/\+/g, " ").trim();
          if (name && !skip.test(name)) found.add(name);
        });
    }
  }

  const ffMatches = html.matchAll(/font-family:\s*([^;}{]+)/gi);
  for (const m of ffMatches) {
    m[1]
      .split(",")
      .map((f) => f.replace(/['"]/g, "").trim())
      .filter((f) => f && !skip.test(f))
      .slice(0, 1)
      .forEach((f) => found.add(f));
  }

  return [...found].slice(0, 4);
}

function extractAttr(tag: string, attr: string): string {
  const match = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() ?? "";
}

function extractLinkIcons(html: string, baseUrl: string): LogoCandidate[] {
  const results: LogoCandidate[] = [];
  const linkPattern = /<link[^>]+>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const tag = match[0];
    const rel = extractAttr(tag, "rel").toLowerCase();
    const href = extractAttr(tag, "href");
    if (!href) continue;

    const resolved = resolveUrl(href, baseUrl);
    if (!resolved) continue;

    if (rel.includes("apple-touch-icon")) {
      results.push({ url: resolved, source: "apple-touch-icon", score: 90 });
    } else if (rel.includes("icon") || rel.includes("shortcut icon")) {
      const sizes = extractAttr(tag, "sizes");
      const sizeScore = sizes.includes("192") || sizes.includes("180") ? 75 : 55;
      results.push({ url: resolved, source: "favicon", score: sizeScore });
    } else if (rel.includes("mask-icon")) {
      results.push({ url: resolved, source: "mask-icon", score: 70 });
    }
  }

  return results;
}

function extractLogoImages(html: string, baseUrl: string): LogoCandidate[] {
  const results: LogoCandidate[] = [];
  const imgPattern = /<img[^>]+>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(html)) !== null) {
    const tag = match[0];
    const src = extractAttr(tag, "src");
    if (!src) continue;

    const alt = extractAttr(tag, "alt").toLowerCase();
    const cls = extractAttr(tag, "class").toLowerCase();
    const id = extractAttr(tag, "id").toLowerCase();
    const combined = `${alt} ${cls} ${id} ${src.toLowerCase()}`;

    if (/logo|brand|site-icon|navbar-brand|header-logo/.test(combined)) {
      const resolved = resolveUrl(src, baseUrl);
      if (resolved) {
        const inHeader = /header|nav|navbar/i.test(
          html.slice(Math.max(0, match.index - 400), match.index),
        );
        results.push({
          url: resolved,
          source: inHeader ? "header-logo" : "logo-image",
          score: inHeader ? 100 : 85,
        });
      }
    }
  }

  return results;
}

function extractJsonLdLogos(html: string, baseUrl: string): LogoCandidate[] {
  const results: LogoCandidate[] = [];
  const pattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const logo = item?.logo ?? item?.image;
        if (typeof logo === "string") {
          const resolved = resolveUrl(logo, baseUrl);
          if (resolved) results.push({ url: resolved, source: "json-ld", score: 88 });
        } else if (logo?.url) {
          const resolved = resolveUrl(String(logo.url), baseUrl);
          if (resolved) results.push({ url: resolved, source: "json-ld", score: 88 });
        }
      }
    } catch {
      // invalid JSON-LD
    }
  }

  return results;
}

function dedupeLogoCandidates(candidates: LogoCandidate[]): LogoCandidate[] {
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter((c) => {
      if (seen.has(c.url)) return false;
      seen.add(c.url);
      return true;
    });
}

function extractLogoCandidates(html: string, baseUrl: string): LogoCandidate[] {
  const parsed = new URL(baseUrl);
  const origin = parsed.origin;

  const candidates: LogoCandidate[] = [
    ...extractLogoImages(html, baseUrl),
    ...extractJsonLdLogos(html, baseUrl),
    ...extractLinkIcons(html, baseUrl),
  ];

  const ogLogo = extractMeta(html, "og:logo");
  if (ogLogo) {
    const resolved = resolveUrl(ogLogo, baseUrl);
    if (resolved) candidates.push({ url: resolved, source: "og:logo", score: 82 });
  }

  const ogImage = extractMeta(html, "og:image");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl);
    if (resolved) {
      candidates.push({ url: resolved, source: "og:image", score: 45 });
    }
  }

  candidates.push({
    url: `${origin}/favicon.ico`,
    source: "favicon-default",
    score: 35,
  });
  candidates.push({
    url: `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`,
    source: "google-favicon",
    score: 30,
  });

  return dedupeLogoCandidates(candidates).slice(0, 8);
}

function bufferToDataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function fetchLogoAsset(
  candidate: LogoCandidate,
): Promise<FetchedLogo | null> {
  try {
    const response = await fetch(candidate.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SOTAFlovo/1.0; +https://sotaflovo.app)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const mimeType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/png";
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0 || buffer.byteLength > 2_000_000) return null;

    if (mimeType.includes("svg") || candidate.url.endsWith(".svg")) {
      const svgText = new TextDecoder().decode(buffer);
      if (!svgText.includes("<svg")) return null;
      return {
        url: candidate.url,
        dataUrl: `data:image/svg+xml;base64,${Buffer.from(svgText, "utf-8").toString("base64")}`,
        mimeType: "image/svg+xml",
        svgContent: svgText,
        source: candidate.source,
      };
    }

    const dataUrl = bufferToDataUrl(buffer, mimeType);
    return {
      url: candidate.url,
      dataUrl,
      mimeType,
      source: candidate.source,
    };
  } catch {
    return null;
  }
}

export async function fetchBestLogo(
  candidates: LogoCandidate[],
): Promise<FetchedLogo | null> {
  for (const candidate of candidates) {
    const fetched = await fetchLogoAsset(candidate);
    if (fetched) return fetched;
  }
  return null;
}

export async function fetchLogoGallery(
  candidates: LogoCandidate[],
  limit = 4,
): Promise<FetchedLogo[]> {
  const gallery: FetchedLogo[] = [];
  for (const candidate of candidates) {
    if (gallery.length >= limit) break;
    const fetched = await fetchLogoAsset(candidate);
    if (fetched && !gallery.some((g) => g.dataUrl === fetched.dataUrl)) {
      gallery.push(fetched);
    }
  }
  return gallery;
}

function rasterToSvg(dataUrl: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><image href="${dataUrl}" width="200" height="200" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

export function logoToCustomSvg(logo: FetchedLogo): string {
  if (logo.svgContent) return logo.svgContent;
  return rasterToSvg(logo.dataUrl);
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : "";
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const pattern = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && headings.length < 8) {
    const text = stripTags(match[1]).replace(/\s+/g, " ").trim();
    if (text.length > 2 && text.length < 200) headings.push(text);
  }
  return headings;
}

function extractBodyText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  const text = stripTags(withoutScripts).replace(/\s+/g, " ").trim();
  return text.slice(0, 2000);
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const pattern = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && links.size < 12) {
    try {
      const href = match[1].trim();
      if (href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
      const resolved = new URL(href, baseUrl).href;
      links.add(resolved);
    } catch {
      // skip invalid URLs
    }
  }
  return [...links];
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export async function scrapeWebsite(url: string): Promise<ScrapedWebsite> {
  const normalized = normalizeUrl(url);
  const parsed = new URL(normalized);
  const domain = parsed.hostname.replace(/^www\./, "");

  const [response, jinaResponse] = await Promise.allSettled([
    fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SOTAFlovo/1.0; +https://sotaflovo.app)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    }),
    fetch(`https://r.jina.ai/${normalized}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SOTAFlovo/1.0)",
      },
      signal: AbortSignal.timeout(15000),
    })
  ]);

  let html = "";
  if (response.status === "fulfilled" && response.value.ok) {
    html = await response.value.text();
  }

  let jinaText = "";
  if (jinaResponse.status === "fulfilled" && jinaResponse.value.ok) {
    jinaText = await jinaResponse.value.text();
  }

  if (!html && !jinaText) {
    throw new Error(`Could not fetch website. Either blocked or invalid.`);
  }

  const standardBodyText = extractBodyText(html);
  // Use jinaText if it's substantial, otherwise fallback to standard html extraction
  const finalBodyText = jinaText.length > 300 ? jinaText.slice(0, 3000) : standardBodyText;

  return {
    url: normalized,
    domain,
    title: extractTitle(html),
    description: extractMeta(html, "description"),
    ogTitle: extractMeta(html, "og:title"),
    ogDescription: extractMeta(html, "og:description"),
    ogImage: extractMeta(html, "og:image"),
    themeColor: extractMeta(html, "theme-color"),
    keywords: extractMeta(html, "keywords"),
    headings: extractHeadings(html),
    bodyText: finalBodyText,
    links: extractLinks(html, normalized),
    logoCandidates: extractLogoCandidates(html, normalized),
    fontFamilies: extractFonts(html),
  };
}

export function formatScrapedForAI(scraped: ScrapedWebsite): string {
  const sections = [
    `URL: ${scraped.url}`,
    `Domain: ${scraped.domain}`,
    scraped.title && `Page Title: ${scraped.title}`,
    scraped.ogTitle && scraped.ogTitle !== scraped.title && `OG Title: ${scraped.ogTitle}`,
    scraped.description && `Meta Description: ${scraped.description}`,
    scraped.ogDescription &&
      scraped.ogDescription !== scraped.description &&
      `OG Description: ${scraped.ogDescription}`,
    scraped.keywords && `Keywords: ${scraped.keywords}`,
    scraped.themeColor && `Theme Color: ${scraped.themeColor}`,
    scraped.fontFamilies.length > 0 &&
      `Fonts detected: ${scraped.fontFamilies.join(", ")}`,
    scraped.ogImage && `OG Image: ${scraped.ogImage}`,
    scraped.logoCandidates.length > 0 &&
      `Logo URLs found: ${scraped.logoCandidates.map((l) => l.url).join(", ")}`,
    scraped.headings.length > 0 && `Headings: ${scraped.headings.join(" | ")}`,
    scraped.bodyText && `Page Content (excerpt): ${scraped.bodyText.slice(0, 1200)}`,
    scraped.links.length > 0 &&
      `Social/Links found: ${scraped.links.slice(0, 6).join(", ")}`,
  ].filter(Boolean);

  return sections.join("\n");
}
