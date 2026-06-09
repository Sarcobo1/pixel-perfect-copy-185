import "dotenv/config";

const apiKey = process.env.DASHSCOPE_API_KEY;

async function test(url: string, headers: any) {
  console.log("Testing:", url);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        model: "qwen3.7-plus",
        messages: [{ role: "user", content: "Hello" }]
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 150));
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}

async function run() {
  await test("https://ws-nc6quc6u06gfaydg.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions", {});
  await test("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {});
  await test("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {});
}

run();
