import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { useGame } from '../../store/GameContext.js';
import { selectLevelProgress, selectStreak } from '../../store/selectors.js';
import { Copy, Check, Share2, Sparkles } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { state, now } = useGame();
  const levelProg = selectLevelProgress(state);
  const streak = selectStreak(state, now);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'https://solo-levelling.app';

  const shareText = `Mình đang Level ${levelProg.level} (${levelProg.title}) với chuỗi Streak ${streak.currentStreak} ngày trên SOLO LEVELLING! Cùng vào cày quest đại học với mình nhé: ${currentUrl}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#E8C27A',
          light: '#0C1020',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR in browser:', err));
    }
  }, [isOpen, currentUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'SOLO LEVELLING - READY TO BECOME BETTER?',
          text: shareText,
          url: currentUrl,
        })
        .catch(() => {});
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mời Bạn Bè & Chia Sẻ" maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* QR Code Canvas */}
        <div className="p-3 bg-[var(--bg)] pixel-frame pixel-frame-gold flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code ứng dụng SOLO LEVELLING" className="w-48 h-48 rounded-[2px]" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-[var(--muted)] font-heading">
              Đang tạo mã QR...
            </div>
          )}
        </div>

        {/* Share Status Snippet */}
        <div className="p-3 bg-[var(--bg)] border-2 border-[var(--ink)] rounded-[2px] text-xs text-[var(--muted)] text-left w-full space-y-1">
          <div className="font-bold text-[var(--gold)] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thành tích của bạn:</span>
          </div>
          <p className="italic text-[var(--text)] text-xs sm:text-sm">
            "{shareText}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="primary"
              fullWidth
              icon={<Share2 className="w-4 h-4" />}
              onClick={handleNativeShare}
            >
              Chia Sẻ Ngay
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-xs"
              icon={copiedLink ? <Check className="w-3.5 h-3.5 text-[var(--green)]" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyLink}
            >
              {copiedLink ? 'Đã sao chép Link' : 'Sao chép Link'}
            </Button>

            <Button
              variant="secondary"
              className="flex-1 text-xs"
              icon={copiedText ? <Check className="w-3.5 h-3.5 text-[var(--green)]" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyText}
            >
              {copiedText ? 'Đã sao chép Lời mời' : 'Sao chép Lời mời'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
