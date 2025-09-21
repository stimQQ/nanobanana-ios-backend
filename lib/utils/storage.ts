import { supabaseAdmin } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket names
export const STORAGE_BUCKETS = {
  USER_UPLOADS: 'user-uploads',
  IMAGES: 'images',
} as const;

// Storage configuration
export const STORAGE_CONFIG = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  CACHE_CONTROL: '3600', // 1 hour
} as const;

export interface StorageUploadOptions {
  bucket: keyof typeof STORAGE_BUCKETS;
  fileName?: string;
  userId?: string;
  purpose?: string;
  upsert?: boolean;
  cacheControl?: string;
}

export interface StorageUploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
  details?: any;
}

/**
 * Validates if a storage bucket exists and is accessible
 */
export async function validateBucket(bucketName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);

    if (error) {
      console.error(`[Storage] Bucket validation error for ${bucketName}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(`[Storage] Unexpected error validating bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Lists all available storage buckets
 */
export async function listStorageBuckets(): Promise<string[]> {
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();

    if (error) {
      console.error('[Storage] Error listing buckets:', error);
      return [];
    }

    return buckets?.map(b => b.name) || [];
  } catch (error) {
    console.error('[Storage] Unexpected error listing buckets:', error);
    return [];
  }
}

/**
 * Generates a unique storage path for a file
 */
export function generateStoragePath(
  userId: string,
  purpose: string = 'general',
  extension: string
): string {
  const uuid = uuidv4();
  return `${userId}/${purpose}/${uuid}.${extension}`;
}

/**
 * Uploads a file to Supabase Storage with proper error handling
 */
export async function uploadToStorage(
  file: Buffer | Uint8Array | ArrayBuffer,
  contentType: string,
  options: StorageUploadOptions
): Promise<StorageUploadResult> {
  try {
    const bucketName = STORAGE_BUCKETS[options.bucket];

    // Validate bucket exists
    const bucketExists = await validateBucket(bucketName);

    if (!bucketExists) {
      console.error(`[Storage] Bucket ${bucketName} does not exist or is not accessible`);

      // List available buckets for debugging
      const availableBuckets = await listStorageBuckets();
      console.log('[Storage] Available buckets:', availableBuckets.join(', '));

      return {
        success: false,
        error: `Storage bucket ${bucketName} is not available`,
      };
    }

    // Generate or use provided file path
    let filePath: string;

    if (options.fileName) {
      filePath = options.fileName;
    } else if (options.userId && options.purpose) {
      const extension = contentType.split('/').pop() || 'bin';
      filePath = generateStoragePath(options.userId, options.purpose, extension);
    } else {
      return {
        success: false,
        error: 'Either fileName or both userId and purpose must be provided',
      };
    }

    console.log(`[Storage] Uploading to ${bucketName}/${filePath}`);

    // Convert file to Buffer if needed
    let buffer: Buffer;
    if (file instanceof Buffer) {
      buffer = file;
    } else if (file instanceof ArrayBuffer) {
      buffer = Buffer.from(file);
    } else if (file instanceof Uint8Array) {
      buffer = Buffer.from(file);
    } else {
      buffer = Buffer.from(file as any);
    }

    // Upload file
    const { data: _data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        upsert: options.upsert || false,
        cacheControl: options.cacheControl || STORAGE_CONFIG.CACHE_CONTROL,
      });

    if (uploadError) {
      console.error('[Storage] Upload error:', uploadError);

      // Handle duplicate file error
      if (uploadError.message?.includes('already exists') || (uploadError as any).statusCode === '409') {
        // If upsert is false and file exists, retry with a different name
        if (!options.upsert && options.userId && options.purpose) {
          const extension = contentType.split('/').pop() || 'bin';
          const retryPath = generateStoragePath(options.userId, options.purpose + '-retry', extension);

          console.log(`[Storage] File exists, retrying with ${retryPath}`);

          const { data: _retryData, error: retryError } = await supabaseAdmin.storage
            .from(bucketName)
            .upload(retryPath, buffer, {
              contentType,
              upsert: false,
              cacheControl: options.cacheControl || STORAGE_CONFIG.CACHE_CONTROL,
            });

          if (retryError) {
            return {
              success: false,
              error: 'Upload failed after retry',
              details: retryError,
            };
          }

          filePath = retryPath;
        } else {
          return {
            success: false,
            error: 'File already exists',
            details: uploadError,
          };
        }
      } else {
        return {
          success: false,
          error: uploadError.message || 'Upload failed',
          details: uploadError,
        };
      }
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`[Storage] Upload successful: ${publicUrl}`);

    return {
      success: true,
      publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('[Storage] Unexpected upload error:', error);

    return {
      success: false,
      error: error.message || 'Unexpected error during upload',
      details: error,
    };
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFromStorage(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bucketName = STORAGE_BUCKETS[bucket];

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`[Storage] Delete error for ${bucketName}/${filePath}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Storage] Deleted ${bucketName}/${filePath}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Storage] Unexpected delete error:', error);
    return { success: false, error: error.message || 'Unexpected error during deletion' };
  }
}

/**
 * Gets the public URL for a file in storage
 */
export function getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, filePath: string): string {
  const bucketName = STORAGE_BUCKETS[bucket];
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Validates if a file type is allowed for upload
 */
export function isValidImageType(mimeType: string): boolean {
  return STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.includes(mimeType as any);
}

/**
 * Validates if a file size is within limits
 */
export function isValidFileSize(size: number): boolean {
  return size <= STORAGE_CONFIG.MAX_FILE_SIZE;
}