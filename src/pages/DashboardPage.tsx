import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import {
  selectLevelProgress,
  selectStreak,
  selectTotalXp,
  selectDailyQuestsStatus,
  selectPackagesStatus,
  selectAchievementProgress,
  selectActiveEvents,
} from '../store/selectors.js';
import { getCampusHotspot } from '../domain/locations.js';
import { CharacterStage } from '../components/game/CharacterStage.js';
import { QuestCard } from '../components/game/QuestCard.js';
import { QuestDetailModal } from '../components/game/QuestDetailModal.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { CharacterAdjustModal } from '../components/game/CharacterAdjustModal.js';
import charactersData from '../data/characters.json' with { type: 'json' };
import {
  Flame,
  Trophy,
  Compass,
  MapPin,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  Play,
  Check,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { state, dispatch, now } = useGame();
  const levelProg = selectLevelProgress(state);
  const streak = selectStreak(state, now);
  const totalXp = selectTotalXp(state);
  const dailyStatus = selectDailyQuestsStatus(state, now);
  const packagesStatus = selectPackagesStatus(state);
  const achievements = selectAchievementProgress(state, now);
  const activeEvents = selectActiveEvents(state, now);
  const hotspot = getCampusHotspot(state, now);

  const [selectedQuest, setSelectedQuest] = useState<any | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Active / owned packages
  const activePackages = packagesStatus.filter(p => p.isOwned && !p.isAbandoned);
  // Recent unlocked achievements or near completion (>= 50%)
  const recentAchievements = achievements
    .filter(a => a.isUnlocked || a.currentProgress / a.maxProgress >= 0.5)
    .slice(0, 3);

  // Top running active event
  const runningEvent = activeEvents.find(e => e.isActive);

  return (
    <div className="space-y-6">
      {/* Top Player Profile RPG Banner */}
      <Card variant="surface" className="p-5 sm:p-6 relative overflow-hidden border border-violet-500/30">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Character Stage with Cosmetics */}
          <div className="shrink-0 flex flex-col items-center">
            <CharacterStage size="md" showNameplate={false} />
            <div className="mt-2 flex items-center gap-2.5 text-xs font-semibold flex-wrap justify-center">
              <Link to="/play/wardrobe" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <span>Đổi đồ</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(true)}
                className="text-violet-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Căn chỉnh vị trí và phóng to thu nhỏ nhân vật"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Căn chỉnh & Phóng to</span>
              </button>
            </div>
          </div>

          {/* Player Progression & Stats */}
          <div className="flex-1 w-full space-y-4">
            {/* Title & Level */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{levelProg.title}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 mt-1">
                  {state.profile.nickname || 'Tân Binh'}
                </h1>
                {(() => {
                  const activeCharId = state.profile.characterId || 'hero';
                  const charObj = state.customCharacters?.find(c => c.id === activeCharId) ||
                    charactersData.find((c: any) => c.id === activeCharId);
                  const desc = charObj?.description || charObj?.tagline;
                  return (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      <span className="text-cyan-300 font-semibold">{charObj?.displayName || 'Sinh Viên'}</span>
                      {desc && <span className="text-slate-400"> • {desc}</span>}
                    </p>
                  );
                })()}
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-[#0F132E] border border-amber-500/40 shadow-lg">
                <Flame className={`w-6 h-6 ${streak.hasCompletedToday ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-pixel">Streak</div>
                  <div className="text-lg font-black text-amber-300 font-pixel leading-tight">
                    {streak.currentStreak} ngày
                  </div>
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="space-y-1.5 bg-[#0F132E]/80 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-400 font-pixel text-sm">LEVEL {levelProg.level}</span>
                <span className="text-slate-300 font-pixel">
                  {levelProg.xpInCurrentLevel} / {levelProg.xpRequiredForNextLevel} XP ({levelProg.progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${levelProg.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                <span>Tổng XP trọn đời: <strong className="text-slate-200">{totalXp.toLocaleString()} XP</strong></span>
                <span>{levelProg.isMaxLevel ? 'Đã đạt Max Level!' : `Còn ${levelProg.xpRequiredForNextLevel - levelProg.xpInCurrentLevel} XP để lên Level ${levelProg.level + 1}`}</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Link to="/play/quests" className="flex-1 min-w-[130px]">
                <Button variant="primary" size="sm" fullWidth icon={<Compass className="w-4 h-4" />}>
                  Cày Nhiệm Vụ
                </Button>
              </Link>
              <Link to="/play/map" className="flex-1 min-w-[130px]">
                <Button variant="secondary" size="sm" fullWidth icon={<MapPin className="w-4 h-4 text-cyan-400" />}>
                  Bản Đồ Trường
                </Button>
              </Link>
              <Link to="/play/wardrobe" className="flex-1 min-w-[130px]">
                <Button variant="secondary" size="sm" fullWidth>
                  Tủ Đồ ({state.seenCosmetics.length} món)
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Hot Spot Banner: "Hôm nay nên ghé đâu?" */}
      <Card variant="surface" className="p-4 bg-gradient-to-r from-[#161B40] via-[#1E1B4B] to-[#161B40] border-cyan-500/30">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-pixel flex items-center gap-1.5">
                <span>Hôm Nay Nên Ghé Đâu?</span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {hotspot.name} ({hotspot.recommendedTime})
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {hotspot.lore}
              </p>
            </div>
          </div>

          <Link to={`/play/map?loc=${hotspot.id}`}>
            <Button variant="cyan" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Ghé thăm ngay
            </Button>
          </Link>
        </div>
      </Card>

      {/* Running Event Banner if active */}
      {runningEvent && (
        <Card variant="glow" className="p-4 border-amber-500/40 bg-gradient-to-r from-[#20163B] to-[#161B40]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase font-pixel tracking-wider">
                  Sự Kiện Đang Diễn Ra (Còn {runningEvent.daysRemaining} ngày)
                </div>
                <div className="text-sm font-bold text-slate-100">
                  {runningEvent.event.title}
                </div>
                <div className="text-xs text-slate-300">
                  Tiến độ: {runningEvent.completedTaskIds.length}/{runningEvent.event.tasks.length} nhiệm vụ (+{runningEvent.event.clearBonusXp} XP bonus)
                </div>
              </div>
            </div>

            <Link to="/play/events">
              <Button variant="gold" size="sm">
                Tham gia sự kiện
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Grid: Daily Quests vs Your Questlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Quests Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-violet-400" />
                <span>Daily Quests Hôm Nay</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tiến độ: <strong className="text-violet-300">{dailyStatus.completedCount}/{dailyStatus.totalCount}</strong> • Còn nhận được <strong className="text-amber-300 font-pixel">+{dailyStatus.remainingXpToday} XP</strong>
              </p>
            </div>

            <Link to="/play/quests" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
              Xem toàn bộ <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {dailyStatus.items.slice(0, 4).map(item => {
              const status = item.activeState ? 'in_progress' : item.isCompleted ? 'completed' : 'todo';
              return (
                <QuestCard
                  key={item.quest.id}
                  id={item.quest.id}
                  name={item.quest.name}
                  description={item.quest.description}
                  category={item.quest.category}
                  difficulty={item.quest.difficulty}
                  xp={item.quest.xp}
                  status={status}
                  startedAt={item.activeState?.startedAt}
                  dueAt={item.activeState?.dueAt}
                  activeTaskState={item.activeState}
                  onClickDetail={() =>
                    setSelectedQuest({
                      id: item.quest.id,
                      name: item.quest.name,
                      description: item.quest.description,
                      condition: item.quest.condition,
                      category: item.quest.category,
                      difficulty: item.quest.difficulty,
                      xp: item.quest.xp,
                      locationId: item.quest.locationId,
                      status,
                      activeTaskState: item.activeState,
                    })
                  }
                  onStart={() =>
                    dispatch({
                      type: 'START_TASK',
                      payload: { questId: item.quest.id },
                    })
                  }
                  onReplay={() =>
                    dispatch({
                      type: 'START_TASK',
                      payload: { questId: item.quest.id },
                    })
                  }
                  onPause={
                    status === 'in_progress' && !item.activeState?.isPaused
                      ? (elapsed) =>
                          dispatch({
                            type: 'PAUSE_TASK',
                            payload: { questId: item.quest.id, elapsedSeconds: elapsed },
                          })
                      : undefined
                  }
                  onResume={
                    status === 'in_progress' && item.activeState?.isPaused
                      ? () =>
                          dispatch({
                            type: 'RESUME_TASK',
                            payload: { questId: item.quest.id },
                          })
                      : undefined
                  }
                  onResetTimer={
                    status === 'in_progress'
                      ? () =>
                          dispatch({
                            type: 'RESET_TASK_TIMER',
                            payload: { questId: item.quest.id },
                          })
                      : undefined
                  }
                  onAbandon={
                    status === 'in_progress'
                      ? () =>
                          dispatch({
                            type: 'ABANDON_TASK',
                            payload: { questId: item.quest.id },
                          })
                      : undefined
                  }
                  onComplete={
                    status === 'in_progress'
                      ? () =>
                          dispatch({
                            type: 'COMPLETE_DAILY_QUEST',
                            payload: { questId: item.quest.id },
                          })
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Your Questlines (Active packages) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Gói Quest Đang Chơi</span>
              </h2>
              <p className="text-xs text-slate-400">
                {activePackages.length} chuỗi nhiệm vụ đang kích hoạt
              </p>
            </div>

            <Link to="/packages" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center">
              Khám phá thêm <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {activePackages.length === 0 ? (
            <Card variant="surface" className="p-8 text-center space-y-3 border-dashed border-slate-700">
              <div className="w-12 h-12 mx-auto rounded-full bg-violet-950/60 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Bạn chưa mở khóa chuỗi nhiệm vụ nào
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Mở khóa các gói nhiệm vụ như Master Python, Gym Rat, AI HCMUS-ER để bắt đầu lộ trình thăng hạng kỹ năng!
              </p>
              <Link to="/packages" className="inline-block pt-2">
                <Button variant="primary" size="sm">
                  Khám Phá Quest Packages
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {activePackages.map(p => (
                <Card key={p.pkg.id} variant="surface" className="p-4 border-l-4" style={{ borderLeftColor: p.pkg.color }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 font-heading">
                        {p.pkg.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {p.pkg.shortDescription}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 font-pixel">
                      {p.completedTasksCount}/{p.totalTasksCount}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden my-2">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: p.pkg.color,
                        width: `${p.progressPercent}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Đã nhận: <strong className="text-violet-300">{p.xpEarnedSoFar} XP</strong>
                    </span>
                    <Link to={`/packages/${p.pkg.id}`}>
                      <Button variant="secondary" size="sm">
                        {p.isCompleted ? 'Xem lại' : 'Tiếp tục chuỗi'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Achievements Teaser */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold font-heading text-slate-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Thành Tựu Đang Chinh Phục</span>
              </h3>
              <Link to="/play/achievements" className="text-xs text-slate-400 hover:text-slate-200">
                Tất cả (17)
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {recentAchievements.map(a => (
                <div
                  key={a.achievement.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    a.isUnlocked
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-[#161B40]/60 border-slate-700/60 text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold line-clamp-1">{a.achievement.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Tiến độ: {a.currentProgress}/{a.maxProgress}
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${a.isUnlocked ? 'bg-amber-400' : 'bg-violet-500'}`}
                      style={{ width: `${Math.round((a.currentProgress / a.maxProgress) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quest Detail Modal */}
      {(() => {
        const activeTaskState = selectedQuest ? state.activeTasks[selectedQuest.id] : undefined;
        const isCompleted = selectedQuest ? state.completions.some(c => c.questId === selectedQuest.id) : false;
        let status = selectedQuest?.status;
        if (activeTaskState) {
          status = 'in_progress';
        } else if (isCompleted) {
          status = 'completed';
        } else if (status === 'in_progress') {
          status = 'todo';
        }

        const liveQuest = selectedQuest ? {
          ...selectedQuest,
          status,
          activeTaskState,
        } : null;

        return (
          <QuestDetailModal
            isOpen={Boolean(selectedQuest)}
            onClose={() => setSelectedQuest(null)}
            quest={liveQuest}
            onStart={() => {
              if (selectedQuest) {
                dispatch({ type: 'START_TASK', payload: { questId: selectedQuest.id } });
              }
            }}
            onPause={(elapsed) => {
              if (selectedQuest) {
                dispatch({ type: 'PAUSE_TASK', payload: { questId: selectedQuest.id, elapsedSeconds: elapsed } });
              }
            }}
            onResume={() => {
              if (selectedQuest) {
                dispatch({ type: 'RESUME_TASK', payload: { questId: selectedQuest.id } });
              }
            }}
            onAbandon={() => {
              if (selectedQuest) {
                dispatch({ type: 'ABANDON_TASK', payload: { questId: selectedQuest.id } });
              }
            }}
            onComplete={() => {
              if (selectedQuest) {
                dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: selectedQuest.id } });
              }
            }}
          />
        );
      })()}

      {/* Character Adjust Modal */}
      <CharacterAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
      />
    </div>
  );
};
