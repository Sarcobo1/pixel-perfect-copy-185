import { MotionVideoSchema } from "@/lib/motion/schema";

export function stripJsonFences(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}

type SceneLike = Record<string, unknown>;

function sceneContent(scene: SceneLike): Record<string, unknown> | undefined {
  if (scene.content && typeof scene.content === "object") {
    return scene.content as Record<string, unknown>;
  }
  return scene as Record<string, unknown>;
}

/** Validate required scene fields (supports legacy + director schema shapes) */
export function validateSceneFields(schema: unknown): void {
  const root = schema as { scenes?: SceneLike[] };
  if (!Array.isArray(root.scenes) || root.scenes.length === 0) {
    throw new Error("Schema must include a non-empty scenes array");
  }

  for (const scene of root.scenes) {
    const id = scene.id ?? scene.scene_id;
    const layoutType = scene.layout_type ?? scene.layout;
    const durationMs = scene.duration_ms ?? (typeof scene.duration === "number" ? scene.duration * 1000 : undefined);
    const content = sceneContent(scene);

    if (id === undefined || id === null) {
      throw new Error("Each scene requires id");
    }
    if (!layoutType || typeof layoutType !== "string") {
      throw new Error(`Scene ${id}: layout_type is required`);
    }
    if (durationMs === undefined || Number(durationMs) <= 0) {
      throw new Error(`Scene ${id}: duration_ms must be a positive number`);
    }
    const hasText =
      content?.headline ||
      content?.words ||
      content?.line1 ||
      content?.text ||
      content?.commands ||
      content?.stats ||
      scene.headline ||
      scene.pushStackText ||
      scene.kineticWords ||
      scene.stackWords ||
      scene.cards ||
      scene.stats ||
      scene.terminalLines ||
      scene.zoomStat;

    if (!hasText) {
      throw new Error(`Scene ${id}: content must include text or data fields`);
    }
  }
}

export function parseMotionVideoJson(raw: string): MotionVideoSchema {
  const cleaned = stripJsonFences(raw);
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  validateSceneFields(parsed);
  if (!parsed.version) parsed.version = "1.0";
  return MotionVideoSchema.parse(parsed);
}

export async function parseMotionVideoJsonWithRetry(
  fetchJson: () => Promise<string>,
  maxAttempts = 3,
): Promise<MotionVideoSchema> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const raw = await fetchJson();
      return parseMotionVideoJson(raw);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts - 1) break;
    }
  }

  throw new Error(
    `AI returned invalid JSON after ${maxAttempts} attempts: ${lastError?.message ?? "unknown"}`,
  );
}
