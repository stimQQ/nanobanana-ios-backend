import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, corsHeaders } from '@/lib/middleware/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { GenerateImageRequest, GenerateImageResponse } from '@/lib/types/database';
import { checkUserCredits, deductCredits, getCreditsForGenerationType } from '@/lib/utils/credits';
import { translate } from '@/lib/config/languages';
import axios from 'axios';

// Initialize Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
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
    console.log('Using Gemini model:', GEMINI_MODEL);
    console.log('Prompt:', prompt);
    console.log('Input images count:', inputImages?.length || 0);

    // Prepare the request body
    let requestBody: any;

    if (inputImages && inputImages.length > 0) {
      // For image-to-image or multi-image generation
      const parts: any[] = [];

      // Add the text prompt
      parts.push({
        text: `Based on the provided image(s), generate a new image with the following description: ${prompt}`
      });

      // Add all input images as inline data
      for (const imageUrl of inputImages) {
        try {
          const base64Data = await imageUrlToBase64(imageUrl);
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          });
          console.log('Added input image to request');
        } catch (error) {
          console.error('Error processing input image:', error);
        }
      }

      requestBody = {
        contents: [{
          parts: parts
        }]
      };
    } else {
      // For text-to-image generation
      requestBody = {
        contents: [{
          parts: [{
            text: `Generate an image of: ${prompt}`
          }]
        }]
      };
    }

    // Make the API call using axios
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      }
    );

    // Check if the response contains image data
    const candidates = response.data.candidates;
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

            console.log(`Attempting to upload image: ${fileName}, size: ${imageBuffer.length} bytes`);

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

              console.log('Image successfully saved to storage:', {
                fileName,
                path: uploadData.path,
                publicUrl
              });

              // Verify the URL is accessible
              if (publicUrl && publicUrl.startsWith('http')) {
                return publicUrl;
              } else {
                console.error('Invalid public URL generated:', publicUrl);
                throw new Error('Failed to generate valid public URL');
              }
            } else if (uploadError) {
              console.error('Supabase upload error:', {
                error: uploadError,
                fileName,
                bucket: 'images'
              });
              throw uploadError;
            }
          } catch (storageError) {
            console.error('Storage operation failed:', {
              error: storageError,
              message: storageError instanceof Error ? storageError.message : 'Unknown error'
            });
            // Don't throw here, fall back to data URL
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
      response: error.response?.data,
      status: error.response?.status
    });

    // Handle specific error cases
    if (error.response?.status === 401 || error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your configuration.');
    }

    if (error.response?.status === 429 || error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    }

    if (error.response?.status === 400) {
      throw new Error('Invalid request. Please check your input.');
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
    const _corsResponse = new NextResponse(null, { status: 200, headers: corsHeaders() });

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
      console.log('Saving generation to database:', {
        user_id: user.id,
        prompt: prompt.substring(0, 50) + '...',
        generation_type,
        imageUrl: imageUrl.substring(0, 100) + '...',
        credits_used: creditsNeeded
      });

      const { data: generation, error: dbError } = await supabaseAdmin
        .from('image_generations')
        .insert({
          user_id: user.id,
          prompt,
          generation_type: generation_type,
          output_image_url: imageUrl,  // Fixed: Changed from image_url to output_image_url
          status: 'completed',          // Added: Set status to completed
          credits_used: creditsNeeded,
          input_images: input_images,  // Added: Save input images if provided
          metadata: {
            language,
            model: 'gemini-2.5-flash-image-preview'  // Store model info in metadata
          }
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save generation to database:', {
          error: dbError,
          code: dbError.code,
          message: dbError.message,
          details: dbError.details
        });
        // Still return the image even if DB save fails
        // User still has the image, just not in history
      } else {
        console.log('Generation saved successfully:', {
          id: generation?.id,
          status: generation?.status
        });
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

export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}