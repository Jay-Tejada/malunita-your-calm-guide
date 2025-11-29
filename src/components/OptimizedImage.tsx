import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  placeholder?: string; // base64 LQIP
  className?: string;
  style?: React.CSSProperties;
  preload?: boolean; // Whether to preload this image
  onLoad?: () => void;
}

/**
 * Optimized image component with:
 * - Lazy loading
 * - Low Quality Image Placeholder (LQIP)
 * - Async decoding
 * - Preloading support
 */
export const OptimizedImage = ({
  src,
  alt,
  placeholder,
  className,
  style,
  preload = false,
  onLoad,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Preload image if requested
    if (preload) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
    } else {
      // Otherwise use lazy loading
      setCurrentSrc(src);
    }
  }, [src, preload, onLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div className="relative w-full h-full">
      {/* Blurred placeholder */}
      {placeholder && !isLoaded && (
        <img
          src={placeholder}
          alt=""
          className={cn("absolute inset-0 w-full h-full blur-sm", className)}
          style={style}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={preload ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={style}
      />
    </div>
  );
};

