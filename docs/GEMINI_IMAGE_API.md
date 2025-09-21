# Gemini Image Generation API

## Overview

The image generation API has been updated to use Google Gemini's `gemini-2.5-flash-image` model instead of DALL-E 3. This provides faster and more reliable image generation capabilities.

## Model Used

- **Model**: `gemini-2.5-flash-image`
- **Provider**: Google Gemini via APICore
- **Timeout**: 120 seconds (with automatic retry on timeout)

## Features

### 1. Text-to-Image Generation
Generate images from text descriptions.

**Request:**
```json
{
  "prompt": "A beautiful sunset over mountains",
  "generation_type": "text-to-image"
}
```

### 2. Image-to-Image Generation
Transform existing images based on prompts.

**Request:**
```json
{
  "prompt": "Transform into watercolor style",
  "generation_type": "image-to-image",
  "input_images": ["https://example.com/image.jpg"]
}
```

## Response Format

The Gemini model returns images in one of two formats:
1. **URL Format**: Direct URL to the generated image
2. **Base64 Format**: Base64 encoded image data

Both formats are automatically handled and stored in Supabase for persistence.

## Improvements

### Retry Logic
- Automatic retry on timeout or server errors (5xx)
- Up to 3 retries with exponential backoff
- Starting delay: 2 seconds

### Error Handling
- Clear error messages for timeout scenarios
- Detailed logging for debugging
- Graceful fallback handling

### Image Storage
- Automatic storage in Supabase
- Support for both URL and base64 formats
- Persistent URLs for generated images

## Testing

Use the provided test script:
```bash
node scripts/test-gemini-api.js
```

Or test directly with the Gemini model:
```bash
node scripts/test-gemini-image.js
```

## Credits Usage

- Text-to-Image: Standard credit cost
- Image-to-Image: Higher credit cost due to image analysis

## Technical Details

### Endpoint
- **Chat Completions**: `https://api.apicore.ai/v1/chat/completions`
- **Model**: `gemini-2.5-flash-image`

### Message Format
```json
{
  "model": "gemini-2.5-flash-image",
  "messages": [
    {
      "role": "user",
      "content": "Generate an image of: [prompt]"
    }
  ],
  "max_tokens": 1024,
  "temperature": 0.7
}
```

### Response Parsing
The API extracts image URLs from markdown format:
- `![image](URL)` - For URL responses
- `![image](data:image/png;base64,...)` - For base64 responses

## Migration from DALL-E 3

Key changes:
1. Model changed from `dall-e-3` to `gemini-2.5-flash-image`
2. API endpoint changed from `/images/generations` to `/chat/completions`
3. Request format uses messages array instead of direct prompt
4. Response parsing extracts URLs from markdown content
5. Increased timeout from 60s to 120s
6. Added retry logic with exponential backoff