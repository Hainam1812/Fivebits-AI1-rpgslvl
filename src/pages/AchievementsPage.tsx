import React, { useState } from 'react';
import { useGame } from '../store/GameContext.js';
import { selectAchievementProgress, selectLevelProgress } from '../store/selectors.js';
import { Card } from '../components/ui/Card.js';
import { Trophy, Award, Lock, CheckCircle2, Sparkles, Filter, Gift } from 'lucide-react';
import { LevelRewardsSection } from '../components/game/LevelRewardsSection.js';

export const AchievementsPage: React.FC = () => {
  const { state, now } = useGame();
  const achievements = selectAchievementProgress(state, now);
  const levelProg = selectLevelProgress(state);
  const currentLevel = levelProg.level;

  const [activeTab, setActiveTab] = useState<'achievements' | 'rewards'>('achievements');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');

  const categories = [
    'all',
    'Học tập',
    'Phát triển bản thân',
    'Daily Quests',
    'Quest Packages',
    'Cửa hàng',
    'Sự kiện và Thi',
    'Bản đồ',
  ];

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  const filteredAchievements = achievements.filter(a => {
    if (filterCategory !== 'all' && a.achievement.category !== filterCategory) return false;
    if (filterStatus === 'unlocked' && !a.isUnlocked) return false;
    if (filterStatus === 'locked' && a.isUnlocked) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Thành Tựu (Achievements)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chinh phục 17 mốc son học thuật để mở khóa ngoại trang danh giá
          </p>
        </div>

        {/* Global Progress Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#161B40] border border-amber-500/40 shadow-lg">
          <Award className="w-5 h-5 text-amber-400" />
          <div className="text-left font-pixel">
            <div className="text-[10px] uppercase text-slate-400">Đã mở khóa</div>
            <div className="text-sm font-bold text-amber-300">
              {unlockedCount} / {achievements.length} ({Math.round((unlockedCount / achievements.length) * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển mục (Tabs lớn): [Thành Tựu] | [Thưởng Cấp] */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#161B40] border border-slate-700/80 shadow-md max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40 border border-violet-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Thành Tựu</span>
          <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] font-pixel text-amber-300">
            {unlockedCount}/{achievements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-lg shadow-amber-900/40 border border-amber-300 font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Gift className={`w-4 h-4 ${activeTab === 'rewards' ? 'text-slate-950' : 'text-amber-400'}`} />
          <span>Thưởng Cấp</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-pixel ${
            activeTab === 'rewards' ? 'bg-amber-900/30 text-slate-950 font-bold' : 'bg-black/40 text-amber-300'
          }`}>
            LV.{currentLevel}
          </span>
        </button>
      </div>

      {/* Nội dung theo Tab đang chọn */}
      {activeTab === 'achievements' ? (
        <>
          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'all' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('unlocked')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'unlocked' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã mở ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('locked')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === 'locked' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Chưa mở ({achievements.length - unlockedCount})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer ml-auto"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Tất cả lĩnh vực' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Achievements Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map(({ achievement: ach, currentProgress, maxProgress, isUnlocked }) => {
              const percent = Math.round((currentProgress / maxProgress) * 100);

              return (
                <Card
                  key={ach.id}
                  variant={isUnlocked ? 'gold' : 'surface'}
                  className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                    !isUnlocked ? 'opacity-85' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badge SVG Icon & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md ${
                          isUnlocked
                            ? 'bg-[#1E1B4B] border-amber-400/80 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}
                      >
                        <Trophy className="w-6 h-6" />
                      </div>

                      <span className="text-[10px] font-bold text-slate-400 uppercase font-pixel tracking-wider">
                        {ach.category}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3
                        className={`font-bold font-heading text-base ${
                          isUnlocked ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        {ach.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-700/60">
                    <div className="flex items-center justify-between text-[11px] font-pixel">
                      <span className="text-slate-400">
                        Tiến độ: <strong className={isUnlocked ? 'text-amber-300' : 'text-slate-200'}>{currentProgress}/{maxProgress}</strong>
                      </span>
                      <span className={isUnlocked ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {isUnlocked ? 'HOÀN THÀNH' : `${percent}%`}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                            : 'bg-gradient-to-r from-violet-600 to-cyan-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        /* Mục Thưởng Cấp (Level Rewards) */
        <LevelRewardsSection currentLevel={currentLevel} />
      )}
    </div>
  );
};
