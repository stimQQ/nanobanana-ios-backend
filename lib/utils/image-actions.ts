'use client';

/**
 * Utility functions for image download and share actions
 */

/**
 * Downloads an image from a URL with proper error handling
 * Handles both same-origin and cross-origin images
 */
export async function downloadImage(imageUrl: string, filename?: string) {
  try {
    // Generate filename with timestamp if not provided
    const defaultFilename = `nanobanana-${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.png`;
    const downloadFilename = filename || defaultFilename;

    // For Google/Gemini URLs that may have CORS issues, open in new tab
    if (imageUrl.includes('google.datas.systems') || imageUrl.includes('googleapis.com')) {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = downloadFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    // For other URLs, try to fetch and create blob
    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      return { success: true };
    } catch (_fetchError) {
      // If fetch fails (likely CORS), fall back to opening in new tab
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = downloadFilename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true, fallback: true };
    }
  } catch (_error) {
    console.error('Error downloading image:', _error);
    return {
      success: false,
      error: _error instanceof Error ? _error.message : 'Failed to download image'
    };
  }
}

/**
 * Shares an image using the Web Share API or copies URL to clipboard
 * Provides fallback for browsers that don't support Web Share API
 */
export async function shareImage(imageUrl: string, title?: string) {
  const shareTitle = title || 'Check out this AI-generated image!';
  const shareText = 'Created with NanoBanana AI';

  try {
    // Check if Web Share API is available and can share URLs
    if (navigator.share && navigator.canShare) {
      // First try to share with file if possible
      try {
        // For cross-origin images, just share the URL
        if (imageUrl.includes('google.datas.systems') || imageUrl.includes('googleapis.com')) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: imageUrl,
          });
          return { success: true, method: 'web-share-url' };
        }

        // Try to fetch and share as file for same-origin images
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'nanobanana-creation.png', { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            files: [file],
          });
          return { success: true, method: 'web-share-file' };
        } else {
          // Fallback to URL sharing
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: imageUrl,
          });
          return { success: true, method: 'web-share-url' };
        }
      } catch (_shareError) {
        // If file sharing fails, try URL only
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: imageUrl,
        });
        return { success: true, method: 'web-share-url' };
      }
    } else {
      // Fallback: Copy URL to clipboard
      await copyToClipboard(imageUrl);
      return { success: true, method: 'clipboard' };
    }
  } catch (error: any) {
    // User cancelled the share or another error occurred
    if (error?.name === 'AbortError') {
      return { success: false, error: 'Share cancelled', cancelled: true };
    }

    // Final fallback: Try to copy to clipboard
    try {
      await copyToClipboard(imageUrl);
      return { success: true, method: 'clipboard-fallback' };
    } catch (_clipboardError) {
      console.error('Error sharing image:', error);
      return {
        success: false,
        error: error?.message || 'Failed to share image'
      };
    }
  }
}

/**
 * Copies text to clipboard with fallback for older browsers
 */
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      textArea.remove();
    } catch (_error) {
      textArea.remove();
      throw new Error('Failed to copy to clipboard');
    }
  }
}

/**
 * Checks if the current device is mobile/touch device
 */
export function isMobileDevice(): boolean {
  // Check if we're on the server
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false; // Default to desktop on server
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         ('ontouchstart' in window) ||
         (navigator.maxTouchPoints > 0);
}