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
      category={isBoss ? undefined : category}
      locked={isLocked}
      variant={isBoss ? 'gold' : isCompleted ? 'surface' : 'interactive'}
      className={`p-4 ${isBoss && !isCompleted && !isLocked ? 'pixel-event-frame' : ''} ${
        isCompleted ? 'opacity-80' : ''
      }`}
    >
      <div className="flex flex-col gap-3 relative z-[2]">
        {/* Header row: Category & Difficulty & XP Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[var(--frame-color)] uppercase tracking-wider">
              {category}
            </span>
            <DifficultyBadge difficulty={difficulty} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeTaskState?.isReplay ? (
              <span className="px-2 py-0.5 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--sky)] text-[var(--sky)] text-xs font-bold">
                Làm lại (0 XP)
              </span>
            ) : (
              <span className="px-2 py-1 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] text-[var(--gold)] text-[10px] font-bold font-num">
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
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`font-bold font-heading text-base group-hover:text-[var(--gold)] transition-colors flex items-center gap-1.5 ${
                isCompleted ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'
              }`}
            >
              {isBoss && <span className="text-[var(--gold)]">👑</span>}
              <span>{name}</span>
            </h4>
            <ChevronRight className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--gold)] transition-transform group-hover:translate-x-0.5 shrink-0" />
          </div>
          <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Real-time individual quest timer */}
        {status === 'in_progress' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-[2px] border-2 ${
                isPaused
                  ? 'bg-[var(--panel-2)] border-[var(--gold)] text-[var(--gold)]'
                  : 'bg-[var(--panel-2)] border-[var(--green)] text-[var(--green)]'
              }`}
            >
              {isPaused ? (
                <Pause className="w-3.5 h-3.5 text-[var(--gold)] shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
              )}
              <span className="font-semibold">
                {isPaused ? 'Đang tạm dừng:' : 'Thời gian làm:'}{' '}
                <strong className="text-[var(--text)] font-num text-xs tracking-wider ml-1">
                  {formatTimer(elapsedSec)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-[2px] text-xs font-bold border-2 ${
                  isPaused
                    ? 'bg-[var(--panel-2)] text-[var(--gold)] border-[var(--gold)]'
                    : 'bg-[var(--panel-2)] text-[var(--green)] border-[var(--green)]'
                }`}
              >
                {isPaused ? 'Tạm dừng' : 'Đang tính giờ'}
              </span>

              {onResetTimer && elapsedSec > 0 && (
                <button
                  type="button"
                  onClick={onResetTimer}
                  title="Đặt lại bộ đếm về 0"
                  className="p-1.5 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)] transition-colors cursor-pointer"
                  aria-label="Đặt lại bộ đếm giờ về 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {isLocked && lockReason && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--danger)] bg-[var(--bg)] px-2.5 py-1.5 rounded-[2px] border-2 border-[var(--lock)]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{lockReason}</span>
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex items-center justify-end gap-2 pt-2.5 border-t-2 border-[var(--ink)] flex-wrap">
          {onClickDetail && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClickDetail}
            >
              Chi tiết
            </Button>
          )}

          {status === 'todo' && onStart && (
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
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
                    variant="primary"
                    size="sm"
                    icon={<Play className="w-3.5 h-3.5 fill-current" />}
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
                    icon={<Pause className="w-3.5 h-3.5 text-[var(--gold)]" />}
                    onClick={() => onPause(elapsedSec)}
                  >
                    Tạm dừng
                  </Button>
                )
              )}

              {onOpenVideo && (
                <Button
                  variant="cyan"
                  size="sm"
                  icon={<Headphones className="w-3.5 h-3.5" />}
                  onClick={onOpenVideo}
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
                    >
                      Bỏ cuộc?
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAbandon(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Flag className="w-3.5 h-3.5 text-[var(--danger)]" />}
                    onClick={() => setConfirmAbandon(true)}
                    className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--panel-2)]"
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
              variant="gold"
              size="sm"
              icon={<Check className="w-4 h-4" />}
              onClick={onComplete}
            >
              {activeTaskState?.isReplay ? 'Hoàn thành lại (0 XP)' : 'Hoàn thành'}
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--green)] py-1 px-2.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--green)]">
                <Check className="w-4 h-4" />
                <span>Đã nhận +{xp} XP</span>
              </div>
              {(onReplay || onStart) && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-[var(--sky)]" />}
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
