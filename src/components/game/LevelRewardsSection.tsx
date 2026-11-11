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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#161B40] via-[#1E1B4B] to-[#121636] border border-amber-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🎁</span>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100 flex items-center gap-2">
              <span>Thưởng Cấp (Level Rewards)</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Đạt cấp độ yêu cầu để nhận giftcode game miễn phí
          </p>
        </div>

        {/* Cấp độ người chơi hiện tại */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0F132E]/90 border border-amber-400/50 shadow-md">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-left font-pixel">
            <div className="text-[10px] uppercase text-slate-400">Cấp hiện tại</div>
            <div className="text-sm sm:text-base font-bold text-amber-300">
              LV.{safeLevel} <span className="text-xs text-slate-400 font-sans font-normal">({unlockedRewardsCount}/{LEVEL_REWARDS.length} đã mở)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lưới các gói phần thưởng: 3 cột desktop, 2 cột tablet, 1 cột mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className={`lr-reward-card p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-0.5 ${
                !isUnlocked ? 'opacity-85' : 'shadow-amber-950/20'
              }`}
            >
              <div className="space-y-3">
                {/* Ảnh Game 16:9 bo góc với Fallback */}
                <div className="lr-card-thumb relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0A0E27] border border-slate-700/60 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={`${reward.gameName} - ${reward.rewardName}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      // Fallback nếu ảnh bị lỗi tải
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-950 via-[#161B40] to-slate-900 text-center p-3';
                        fallbackDiv.innerHTML = `<span class="text-xs font-bold text-slate-200">${reward.gameName}</span><span class="text-[10px] text-slate-400">${reward.rewardName}</span>`;
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />

                  {/* Badge Cấp độ yêu cầu ở góc trên - Điều chỉnh bằng 4/5 (scale 1.2) */}
                  <div className="absolute top-2.5 left-2.5 scale-[1.2] origin-top-left z-10">
                    <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-amber-400 text-amber-300 text-[11px] font-bold font-pixel shadow-lg shadow-amber-950/40 inline-block">
                      LV.{reward.requiredLevel}
                    </span>
                  </div>

                  {/* Tên game ở góc dưới */}
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-cyan-400" />
                      <span>{reward.gameName}</span>
                    </span>
                  </div>
                </div>

                {/* Tên & Trạng thái */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase font-pixel tracking-wider">
                      {reward.gameName}
                    </span>
                    {/* Badge trạng thái */}
                    {isUnlocked ? (
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 font-pixel">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isClaimed ? 'Đã nhận mã' : 'Đã mở khóa'}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Còn {remainingLevels} cấp nữa</span>
                      </span>
                    )}
                  </div>

                  <h3
                    className={`font-bold font-heading text-base ${
                      isUnlocked ? 'text-amber-300' : 'text-slate-200'
                    }`}
                  >
                    {reward.rewardName}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {reward.description}
                  </p>
                </div>
              </div>

              {/* Khung hành động chia hai phần: Bên trái là Chi tiết, Bên phải là Nhận thưởng có chữ vàng */}
              <div className="pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedReward(reward)}
                  className="font-pixel text-[11px] sm:text-xs flex items-center justify-center cursor-pointer min-h-[38px] px-1.5 sm:px-2.5 whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">chi tiết &gt;</span>
                </Button>

                {isUnlocked ? (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setSelectedReward(reward)}
                    className="font-pixel text-[11px] sm:text-xs flex items-center justify-center gap-1 cursor-pointer min-h-[38px] px-1.5 sm:px-2.5 shadow-amber-950/40 whitespace-nowrap"
                    icon={<Gift className="w-3.5 h-3.5 shrink-0" />}
                  >
                    <span className="whitespace-nowrap">{isClaimed ? 'Xem Mã' : 'Nhận Thưởng'}</span>
                  </Button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex items-center justify-center font-semibold rounded-xl text-[11px] sm:text-xs px-1.5 sm:px-2.5 py-2 min-h-[38px] bg-slate-900/90 text-slate-500 border border-slate-800 opacity-50 cursor-not-allowed select-none gap-1 font-pixel pointer-events-none whitespace-nowrap"
                  >
                    <Lock className="w-3 h-3 text-slate-500 shrink-0" />
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
