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
    { to: '/play/wardrobe', label: 'Nhân vật', icon: Shirt },
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
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[var(--panel)] border-r-[3px] border-[var(--ink)] shrink-0 h-screen sticky top-0 overflow-y-auto transition-all duration-200">
      {/* Brand Logo Header with Collapse Button */}
      <div className="p-5 border-b-2 border-[var(--ink)] flex items-center justify-between gap-2">
        <Link to="/" className="inline-block hover:opacity-90 transition-opacity min-w-0">
          <Logo size="md" showSlogan={true} />
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] bg-[var(--panel-2)] rounded-[2px] border-2 border-[var(--ink)] hover:border-[var(--gold)] transition-colors cursor-pointer shrink-0"
            title="Thu gọn thanh công cụ (Collapse)"
            aria-label="Thu gọn thanh công cụ"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3.5 space-y-1" aria-label="Sidebar navigation">
        <div className="px-3 py-1.5 text-xs font-bold text-[var(--muted)] uppercase tracking-wider font-heading">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-[2px] text-sm font-semibold transition-colors border-2 ${
                  isActive
                    ? 'bg-[var(--panel-2)] text-[var(--gold)] border-[var(--gold)] shadow-[0_2px_0_0_var(--ink)]'
                    : 'text-[var(--text)]/90 border-transparent hover:text-[var(--text)] hover:bg-[var(--panel-2)]/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[var(--gold)]' : 'text-[var(--muted)]'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[var(--gold)]" />}
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 py-1.5 text-xs font-bold text-[var(--muted)] uppercase tracking-wider font-heading">
          Thông Tin
        </div>
        {secondaryLinks.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 rounded-[2px] text-xs font-semibold transition-colors border-2 ${
                  isActive
                    ? 'text-[var(--gold)] bg-[var(--panel-2)] border-[var(--gold)]'
                    : 'text-[var(--muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--panel-2)]/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Mini Player Profile Card at Bottom */}
      <div className="p-3 border-t-2 border-[var(--ink)] bg-[var(--bg)]">
        <Link
          to="/play/profile"
          className="flex items-center gap-2.5 p-2.5 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] hover:border-[var(--gold)] transition-colors group overflow-hidden shadow-[0_3px_0_0_var(--ink)]"
        >
          <div className="shrink-0 flex items-center justify-center">
            <CharacterStage size="xs" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--gold)] transition-colors">
                {state.profile.nickname || 'Tân Binh'}
              </span>
              <span className="text-[10px] font-bold text-[var(--gold)] font-num shrink-0">
                LV.{levelProg.level}
              </span>
            </div>

            {/* Segmented XP Progress Bar */}
            <div className="pixel-progress h-2.5 mt-1.5">
              <div
                className="pixel-progress-fill"
                style={{ width: `${levelProg.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-[var(--muted)] mt-1.5 font-num">
              <span className="truncate">{levelProg.xpInCurrentLevel}/{levelProg.xpRequiredForNextLevel}</span>
              <span className="flex items-center text-[var(--gold)] shrink-0 ml-1">
                <Flame className="w-3 h-3 mr-0.5 fill-[var(--gold)]" />
                {streak.currentStreak}d
              </span>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
};
