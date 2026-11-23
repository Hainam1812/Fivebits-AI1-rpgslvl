import React from 'react';
import { useGame } from '../../store/GameContext.js';
import { Button } from './Button.js';
import { Sparkles, Trophy, Award, Shirt } from 'lucide-react';
import { getCosmeticById } from '../../data/cosmetics.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';

export const NotificationModal: React.FC = () => {
  const { currentNotification, dismissNotification, dispatch } = useGame();

  if (!currentNotification) return null;

  const handleEquipCosmetic = (cosmeticId: string) => {
    const cos = getCosmeticById(cosmeticId);
    if (cos) {
      dispatch({ type: 'EQUIP_COSMETIC', payload: { slot: cos.slot, cosmeticId: cos.id } });
    }
    dismissNotification();
  };

  const renderContent = () => {
    switch (currentNotification.type) {
      case 'level_up':
        return (
          <div className="text-center py-4 space-y-4">
            <div className="w-24 h-24 mx-auto pixel-frame pixel-frame-gold bg-[var(--bg)] flex flex-col items-center justify-center">
              <span className="text-xs uppercase font-bold text-[var(--gold)] tracking-wider">Level</span>
              <span className="text-2xl font-bold text-[var(--text)] font-num mt-1">
                {currentNotification.level}
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-pixel-latin text-[var(--gold)] tracking-wider">
                LEVEL UP!
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                Bạn đã nâng cấp sức mạnh và mở khóa thêm nhiều đặc quyền mới!
              </p>
            </div>

            <Button variant="gold" fullWidth onClick={dismissNotification}>
              Tuyệt Vời! Tiếp Tục Lên Cấp
            </Button>
          </div>
        );

      case 'achievement_unlocked': {
        const ach = ACHIEVEMENTS.find(a => a.id === currentNotification.achievementId);
        return (
          <div className="text-center py-4 space-y-4">
            <div className="w-20 h-20 mx-auto pixel-frame pixel-frame-gold bg-[var(--panel-2)] p-2 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-[var(--gold)]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] text-[var(--gold)] text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>Thành Tựu Mới</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-[var(--text)]">
                {ach ? ach.title : currentNotification.title}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                {ach ? ach.description : currentNotification.message}
              </p>
            </div>

            <Button variant="primary" fullWidth onClick={dismissNotification}>
              Đã Nhận Thành Tựu
            </Button>
          </div>
        );
      }

      case 'cosmetic_unlocked': {
        const cos = getCosmeticById(currentNotification.cosmeticId || '');
        return (
          <div className="text-center py-4 space-y-4">
            <div className="w-20 h-20 mx-auto pixel-frame pixel-frame-violet bg-[var(--panel-2)] p-2 flex items-center justify-center">
              <Shirt className="w-10 h-10 text-[var(--violet)]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--violet)] text-[var(--violet)] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ngoại Trang Mới</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-[var(--text)]">
                {cos ? cos.name : currentNotification.title}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                {cos ? cos.description : currentNotification.message}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={dismissNotification}
              >
                Để sau
              </Button>
              {cos && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => handleEquipCosmetic(cos.id)}
                >
                  Trang bị ngay
                </Button>
              )}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto pixel-frame bg-[var(--panel-2)] flex items-center justify-center text-[var(--green)]" data-category="health">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold font-heading text-[var(--text)]">
                {currentNotification.title}
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                {currentNotification.message}
              </p>
              {currentNotification.xpEarned && (
                <div className="inline-block mt-3 px-3 py-1.5 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] text-[var(--gold)] font-bold font-num text-xs">
                  +{currentNotification.xpEarned} XP
                </div>
              )}
            </div>

            <Button variant="primary" fullWidth onClick={dismissNotification}>
              Tiếp tục
            </Button>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A15]/85 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm pixel-frame pixel-frame-gold bg-[var(--panel)] p-6 relative animate-scale-in">
        <div className="relative">{renderContent()}</div>
      </div>
    </div>
  );
};
