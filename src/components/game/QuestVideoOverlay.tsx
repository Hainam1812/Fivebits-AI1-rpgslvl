import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X, Volume2, VolumeX, Play, Pause, Compass, Sparkles, Clock, ShieldCheck, MapPin, Headphones, Check, Music, Maximize, Minimize } from 'lucide-react';
import { DifficultyBadge } from '../ui/Badge.js';
import { getLocationById } from '../../data/locations.js';

export interface QuestVideoOverlayProps {
  quest: {
    id: string;
    name: string;
    description: string;
    condition?: string;
    category: string;
    difficulty: any;
    xp: number;
    locationId?: string;
    isBoss?: boolean;
    activeTaskState?: any;
    source?: 'daily' | 'package';
    packageId?: string;
  };
  isCompleted?: boolean;
  onComplete?: () => void;
  onClose: () => void;
}

type TransitionPhase =
  | 'mosaic_in_start'
  | 'mosaic_in_active'
  | 'mosaic_out_active'
  | 'ready'
  | 'exit_mosaic_in_active'
  | 'exit_mosaic_out_active';

export const QuestVideoOverlay: React.FC<QuestVideoOverlayProps> = ({
  quest,
  isCompleted = false,
  onComplete,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoSectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<TransitionPhase>('mosaic_in_start');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAutoplayHint, setShowAutoplayHint] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedState, setCompletedState] = useState(Boolean(isCompleted));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep state in sync if native fullscreen is exited via browser controls or ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement;
      if (!fsEl) {
        setIsFullscreen(false);
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          try {
            screen.orientation.unlock();
          } catch {
            // Ignore
          }
        }
      } else {
        setIsFullscreen(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isCompleted) {
      setCompletedState(true);
    }
  }, [isCompleted]);

  // Check prefers-reduced-motion
  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Compute mosaic grid dimensions based on viewport
  const grid = useMemo(() => {
    if (typeof window === 'undefined') {
      return { cols: 10, rows: 10, total: 100, inOrder: [], outOrder: [], exitInOrder: [], exitOutOrder: [] };
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Tile size around 70-80px for balanced density and 60fps performance
    const targetSize = Math.max(60, Math.min(85, Math.floor(Math.min(w, h) / 9)));
    const cols = Math.max(4, Math.ceil(w / targetSize));
    const rows = Math.max(4, Math.ceil(h / targetSize));
    const total = cols * rows;

    // Helper to generate Fisher-Yates shuffled permutation
    const generateShuffled = () => {
      const arr = Array.from({ length: total }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    };

    return {
      cols,
      rows,
      total,
      inOrder: generateShuffled(),
      outOrder: generateShuffled(),
      exitInOrder: generateShuffled(),
      exitOutOrder: generateShuffled(),
    };
  }, []);

  // Body scroll locking
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Task timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Forward transition state machine (Mosaic In -> Mosaic Out -> Ready)
  useEffect(() => {
    if (prefersReduced) {
      // Simple fade fallback
      const t1 = setTimeout(() => setPhase('ready'), 350);
      return () => clearTimeout(t1);
    }

    // Step 1: Start animating tiles into black
    const tStart = setTimeout(() => {
      setPhase('mosaic_in_active');
    }, 20);

    // Step 2: Screen is fully covered in black (~1.0s), start revealing video
    const tReveal = setTimeout(() => {
      setPhase('mosaic_out_active');
    }, 1050);

    // Step 3: Tiles completely gone (~2.0s), video is fully ready
    const tReady = setTimeout(() => {
      setPhase('ready');
    }, 2050);

    return () => {
      clearTimeout(tStart);
      clearTimeout(tReveal);
      clearTimeout(tReady);
    };
  }, [prefersReduced]);

  // Video Autoplay & Audio Handling
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;

    // Video & Audio paths: use base URL safe path
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    video.src = `${baseUrl}/quest-video.mp4`;

    if (audio) {
      audio.src = `${baseUrl}/quest-audio.mp3`;
      audio.loop = true;
      audio.volume = 0.75;
      audio.muted = false;
    }

    // Attempt autoplay with sound
    video.muted = false;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
          setShowAutoplayHint(false);
          if (audio) {
            audio.muted = false;
            audio.play().catch(() => {});
          }
        })
        .catch(() => {
          // Browser prevented autoplay with unmuted audio: fallback to muted
          video.muted = true;
          if (audio) {
            audio.muted = true;
          }
          setIsMuted(true);
          setShowAutoplayHint(true);
          video
            .play()
            .then(() => {
              setIsPlaying(true);
              if (audio) {
                audio.play().catch(() => {});
              }
            })
            .catch(e => console.warn('[Video] Playback failed:', e));
        });
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  // Handle Exit with reverse mosaic transition
  const handleExit = useCallback(() => {
    if (phase === 'exit_mosaic_in_active' || phase === 'exit_mosaic_out_active') {
      return; // Already exiting
    }

    // Immediately pause and reset video and audio
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);

    if (prefersReduced) {
      onClose();
      return;
    }

    // Phase 1 of exit: Cover screen with black tiles
    setPhase('exit_mosaic_in_active');

    // Phase 2 of exit: After ~0.75s, screen is completely black. Now uncover back to Quests page
    const tExitCovered = setTimeout(() => {
      setPhase('exit_mosaic_out_active');
    }, 750);

    // Phase 3: Completely remove overlay from DOM
    const tComplete = setTimeout(() => {
      onClose();
    }, 1550);

    return () => {
      clearTimeout(tExitCovered);
      clearTimeout(tComplete);
    };
  }, [phase, prefersReduced, onClose]);

  const toggleFullscreen = useCallback(async () => {
    const container = videoSectionRef.current;
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (container) {
        try {
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            await (container as any).webkitRequestFullscreen();
          }
          if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
            (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch {
          // Fallback to pure CSS fixed inset-0 fullscreen if native Fullscreen API is blocked/unsupported
        }
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      } catch {
        // Ignore
      }
    }
  }, [isFullscreen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isFullscreen) {
          toggleFullscreen();
          return;
        }
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit, isFullscreen, toggleFullscreen]);

  // Toggle Mute (synchronized between video and music)
  const toggleMute = () => {
    const nextMuted = !isMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
      if (!nextMuted && isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
    setIsMuted(nextMuted);
    if (!nextMuted) {
      setShowAutoplayHint(false);
    }
  };

  // Toggle Play / Pause (synchronized between video and music)
  const togglePlay = () => {
    if (isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current) videoRef.current.play().catch(() => {});
      if (audioRef.current) {
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const location = quest.locationId ? getLocationById(quest.locationId) : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video nhiệm vụ: ${quest.name}`}
      className="fixed inset-0 z-[99999] bg-black text-slate-100 flex flex-col select-none overflow-hidden"
    >
      {/* UNDER LAYER: Video & Quest Briefing Panel */}
      <div
        className={`relative z-10 w-full h-full flex flex-col transition-opacity duration-300 ${
          phase === 'exit_mosaic_out_active' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Header Bar */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#0B0F2A]/90 backdrop-blur-md border-b border-violet-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Compass className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-pixel text-cyan-300 tracking-wider uppercase flex items-center gap-1">
                  <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vùng Yên Tĩnh</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-pixel bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Focus Zone
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold font-heading text-slate-200 line-clamp-1">
                {quest.name}
              </h2>
            </div>
          </div>

          {/* Exit Button */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-pixel text-slate-400">
              ESC để thoát
            </span>
            <button
              type="button"
              onClick={handleExit}
              aria-label="Thoát xem video nhiệm vụ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/50 text-rose-200 hover:text-white transition-all shadow-lg hover:shadow-rose-900/40 cursor-pointer text-xs font-bold font-pixel"
            >
              <X className="w-4 h-4" />
              <span>Thoát</span>
            </button>
          </div>
        </header>

        {/* Content Area: Video (65%) + Quest Info Panel (35%) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[#050714]">
          {/* Video Section (~65% desktop, or Fullscreen Mode) */}
          <section
            ref={videoSectionRef}
            className={
              isFullscreen
                ? 'fixed inset-0 z-[25] w-full h-full flex items-center justify-center bg-black overflow-hidden'
                : 'w-full lg:w-[65%] h-[40vh] sm:h-[48vh] lg:h-full relative flex items-center justify-center bg-black overflow-hidden border-b lg:border-b-0 lg:border-r border-violet-900/30'
            }
          >
            {isFullscreen && (
              <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-bold font-heading text-slate-200 line-clamp-1 max-w-[65%]">
                  {quest.name}
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label="Thu nhỏ toàn màn hình"
                  className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] font-bold font-pixel transition-colors cursor-pointer"
                >
                  <Minimize className="w-3.5 h-3.5" />
                  <span>Thu nhỏ</span>
                </button>
              </div>
            )}
            <video
              ref={videoRef}
              playsInline
              loop
              autoPlay
              className="w-full h-full object-contain"
              onPlay={() => {
                setIsPlaying(true);
                if (audioRef.current && audioRef.current.paused) {
                  audioRef.current.play().catch(() => {});
                }
              }}
              onPause={() => {
                setIsPlaying(false);
                if (audioRef.current && !audioRef.current.paused) {
                  audioRef.current.pause();
                }
              }}
            />
            {/* Background Music synchronized with video */}
            <audio ref={audioRef} playsInline loop preload="auto" />

            {/* Autoplay Muted Notification Banner */}
            {showAutoplayHint && isMuted && (
              <div className={`absolute ${isFullscreen ? 'top-14' : 'top-4'} left-4 right-4 sm:left-auto sm:right-4 z-20 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#161B40]/90 backdrop-blur-md border border-cyan-500/50 shadow-xl text-xs text-cyan-200`}>
                <span className="flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Trình duyệt đang tắt tiếng video & nhạc</span>
                </span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-pixel text-[11px] transition-colors cursor-pointer"
                >
                  Bật Tiếng
                </button>
              </div>
            )}

            {/* Video Floating Controls */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between px-3 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Tạm dừng video và nhạc' : 'Tiếp tục phát'}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Bật âm thanh (Video & Nhạc)' : 'Tắt âm thanh'}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Phát toàn màn hình'}
                  title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    isFullscreen
                      ? 'text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              </div>

              {/* Music Indicator */}
              <div className="flex items-center gap-2 text-[11px] font-pixel text-slate-300 overflow-hidden">
                <Music className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isPlaying && !isMuted ? 'animate-bounce' : ''}`} />
                <span className="line-clamp-1 text-slate-200">
                  Legends Never Die
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
            </div>
          </section>

          {/* Quest Info Panel (~35% desktop) */}
          <aside className="w-full lg:w-[35%] h-auto lg:h-full p-4 sm:p-6 flex flex-col justify-between overflow-y-auto bg-[#0A0E27]/90 space-y-5">
            <div className="space-y-4">
              {/* Category, Difficulty & XP Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider font-pixel">
                    {quest.category}
                  </span>
                  <DifficultyBadge difficulty={quest.difficulty} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-950/80 border border-violet-500/50 text-violet-200 text-xs font-bold font-pixel shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{quest.xp} XP</span>
                </div>
              </div>

              {/* Soundtrack Badge */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-pixel">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Music className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isPlaying && !isMuted ? 'animate-bounce' : ''}`} />
                  <span className="line-clamp-1">Nhạc nền: Legends Never Die</span>
                </div>
                <span className="text-[10px] text-cyan-400/80 font-mono">
                  {isMuted ? 'Tắt tiếng' : 'Đang phát'}
                </span>
              </div>

              {/* Quest Title */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-heading text-white tracking-wide">
                  {quest.isBoss && <span className="text-amber-400 mr-1.5">👑</span>}
                  {quest.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {quest.description}
                </p>
              </div>

              {/* Condition / Clear Criteria Box */}
              {quest.condition && (
                <div className="p-3.5 rounded-2xl bg-[#161B40] border border-cyan-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 font-pixel">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Điều Kiện Hoàn Thành</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {quest.condition}
                  </p>
                </div>
              )}

              {/* Location Badge (if applicable) */}
              {location && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Khu vực gợi ý: <strong className="text-slate-200">{location.name}</strong></span>
                </div>
              )}

              {/* Active Timer Status */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                  <div>
                    <div className="text-[10px] font-pixel uppercase tracking-wider text-emerald-400">
                      Nhiệm vụ đang chạy
                    </div>
                    <div className="text-xs text-slate-300">
                      Thời gian phiên hiện tại
                    </div>
                  </div>
                </div>
                <div className="text-lg font-mono font-bold text-white tracking-wider">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>

              {/* Nút Hoàn Thành trong Vùng Yên Tĩnh nằm dưới chỗ Nhiệm vụ đang chạy, thời gian phiên hiện tại */}
              {onComplete && !completedState && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletedState(true);
                    onComplete();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold font-pixel text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xác Nhận Hoàn Thành (+{quest.xp} XP)</span>
                </button>
              )}

              {completedState && (
                <div className="w-full py-3 px-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 font-pixel text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Đã Hoàn Thành Nhiệm Vụ (+{quest.xp} XP)</span>
                </div>
              )}
            </div>

            {/* Motivational Footer & Quick Return Button */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="text-[11px] text-slate-400 italic bg-white/5 p-3 rounded-xl border border-white/5">
                💡 <span className="font-semibold text-slate-300">Lưu ý:</span> Bạn có thể quay lại trang Quests bất kỳ lúc nào bằng nút Thoát hoặc phím ESC mà không làm mất tiến độ nhiệm vụ.
              </div>

              <button
                type="button"
                onClick={handleExit}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold font-pixel text-xs transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Quay Lại Danh Sách Quests (ESC)</span>
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* TOP LAYER: MOSAIC GRID OF BLACK SQUARES */}
      {!prefersReduced && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-30 pointer-events-none grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
            gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
          }}
        >
          {Array.from({ length: grid.total }).map((_, index) => {
            let opacity = 0;
            let scale = 0;
            let delay = 0;
            let duration = 350;

            if (phase === 'mosaic_in_start') {
              opacity = 0;
              scale = 0;
            } else if (phase === 'mosaic_in_active') {
              // Fade In to Black in random order
              const rank = grid.inOrder[index] ?? 0;
              delay = (rank / grid.total) * 0.7; // Stagger across 0.7s
              duration = 350;
              opacity = 1;
              scale = 1.05; // slight overlap so no subpixel seams
            } else if (phase === 'mosaic_out_active') {
              // Fade Out to reveal video in random order
              const rank = grid.outOrder[index] ?? 0;
              delay = (rank / grid.total) * 0.6; // Stagger across 0.6s
              duration = 350;
              opacity = 0;
              scale = 0;
            } else if (phase === 'ready') {
              // Video is fully uncovered
              opacity = 0;
              scale = 0;
            } else if (phase === 'exit_mosaic_in_active') {
              // Exit: Fade In to Black in random order
              const rank = grid.exitInOrder[index] ?? 0;
              delay = (rank / grid.total) * 0.45;
              duration = 300;
              opacity = 1;
              scale = 1.05;
            } else if (phase === 'exit_mosaic_out_active') {
              // Exit: Fade Out to reveal Quests page in random order
              const rank = grid.exitOutOrder[index] ?? 0;
              delay = (rank / grid.total) * 0.45;
              duration = 300;
              opacity = 0;
              scale = 0;
            }

            return (
              <div
                key={index}
                className="bg-black will-change-[transform,opacity]"
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                  transitionProperty: 'transform, opacity',
                  transitionDuration: `${duration}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transitionDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Reduced motion fade overlay */}
      {prefersReduced && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-30 pointer-events-none bg-black transition-opacity duration-300 ${
            phase === 'ready' ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};
