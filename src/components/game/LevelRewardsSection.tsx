import React, { useState, useEffect } from 'react';
import { LEVEL_REWARDS, LevelRewardDef } from '../../data/levelRewards.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { LevelRewardModal } from './LevelRewardModal.js';
import { Gift, Lock, CheckCircle2, Gamepad2, Sparkles, ChevronRight, Award } from 'lucide-react';

interface LevelRewardsSectionProps {
  currentLevel: number;
}

const STORAGE_KEY_CLAIMED = 'solo_levelling_claimed_rewards';

export const LevelRewardsSection: React.FC<LevelRewardsSectionProps> = ({ currentLevel }) => {
  const [selectedReward, setSelectedReward] = useState<LevelRewardDef | null>(null);
  const [claimedRewardIds, setClaimedRewardIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLAIMED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Đồng bộ lưu trạng thái nhận mã vào localStorage
  const handleClaim = (rewardId: string) => {
    setClaimedRewardIds(prev => {
      if (prev.includes(rewardId)) return prev;
      const next = [...prev, rewardId];
      try {
        localStorage.setItem(STORAGE_KEY_CLAIMED, JSON.stringify(next));
      } catch (e) {
        console.error('Không thể lưu trạng thái nhận thưởng vào localStorage:', e);
      }
      return next;
    });
  };

  // Xử lý an toàn cấp độ (fallback nếu thiếu hoặc không hợp lệ)
  const safeLevel = Math.max(1, Number.isFinite(currentLevel) ? Math.floor(currentLevel) : 1);

  // Đếm số gói đã mở khóa
  const unlockedRewardsCount = LEVEL_REWARDS.filter(r => safeLevel >= r.requiredLevel).length;

  const baseUrl = (import.meta.env?.BASE_URL || './').replace(/\/$/, '');

  return (
    <div className="lr-section space-y-6">
      {/* Banner Tiêu đề & Cấp độ hiện tại */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 pixel-frame pixel-frame-gold bg-[var(--panel)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎁</span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text)] flex items-center gap-2">
              <span>Thưởng Cấp (Level Rewards)</span>
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Đạt cấp độ yêu cầu để nhận giftcode game miễn phí
          </p>
        </div>

        {/* Cấp độ người chơi hiện tại */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)]">
          <Award className="w-5 h-5 text-[var(--gold)] shrink-0" />
          <div className="text-left">
            <div className="text-xs uppercase font-bold text-[var(--muted)]">Cấp hiện tại</div>
            <div className="text-sm font-bold text-[var(--gold)] font-num mt-0.5">
              LV.{safeLevel}{' '}
              <span className="text-xs text-[var(--muted)] font-sans font-semibold">
                ({unlockedRewardsCount}/{LEVEL_REWARDS.length} đã mở)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lưới các gói phần thưởng: 3 cột desktop, 2 cột tablet, 1 cột mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {LEVEL_REWARDS.map(reward => {
          const isUnlocked = safeLevel >= reward.requiredLevel;
          const isClaimed = claimedRewardIds.includes(reward.id);
          const remainingLevels = Math.max(0, reward.requiredLevel - safeLevel);

          const imageUrl = reward.gameImage.startsWith('http')
            ? reward.gameImage
            : `${baseUrl}${reward.gameImage.startsWith('/') ? '' : '/'}${reward.gameImage}`;

          return (
            <Card
              key={reward.id}
              variant={isUnlocked ? 'gold' : 'surface'}
              className={`lr-reward-card p-4 sm:p-5 flex flex-col justify-between space-y-4 pixel-frame-interactive ${
                !isUnlocked ? 'border-[var(--lock)] opacity-90' : ''
              }`}
            >
              <div className="space-y-3">
                {/* Ảnh Game 16:9 với Fallback */}
                <div className="lr-card-thumb relative aspect-[16/9] w-full rounded-[2px] overflow-hidden bg-[var(--bg)] border-2 border-[var(--ink)]">
                  <img
                    src={imageUrl}
                    alt={`${reward.gameName} - ${reward.rewardName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-full h-full flex flex-col items-center justify-center bg-[#1F2650] text-center p-3';
                        fallbackDiv.innerHTML = `<span class="text-xs font-bold text-[#F3EFE6]">${reward.gameName}</span><span class="text-xs text-[#9AA0BD]">${reward.rewardName}</span>`;
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />

                  {/* Badge Cấp độ yêu cầu ở góc trên - scale 1.2 giữ nguyên */}
                  <div className="absolute top-2.5 left-2.5 scale-[1.2] origin-top-left z-10">
                    <span className="px-2 py-1 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] text-[var(--gold)] text-[10px] font-bold font-num inline-block shadow-[2px_2px_0_0_var(--ink)]">
                      LV.{reward.requiredLevel}
                    </span>
                  </div>

                  {/* Tên game ở góc dưới */}
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--ink)] text-[var(--text)] text-xs font-semibold flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-[var(--sky)]" />
                      <span>{reward.gameName}</span>
                    </span>
                  </div>
                </div>

                {/* Tên & Trạng thái */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-[var(--sky)] uppercase font-heading tracking-wider">
                      {reward.gameName}
                    </span>
                    {/* Badge trạng thái */}
                    {isUnlocked ? (
                      <span className="text-xs font-bold text-[var(--gold)] flex items-center gap-1 font-heading">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)]" />
                        <span>{isClaimed ? 'Đã nhận mã' : 'Đã mở khóa'}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-[var(--lock)]" />
                        <span>Còn {remainingLevels} cấp nữa</span>
                      </span>
                    )}
                  </div>

                  <h3
                    className={`font-bold font-heading text-base ${
                      isUnlocked ? 'text-[var(--gold)]' : 'text-[var(--text)]'
                    }`}
                  >
                    {reward.rewardName}
                  </h3>

                  <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                    {reward.description}
                  </p>
                </div>
              </div>

              {/* Khung hành động chia hai phần: Bên trái là Chi tiết, Bên phải là Nhận thưởng */}
              <div className="pt-3 border-t-2 border-[var(--ink)] grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedReward(reward)}
                  className="font-heading text-xs px-2"
                >
                  <span className="whitespace-nowrap">chi tiết &gt;</span>
                </Button>

                {isUnlocked ? (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setSelectedReward(reward)}
                    className="font-heading text-xs px-2"
                    icon={<Gift className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span className="whitespace-nowrap">{isClaimed ? 'Xem Mã' : 'Nhận Thưởng'}</span>
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center justify-center font-bold rounded-[2px] text-xs px-2 py-2 min-h-[44px] bg-[var(--panel-2)] text-[var(--muted)] border-2 border-[var(--ink)] cursor-not-allowed select-none gap-1 font-heading whitespace-nowrap"
                  >
                    <Lock className="w-3 h-3 text-[var(--lock)] shrink-0" />
                    <span className="whitespace-nowrap">Nhận Thưởng</span>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Popup / Modal Chi Tiết Phần Thưởng */}
      <LevelRewardModal
        reward={selectedReward}
        isOpen={!!selectedReward}
        onClose={() => setSelectedReward(null)}
        currentLevel={safeLevel}
        isClaimed={selectedReward ? claimedRewardIds.includes(selectedReward.id) : false}
        onClaim={handleClaim}
      />
    </div>
  );
};
