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
      className="lr-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#070A15]/85 animate-fade-in"
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
        className="lr-modal-container w-full max-w-2xl pixel-frame pixel-frame-gold bg-[var(--panel)] overflow-hidden focus:outline-none max-h-[90vh] flex flex-col animate-scale-in"
      >
        {/* Header Modal */}
        <div className="lr-modal-header flex items-center justify-between px-5 py-4 border-b-2 border-[var(--ink)] shrink-0 bg-[var(--panel-2)]">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[var(--gold)]" />
            <h3 id="lr-modal-title" className="text-base sm:text-lg font-bold font-heading text-[var(--text)] truncate">
              {reward.rewardName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="lr-close-btn p-1.5 rounded-[2px] bg-[var(--panel)] border-2 border-[var(--ink)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--gold)] transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung Modal */}
        <div className="lr-modal-body p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Ảnh Game 16:9 với Fallback */}
          <div className="lr-image-wrapper relative aspect-[16/9] w-full rounded-[2px] overflow-hidden bg-[var(--bg)] border-2 border-[var(--ink)]">
            {!imgError ? (
              <img
                src={imageUrl}
                alt={`${reward.gameName} - ${reward.rewardName}`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--panel-2)] p-4 text-center">
                <Gamepad2 className="w-12 h-12 text-[var(--gold)] mb-2" />
                <span className="font-bold text-sm text-[var(--text)]">{reward.gameName}</span>
                <span className="text-xs text-[var(--muted)]">{reward.rewardName}</span>
              </div>
            )}

            {/* Badges nổi trên ảnh - scale 1.2 giữ nguyên */}
            <div className="absolute top-3 left-3 scale-[1.2] origin-top-left z-10 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] text-[var(--gold)] text-[10px] font-bold font-num inline-block shadow-[2px_2px_0_0_var(--ink)]">
                LV.{reward.requiredLevel}
              </span>
            </div>

            <div className="absolute bottom-2.5 right-2.5">
              <span className="px-2.5 py-1 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--ink)] text-[var(--text)] text-xs font-semibold flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-[var(--sky)]" />
                <span>{reward.gameName}</span>
              </span>
            </div>
          </div>

          {/* Khung chia 2 phần */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Phần bên trái: Chi tiết */}
            <div className="lr-col-details flex flex-col justify-between p-4 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--ink)] space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--muted)] uppercase font-heading tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--sky)]" />
                    <span>Chi Tiết</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-[2px] bg-[var(--panel-2)] border border-[var(--sky)] text-[var(--sky)] text-xs font-bold font-heading truncate max-w-[140px]">
                    {reward.gameName}
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-bold font-heading text-[var(--text)]">
                  {reward.rewardName}
                </h4>

                <p className="text-sm text-[var(--muted)] leading-relaxed bg-[var(--panel)] p-3 rounded-[2px] border border-[var(--ink)]">
                  {reward.description}
                </p>
              </div>

              <div className="pt-2 border-t-2 border-[var(--ink)] text-xs text-[var(--muted)] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--sky)] shrink-0 mt-0.5" />
                <span>Nhập mã tại mục Cài đặt / Đổi quà trong <strong className="text-[var(--text)]">{reward.gameName}</strong>.</span>
              </div>
            </div>

            {/* Phần bên phải: Nhận thưởng */}
            <div
              className={`lr-col-claim flex flex-col justify-between p-4 rounded-[2px] border-2 ${
                !isUnlocked
                  ? 'bg-[var(--bg)] border-[var(--lock)] opacity-75 pointer-events-none select-none cursor-not-allowed'
                  : 'bg-[var(--panel-2)] border-[var(--gold)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-[var(--ink)]">
                  <div className="flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[var(--gold)]" />
                    <span className="font-heading font-bold text-xs sm:text-sm text-[var(--gold)] uppercase tracking-wider">
                      Nhận Thưởng
                    </span>
                  </div>
                  {isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-[2px] text-xs font-heading font-bold bg-[var(--bg)] text-[var(--gold)] border border-[var(--gold)]">
                      {isClaimed ? 'ĐÃ NHẬN MÃ' : 'SẴN SÀNG'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[2px] text-xs font-heading font-bold bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--lock)] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[var(--lock)]" />
                      <span>CHƯA MỞ</span>
                    </span>
                  )}
                </div>

                {!isUnlocked ? (
                  <div className="space-y-3 py-1">
                    <div className="flex items-center gap-2 p-2.5 rounded-[2px] bg-[var(--panel)] border border-[var(--ink)]">
                      <div className="w-8 h-8 rounded-[2px] bg-[var(--panel-2)] border border-[var(--lock)] flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-[var(--lock)]" />
                      </div>
                      <div className="text-left text-xs">
                        <div className="font-bold text-[var(--gold)] font-heading">CẦN ĐẠT LV.{reward.requiredLevel}</div>
                        <div className="text-[var(--muted)]">Còn thiếu {remainingLevels} cấp độ nữa</div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                      Phần thưởng đang bị khóa. Bạn hiện đang ở <strong className="text-[var(--text)]">LV.{safeLevel}</strong>. Hãy tiếp tục luyện tập và hoàn thành nhiệm vụ để mở khóa!
                    </p>
                  </div>
                ) : !isClaimed ? (
                  <div className="space-y-3 py-1">
                    <div className="p-2.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] text-xs">
                      <div className="font-bold text-[var(--gold)] font-heading flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ĐỦ ĐIỀU KIỆN (LV.{safeLevel})</span>
                      </div>
                      <div className="text-[var(--text)] mt-0.5">
                        Bấm nút bên dưới để nhận mã Giftcode game độc quyền.
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                      Chúc mừng bạn! Mã quà tặng dành riêng cho bạn đã sẵn sàng kích hoạt.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 py-1">
                    <div className="text-xs text-[var(--gold)] font-heading font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--green)]" />
                      <span>MÃ GIFTCODE CỦA BẠN:</span>
                    </div>

                    <div className="p-2.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] flex items-center justify-between gap-2">
                      <code className="font-mono font-bold text-sm text-[var(--gold)] tracking-wider truncate select-all">
                        {reward.giftcode}
                      </code>
                    </div>

                    <p className="text-xs text-[var(--muted)] leading-normal">
                      Mã đã được lưu lại, bạn có thể sao chép bất kỳ lúc nào.
                    </p>
                  </div>
                )}
              </div>

              {/* Nút hành động ở đáy cột Nhận thưởng */}
              <div className="pt-3 mt-3 border-t-2 border-[var(--ink)]">
                {!isUnlocked ? (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-2.5 px-4 rounded-[2px] bg-[var(--panel-2)] text-[var(--muted)] text-xs font-bold font-heading border-2 border-[var(--ink)] cursor-not-allowed select-none flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Chưa đủ cấp (Khóa)</span>
                  </button>
                ) : !isClaimed ? (
                  <Button
                    variant="gold"
                    fullWidth
                    onClick={handleClaimReward}
                    icon={<Gift className="w-4 h-4" />}
                  >
                    <span>Nhận Giftcode Ngay</span>
                  </Button>
                ) : (
                  <Button
                    variant={copied ? 'secondary' : 'gold'}
                    fullWidth
                    onClick={handleCopyCode}
                    icon={copied ? <Check className="w-3.5 h-3.5 text-[var(--green)]" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lr-modal-footer px-5 py-3 border-t-2 border-[var(--ink)] shrink-0 bg-[var(--panel-2)] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
