import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card.js';
import { DifficultyBadge, StatusBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { DifficultyLevel } from '../../config/progression.js';
import { ActiveTaskState } from '../../store/types.js';
import { Check, Clock, Play, Pause, Lock, Sparkles, ChevronRight, RotateCcw, Flag, Headphones } from 'lucide-react';

export interface QuestCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: DifficultyLevel;
  xp: number;
  status: 'todo' | 'in_progress' | 'completed' | 'locked' | 'overdue';
  startedAt?: string;
  dueAt?: string;
  activeTaskState?: ActiveTaskState;
  isBoss?: boolean;
  lockReason?: string;
  onStart?: () => void;
  onOpenVideo?: () => void;
  onReplay?: () => void;
  onPause?: (currentElapsed?: number) => void;
  onResume?: () => void;
  onResetTimer?: () => void;
  onAbandon?: () => void;
  onComplete?: () => void;
  onClickDetail?: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  id,
  name,
  description,
  category,
  difficulty,
  xp,
  status,
  startedAt,
  dueAt,
  activeTaskState,
  isBoss = false,
  lockReason,
  onStart,
  onOpenVideo,
  onReplay,
  onPause,
  onResume,
  onResetTimer,
  onAbandon,
  onComplete,
  onClickDetail,
}) => {
  const isPaused = activeTaskState?.isPaused ?? false;
  const baseElapsed = activeTaskState?.elapsedSeconds ?? 0;
  const lastResumed = activeTaskState?.lastResumedAt || startedAt;

  const [confirmAbandon, setConfirmAbandon] = useState(false);

  // Individual timer starting from 0 for this quest
  const [elapsedSec, setElapsedSec] = useState<number>(() => {
    if (status !== 'in_progress') return 0;
    if (isPaused) return baseElapsed;
    if (lastResumed) {
      const delta = Math.max(0, Math.floor((Date.now() - new Date(lastResumed).getTime()) / 1000));
      return baseElapsed + delta;
    }
    return baseElapsed;
  });

  useEffect(() => {
    if (status !== 'in_progress') {
      setElapsedSec(0);
      setConfirmAbandon(false);
      return;
    }

    if (isPaused) {
      setElapsedSec(baseElapsed);
      return;
    }

    const calcCurrent = () => {
      if (!lastResumed) return baseElapsed;
      const delta = Math.max(0, Math.floor((Date.now() - new Date(lastResumed).getTime()) / 1000));
      return baseElapsed + delta;
    };

    setElapsedSec(calcCurrent());
    const interval = setInterval(() => {
      setElapsedSec(calcCurrent());
    }, 1000);

    return () => clearInterval(interval);
  }, [status, isPaused, baseElapsed, lastResumed]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isCompleted = status === 'completed';
  const isLocked = status === 'locked';

  return (
    <Card
      variant={isBoss ? 'gold' : isCompleted ? 'surface' : 'interactive'}
      className={`p-4 transition-all duration-200 border-l-4 ${
        isBoss
          ? 'border-l-amber-400'
          : isCompleted
          ? 'border-l-emerald-500 opacity-80'
          : status === 'in_progress'
          ? 'border-l-amber-500'
          : 'border-l-violet-500'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header row: Category & Difficulty & XP Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">
              {category}
            </span>
            <DifficultyBadge difficulty={difficulty} />
          </div>

          <div className="flex items-center gap-2">
            {activeTaskState?.isReplay ? (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-bold font-pixel">
                Làm lại (0 XP)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-200 text-xs font-bold font-pixel">
                +{xp} XP
              </span>
            )}
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Quest Title & Description */}
        <div
          onClick={onClickDetail}
          className="cursor-pointer group select-none"
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onClickDetail?.()}
        >
          <div className="flex items-center justify-between">
            <h4
              className={`font-bold font-heading text-base group-hover:text-violet-300 transition-colors flex items-center gap-1.5 ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
              }`}
            >
              {isBoss && <span className="text-amber-400">👑</span>}
              <span>{name}</span>
            </h4>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-violet-300 transition-transform group-hover:translate-x-0.5 shrink-0" />
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Real-time individual quest timer */}
        {status === 'in_progress' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className={`flex items-center gap-1.5 text-xs font-pixel px-3 py-1.5 rounded-xl border transition-all ${
              isPaused
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            }`}>
              {isPaused ? (
                <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
              )}
              <span>
                {isPaused ? 'Đang tạm dừng:' : 'Thời gian làm:'} <strong className="text-white font-mono text-sm tracking-wider">{formatTimer(elapsedSec)}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-pixel tracking-wider border ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
              }`}>
                {isPaused ? 'Tạm dừng' : 'Đang tính giờ'}
              </span>

              {onResetTimer && elapsedSec > 0 && (
                <button
                  type="button"
                  onClick={onResetTimer}
                  title="Đặt lại bộ đếm về 0"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Đặt lại bộ đếm giờ về 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {isLocked && lockReason && (
          <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/40 px-2.5 py-1.5 rounded-lg border border-rose-800/60">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{lockReason}</span>
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700/40 flex-wrap">
          {onClickDetail && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClickDetail}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Chi tiết
            </Button>
          )}

          {status === 'todo' && onStart && (
            <Button
              variant="cyan"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current text-white" />}
              onClick={onStart}
            >
              Bắt đầu
            </Button>
          )}

          {status === 'in_progress' && (
            <>
              {isPaused ? (
                onResume && (
                  <Button
                    variant="cyan"
                    size="sm"
                    icon={<Play className="w-3.5 h-3.5" />}
                    onClick={onResume}
                  >
                    Tiếp tục
                  </Button>
                )
              ) : (
                onPause && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={() => onPause(elapsedSec)}
                  >
                    Tạm dừng
                  </Button>
                )
              )}

              {onOpenVideo && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Headphones className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={onOpenVideo}
                  className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 hover:text-white"
                  title="Quay lại trang video Vùng Yên Tĩnh"
                >
                  Vùng yên tĩnh
                </Button>
              )}

              {onAbandon && (
                confirmAbandon ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setConfirmAbandon(false);
                        onAbandon();
                      }}
                      className="px-2.5 text-xs font-bold"
                    >
                      Bỏ cuộc?
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAbandon(false)}
                      className="px-2 text-xs text-slate-400"
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Flag className="w-3.5 h-3.5 text-rose-400" />}
                    onClick={() => setConfirmAbandon(true)}
                    className="text-rose-300 border-rose-500/40 hover:bg-rose-950/40 hover:text-white"
                    title="Bỏ cuộc nhiệm vụ này và đặt lại từ đầu"
                  >
                    Bỏ cuộc
                  </Button>
                )
              )}
            </>
          )}

          {status === 'in_progress' && onComplete && (
            <Button
              variant={isBoss ? 'gold' : 'primary'}
              size="sm"
              icon={<Check className="w-4 h-4" />}
              onClick={onComplete}
            >
              {activeTaskState?.isReplay ? 'Hoàn thành lại (0 XP)' : 'Hoàn thành'}
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 py-1 px-2 rounded-lg bg-emerald-950/40">
                <Check className="w-4 h-4" />
                <span>Đã nhận +{xp} XP</span>
              </div>
              {(onReplay || onStart) && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-cyan-400" />}
                  onClick={onReplay || onStart}
                  title="Làm lại nhiệm vụ này (rèn luyện, 0 XP)"
                >
                  Làm lại
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
