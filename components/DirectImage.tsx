import { useState } from 'react';

interface DirectImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onLoad?: () => void;
}

/**
 * DirectImage component that bypasses Next.js image optimization
 * and renders images directly with appropriate error handling
 */
export default function DirectImage({ src, alt, className, onClick, onLoad }: DirectImageProps) {
  const [hasError, setHasError] = useState(false);
  
  // Add a cache-busting parameter to avoid browser caching
  const cacheBuster = `${src.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const imageSrc = hasError ? '/placeholder-image.png' : `${src}${cacheBuster}`;
  
  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className || ''}
      onClick={onClick}
      onError={() => {
        console.error(`Failed to load image: ${src}`);
        setHasError(true);
      }}
      onLoad={() => {
        console.log(`Successfully loaded image: ${src}`);
        onLoad?.();
      }}
      loading="lazy"
      style={{ objectFit: 'contain' }}
    />
  );
} 