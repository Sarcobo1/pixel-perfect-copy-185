import { defineEventHandler, readBody } from 'h3';

/**
 * Legacy H3/Nitro handler — kept for backward compatibility.
 * The primary AI generation pipeline is in src/lib/api/generate-video.ts
 * via TanStack Start server functions.
 */
export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody<{ description?: string; userPrompt?: string; instagram?: string; telegram?: string }>(event)) ?? {};
    const description = body.description || body.userPrompt;
    const instagram = body.instagram;
    const telegram = body.telegram;

    if (!description) {
      return { error: 'Description is required', statusCode: 400 };
    }

    const brandName = description.split(/\s+/).slice(0, 2).join(' ') || 'Brand';
    const inst = instagram || '@brand';
    const tele = telegram || 't.me/brand';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} - Motion Brand Video</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0f; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; }
    canvas { display: block; max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1920; canvas.height = 1080;
    const W = canvas.width, H = canvas.height;
    let startTime = Date.now();
    const easeOutBack = t => { const c = 1.70158; return 1 + c * Math.pow(t-1,3) + c * Math.pow(t-1,2); };
    function animate() {
      const elapsed = (Date.now() - startTime) % 30000;
      ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0,0,W,H);
      if (elapsed < 4000) {
        const t = elapsed / 4000;
        ctx.save(); ctx.translate(W/2, H/2); ctx.scale(easeOutBack(t), easeOutBack(t));
        ctx.fillStyle = '#6aff3d'; ctx.font = 'bold 120px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('${brandName}', 0, 0); ctx.restore();
      }
      requestAnimationFrame(animate);
    }
    animate();
  <\/script>
</body>
</html>`;

    return {
      success: true,
      projectId: `ai-${Date.now()}`,
      htmlCode: htmlContent,
      brandName,
      instagram: inst,
      telegram: tele,
      message: 'Fallback video generated',
    };
  } catch (error) {
    console.error('Generate video fallback error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to generate video',
      statusCode: 500,
    };
  }
});
