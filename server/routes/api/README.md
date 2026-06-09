# Dual-Agent Video Generation API

This document explains how to set up and use the dual-agent video generation pipeline powered by Groq SDK.

## Overview

The API orchestrates two specialized AI agents:

1. **Agent 1 (Brand Strategist)** — Transforms raw business descriptions into optimized Brand Identity JSON
2. **Agent 2 (HTML5 Canvas Compiler)** — Converts Brand Identity JSON into production-ready 30-second video animations

## Prerequisites

### 1. Install Dependencies

Required packages have been installed:
- `groq-sdk` — For Groq AI API calls
- `dotenv` — For environment variable management

Verify installation:
```bash
npm list groq-sdk dotenv
```

### 2. Get Groq API Key

1. Visit [Groq Console](https://console.groq.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to view it again)

### 3. Configure Environment Variables

Update `.env` file with your Groq API key:

```env
GROQ_API_KEY="gsk_your_actual_api_key_here"
```

**Security Note:** Never commit the `.env` file to version control. Add `.env` to your `.gitignore`.

## API Endpoint

**Endpoint:** `POST /api/generate-video`

**Location:** `/server/routes/api/generate-video.ts`

### Request Body

```json
{
  "userPrompt": "Your business idea or product description",
  "instagram": "@your_instagram_handle",
  "telegram": "t.me/your_telegram_channel"
}
```

### Request Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userPrompt` | string | Yes | Raw business description or product idea |
| `instagram` | string | Yes | Instagram handle (e.g., `@sotamotion_ai`) |
| `telegram` | string | Yes | Telegram link (e.g., `t.me/sotamotion`) |

### Response Format

**Success Response (200):**
```json
{
  "success": true,
  "htmlCode": "<!DOCTYPE html>...",
  "brandIdentity": {
    "brand": {
      "name": "Brand Name",
      "headline": "Compelling headline",
      "tagline": "Emotional tagline",
      "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "logo_svg": "",
      "logo_type": "text"
    },
    "social_assets": [...],
    "palette": {...},
    "motion_preset": "energetic",
    "voice_timeline": [...]
  }
}
```

**Error Response (400/500):**
```json
{
  "statusCode": 400,
  "statusMessage": "Missing required fields: userPrompt, instagram, telegram"
}
```

## Client-Side Usage

### Using the React Hook

```tsx
import { useGenerateVideo } from '@/hooks/use-generate-video';

export function VideoGenerator() {
  const { loading, error, data, generateVideo } = useGenerateVideo();

  const handleGenerate = async () => {
    const result = await generateVideo({
      userPrompt: 'An AI platform that generates 30-second ads from business ideas',
      instagram: '@sotamotion_ai',
      telegram: 't.me/sotamotion',
    });

    if (result?.success) {
      console.log('Video HTML generated:', result.htmlCode);
      // Display the HTML or embed it in an iframe
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Video'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data?.htmlCode && (
        <iframe
          srcDoc={data.htmlCode}
          style={{ width: '100%', height: '600px' }}
          title="Generated Video"
        />
      )}
    </div>
  );
}
```

### Using Fetch API

```typescript
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userPrompt: 'Your business description',
    instagram: '@your_handle',
    telegram: 't.me/your_channel',
  }),
});

const { success, htmlCode, brandIdentity } = await response.json();
```

## Agent Specifications

### Agent 1: Brand Strategist
- **Model:** `llama-3.3-70b-versatile`
- **Temperature:** 0.2 (precise, deterministic)
- **Output Format:** JSON Mode
- **Purpose:** Generate optimized brand identity with marketing copy

### Agent 2: HTML5 Canvas Compiler
- **Model:** `llama-3.3-70b-versatile`
- **Temperature:** 0.1 (highly deterministic)
- **Output Format:** JSON Mode
- **Purpose:** Compile brand identity into production HTML5 animation

## File Structure

```
project-root/
├── server/
│   └── routes/
│       └── api/
│           └── generate-video.ts       ← API endpoint
├── src/
│   └── hooks/
│       └── use-generate-video.ts       ← React hook
├── .env                                ← Configuration (add GROQ_API_KEY)
└── package.json
```

## Error Handling

The endpoint includes robust error handling:

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Missing fields | 400 | Incomplete request body | Provide all required fields |
| API key missing | 500 | `GROQ_API_KEY` not set | Add to `.env` |
| Agent failure | 500 | Groq API error | Check API key validity |
| Parse error | 500 | Invalid JSON response | Retry or contact support |

## Testing the Endpoint

### Using cURL

```bash
curl -X POST http://localhost:5173/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "userPrompt": "AI platform for generating premium video ads",
    "instagram": "@sotamotion_ai",
    "telegram": "t.me/sotamotion"
  }'
```

### Using Postman

1. Set method to `POST`
2. URL: `http://localhost:5173/api/generate-video`
3. Body (JSON):
```json
{
  "userPrompt": "Your description here",
  "instagram": "@your_handle",
  "telegram": "t.me/your_channel"
}
```

## Performance Considerations

- **Response Time:** ~15-30 seconds (depends on Groq API load)
- **Rate Limits:** Subject to Groq API tier limits
- **Timeout:** Configure based on your deployment (default recommended: 60 seconds)

## Troubleshooting

### Issue: "Groq API key not configured"
**Solution:** Ensure `GROQ_API_KEY` is set in `.env` and the server is restarted.

### Issue: "Agent 1 failed to generate response"
**Solution:** Check if your Groq API key is valid and has sufficient quota.

### Issue: "Failed to parse HTML code from Agent 2"
**Solution:** This may occur if Agent 2 generates malformed JSON. Retry the request.

### Issue: Port already in use
**Solution:** Kill the previous process or change the port in `vite.config.ts`.

## Next Steps

1. **Add authentication** if needed (e.g., verify user before generation)
2. **Implement caching** to avoid redundant Groq API calls
3. **Add database storage** for generated videos
4. **Set up webhooks** for asynchronous processing
5. **Implement cost tracking** for Groq API usage

## Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [TanStack Start Documentation](https://tanstack.com/router/latest)
- [Nitro Server Documentation](https://nitro.unjs.io/)

## Support

For issues or questions, refer to the Groq documentation or contact support at [Groq Console](https://console.groq.com).
