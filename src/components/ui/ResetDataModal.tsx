import React, { useState } from 'react';
import { Button } from './Button.js';
import { Trash2, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useGame } from '../../store/GameContext.js';
import { saveStateToStorageImmediate } from '../../store/persistence.js';

interface ResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ResetDataModal: React.FC<ResetDataModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { state, dispatch } = useGame();
  const [isResetting, setIsResetting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      dispatch({ type: 'RESET_DATA' });

      const resetState = {
        ...state,
        completions: [],
        activeTasks: {},
        abandonedPackages: [],
        unlockedAchievements: [],
        examHistory: [],
        personalExams: [],
        lastLocationId: 'classroom',
      };
      saveStateToStorageImmediate(resetState);

      setSuccessNotice(true);
      setTimeout(() => {
        setIsResetting(false);
        setSuccessNotice(false);
        onClose();
        onSuccess?.();
      }, 1200);
    } catch (err) {
      console.error('Lỗi khi reset data:', err);
      setIsResetting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A15]/85 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        data-category="productivity"
        className="relative w-full max-w-lg pixel-frame bg-[var(--panel)] p-6 overflow-hidden flex flex-col space-y-5 animate-scale-in"
      >
        {/* Close Button */}
        {!isResetting && !successNotice && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[var(--muted)] hover:text-[var(--text)] rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] hover:border-[var(--gold)] transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with warning icon */}
        <div className="flex items-center gap-3.5 pb-3 border-b-2 border-[var(--ink)]">
          <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--danger)] flex items-center justify-center text-[var(--danger)] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger)] font-heading">
              Vùng Nguy Hiểm • Danger Zone
            </span>
            <h3 className="text-xl font-bold font-heading text-[var(--text)]">
              Đặt Lại Tiến Độ Chơi (Reset Progression)
            </h3>
          </div>
        </div>

        {successNotice ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-[var(--green)] mx-auto" />
            <h4 className="text-lg font-bold text-[var(--text)] font-heading">
              Đặt lại tiến độ thành công!
            </h4>
            <p className="text-sm text-[var(--muted)]">
              Tiến độ chơi và XP đã được làm mới. Mọi gói nhiệm vụ đã mua và ngoại trang vẫn được giữ nguyên vẹn!
            </p>
          </div>
        ) : (
          <>
            {/* Warning details */}
            <div className="space-y-3 text-sm text-[var(--muted)] leading-relaxed bg-[var(--bg)] p-4 rounded-[2px] border-2 border-[var(--ink)]">
              <div className="p-3 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--green)] text-[var(--text)] text-xs sm:text-sm flex items-start gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <span>
                  <strong>Bảo vệ vật phẩm vĩnh viễn:</strong> Toàn bộ <strong>gói nhiệm vụ đã mua</strong>, lịch sử thanh toán, giỏ hàng, ngoại trang và nhân vật của bạn sẽ được <strong>GIỮ NGUYÊN VẸN</strong>!
                </span>
              </div>

              <p className="font-bold text-[var(--danger)]">
                Chỉ các thông số tiến độ chơi sau đây sẽ được làm mới để bạn bắt đầu lại hành trình:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--muted)] list-disc list-inside">
                <li><strong className="text-[var(--text)]">Cấp độ & XP:</strong> Đặt lại về Level 1 (0 XP)</li>
                <li><strong className="text-[var(--text)]">Chuỗi ngày (Streak):</strong> Đặt lại về 0 ngày</li>
                <li><strong className="text-[var(--text)]">Bộ đếm nhiệm vụ:</strong> Hủy các timer đang chạy/tạm dừng</li>
                <li><strong className="text-[var(--text)]">Tiến độ quest:</strong> Đưa nhiệm vụ về trạng thái sẵn sàng cày lại</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={isResetting}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmReset}
                disabled={isResetting}
              >
                {isResetting ? 'Đang đặt lại...' : 'Xác Nhận Reset Data'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
