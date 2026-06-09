const DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

const MODEL_FALLBACKS = [
  "qwen3.7-plus",
  "qwen-plus",
  "qwen-max",
];

interface QwenMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface QwenOptions {
  model: string;
  messages: QwenMessage[];
  temperature?: number;
  max_tokens?: number;
}

async function tryModel(
  model: string,
  opts: QwenOptions,
  apiKey: string,
): Promise<{ text: string; skip: boolean }> {
  const response = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 4096,
      messages: opts.messages,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return { text: data.choices?.[0]?.message?.content ?? "", skip: false };
  }

  if (response.status === 429 || response.status === 404) {
    const reason = response.status === 429 ? "rate-limited" : "not found";
    console.warn(`Qwen: ${model} ${reason}, skipping…`);
    return { text: "", skip: true };
  }

  const errText = await response.text();
  throw new Error(`Qwen API error: ${response.status} ${errText}`);
}

export async function callOpenRouter(opts: QwenOptions): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY is not configured");

  const preferredModel = opts.model;
  const chain = [
    preferredModel,
    ...MODEL_FALLBACKS.filter((m) => m !== preferredModel),
  ];

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      console.log(`Qwen: trying ${model} (${i + 1}/${chain.length})`);
      const result = await tryModel(model, opts, apiKey);
      if (!result.skip) {
        if (i > 0) console.log(`Qwen: succeeded with ${model}`);
        return result.text;
      }
    } catch (err) {
      if (i === chain.length - 1) throw err;
      console.warn(`Qwen: ${model} error, trying next…`, err);
    }
  }

  throw new Error(
    "All Qwen models are currently unavailable. Please try again in a minute.",
  );
}
