import React, { useState, useEffect } from 'react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
  onError,
  onLoad,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${containerClassName || 'w-full h-full'}`}>
      <img
        {...props}
        src={imgSrc}
        alt={alt}
        className={className}
        onLoad={(e) => {
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
          if (onError) onError(e);
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
