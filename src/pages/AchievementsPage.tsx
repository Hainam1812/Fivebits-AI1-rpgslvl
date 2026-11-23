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
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text)] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[var(--gold)]" />
            <span>Thành Tựu (Achievements)</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Chinh phục 17 mốc son học thuật để mở khóa ngoại trang danh giá
          </p>
        </div>

        {/* Global Progress Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 pixel-frame pixel-frame-gold">
          <Award className="w-5 h-5 text-[var(--gold)]" />
          <div className="text-left font-pixel">
            <div className="text-xs uppercase text-[var(--muted)]">Đã mở khóa</div>
            <div className="text-sm font-bold text-[var(--gold)] font-num">
              {unlockedCount}/{achievements.length} ({Math.round((unlockedCount / achievements.length) * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Thanh chuyển mục (Tabs lớn): [Thành Tựu] | [Thưởng Cấp] */}
      <div className="pixel-tab-list flex items-center gap-1.5 p-1.5 max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer min-h-[40px] ${
            activeTab === 'achievements'
              ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] border-2 border-transparent'
          }`}
        >
          <Trophy className={`w-4 h-4 ${activeTab === 'achievements' ? 'text-[var(--ink)]' : 'text-[var(--gold)]'}`} />
          <span>Thành Tựu</span>
          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-num ${
            activeTab === 'achievements' ? 'bg-[var(--ink)] text-[var(--gold)]' : 'bg-[var(--panel-2)] text-[var(--gold)] border border-[var(--ink)]'
          }`}>
            {unlockedCount}/{achievements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[2px] font-heading font-bold text-xs sm:text-sm transition-colors cursor-pointer min-h-[40px] ${
            activeTab === 'rewards'
              ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] border-2 border-transparent'
          }`}
        >
          <Gift className={`w-4 h-4 ${activeTab === 'rewards' ? 'text-[var(--ink)]' : 'text-[var(--gold)]'}`} />
          <span>Thưởng Cấp</span>
          <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-num ${
            activeTab === 'rewards' ? 'bg-[var(--ink)] text-[var(--gold)]' : 'bg-[var(--panel-2)] text-[var(--gold)] border border-[var(--ink)]'
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
            <div className="pixel-tab-list flex items-center gap-1 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-[2px] font-semibold transition-colors cursor-pointer min-h-[36px] ${
                  filterStatus === 'all' ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--text)] border-2 border-transparent'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('unlocked')}
                className={`px-3 py-1.5 rounded-[2px] font-semibold transition-colors cursor-pointer min-h-[36px] ${
                  filterStatus === 'unlocked' ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--text)] border-2 border-transparent'
                }`}
              >
                Đã mở ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('locked')}
                className={`px-3 py-1.5 rounded-[2px] font-semibold transition-colors cursor-pointer min-h-[36px] ${
                  filterStatus === 'locked' ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--text)] border-2 border-transparent'
                }`}
              >
                Chưa mở ({achievements.length - unlockedCount})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="pixel-input px-3 py-2 text-xs text-[var(--text)] cursor-pointer ml-auto min-h-[44px]"
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
                  category={isUnlocked ? undefined : ach.category}
                  locked={!isUnlocked}
                  className="p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Badge SVG Icon & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`w-12 h-12 rounded-[2px] flex items-center justify-center border-2 ${
                          isUnlocked
                            ? 'bg-[var(--panel-2)] border-[var(--gold)] text-[var(--gold)]'
                            : 'bg-[var(--bg)] border-[var(--ink)] text-[var(--muted)]'
                        }`}
                      >
                        <Trophy className="w-6 h-6" />
                      </div>

                      <span className="text-xs font-bold text-[var(--muted)] uppercase font-pixel tracking-wider">
                        {ach.category}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3
                        className={`font-bold font-heading text-base ${
                          isUnlocked ? 'text-[var(--gold)]' : 'text-[var(--text)]'
                        }`}
                      >
                        {ach.title}
                      </h3>
                      <p className="text-xs text-[#C8CEEA] mt-1 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  <div className="space-y-1.5 pt-3 border-t-2 border-[#2C3563]">
                    <div className="flex items-center justify-between text-xs font-pixel">
                      <span className="text-[var(--muted)]">
                        Tiến độ:{' '}
                        <strong className={`font-num text-[11px] ${isUnlocked ? 'text-[var(--gold)]' : 'text-[var(--text)]'}`}>
                          {currentProgress}/{maxProgress}
                        </strong>
                      </span>
                      <span className={isUnlocked ? 'text-[var(--green)] font-bold' : 'text-[var(--muted)]'}>
                        {isUnlocked ? 'HOÀN THÀNH' : `${percent}%`}
                      </span>
                    </div>

                    <div className="pixel-progress h-2.5">
                      <div
                        className={`pixel-progress-fill ${
                          isUnlocked ? 'bg-[var(--gold)]' : 'bg-[var(--sky)]'
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
