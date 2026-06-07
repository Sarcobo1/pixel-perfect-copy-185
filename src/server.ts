import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { JSON_MOTION_SYSTEM_PROMPT, buildUserPrompt } from "./lib/api/video-prompt";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

const MODEL_FALLBACKS = [
  "qwen3.6-max-preview",
  "qwen-max",
  "qwen-plus",
];

async function handleGenerateStream(request: Request): Promise<Response> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "DASHSCOPE_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    brandInfo?: string;
    palette?: string;
    primaryColor?: string;
    socialLine?: string;
    brandUrl?: string;
    animationStyle?: string;
    voice?: string;
    fontFamily?: string;
    logoProvided?: boolean;
    customPrompt?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userPrompt = buildUserPrompt({
    brandInfo: body.brandInfo ?? "Brand description not provided",
    palette: body.palette ?? "Lime",
    socialLine: body.socialLine,
    brandUrl: body.brandUrl,
    customPrompt: body.customPrompt,
  });

  const messages = [
    { role: "system" as const, content: JSON_MOTION_SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  for (let i = 0; i < MODEL_FALLBACKS.length; i++) {
    const model = MODEL_FALLBACKS[i];
    console.log(`[stream] trying ${model} (${i + 1}/${MODEL_FALLBACKS.length})`);

    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(DASHSCOPE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 8000,
          stream: true,
          messages,
        }),
      });
    } catch (fetchErr) {
      console.warn(`[stream] ${model} fetch error:`, fetchErr);
      if (i === MODEL_FALLBACKS.length - 1) {
        return new Response(JSON.stringify({ error: "Network error reaching AI provider" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      continue;
    }

    if (upstreamRes.status === 429 || upstreamRes.status === 404) {
      console.warn(`[stream] ${model} ${upstreamRes.status === 429 ? "rate-limited" : "not found"}, skipping…`);
      continue;
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "unknown");
      console.error(`[stream] ${model} error ${upstreamRes.status}:`, errText);
      if (i === MODEL_FALLBACKS.length - 1) {
        return new Response(JSON.stringify({ error: `Generation failed: ${errText}` }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      continue;
    }

    console.log(`[stream] streaming with ${model}`);

    // Pipe OpenRouter SSE stream straight to the client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    writer.write(encoder.encode(`: model=${model}\n\n`)).catch(() => {});

    (async () => {
      try {
        const reader = upstreamRes.body!.getReader();
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

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      },
    });
  }

  return new Response(
    JSON.stringify({ error: "All AI models are unavailable. Please try again in a minute." }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Intercept streaming generation before TanStack Start handles it
      const url = new URL(request.url);
      if (url.pathname === "/api/generate-stream" && request.method === "POST") {
        return await handleGenerateStream(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
