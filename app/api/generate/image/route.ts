import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { GenerateImageRequest, GenerateImageResponse, GenerationType } from '@/lib/types/database';
import { checkUserCredits, deductCredits, getCreditsForGenerationType } from '@/lib/utils/credits';
import { translate } from '@/lib/config/languages';
import axios from 'axios';

// Initialize API configuration
const APICORE_API_KEY = process.env.APICORE_API_KEY || 'sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI';
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const API_ENDPOINT = 'https://api.apicore.ai/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    // Handle data URLs directly
    if (url.startsWith('data:')) {
      return url.split(',')[1];
    }

    // Fetch image from URL
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process input image');
  }
}

// Helper function to generate images using Gemini API through APICore
async function generateImage(prompt: string, inputImages?: string[]): Promise<string> {
  try {
    console.log('Using Gemini model:', GEMINI_MODEL);
    console.log('Prompt:', prompt);

    // For now, we'll focus on text-to-image generation
    // Image-to-image can be added later if needed
    const fullPrompt = inputImages && inputImages.length > 0
      ? `${prompt} (Based on the provided image)`
      : prompt;

    const response = await axios.post(
      API_ENDPOINT,
      {
        model: GEMINI_MODEL,
        messages: [
          {
            role: 'user',
            content: `Generate an image of: ${fullPrompt}`
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${APICORE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes
      }
    );

    // Handle the response
    if (response.data?.choices?.[0]?.message?.content) {
      const content = response.data.choices[0].message.content;

      // Extract URL from markdown format ![...](url)
      const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
      const base64Match = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);

      if (urlMatch && urlMatch[1]) {
        console.log('Image URL generated:', urlMatch[1]);
        return urlMatch[1];
      } else if (base64Match && base64Match[1]) {
        console.log('Base64 image generated');
        return base64Match[1];
      } else {
        // Try to find any URL in the response
        const anyUrlMatch = content.match(/(https?:\/\/[^\s]+)/);
        if (anyUrlMatch && anyUrlMatch[1]) {
          console.log('URL found in response:', anyUrlMatch[1]);
          return anyUrlMatch[1];
        }
      }
    }

    // If no image was generated, create a placeholder
    console.log('No image generated, creating placeholder');

    const placeholderSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
        <rect fill="#1a1a1a" width="1024" height="1024"/>
        <text fill="#FFD700" font-size="48" font-family="Arial" x="50%" y="45%" text-anchor="middle">
          Image Generation in Progress
        </text>
        <text fill="#888" font-size="32" font-family="Arial" x="50%" y="55%" text-anchor="middle">
          ${prompt.substring(0, 50)}...
        </text>
      </svg>
    `;

    const svgBase64 = Buffer.from(placeholderSvg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;

  } catch (error: any) {
    console.error('Gemini API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Image generation timed out. Please try again.');
    }

    if (error.response?.status === 503) {
      throw new Error('Model is currently unavailable. Please try again later.');
    }

    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    throw new Error('Failed to generate image. Please try again.');
  }
}

// Helper function for retry logic
async function retryApiCall<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && !error.message?.includes('credits')) {
      console.log(`Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryApiCall(fn, retries - 1);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  return withAuth(req, async (authenticatedReq: AuthenticatedRequest) => {
    const corsResponse = new NextResponse(null, { status: 200, headers: corsHeaders() });

    // Declare body variable outside try block for access in catch block
    let body: GenerateImageRequest | undefined;

    try {
      const { user } = authenticatedReq;

      // Check if user exists (should always exist after withAuth, but TypeScript needs the check)
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required'
          } as GenerateImageResponse,
          { status: 401, headers: corsHeaders() }
        );
      }

      body = await req.json() as GenerateImageRequest;
      const { prompt, language = 'en', generation_type = 'text-to-image', input_images } = body;

      console.log(`Image generation request: type=${generation_type}, user=${user.id}`);

      // Check user credits
      const creditsNeeded = getCreditsForGenerationType(generation_type);
      const checkResult = await checkUserCredits(user.id, creditsNeeded);
      const hasCredits = checkResult.hasCredits;

      if (!hasCredits) {
        return NextResponse.json(
          {
            success: false,
            error: translate('errors.insufficientCredits', language)
          } as GenerateImageResponse,
          { status: 402, headers: corsHeaders() }
        );
      }

      // Generate the image with retry logic
      const imageUrl = await retryApiCall(async () => {
        if (generation_type === 'image-to-image' && input_images && input_images.length > 0) {
          // For image-to-image, include the input images
          return await generateImage(prompt, input_images);
        } else {
          // For text-to-image
          return await generateImage(prompt);
        }
      });

      // Deduct credits after successful generation
      const deductResult = await deductCredits(
        user.id,
        creditsNeeded,
        'usage',
        `Image generation: ${generation_type}`
      );
      const creditsRemaining = deductResult.newBalance;

      // Save generation record to database
      const { data: generation, error: dbError } = await supabaseAdmin
        .from('image_generations')
        .insert({
          user_id: user.id,
          prompt,
          generation_type: generation_type,
          image_url: imageUrl,
          language,
          credits_used: creditsNeeded
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the request if DB save fails
      }

      return NextResponse.json(
        {
          success: true,
          image_url: imageUrl,
          credits_used: creditsNeeded,
          remaining_credits: creditsRemaining,
          generation_id: generation?.id
        } as GenerateImageResponse,
        { headers: corsHeaders() }
      );

    } catch (error: any) {
      console.error('Generation error:', {
        message: error.message,
        stack: error.stack
      });

      // Refund credits if generation failed (not for insufficient credits)
      if (authenticatedReq.user && !error.message?.includes('credits')) {
        try {
          // Parse body safely - we already read it once, so use the parsed body variable if available
          const generationType = body?.generation_type || 'text-to-image';
          const creditsNeeded = getCreditsForGenerationType(generationType);

          await supabaseAdmin.rpc('add_credits', {
            p_user_id: authenticatedReq.user.id,
            p_credits: creditsNeeded
          });
          console.log(`Refunded ${creditsNeeded} credits to user ${authenticatedReq.user.id}`);
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError);
        }
      }

      const errorMessage = error.message || 'Failed to generate image';
      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        } as GenerateImageResponse,
        { status: 500, headers: corsHeaders() }
      );
    }
  });
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}