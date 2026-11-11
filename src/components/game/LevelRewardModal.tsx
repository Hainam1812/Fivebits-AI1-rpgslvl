import React, { useState, useEffect, useRef } from 'react';
import { LevelRewardDef } from '../../data/levelRewards.js';
import { Button } from '../ui/Button.js';
import { X, Lock, CheckCircle2, Copy, Check, Gift, Gamepad2, Sparkles, AlertCircle } from 'lucide-react';

interface LevelRewardModalProps {
  reward: LevelRewardDef | null;
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  isClaimed: boolean;
  onClaim: (rewardId: string) => void;
}

export const LevelRewardModal: React.FC<LevelRewardModalProps> = ({
  reward,
  isOpen,
  onClose,
  currentLevel,
  isClaimed,
  onClaim,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Reset image error state when reward changes
  useEffect(() => {
    setImgError(false);
    setCopied(false);
  }, [reward?.id]);

  // Handle ESC key and focus restoration
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
          modalRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        previouslyFocusedRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !reward) return null;

  // Xử lý an toàn: kiểm tra cấp độ hợp lệ (fallback nếu âm hoặc NaN)
  const safeLevel = Math.max(1, Number.isFinite(currentLevel) ? Math.floor(currentLevel) : 1);
  const isUnlocked = safeLevel >= reward.requiredLevel;
  const remainingLevels = Math.max(0, reward.requiredLevel - safeLevel);

  const handleCopyCode = async () => {
    if (!reward.giftcode) return;
    try {
      await navigator.clipboard.writeText(reward.giftcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback nếu trình duyệt chặn clipboard
      const textarea = document.createElement('textarea');
      textarea.value = reward.giftcode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimReward = () => {
    onClaim(reward.id);
  };

  const baseUrl = (import.meta.env?.BASE_URL || './').replace(/\/$/, '');
  const imageUrl = reward.gameImage.startsWith('http')
    ? reward.gameImage
    : `${baseUrl}${reward.gameImage.startsWith('/') ? '' : '/'}${reward.gameImage}`;

  return (
    <div
      className="lr-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lr-modal-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="lr-modal-container w-full max-w-2xl bg-[#161B40] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden focus:outline-none max-h-[90vh] flex flex-col animate-scale-in"
      >
        {/* Header Modal */}
        <div className="lr-modal-header flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0 bg-[#0F132E]/70">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <h3 id="lr-modal-title" className="text-base sm:text-lg font-bold font-heading text-slate-100 truncate">
              {reward.rewardName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="lr-close-btn p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal (Cuộn được khi dài) */}
        <div className="lr-modal-body p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Ảnh Game 16:9 với Fallback */}
          <div className="lr-image-wrapper relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0A0E27] border border-slate-700/60 shadow-inner">
            {!imgError ? (
              <img
                src={imageUrl}
                alt={`${reward.gameName} - ${reward.rewardName}`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              /* Fallback gradient banner khi ảnh lỗi hoặc thiếu */
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-950 via-[#161B40] to-slate-900 p-4 text-center">
                <Gamepad2 className="w-12 h-12 text-violet-400 mb-2" />
                <span className="font-bold text-sm text-slate-200">{reward.gameName}</span>
                <span className="text-xs text-slate-400">{reward.rewardName}</span>
              </div>
            )}

            {/* Badges nổi trên ảnh - Điều chỉnh bằng 4/5 (scale 1.2) */}
            <div className="absolute top-3 left-3 scale-[1.2] origin-top-left z-10 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-amber-400 text-amber-300 text-xs font-bold font-pixel shadow-lg shadow-amber-950/40 inline-block">
                LV.{reward.requiredLevel}
              </span>
            </div>

            <div className="absolute bottom-2.5 right-2.5">
              <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{reward.gameName}</span>
              </span>
            </div>
          </div>

          {/* Khung chia 2 phần: Bên trái là Chi tiết, Bên phải là Nhận thưởng có chữ vàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Phần bên trái: Chi tiết */}
            <div className="lr-col-details flex flex-col justify-between p-4 rounded-xl bg-[#0F132E]/80 border border-slate-700/60 space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-pixel tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Chi Tiết</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold font-pixel truncate max-w-[130px]">
                    {reward.gameName}
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black font-heading text-slate-100">
                  {reward.rewardName}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#0A0D22]/70 p-3 rounded-lg border border-slate-800">
                  {reward.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Nhập mã tại mục Cài đặt / Đổi quà trong <strong>{reward.gameName}</strong>.</span>
              </div>
            </div>

            {/* Phần bên phải: Nhận thưởng có chữ vàng */}
            <div
              className={`lr-col-claim flex flex-col justify-between p-4 rounded-xl border transition-all ${
                !isUnlocked
                  ? 'bg-[#080B18]/95 border-slate-800/80 opacity-60 pointer-events-none select-none cursor-not-allowed shadow-inner'
                  : isClaimed
                  ? 'bg-[#0B0E23] border-amber-400/80 shadow-lg shadow-amber-950/30'
                  : 'bg-gradient-to-b from-[#1C170E] via-[#161B40] to-[#0F132E] border-amber-400/80 shadow-xl shadow-amber-950/40'
              }`}
            >
              <div>
                {/* Tiêu đề nhận thưởng - Chữ vàng */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-400/20">
                  <div className="flex items-center gap-1.5">
                    <Gift className={`w-4 h-4 ${isUnlocked ? 'text-amber-400' : 'text-amber-500/70'}`} />
                    <span className="font-pixel font-bold text-xs sm:text-sm text-amber-300 uppercase tracking-wider">
                      Nhận Thưởng
                    </span>
                  </div>
                  {isUnlocked ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-pixel font-bold bg-amber-400/10 text-amber-300 border border-amber-400/40">
                      {isClaimed ? 'ĐÃ NHẬN MÃ' : 'SẴN SÀNG'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-pixel font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>CHƯA MỞ</span>
                    </span>
                  )}
                </div>

                {!isUnlocked ? (
                  /* Khi chưa nhận được: Sẫm màu xuống, không tương tác được */
                  <div className="space-y-3 py-1">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-left text-xs">
                        <div className="font-bold text-amber-300/80 font-pixel">CẦN ĐẠT LV.{reward.requiredLevel}</div>
                        <div className="text-slate-400 text-[11px]">Còn thiếu {remainingLevels} cấp độ nữa</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Phần thưởng đang bị khóa. Bạn hiện đang ở <strong>LV.{safeLevel}</strong>. Hãy tiếp tục luyện tập và hoàn thành nhiệm vụ để mở khóa!
                    </p>
                  </div>
                ) : !isClaimed ? (
                  /* Khi đã đủ cấp nhưng chưa nhận */
                  <div className="space-y-3 py-1">
                    <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs">
                      <div className="font-bold text-amber-300 font-pixel flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>ĐỦ ĐIỀU KIỆN (LV.{safeLevel})</span>
                      </div>
                      <div className="text-amber-200/90 text-[11px] mt-0.5">
                        Bấm nút bên dưới để nhận mã Giftcode game độc quyền.
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Chúc mừng bạn! Mã quà tặng dành riêng cho bạn đã sẵn sàng kích hoạt.
                    </p>
                  </div>
                ) : (
                  /* Khi đã nhận mã: Hiển thị Giftcode kèm nút Sao chép */
                  <div className="space-y-2.5 py-1">
                    <div className="text-[11px] text-amber-300 font-pixel font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>MÃ GIFTCODE CỦA BẠN:</span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/70 border border-amber-400/50 flex items-center justify-between gap-2">
                      <code className="font-mono font-bold text-sm text-amber-300 tracking-wider truncate select-all">
                        {reward.giftcode}
                      </code>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">
                      Mã đã được lưu lại, bạn có thể sao chép bất kỳ lúc nào.
                    </p>
                  </div>
                )}
              </div>

              {/* Nút hành động ở đáy cột Nhận thưởng */}
              <div className="pt-3 mt-3 border-t border-slate-800">
                {!isUnlocked ? (
                  /* Không tương tác được khi chưa nhận được */
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 text-slate-500 text-xs font-bold font-pixel border border-slate-800 cursor-not-allowed select-none flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Chưa đủ cấp (Khóa)</span>
                  </button>
                ) : !isClaimed ? (
                  <Button
                    variant="gold"
                    fullWidth
                    onClick={handleClaimReward}
                    className="font-pixel py-2.5 text-xs shadow-amber-900/50 cursor-pointer"
                    icon={<Gift className="w-4 h-4" />}
                  >
                    <span>Nhận Giftcode Ngay</span>
                  </Button>
                ) : (
                  <Button
                    variant={copied ? 'secondary' : 'gold'}
                    fullWidth
                    onClick={handleCopyCode}
                    className="font-pixel py-2.5 text-xs cursor-pointer"
                    icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lr-modal-footer px-5 py-3 border-t border-slate-700/60 shrink-0 bg-[#0F132E]/70 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
