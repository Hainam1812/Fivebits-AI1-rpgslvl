import React, { useEffect, useRef, useState } from 'react';
import { getCharacterBlob } from '../../store/characterStorage.js';
import { ImageOff } from 'lucide-react';

interface LazyCharacterGifProps {
  characterId: string;
  name: string;
  scale?: number;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}

export const LazyCharacterGif: React.FC<LazyCharacterGifProps> = ({
  characterId,
  name,
  scale = 1,
  className = '',
  imgClassName = 'w-full h-full object-contain',
  eager = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(eager);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Defer loading until card enters viewport (unless eager)
  useEffect(() => {
    if (eager || isVisible) return;

    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, isVisible]);

  // Load Blob from IndexedDB once visible & revoke Object URL on unmount/change
  useEffect(() => {
    if (!isVisible || !characterId) return;

    let cancelled = false;
    let createdUrl: string | null = null;
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      try {
        const blob = await getCharacterBlob(characterId);
        if (cancelled) return;

        if (!blob) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
      setObjectUrl(null);
    };
  }, [characterId, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
    >
      {hasError ? (
        <div
          className="flex flex-col items-center justify-center gap-1 text-slate-500 p-2 text-center"
          aria-label={`Không thể hiển thị GIF của ${name}`}
        >
          <ImageOff className="w-6 h-6 text-slate-500" />
          <span className="text-[10px] font-pixel">Lỗi GIF</span>
        </div>
      ) : objectUrl ? (
        <img
          src={objectUrl}
          alt={name}
          loading={eager ? 'eager' : 'lazy'}
          draggable={false}
          onError={() => setHasError(true)}
          style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
          className={`${imgClassName} pointer-events-none select-none transition-transform duration-150`}
        />
      ) : (
        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      )}
    </div>
  );
};
