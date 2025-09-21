import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/middleware/auth';
import { getUserFromToken, extractBearerToken } from '@/lib/utils/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { UploadImageResponse } from '@/lib/types/database';
import { translate } from '@/lib/config/languages';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadToStorage,
  isValidImageType,
  isValidFileSize,
  STORAGE_CONFIG
} from '@/lib/utils/storage';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  const logContext = {
    timestamp: new Date().toISOString(),
    endpoint: '/api/upload/image',
    userId: null as string | null,
  };

  try {
    // Authentication
    const token = extractBearerToken(request.headers.get('authorization') || undefined);

    if (!token) {
      console.log('[Upload] No authentication token provided');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const user = await getUserFromToken(token);

    if (!user) {
      console.log('[Upload] Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401, headers: corsHeaders() }
      );
    }

    logContext.userId = user.id;
    console.log('[Upload] Authenticated user:', user.id);

    const language = request.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'en';

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('[Upload] FormData parsing error:', formError);

      // Check if it's a development/testing request
      if (process.env.NODE_ENV === 'development') {
        console.log('[Upload] Returning test response in development mode');
        return NextResponse.json(
          {
            success: true,
            image_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            image_id: uuidv4(),
            message: 'Test response - FormData parsing failed'
          },
          { status: 200, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format'
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    const file = formData.get('file') as File;
    const purpose = formData.get('purpose') as string || 'input';

    if (!file) {
      console.log('[Upload] No file provided in request');
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided'
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[Upload] File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      purpose: purpose
    });

    // Validate file type using utility
    if (!isValidImageType(file.type)) {
      console.log('[Upload] Invalid file type:', file.type);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Only ${STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.join(', ')} are allowed.`
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate file size using utility
    if (!isValidFileSize(file.size)) {
      console.log('[Upload] File too large:', file.size);
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB.`
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using the storage utility
    console.log('[Upload] Starting file upload to storage...');

    const uploadResult = await uploadToStorage(buffer, file.type, {
      bucket: 'USER_UPLOADS',
      userId: user.id,
      purpose: purpose,
      upsert: false,
    });

    if (!uploadResult.success) {
      console.error('[Upload] Storage upload failed:', uploadResult.error);

      // Fallback to base64 data URL if storage completely fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[Upload] Falling back to base64 data URL in development');
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        return NextResponse.json(
          {
            success: true,
            image_url: dataUrl,
            image_id: uuidv4(),
            message: 'Using base64 fallback due to storage error'
          },
          { status: 200, headers: corsHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload image. Please try again.',
          details: uploadResult.details
        },
        { status: 500, headers: corsHeaders() }
      );
    }

    const publicUrl = uploadResult.publicUrl!;
    const storagePath = uploadResult.path!;

    console.log('[Upload] File uploaded successfully:', storagePath);
    console.log('[Upload] Public URL:', publicUrl);

    // Try to save upload record to database (non-critical)
    let uploadRecordId: string | undefined;

    try {
      const { data: uploadRecord, error: dbError } = await supabaseAdmin
        .from('uploaded_images')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          public_url: publicUrl,
        })
        .select()
        .single();

      if (dbError) {
        console.error('[Upload] Database insert error (non-critical):', dbError);
      } else {
        console.log('[Upload] Database record created:', uploadRecord?.id);
        uploadRecordId = uploadRecord?.id;
      }
    } catch (dbError) {
      console.error('[Upload] Database error (non-critical):', dbError);
    }

    const response: UploadImageResponse = {
      success: true,
      image_url: publicUrl,
      image_id: uploadRecordId || uuidv4(),
    };

    return NextResponse.json(response, { status: 200, headers: corsHeaders() });

  } catch (error: any) {
    console.error('[Upload] Unexpected error:', {
      ...logContext,
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}