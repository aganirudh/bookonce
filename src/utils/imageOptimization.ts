/**
 * Image Optimization Utilities
 * Provides WebP format support and lazy loading for hotel images
 */

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get optimized image URL with WebP support
 * @param imageUrl - Original image URL
 * @param fallbackUrl - Fallback URL if WebP is not supported
 */
export const getOptimizedImageUrl = (imageUrl: string, fallbackUrl?: string): string => {
  if (supportsWebP() && imageUrl.includes('.jpg') || imageUrl.includes('.png')) {
    // In production, this would convert to WebP
    // For now, return original URL
    return imageUrl;
  }
  return fallbackUrl || imageUrl;
};

/**
 * Lazy load image with Intersection Observer
 * @param imageElement - Image element to lazy load
 * @param src - Image source URL
 */
export const lazyLoadImage = (imageElement: HTMLImageElement, src: string): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    imageObserver.observe(imageElement);
  } else {
    // Fallback for browsers without Intersection Observer
    imageElement.src = src;
  }
};

/**
 * Preload critical images
 * @param imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls: string[]): void => {
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * Generate responsive image srcset
 * @param baseUrl - Base image URL
 * @param sizes - Array of sizes (e.g., [320, 640, 1024])
 */
export const generateSrcSet = (baseUrl: string, sizes: number[]): string => {
  return sizes
    .map((size) => {
      // In production, this would generate different sized images
      return `${baseUrl} ${size}w`;
    })
    .join(', ');
};

/**
 * Image loading priority levels
 */
export enum ImagePriority {
  HIGH = 'high',
  LOW = 'low',
  AUTO = 'auto',
}

/**
 * Optimized image component props
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: ImagePriority;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Calculate optimal image dimensions based on viewport
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum width constraint
 */
export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } => {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }

  const ratio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * ratio),
  };
};

/**
 * Image format conversion utilities
 */
export const ImageFormats = {
  WEBP: 'image/webp',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  AVIF: 'image/avif',
} as const;

/**
 * Check if format is supported
 * @param format - Image format to check
 */
export const isFormatSupported = async (format: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  try {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, format);
    });
    return blob !== null;
  } catch {
    return false;
  }
};

/**
 * Performance monitoring for image loading
 */
export class ImageLoadMonitor {
  private loadTimes: Map<string, number> = new Map();

  startLoad(imageUrl: string): void {
    this.loadTimes.set(imageUrl, performance.now());
  }

  endLoad(imageUrl: string): number {
    const startTime = this.loadTimes.get(imageUrl);
    if (!startTime) return 0;

    const loadTime = performance.now() - startTime;
    this.loadTimes.delete(imageUrl);
    return loadTime;
  }

  getAverageLoadTime(): number {
    if (this.loadTimes.size === 0) return 0;
    const times = Array.from(this.loadTimes.values());
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
}

export const imageLoadMonitor = new ImageLoadMonitor();
