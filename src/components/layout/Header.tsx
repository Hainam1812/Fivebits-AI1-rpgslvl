import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../../store/GameContext.js';
import { selectLevelProgress, selectStreak } from '../../store/selectors.js';
import { Logo } from '../ui/Logo.js';
import { CharacterStage } from '../game/CharacterStage.js';
import { ShoppingBag, Flame, Share2, Award, Shirt, User, Settings, Menu, X, RotateCcw, PanelLeftOpen } from 'lucide-react';
import { ShareModal } from '../share/ShareModal.js';
import { ResetDataModal } from '../ui/ResetDataModal.js';
import { CharacterSelectModal } from '../game/CharacterSelectModal.js';

export interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { state, now } = useGame();
  const navigate = useNavigate();
  const levelProg = selectLevelProgress(state);
  const streak = selectStreak(state, now);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);

  const cartCount = state.cart.length;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--panel)] border-b-[3px] border-[var(--ink)] px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Sidebar toggle */}
          <div className="flex items-center gap-2.5">
            {onToggleSidebar && isSidebarCollapsed && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-[var(--panel-2)] hover:bg-[#273063] border-2 border-[var(--ink)] hover:border-[var(--gold)] text-[var(--gold)] hover:text-[var(--text)] transition-colors cursor-pointer shadow-[0_2px_0_0_var(--ink)] group"
                title="Mở thanh công cụ bên trái (Expand Toolbar)"
                aria-label="Mở thanh công cụ"
              >
                <PanelLeftOpen className="w-4 h-4 text-[var(--gold)]" />
                <span className="text-xs font-bold font-heading">Menu</span>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 select-none hover:opacity-90 transition-opacity">
              <Logo size="sm" showSlogan={false} />
            </Link>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Streak Counter */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] border-2 text-xs font-bold transition-colors ${
                streak.hasCompletedToday
                  ? 'bg-[var(--panel-2)] border-[var(--gold)] text-[var(--gold)]'
                  : streak.currentStreak > 0
                  ? 'bg-[var(--panel-2)] border-[var(--ink)] text-[var(--text)]'
                  : 'bg-[var(--bg)] border-[var(--ink)] text-[var(--muted)]'
              }`}
              title={`Streak hiện tại: ${streak.currentStreak} ngày liên tiếp (Kỷ lục: ${streak.longestStreak} ngày)`}
            >
              <Flame className={`w-3.5 h-3.5 ${streak.hasCompletedToday ? 'text-[var(--gold)] fill-[var(--gold)]' : ''}`} />
              <span className="font-num text-[11px]">{streak.currentStreak}</span>
            </div>

            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className="relative p-2 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] hover:border-[var(--gold)] text-[var(--text)] transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_var(--ink)]"
              aria-label={`Giỏ hàng mở khóa (${cartCount} gói)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-[2px] bg-[var(--gold)] border-2 border-[var(--ink)] text-[var(--ink)] text-[10px] font-bold font-num flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Share Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="hidden sm:flex items-center justify-center p-2 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] hover:border-[var(--gold)] text-[var(--text)] transition-colors min-w-[40px] min-h-[40px] cursor-pointer shadow-[0_2px_0_0_var(--ink)]"
              title="Chia sẻ & Quét mã QR"
              aria-label="Chia sẻ ứng dụng"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* User Avatar & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-3 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] hover:bg-[#273063] transition-colors select-none cursor-pointer shadow-[0_2px_0_0_var(--ink)]"
                aria-label="Menu cá nhân"
              >
                <CharacterStage size="mini" />
                <div className="flex flex-col text-left leading-tight hidden xs:block">
                  <span className="text-[10px] text-[var(--gold)] uppercase font-bold font-num">
                    LV.{levelProg.level}
                  </span>
                  <span className="text-xs font-bold text-[var(--text)] max-w-[80px] truncate mt-0.5">
                    {state.profile.nickname || 'Tân Binh'}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 pixel-frame pixel-frame-gold bg-[var(--panel)] p-2 z-50 animate-slide-up flex flex-col gap-1"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b-2 border-[var(--ink)] mb-1 bg-[var(--bg)]">
                    <p className="text-xs font-bold text-[var(--text)] truncate">
                      {state.profile.nickname || 'Tân Binh'}
                    </p>
                    <p className="text-xs text-[var(--gold)] font-heading font-bold">
                      Level {levelProg.level} • {levelProg.title}
                    </p>
                  </div>

                  <Link
                    to="/play/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors"
                  >
                    <User className="w-4 h-4 text-[var(--violet)]" />
                    <span>Hồ sơ người chơi</span>
                  </Link>

                  <Link
                    to="/play/wardrobe"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors"
                  >
                    <Shirt className="w-4 h-4 text-[var(--sky)]" />
                    <span>Nhân vật</span>
                  </Link>

                  <Link
                    to="/play/achievements"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors"
                  >
                    <Award className="w-4 h-4 text-[var(--gold)]" />
                    <span>Thành tựu (17)</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors w-full text-left sm:hidden"
                  >
                    <Share2 className="w-4 h-4 text-[var(--green)]" />
                    <span>Chia sẻ & Mã QR</span>
                  </button>

                  <Link
                    to="/about"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors"
                  >
                    <span>Về dự án</span>
                  </Link>

                  <div className="pt-1 border-t-2 border-[var(--ink)] mt-1">
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-[var(--panel-2)] rounded-[2px] transition-colors w-full text-left cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[var(--danger)]" />
                      <span>Đặt lại dữ liệu</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => setIsCharModalOpen(true)}
      />
      <CharacterSelectModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        title="Bắt Đầu Hành Trình Mới"
        subtitle="Dữ liệu đã được làm mới thành công! Hãy chọn nhân vật và nhập biệt danh mới để bắt đầu."
      />
    </>
  );
};
