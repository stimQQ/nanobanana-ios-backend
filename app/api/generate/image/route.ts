import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { GenerateImageRequest, GenerateImageResponse, GenerationType } from '@/lib/types/database';
import { checkUserCredits, deductCredits, getCreditsForGenerationType } from '@/lib/utils/credits';
import { translate } from '@/lib/config/languages';
import { GoogleGenAI } from "@google/genai";

// Initialize API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

// Helper function to generate images using Google GenAI SDK
async function generateImage(prompt: string, inputImages?: string[]): Promise<string> {
  try {
    console.log('Using Gemini model:', GEMINI_MODEL);
    console.log('Prompt:', prompt);

    let result: any;

    if (inputImages && inputImages.length > 0) {
      // Image-to-image: build contents array with text and inline images
      const contents: any[] = [];

      // Add the text prompt first as an object
      contents.push({ text: prompt });

      // Add all input images as inlineData objects
      for (const imageUrl of inputImages) {
        const base64Image = await imageUrlToBase64(imageUrl);
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        });
      }

      // Use the exact format from the working test
      result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contents
      });
    } else {
      // Text-to-image: simple string format
      result = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt
      });
    }

    // Handle the response format with candidates[0].content.parts
    if (result.candidates && result.candidates[0]) {
      const parts = result.candidates[0].content.parts;

      // Look for generated image in the response
      if (parts && Array.isArray(parts)) {
        for (const part of parts) {
          if (part && part.inlineData) {
            console.log('Image generated successfully!');
            console.log('Image data length:', part.inlineData.data.length);
            // Return as data URL
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }

        // Check for text response
        for (const part of parts) {
          if (part && part.text) {
            console.log('Text response received:', part.text.substring(0, 200));
          }
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
    console.error('Google GenAI SDK error:', {
      message: error.message,
      error: error
    });

    // If SDK fails, provide more specific error messages
    if (error.message?.includes('not found') || error.message?.includes('not available')) {
      throw new Error(`Model ${GEMINI_MODEL} is not available. Please check model availability in your region.`);
    }

    throw error;
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