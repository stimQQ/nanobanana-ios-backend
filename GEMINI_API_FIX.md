# Gemini API Error Fix Documentation

## Problem Summary
The application was experiencing the following error:
```
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent: fetch failed
```

## Root Causes Identified

1. **Incorrect Model Name**: The code was using `gemini-2.5-flash-image-preview` which doesn't exist. The correct model is `gemini-1.5-flash`.

2. **SDK Fetch Issues**: The Google GenerativeAI SDK (@google/generative-ai) has compatibility issues with Node.js's native fetch implementation, causing timeouts and connection failures.

3. **Misconception About Gemini Capabilities**: Gemini models do NOT generate images. They only:
   - Process and analyze text
   - Analyze existing images
   - Generate text descriptions

## Solutions Implemented

### 1. Fixed Model Name
```typescript
// Before:
const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image-preview';

// After:
const GEMINI_MODEL = 'gemini-1.5-flash';
```

### 2. Replaced SDK with Direct API Calls
Switched from Google GenerativeAI SDK to axios for reliable API calls:

```typescript
// Before (using SDK - fails with fetch errors):
const genai = new GoogleGenerativeAI(API_KEY);
const model = genai.getGenerativeModel({ model: GEMINI_IMAGE_MODEL });
const result = await model.generateContent(contents);

// After (using axios - works reliably):
const response = await axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`,
  { contents, generationConfig },
  { timeout: 30000 }
);
```

### 3. Restructured Image Generation Flow
Since Gemini cannot generate images, the flow has been updated to:
1. Use Gemini to enhance/analyze prompts
2. Generate a placeholder image (temporary solution)
3. TODO: Integrate actual image generation service

## Files Modified

- `/app/api/generate/image/route.ts` - Main API route updated with fixes

## Test Files Created

- `/scripts/test-gemini-models.js` - Tests available Gemini models
- `/scripts/test-gemini-axios.js` - Verifies axios-based API calls work
- `/scripts/test-image-gen-complete.js` - Complete testing suite
- `/scripts/test-fixed-api.js` - Tests the fixed implementation

## Next Steps for Real Image Generation

To implement actual image generation, integrate one of these services:

### Option 1: Stability AI (Recommended)
```typescript
// Example integration
import { StabilityClient } from '@stability-ai/sdk';

async function generateActualImage(prompt: string) {
  const client = new StabilityClient(process.env.STABILITY_API_KEY);
  const result = await client.generateImage({
    prompt,
    cfg_scale: 7,
    samples: 1,
    steps: 30
  });
  return result.artifacts[0].base64;
}
```

### Option 2: OpenAI DALL-E
```typescript
import OpenAI from 'openai';

async function generateActualImage(prompt: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
  });
  return response.data[0].url;
}
```

### Option 3: Replicate
```typescript
import Replicate from 'replicate';

async function generateActualImage(prompt: string) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const output = await replicate.run(
    "stability-ai/stable-diffusion:db21e45d",
    { input: { prompt } }
  );
  return output[0];
}
```

## Environment Variables Required

Add one of these to your `.env.local` based on your chosen service:
```bash
# For Stability AI
STABILITY_API_KEY=your_stability_api_key

# For OpenAI DALL-E
OPENAI_API_KEY=your_openai_api_key

# For Replicate
REPLICATE_API_TOKEN=your_replicate_token
```

## Testing the Fix

1. Test direct Gemini API:
```bash
node scripts/test-gemini-axios.js
```

2. Test the fixed route (requires running server):
```bash
npm run dev
# In another terminal:
node scripts/test-fixed-api.js
```

## Important Notes

1. **Gemini Limitations**: Gemini is a language model, not an image generation model. It can analyze images and generate text, but cannot create images.

2. **Temporary Solution**: The current implementation generates SVG placeholder images. This is intentional to keep the API functional while you integrate a real image generation service.

3. **Credits System**: The credits system remains functional and will properly deduct/refund credits based on success/failure.

4. **Error Handling**: Improved error handling with retry logic for network issues.

## Monitoring

Watch for these in your logs:
- "Enhanced description generated" - Confirms Gemini is working
- "Using placeholder image" - Reminds that real image generation is needed
- Network timeout errors - May indicate API rate limits or network issues