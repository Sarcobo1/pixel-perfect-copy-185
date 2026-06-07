export type AspectRatio = "16:9" | "9:16" | "1:1";

export function getCanvasDimensions(aspectRatio: AspectRatio = "16:9") {
  switch (aspectRatio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}

export function aspectRatioClass(aspectRatio: AspectRatio): string {
  if (aspectRatio === "9:16") return "aspect-9-16";
  if (aspectRatio === "1:1") return "aspect-1-1";
  return "aspect-16-9";
}
