import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { GenerateImageRequest, GenerateImageResponse, GenerationType } from '@/lib/types/database';
import { checkUserCredits, deductCredits, getCreditsForGenerationType } from '@/lib/utils/credits';
import { translate } from '@/lib/config/languages';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
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

// Helper function to generate images using Gemini API
async function generateImage(prompt: string, inputImages?: string[]): Promise<string> {
  try {
    console.log('Using Gemini model: gemini-2.5-flash-image-preview');
    console.log('Prompt:', prompt);

    // Use the Gemini Flash model for image generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    // Create a detailed prompt for image generation
    const detailedPrompt = `Generate an image of: ${prompt}`;

    const result = await model.generateContent(detailedPrompt);
    const response = await result.response;

    // Check if the response contains image data
    const candidates = response.candidates;
    if (candidates && candidates[0]?.content?.parts) {
      const parts = candidates[0].content.parts;

      // Look for inline image data in the response
      for (const part of parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          const base64Data = part.inlineData.data;
          const mimeType = part.inlineData.mimeType;

          console.log(`Image generated with mimeType: ${mimeType}`);

          // Store the image in Supabase storage
          try {
            const timestamp = Date.now();
            const extension = mimeType.split('/')[1] || 'png';
            const fileName = `generated/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;

            // Convert base64 to Buffer
            const imageBuffer = Buffer.from(base64Data, 'base64');

            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from('images')
              .upload(fileName, imageBuffer, {
                contentType: mimeType,
                cacheControl: '3600',
                upsert: false
              });

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabaseAdmin.storage
                .from('images')
                .getPublicUrl(fileName);

              console.log('Image saved to storage:', publicUrl);
              return publicUrl;
            } else if (uploadError) {
              console.error('Upload error:', uploadError);
            }
          } catch (storageError) {
            console.error('Storage error:', storageError);
          }

          // If storage fails, return the base64 data URL
          return `data:${mimeType};base64,${base64Data}`;
        }
      }
    }

    // If no image was generated, throw an error
    throw new Error('No image was generated. Please try a different prompt.');

  } catch (error: any) {
    console.error('Gemini API error:', {
      message: error.message,
      stack: error.stack
    });

    // Handle specific error cases
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your configuration.');
    }

    if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    }

    if (error.message?.includes('No image')) {
      throw error; // Re-throw the "No image" error
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