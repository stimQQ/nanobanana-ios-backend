/**
 * Upload Cache Utility
 * Provides local caching for uploaded images to reduce latency
 */

interface CachedImage {
  url: string;
  base64: string;
  timestamp: number;
  size: number;
}

class UploadCache {
  private static instance: UploadCache;
  private cache: Map<string, CachedImage> = new Map();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB max cache
  private maxAge = 3600000; // 1 hour cache lifetime

  static getInstance(): UploadCache {
    if (!UploadCache.instance) {
      UploadCache.instance = new UploadCache();
    }
    return UploadCache.instance;
  }

  /**
   * Cache an uploaded image
   */
  set(url: string, base64: string): void {
    const size = this.getBase64Size(base64);

    // Clean old entries if cache is too large
    this.cleanCache(size);

    this.cache.set(url, {
      url,
      base64,
      timestamp: Date.now(),
      size
    });

    // Also store in localStorage for persistence
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`img_cache_${this.hashUrl(url)}`, JSON.stringify({
          base64: base64.substring(0, 100), // Store preview only
          timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.warn('LocalStorage cache failed:', e);
    }
  }

  /**
   * Get cached image
   */
  get(url: string): string | null {
    const cached = this.cache.get(url);

    if (cached) {
      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.maxAge) {
        this.cache.delete(url);
        return null;
      }
      return cached.base64;
    }

    return null;
  }

  /**
   * Check if URL is cached
   */
  has(url: string): boolean {
    const cached = this.cache.get(url);
    if (!cached) return false;

    // Check expiration
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(url);
      return false;
    }

    return true;
  }

  /**
   * Clean cache to stay under size limit
   */
  private cleanCache(newSize: number): void {
    let totalSize = newSize;

    // Calculate current cache size
    for (const item of this.cache.values()) {
      totalSize += item.size;
    }

    // If over limit, remove oldest items
    if (totalSize > this.maxCacheSize) {
      const sorted = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      while (totalSize > this.maxCacheSize && sorted.length > 0) {
        const [key, value] = sorted.shift()!;
        totalSize -= value.size;
        this.cache.delete(key);
      }
    }
  }

  /**
   * Calculate base64 string size in bytes
   */
  private getBase64Size(base64: string): number {
    const padding = (base64.match(/=/g) || []).length;
    return Math.floor((base64.length * 3) / 4) - padding;
  }

  /**
   * Simple hash function for URL
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();

    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('img_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    itemCount: number;
    totalSize: number;
    oldestItem: number | null;
  } {
    let totalSize = 0;
    let oldestTimestamp: number | null = null;

    for (const item of this.cache.values()) {
      totalSize += item.size;
      if (!oldestTimestamp || item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
    }

    return {
      itemCount: this.cache.size,
      totalSize,
      oldestItem: oldestTimestamp
    };
  }
}

export const uploadCache = UploadCache.getInstance();

/**
 * Upload with caching wrapper
 */
export async function uploadWithCache(
  file: File,
  uploadFn: (file: File) => Promise<{ url: string; base64?: string }>
): Promise<{ url: string; base64?: string; cached?: boolean }> {
  // Generate a unique key for this file
  const fileKey = `${file.name}_${file.size}_${file.lastModified}`;

  // Check if we have a cached version
  const cached = uploadCache.get(fileKey);
  if (cached) {
    console.log('[Cache] Using cached image for:', file.name);
    return { url: fileKey, base64: cached, cached: true };
  }

  // Upload the file
  console.log('[Cache] Uploading new image:', file.name);
  const result = await uploadFn(file);

  // Cache the result if it includes base64
  if (result.base64) {
    uploadCache.set(result.url, result.base64);
  }

  return { ...result, cached: false };
}

/**
 * Preload image with progressive loading
 */
export function preloadImage(url: string, callback?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check cache first
    if (uploadCache.has(url)) {
      callback?.(100);
      resolve();
      return;
    }

    const img = new Image();

    // Simulate progress for better UX
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) progress = 90;
      callback?.(progress);
    }, 100);

    img.onload = () => {
      clearInterval(progressInterval);
      callback?.(100);
      resolve();
    };

    img.onerror = () => {
      clearInterval(progressInterval);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}