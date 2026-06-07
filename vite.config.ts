import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";

const DASHSCOPE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL_FALLBACKS = ["qwen3.6-max-preview", "qwen-max", "qwen-plus"];

function generateStreamDevPlugin() {
  return {
    name: "api-generate-stream-dev",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        "/api/generate-stream",
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.method !== "POST") return next();

          let rawBody = "";
          req.on("data", (chunk: Buffer) => { rawBody += chunk.toString(); });
          req.on("end", async () => {
            try {
              const apiKey = process.env.DASHSCOPE_API_KEY;
              if (!apiKey) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "DASHSCOPE_API_KEY not configured" }));
                return;
              }

              const parsed = JSON.parse(rawBody || "{}");

              const { CINEMATIC_SYSTEM_PROMPT, buildPaletteHint, buildUserPrompt } =
                (await server.ssrLoadModule("/src/lib/api/video-prompt.ts")) as {
                  CINEMATIC_SYSTEM_PROMPT: string;
                  buildPaletteHint: (palette?: string, primaryColor?: string) => string;
                  buildUserPrompt: (opts: {
                    brandInfo: string;
                    paletteHint: string;
                    socialLine?: string;
                    brandUrl?: string;
                    animationStyle?: string;
                    voice?: string;
                    fontFamily?: string;
                    logoProvided?: boolean;
                  }) => string;
                };

              const paletteHint = buildPaletteHint(
                parsed.palette ?? "Lime",
                parsed.primaryColor,
              );
              const userPrompt = buildUserPrompt({
                brandInfo: parsed.brandInfo ?? "Brand description not provided",
                paletteHint,
                socialLine: parsed.socialLine,
                brandUrl: parsed.brandUrl,
                animationStyle: parsed.animationStyle,
                voice: parsed.voice,
                fontFamily: parsed.fontFamily,
                logoProvided: parsed.logoProvided,
              });

              const messages = [
                { role: "system", content: CINEMATIC_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ];

              let responded = false;
              for (let i = 0; i < MODEL_FALLBACKS.length; i++) {
                const model = MODEL_FALLBACKS[i];
                console.log(`[stream-dev] trying ${model} (${i + 1}/${MODEL_FALLBACKS.length})`);

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
                      temperature: 0.75,
                      max_tokens: 16384,
                      stream: true,
                      messages,
                    }),
                  });
                } catch (fetchErr) {
                  console.warn(`[stream-dev] ${model} fetch error:`, fetchErr);
                  if (i === MODEL_FALLBACKS.length - 1) {
                    res.writeHead(502, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Network error reaching AI provider" }));
                    return;
                  }
                  continue;
                }

                if (upstreamRes.status === 429 || upstreamRes.status === 404) {
                  console.warn(`[stream-dev] ${model} ${upstreamRes.status}, trying next…`);
                  continue;
                }

                if (!upstreamRes.ok) {
                  const errText = await upstreamRes.text().catch(() => "unknown");
                  console.error(`[stream-dev] ${model} error ${upstreamRes.status}:`, errText);
                  if (i === MODEL_FALLBACKS.length - 1) {
                    res.writeHead(502, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `Generation failed: ${errText}` }));
                    return;
                  }
                  continue;
                }

                console.log(`[stream-dev] streaming with ${model}`);
                res.writeHead(200, {
                  "Content-Type": "text/event-stream",
                  "Cache-Control": "no-cache",
                  "X-Accel-Buffering": "no",
                  Connection: "keep-alive",
                });
                res.write(`: model=${model}\n\n`);

                const reader = upstreamRes.body!.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  res.write(Buffer.from(value));
                }
                res.end();
                responded = true;
                break;
              }

              if (!responded) {
                res.writeHead(503, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "All Qwen models are unavailable. Please try again in a minute." })
                );
              }
            } catch (err) {
              console.error("[stream-dev] unhandled error:", err);
              if (!res.headersSent) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal server error" }));
              }
            }
          });
        }
      );
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    generateStreamDevPlugin(),
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
