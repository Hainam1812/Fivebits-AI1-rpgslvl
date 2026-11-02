import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Compass,
  CalendarCheck2,
  Layers,
  Award,
  Shirt,
  User,
  Info,
  Mail,
  Flame,
  ChevronRight,
  PanelLeftClose,
} from 'lucide-react';
import { Logo } from '../ui/Logo.js';
import { CharacterStage } from '../game/CharacterStage.js';
import { useGame } from '../../store/GameContext.js';
import { selectLevelProgress, selectStreak, selectTotalXp } from '../../store/selectors.js';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { state, now } = useGame();
  const levelProg = selectLevelProgress(state);
  const streak = selectStreak(state, now);
  const totalXp = selectTotalXp(state);

  const mainLinks = [
    { to: '/play', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/play/map', label: 'Campus Map & TKB', icon: Map },
    { to: '/play/quests', label: 'Quests', icon: Compass },

    { to: '/play/events', label: 'Events & Thi', icon: CalendarCheck2 },
    { to: '/packages', label: 'Quest Packages', icon: Layers },
    { to: '/play/wardrobe', label: 'Tủ Đồ', icon: Shirt },
    { to: '/play/achievements', label: 'Thành Tựu', icon: Award },
    { to: '/play/profile', label: 'Hồ Sơ', icon: User },
  ];

  const secondaryLinks = [
    { to: '/about', label: 'Về Dự Án', icon: Info },
    { to: '/contact', label: 'Liên Hệ & FAQ', icon: Mail },
  ];

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#0F132E] border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto transition-all duration-300">
      {/* Brand Logo Header with Collapse Button */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-2">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity min-w-0">
          <Logo size="md" showSlogan={true} />
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl border border-slate-700/60 transition-colors cursor-pointer shrink-0"
            title="Thu gọn thanh công cụ (Collapse)"
            aria-label="Thu gọn thanh công cụ"
          >
            <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-cyan-300" />
          </button>
        )}
      </div>


      {/* Main Navigation */}
      <nav className="flex-1 p-3.5 space-y-1" aria-label="Sidebar navigation">
        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
          Khu Chơi Game
        </div>
        {mainLinks.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-violet-400 scale-110 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]' : 'text-slate-400'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-violet-400" />}
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
          Thông Tin
        </div>
        {secondaryLinks.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  isActive ? 'text-violet-300 bg-white/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 text-slate-500" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Mini Player Profile Card at Bottom */}
      <div className="p-3 border-t border-slate-800 bg-[#0A0E27]/60">
        <Link
          to="/play/profile"
          className="flex items-center gap-2.5 p-2 rounded-xl bg-[#161B40]/70 border border-slate-700/60 hover:border-violet-500/50 transition-all group overflow-hidden"
        >
          <div className="shrink-0 flex items-center justify-center">
            <CharacterStage size="xs" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-100 truncate group-hover:text-violet-300 transition-colors">
                {state.profile.nickname || 'Tân Binh'}
              </span>
              <span className="text-[10px] font-bold text-violet-400 font-pixel shrink-0">
                LV.{levelProg.level}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${levelProg.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-pixel">
              <span className="truncate">{levelProg.xpInCurrentLevel}/{levelProg.xpRequiredForNextLevel} XP</span>
              <span className="flex items-center text-amber-400 shrink-0 ml-1">
                <Flame className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                {streak.currentStreak}d
              </span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
};
