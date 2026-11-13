import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.js';
import { DifficultyBadge, StatusBadge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { DifficultyLevel } from '../../config/progression.js';
import { ActiveTaskState } from '../../store/types.js';
import { Check, Play, Pause, MapPin, AlertCircle, Sparkles, Clock, Flag, RotateCcw, Headphones } from 'lucide-react';
import { getLocationById } from '../../data/locations.js';

interface QuestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: {
    id: string;
    name: string;
    description: string;
    condition: string;
    category: string;
    difficulty: DifficultyLevel;
    xp: number;
    locationId?: string;
    status: 'todo' | 'in_progress' | 'completed' | 'locked' | 'overdue';
    isBoss?: boolean;
    lockReason?: string;
    activeTaskState?: ActiveTaskState;
  } | null;
  onStart?: () => void;
  onOpenVideo?: () => void;
  onPause?: (currentElapsed?: number) => void;
  onResume?: () => void;
  onAbandon?: () => void;
  onComplete?: () => void;
}

export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({
  isOpen,
  onClose,
  quest,
  onStart,
  onOpenVideo,
  onPause,
  onResume,
  onAbandon,
  onComplete,
}) => {
  const isPaused = quest?.activeTaskState?.isPaused ?? false;
  const baseElapsed = quest?.activeTaskState?.elapsedSeconds ?? 0;
  const lastResumed = quest?.activeTaskState?.lastResumedAt || quest?.activeTaskState?.startedAt;
  const questStatus = quest?.status;

  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [elapsedSec, setElapsedSec] = useState<number>(() => {
    if (!quest || questStatus !== 'in_progress') return 0;
    if (isPaused) return baseElapsed;
    if (lastResumed) {
      const delta = Math.max(0, Math.floor((Date.now() - new Date(lastResumed).getTime()) / 1000));
      return baseElapsed + delta;
    }
    return baseElapsed;
  });

  useEffect(() => {
    if (!isOpen || !quest || questStatus !== 'in_progress') {
      setElapsedSec(0);
      setConfirmAbandon(false);
      return;
    }
    if (isPaused) {
      setElapsedSec(baseElapsed);
      return;
    }
    const calc = () => {
      if (!lastResumed) return baseElapsed;
      const delta = Math.max(0, Math.floor((Date.now() - new Date(lastResumed).getTime()) / 1000));
      return baseElapsed + delta;
    };
    setElapsedSec(calc());
    const interval = setInterval(() => setElapsedSec(calc()), 1000);
    return () => clearInterval(interval);
  }, [isOpen, quest, questStatus, isPaused, baseElapsed, lastResumed]);

  if (!isOpen || !quest) return null;

  const loc = quest.locationId ? getLocationById(quest.locationId) : undefined;
  const isCompleted = quest.status === 'completed';
  const isLocked = quest.status === 'locked';

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={quest.name} maxWidth="md">
      <div className="space-y-5">
        {/* Badges & Meta */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              {quest.category}
            </span>
            <DifficultyBadge difficulty={quest.difficulty} />
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-violet-950 border border-violet-500/50 text-violet-200 text-xs font-bold font-pixel">
              +{quest.xp} XP
            </span>
            <StatusBadge status={quest.status} />
          </div>
        </div>

        {/* Quest Description */}
        <div className="space-y-1.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Nội dung nhiệm vụ:
          </h5>
          <p className="text-sm text-slate-200 leading-relaxed bg-[#0F132E]/70 p-3 rounded-xl border border-slate-800">
            {quest.description}
          </p>
        </div>

        {/* Specific Completion Condition */}
        <div className="space-y-1.5">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Điều kiện hoàn thành xác thực:</span>
          </h5>
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs sm:text-sm text-amber-200 leading-relaxed font-medium">
            {quest.condition}
          </div>
        </div>

        {/* Location Lore info */}
        {loc && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-100">{loc.name}</span>: {loc.lore}
            </div>
          </div>
        )}

        {/* In-progress timer status */}
        {quest.status === 'in_progress' && (
          <div className={`p-3.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
            isPaused
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Pause className="w-4 h-4 text-amber-400" />
              ) : (
                <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
              )}
              <span className="text-xs font-semibold">
                {isPaused ? 'Nhiệm vụ đang tạm dừng:' : 'Nhiệm vụ đang đếm giờ:'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-black/40">
                {formatTimer(elapsedSec)}
              </span>
              <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border uppercase ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              }`}>
                {isPaused ? 'Tạm dừng' : 'Đang làm'}
              </span>
            </div>
          </div>
        )}

        {/* Lock warning */}
        {isLocked && quest.lockReason && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{quest.lockReason}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-700/60 flex-wrap">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>

          {quest.status === 'todo' && onStart && (
            <Button
              variant="cyan"
              icon={<Play className="w-4 h-4 fill-current text-white" />}
              onClick={() => {
                onStart();
                onClose();
              }}
            >
              Bắt đầu
            </Button>
          )}

          {quest.status === 'in_progress' && (
            <>
              {isPaused ? (
                onResume && (
                  <Button
                    variant="cyan"
                    icon={<Play className="w-4 h-4" />}
                    onClick={onResume}
                  >
                    Tiếp tục làm
                  </Button>
                )
              ) : (
                onPause && (
                  <Button
                    variant="secondary"
                    icon={<Pause className="w-4 h-4 text-amber-400" />}
                    onClick={() => onPause(elapsedSec)}
                  >
                    Tạm dừng
                  </Button>
                )
              )}

              {onAbandon && (
                confirmAbandon ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="danger"
                      onClick={() => {
                        setConfirmAbandon(false);
                        onAbandon();
                        onClose();
                      }}
                    >
                      Xác nhận bỏ cuộc
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmAbandon(false)}
                      className="text-xs text-slate-400"
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    icon={<Flag className="w-4 h-4 text-rose-400" />}
                    onClick={() => setConfirmAbandon(true)}
                    className="text-rose-300 border-rose-500/40 hover:bg-rose-950/40 hover:text-white"
                  >
                    Bỏ cuộc
                  </Button>
                )
              )}
              {onOpenVideo && (
                <Button
                  variant="secondary"
                  icon={<Headphones className="w-4 h-4 text-cyan-400" />}
                  onClick={() => {
                    onClose();
                    onOpenVideo();
                  }}
                  className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
                  title="Quay lại trang video Vùng Yên Tĩnh"
                >
                  Vùng yên tĩnh
                </Button>
              )}
            </>
          )}

          {quest.status === 'in_progress' && onComplete && (
            <Button
              variant={quest.isBoss ? 'gold' : 'primary'}
              icon={<Check className="w-4 h-4" />}
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              {quest.activeTaskState?.isReplay
                ? 'Xác nhận hoàn thành (Làm lại - 0 XP)'
                : `Xác nhận hoàn thành (+${quest.xp} XP)`}
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Đã hoàn thành</span>
              </div>
              {onStart && (
                <Button
                  variant="secondary"
                  icon={<RotateCcw className="w-4 h-4 text-cyan-400" />}
                  onClick={() => {
                    onStart();
                    onClose();
                  }}
                >
                  Làm lại (0 XP)
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
