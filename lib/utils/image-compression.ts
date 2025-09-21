'use client';

/**
 * Client-side image compression utilities for optimizing upload speed
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 2,
};

/**
 * Compress an image file on the client side
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for already small files
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB < 0.5) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Create object URL first
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // Clean up object URL after loading
      URL.revokeObjectURL(url);

      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxWidth = config.maxWidth!;
        const maxHeight = config.maxHeight!;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions and draw the image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if we achieved the target size
            const compressedSizeMB = blob.size / (1024 * 1024);

            // If still too large, reduce quality further
            if (compressedSizeMB > config.maxSizeMB! && config.quality! > 0.3) {
              const reducedQuality = Math.max(0.3, config.quality! - 0.1);
              const result = await compressImage(file, {
                ...options,
                quality: reducedQuality,
              });
              resolve(result);
            } else {
              // Create a new File object with the compressed blob
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: blob.type || file.type,
                  lastModified: Date.now(),
                }
              );

              console.log(`Image compressed: ${sizeInMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB`);
              resolve(compressedFile);
            }
          },
          file.type || 'image/jpeg',
          config.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      // Clean up object URL on error
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    // Load the image
    img.src = url;
  });
}

/**
 * Calculate estimated upload time for a file
 * @param fileSize - Size in bytes
 * @param speedMbps - Upload speed in Mbps (default: 10)
 * @returns Estimated time in seconds
 */
export function estimateUploadTime(fileSize: number, speedMbps: number = 10): number {
  const fileSizeMb = (fileSize * 8) / (1024 * 1024); // Convert bytes to megabits
  return fileSizeMb / speedMbps;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}