import { defineEventHandler, readBody, sendWebResponse } from "h3";
import { CINEMATIC_SYSTEM_PROMPT, PALETTE_HINTS, buildUserPrompt } from "../../src/lib/api/video-prompt";

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

const MODEL_FALLBACKS = [
  "qwen-max",      // Best quality, DashScope international
  "qwen-plus",     // Balanced
  "qwen-turbo",    // Fast fallback
];

export default defineEventHandler(async (event) => {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return sendWebResponse(
      event,
      new Response(JSON.stringify({ error: "DASHSCOPE_API_KEY not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  interface GenerateBody {
    brandInfo?: string;
    palette?: string;
    socialLine?: string;
    brandUrl?: string;
    animationStyle?: string;
    voice?: string;
    fontFamily?: string;
    customPrompt?: string;
    logoProvided?: boolean;
  }
  let body: GenerateBody = {};
  try {
    body = await readBody(event);
  } catch {
    return sendWebResponse(
      event,
      new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  const paletteHint = PALETTE_HINTS[body.palette ?? "Lime"] ?? PALETTE_HINTS.Lime;

  const userPrompt = buildUserPrompt({
    brandInfo: body.brandInfo ?? "Brand description not provided",
    paletteHint,
    socialLine: body.socialLine,
    brandUrl: body.brandUrl,
    animationStyle: body.animationStyle,
    customPrompt: body.customPrompt,
  });

  const messages = [
    { role: "system" as const, content: CINEMATIC_SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  // Model fallback loop
  for (let i = 0; i < MODEL_FALLBACKS.length; i++) {
    const model = MODEL_FALLBACKS[i];
    console.log(`[stream] trying ${model} (${i + 1}/${MODEL_FALLBACKS.length})`);

    let upstreamRes;
    try {
      upstreamRes = await fetch(DASHSCOPE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.5,        // Lower = more consistent code
          max_tokens: 14000,        // Increased for 400+ line HTML generation
          stream: true,
          messages,
        }),
      });
    } catch (fetchErr) {
      console.warn(`[stream] ${model} fetch error:`, fetchErr);
      if (i === MODEL_FALLBACKS.length - 1) {
        return sendWebResponse(
          event,
          new Response(JSON.stringify({ error: "Network error reaching AI provider" }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      continue;
    }

    if (upstreamRes.status === 429) {
      console.warn(`[stream] ${model} rate-limited, trying next…`);
      continue;
    }

    if (upstreamRes.status === 404) {
      console.warn(`[stream] ${model} not found, trying next…`);
      continue;
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "unknown");
      console.error(`[stream] ${model} error ${upstreamRes.status}:`, errText);
      if (i === MODEL_FALLBACKS.length - 1) {
        return sendWebResponse(
          event,
          new Response(JSON.stringify({ error: `Generation failed: ${errText}` }), {
            status: 502,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      continue;
    }

    console.log(`[stream] streaming with ${model}`);

    // Transform DashScope SSE stream to client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    writer.write(encoder.encode(`: model=${model}

`)).catch(() => {});

    (async () => {
      try {
        const reader = upstreamRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
      } catch (err) {
        console.error("[stream] pipe error:", err);
      } finally {
        writer.close().catch(() => {});
      }
    })();

    return sendWebResponse(
      event,
      new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
          Connection: "keep-alive",
        },
      }),
    );
  }

  return sendWebResponse(
    event,
    new Response(
      JSON.stringify({ error: "All AI models are unavailable. Please try again in a minute." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    ),
  );
});