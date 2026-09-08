import { useEffect, useState } from "react";

interface HeroSlideshowProps {
  images: string[];
  intervalMs?: number;
}

/**
 * Fullbleed background slideshow with crossfade.
 * A dark gradient overlay sits on top so foreground text stays readable.
 */
export function HeroSlideshow({ images, intervalMs = 5000 }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <div className="absolute inset-0 -z-0 overflow-hidden">
      {/* Image layers — crossfade via opacity */}
      {images.map((src, i) => (
        <div
          key={src + i}
          className="absolute inset-0 bg-center bg-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Dark brand-tinted overlay for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary-deep) / 0.92) 0%, hsl(var(--primary) / 0.78) 60%, hsl(var(--primary) / 0.55) 100%)",
        }}
      />
    </div>
  );
}
