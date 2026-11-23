import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Compass, CalendarCheck2, Layers } from 'lucide-react';
import { useGame } from '../../store/GameContext.js';
import { selectDailyQuestsStatus } from '../../store/selectors.js';

export const BottomNav: React.FC = () => {
  const { state, now } = useGame();
  const dailyStatus = selectDailyQuestsStatus(state, now);
  const uncompletedDailies = dailyStatus.totalCount - dailyStatus.completedCount;

  const navItems = [
    { to: '/play', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
    { to: '/play/map', label: 'Bản đồ', icon: Map },
    { to: '/play/quests', label: 'Nhiệm vụ', icon: Compass, badge: uncompletedDailies > 0 ? uncompletedDailies : undefined },
    { to: '/play/events', label: 'Sự kiện', icon: CalendarCheck2 },
    { to: '/packages', label: 'Gói Quest', icon: Layers },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--panel)] border-t-[3px] border-[var(--ink)] px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Điều hướng chính di động"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center w-full h-full py-1 min-w-[56px] min-h-[48px] select-none transition-colors ${
                  isActive ? 'text-[var(--gold)] font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2.5 px-1 py-0.5 rounded-[2px] bg-[var(--gold)] border border-[var(--ink)] text-[9px] font-bold text-[var(--ink)] font-num leading-none">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs mt-1 font-semibold tracking-tight leading-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0.5 w-6 h-[3px] bg-[var(--gold)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
