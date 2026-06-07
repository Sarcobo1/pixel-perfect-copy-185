import { defineEventHandler, readBody } from 'h3';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Agent 1: Brand Strategist System Prompt
const AGENT_1_SYSTEM_PROMPT = `You are a brand strategist AI. Your task is to analyze a brand description and generate a comprehensive brand identity framework in JSON format.

Based on the user's brand description, you MUST return a valid JSON object (and ONLY the JSON, no markdown, no extra text) with the following structure:
{
  "brand_name": "extracted or derived brand name",
  "headline": "compelling single-line headline for the brand",
  "primary_color": "#RRGGBB hex color",
  "secondary_color": "#RRGGBB hex color",
  "accent_color": "#RRGGBB hex color",
  "brand_voice": "descriptive tone (e.g., 'professional', 'playful', 'bold', 'minimalist')",
  "key_message_1": "first key message about the brand",
  "key_message_2": "second key message about the brand",
  "key_message_3": "third key message about the brand",
  "voice_timeline": [
    {"scene": "intro", "duration_ms": 4000, "content": "brand reveal with logo"},
    {"scene": "headline", "duration_ms": 5000, "content": "main headline"},
    {"scene": "features", "duration_ms": 9000, "content": "key messages showcase"},
    {"scene": "cta", "duration_ms": 7000, "content": "call to action"},
    {"scene": "outro", "duration_ms": 5000, "content": "brand closing"}
  ]
}

Focus on:
- Professional, modern color palettes
- Memorable headlines that capture essence
- Voice that matches the brand personality
- Timeline that flows naturally for a 30-second video

Return ONLY valid JSON. No explanation, no markdown code blocks.`;

// Agent 2: Frontend Canvas Developer System Prompt
const AGENT_2_SYSTEM_PROMPT = `You are a senior frontend developer specializing in HTML5 Canvas animations. Your task is to create a premium, cinematic video animation based on brand strategy data.

You will receive brand identity JSON from Agent 1. Using that data, you MUST generate a complete HTML5 Canvas animation that brings the brand to life.

Your output MUST be a valid JSON object (and ONLY JSON, no markdown, no extra text) with this structure:
{
  "html_code": "<complete HTML5 with embedded Canvas animation>"
}

Requirements for the HTML5 Canvas animation:
1. Use the brand's primary_color for main elements and secondary_color for accents
2. Create dynamic motion designs (not static):
   - Particle systems
   - Smooth easing transitions
   - Rotating/scaling elements
   - Wave effects on text
   - Glowing effects and shadows
3. Follow the voice_timeline structure from brand data (intro → headline → features → cta → outro)
4. Display the brand name in the intro (use brandName variable)
5. Show key messages in the features scene
6. Include social media handles (instagram, telegram variables)
7. Total animation duration: 30 seconds (30000ms) with looping
8. Use modern design patterns: grid backgrounds, particle effects, glassmorphism cards
9. Responsive canvas that fills the viewport

The HTML must be self-contained with inline CSS and JavaScript. Use template literals for variables: \${brandName}, \${instagram}, \${telegram}

Return ONLY valid JSON with the html_code field. No explanation, no markdown.`;

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const description = body.description || body.userPrompt;
    const instagram = body.instagram;
    const telegram = body.telegram;

    if (!description || !instagram || !telegram) {
      throw new Error('Missing required fields: description, instagram, telegram');
    }

    console.log('📹 Starting dual-agent video generation...');
    console.log('Input:', { description: description.substring(0, 50) + '...', instagram, telegram });

    // ============================================
    // AGENT 1: Brand Strategist
    // ============================================
    console.log('🤖 Agent 1: Analyzing brand strategy...');
    
    const agent1Response = await groq.messages.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: AGENT_1_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Brand Description: ${description}\n\nCreate a brand identity framework in JSON format.`,
        },
      ],
    });

    const agent1Content = agent1Response.content[0];
    if (agent1Content.type !== 'text') {
      throw new Error('Agent 1 returned non-text response');
    }

    let brandData: Record<string, any>;
    try {
      brandData = JSON.parse(agent1Content.text);
    } catch {
      console.error('Failed to parse Agent 1 response:', agent1Content.text);
      throw new Error('Agent 1 response is not valid JSON');
    }

    console.log('✅ Agent 1 complete:', brandData.brand_name);

    // ============================================
    // AGENT 2: Frontend Canvas Developer
    // ============================================
    console.log('🤖 Agent 2: Generating Canvas animation...');

    const agent2Response = await groq.messages.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 8000,
      messages: [
        {
          role: 'system',
          content: AGENT_2_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Brand Data (JSON):\n${JSON.stringify(brandData, null, 2)}\n\nCreate a premium HTML5 Canvas animation that visualizes this brand. The animation will be displayed in a video player. Include variables for: \${brandName}, \${instagram}, \${telegram}. Return only JSON with "html_code" field.`,
        },
      ],
    });

    const agent2Content = agent2Response.content[0];
    if (agent2Content.type !== 'text') {
      throw new Error('Agent 2 returned non-text response');
    }

    let canvasData: Record<string, any>;
    try {
      canvasData = JSON.parse(agent2Content.text);
    } catch {
      console.error('Failed to parse Agent 2 response:', agent2Content.text);
      throw new Error('Agent 2 response is not valid JSON');
    }

    const htmlCode = canvasData.html_code;
    if (!htmlCode || typeof htmlCode !== 'string') {
      throw new Error('Agent 2 did not return valid html_code');
    }

    console.log('✅ Agent 2 complete: Canvas animation generated');

    // ============================================
    // Return Response
    // ============================================
    const finalHtmlCode = htmlCode
      .replace(/\$\{brandName\}/g, brandData.brand_name)
      .replace(/\$\{instagram\}/g, instagram)
      .replace(/\$\{telegram\}/g, telegram);

    console.log('✅ Video generation complete!');

    return {
      success: true,
      projectId: 'ai-' + Date.now(),
      htmlCode: finalHtmlCode,
      brandName: brandData.brand_name,
      brandData: brandData,
      message: 'Video generated successfully via dual-agent AI pipeline!',
    };
  } catch (error) {
    console.error('❌ Generate video error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
    
    return {
      error: errorMessage,
      statusCode: 500,
    };
  }
});
