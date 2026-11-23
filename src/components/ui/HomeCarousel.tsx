import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type CarouselFocalPoint = 'left' | 'center' | 'right' | number;

export interface CarouselSlide {
  src: string;
  alt: string;
  mobileSrc?: string;
  focalPoint?: CarouselFocalPoint;
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

function deriveMobileSrc(src: string): string | undefined {
  if (!src || /^(data:|blob:)/i.test(src) || src.endsWith('-mobile-4x5.webp')) {
    return undefined;
  }
  const replaced = src.replace(/\.(png|jpe?g|webp)(\?.*)?$/i, '-mobile-4x5.webp$2');
  return replaced !== src ? replaced : undefined;
}

function resolveObjectPosition(focalPoint?: CarouselFocalPoint): string {
  if (focalPoint === 'left') return '0% 50%';
  if (focalPoint === 'right') return '100% 50%';
  if (typeof focalPoint === 'number' && Number.isFinite(focalPoint)) {
    const pct = Math.max(0, Math.min(100, focalPoint));
    return `${pct}% 50%`;
  }
  return '50% 50%';
}

const SLIDES: CarouselSlide[] = [
  {
    src: `${baseUrl}/assets/aistudio/Trang_ch__web__1__c837ee48.png`,
    alt: 'Quá tải với quá nhiều công việc và deadline?',
  },
  {
    src: `${baseUrl}/assets/aistudio/Trang_ch__web__2__bcf21d99.png`,
    alt: 'Tìm kiếm giải pháp Solo Leveling trên Google',
  },
  {
    src: `${baseUrl}/assets/aistudio/Trang_ch__web__3__2df02eeb.png`,
    alt: 'Solo Leveling - Biến to-do list thành trò chơi',
  },
  {
    src: `${baseUrl}/assets/aistudio/Trang_ch__web__4__8e38ce78.png`,
    alt: 'Chọn nhiệm vụ, hoàn thành, nhận thưởng để xây dựng thói quen',
  },
  {
    src: `${baseUrl}/assets/aistudio/Trang_ch__web__5__219f453b.png`,
    alt: 'Hoàn thành nhiệm vụ để mở khóa trang phục và tùy chỉnh nhân vật',
  },
];

const AUTO_ADVANCE_MS = 2000;
const SWIPE_THRESHOLD_PX = 40;

export const HomeCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [failedMobileSrcs, setFailedMobileSrcs] = useState<Record<string, boolean>>({});

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const goTo = useCallback((index: number) => {
    const total = SLIDES.length;
    setActiveIndex(((index % total) + total) % total);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex(prev => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isDragging) return;
    const timer = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % SLIDES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, isDragging]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (isHorizontalSwipe.current) {
      setDragOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current && Math.abs(dragOffset) >= SWIPE_THRESHOLD_PX) {
      if (dragOffset < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-2xl border border-violet-500/35 bg-[#0F132E] shadow-2xl aspect-[4/5] min-[769px]:aspect-video select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label="Giới thiệu Solo Leveling"
      >
        {/* Horizontal Slides Track */}
        <div
          className={`flex h-full w-full ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
          }}
        >
          {SLIDES.map((slide, idx) => {
            const mobileSrc = slide.mobileSrc ?? deriveMobileSrc(slide.src);
            const showMobileSource = Boolean(mobileSrc && !failedMobileSrcs[slide.src]);

            return (
              <div key={slide.src} className="w-full h-full shrink-0">
                <picture className="block w-full h-full">
                  {showMobileSource && (
                    <source media="(max-width: 768px)" srcSet={mobileSrc} />
                  )}
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : undefined}
                    decoding="async"
                    draggable={false}
                    onError={() => {
                      if (showMobileSource) {
                        setFailedMobileSrcs(prev => ({ ...prev, [slide.src]: true }));
                      }
                    }}
                    style={{ objectPosition: resolveObjectPosition(slide.focalPoint) }}
                    className="w-full h-full object-cover"
                  />
                </picture>
              </div>
            );
          })}
        </div>

        {/* Left / Right Controls */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Ảnh trước"
          className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0A0E27]/60 hover:bg-[#0A0E27]/85 border border-white/15 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="Ảnh tiếp theo"
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0A0E27]/60 hover:bg-[#0A0E27]/85 border border-white/15 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3" role="tablist" aria-label="Chọn ảnh giới thiệu">
        {SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Ảnh ${idx + 1}`}
              onClick={() => goTo(idx)}
              className="p-1 cursor-pointer focus:outline-none"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]'
                    : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
