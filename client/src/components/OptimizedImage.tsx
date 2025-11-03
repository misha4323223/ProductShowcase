import { useEffect, useRef } from "react";

interface OptimizedImageProps {
  src: string;
  webpSrc: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
}

export default function OptimizedImage({
  src,
  webpSrc,
  alt,
  className = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && fetchPriority && fetchPriority !== "auto") {
      imgRef.current.setAttribute("fetchpriority", fetchPriority);
    }
  }, [fetchPriority]);

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
      />
    </picture>
  );
}
