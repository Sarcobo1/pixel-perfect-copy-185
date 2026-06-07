export type HtmlValidationResult = {
  html: string;
  ok: boolean;
  warnings: string[];
};

/** Detect truncated AI output and patch minimal closings when possible */
export function finalizeMotionHtml(html: string): HtmlValidationResult {
  const warnings: string[] = [];
  let out = html.trim();

  const hasDoctype = /<!doctype/i.test(out);
  const hasTimelines = out.includes("__timelines");
  const hasGsap = out.includes("gsap") || out.includes("GSAP");
  const hasClosingHtml = /<\/html>\s*$/i.test(out);
  const hasClosingBody = /<\/body>/i.test(out);

  if (!hasDoctype) warnings.push("missing_doctype");
  if (!hasTimelines) warnings.push("missing_gsap_timeline");
  if (!hasGsap) warnings.push("missing_gsap_cdn");
  if (!hasClosingBody) {
    warnings.push("truncated_before_body_close");
    out += "\n</body>";
  }
  if (!hasClosingHtml) {
    warnings.push("truncated_before_html_close");
    out += "\n</html>";
  }

  const ok = hasTimelines && hasGsap && hasDoctype;

  return { html: out, ok, warnings };
}

export function validationMessage(warnings: string[]): string | null {
  if (warnings.includes("truncated_before_html_close") || warnings.includes("truncated_before_body_close")) {
    return "AI javobi token limitda kesilgan — HTML to‘liq emas. Qayta generate qiling (qwen-max ishlatiladi).";
  }
  if (warnings.includes("missing_gsap_timeline")) {
    return "Animatsiya timeline topilmadi — video qotib qoladi. Qayta generate qiling.";
  }
  return null;
}
