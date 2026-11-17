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
      <header className="sticky top-0 z-40 w-full bg-[#0A0E27]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Sidebar toggle */}
          <div className="flex items-center gap-2.5">
            {onToggleSidebar && isSidebarCollapsed && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#161B40] hover:bg-violet-900/60 border border-violet-500/50 text-violet-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                title="Mở thanh công cụ bên trái (Expand Toolbar)"
                aria-label="Mở thanh công cụ"
              >
                <PanelLeftOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold font-heading">Menu</span>
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 select-none hover:opacity-90 transition-opacity">
              <Logo size="sm" showSlogan={false} />
            </Link>
          </div>


          {/* Center / Right controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Counter */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-pixel transition-colors ${
                streak.hasCompletedToday
                  ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : streak.currentStreak > 0
                  ? 'bg-slate-800/80 border-slate-600 text-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={`Streak hiện tại: ${streak.currentStreak} ngày liên tiếp (Kỷ lục: ${streak.longestStreak} ngày)`}
            >
              <Flame className={`w-3.5 h-3.5 ${streak.hasCompletedToday ? 'text-amber-400 fill-amber-400 animate-pulse' : ''}`} />
              <span>{streak.currentStreak}</span>
            </div>

            {/* Cart Icon with Badge */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl bg-[#161B40] border border-slate-700/60 hover:border-violet-500/60 text-slate-300 hover:text-white transition-all min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label={`Giỏ hàng mở khóa (${cartCount} gói)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 border border-[#0A0E27] text-white text-[11px] font-bold font-pixel flex items-center justify-center shadow-lg animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Share Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl bg-[#161B40] border border-slate-700/60 hover:border-violet-500/60 text-slate-300 hover:text-white transition-all min-w-[40px] min-h-[40px] cursor-pointer"
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
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#161B40] border border-violet-500/40 hover:border-violet-400 transition-all select-none cursor-pointer"
                aria-label="Menu cá nhân"
              >
                <CharacterStage size="mini" />
                <div className="flex flex-col text-left leading-tight hidden xs:block">
                  <span className="text-[10px] text-violet-300 uppercase font-semibold font-pixel">
                    LV.{levelProg.level}
                  </span>
                  <span className="text-xs font-bold text-slate-200 max-w-[80px] truncate">
                    {state.profile.nickname || 'Tân Binh'}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-[#161B40] border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-slide-up flex flex-col gap-1"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
                    <p className="text-xs font-bold text-slate-100 truncate">
                      {state.profile.nickname || 'Tân Binh'}
                    </p>
                    <p className="text-[11px] text-violet-400 font-pixel">
                      Level {levelProg.level} • {levelProg.title}
                    </p>
                  </div>

                  <Link
                    to="/play/profile"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-violet-400" />
                    <span>Hồ sơ người chơi</span>
                  </Link>

                  <Link
                    to="/play/wardrobe"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Shirt className="w-4 h-4 text-cyan-400" />
                    <span>Nhân vật</span>
                  </Link>

                  <Link
                    to="/play/achievements"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Thành tựu (17)</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left sm:hidden"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>Chia sẻ & Mã QR</span>
                  </button>

                  <Link
                    to="/about"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <span>Về dự án</span>
                  </Link>

                  <div className="pt-1 border-t border-slate-700/60 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsResetModalOpen(true)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-colors w-full text-left cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400" />
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
