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
      <Card variant="gold" className="p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Character Stage with Cosmetics */}
          <div className="shrink-0 flex flex-col items-center">
            <CharacterStage size="md" showNameplate={false} />
            <div className="mt-2 flex items-center gap-2.5 text-xs font-semibold flex-wrap justify-center">
              <Link to="/play/wardrobe" className="text-[var(--sky)] hover:underline flex items-center gap-1">
                <span>Đổi đồ</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <span className="text-[var(--muted)]">•</span>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(true)}
                className="text-[var(--gold)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer transition-colors"
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
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] text-[var(--gold)] text-xs font-pixel">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span>{levelProg.title}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text)] mt-1.5">
                  {state.profile.nickname || 'Tân Binh'}
                </h1>
                {(() => {
                  const activeCharId = state.profile.characterId || 'boy1';
                  const charObj = state.customCharacters?.find(c => c.id === activeCharId) ||
                    charactersData.find((c: any) => c.id === activeCharId);
                  const desc = charObj?.description || charObj?.tagline;
                  return (
                    <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                      <span className="text-[var(--sky)] font-semibold">{charObj?.displayName || 'Sinh Viên'}</span>
                      {desc && <span className="text-[var(--muted)]"> • {desc}</span>}
                    </p>
                  );
                })()}
              </div>

              {/* Streak Badge */}
              <div className="flex items-center gap-2.5 p-2 px-3 pixel-frame pixel-frame-gold">
                <Flame className={`w-6 h-6 ${streak.hasCompletedToday ? 'text-[var(--gold)] fill-[var(--gold)]' : 'text-[var(--muted)]'}`} />
                <div className="text-left">
                  <div className="text-[11px] uppercase font-bold text-[var(--muted)] font-pixel">Streak</div>
                  <div className="text-sm font-bold text-[var(--gold)] leading-tight flex items-baseline gap-1.5">
                    <span className="font-num">{streak.currentStreak}</span>
                    <span className="font-pixel text-[var(--text)]">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level XP Progress Bar */}
            <div className="space-y-2 bg-[var(--bg)] p-3.5 rounded-[2px] border-2 border-[var(--ink)]">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-bold">
                <span className="text-[var(--gold)] font-num text-xs">LV.{levelProg.level}</span>
                <span className="text-[var(--text)] font-num text-[11px]">
                  {levelProg.xpInCurrentLevel} / {levelProg.xpRequiredForNextLevel} XP ({levelProg.progressPercent}%)
                </span>
              </div>
              <div className="pixel-progress h-3.5">
                <div
                  className="pixel-progress-fill bg-[var(--gold)]"
                  style={{ width: `${levelProg.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between gap-2 flex-wrap text-xs text-[var(--muted)] pt-0.5">
                <span>
                  Tổng XP trọn đời:{' '}
                  <strong className="text-[var(--text)] font-num text-[11px]">{totalXp.toLocaleString()} XP</strong>
                </span>
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
                <Button variant="secondary" size="sm" fullWidth icon={<MapPin className="w-4 h-4 text-[var(--sky)]" />}>
                  Bản Đồ Trường
                </Button>
              </Link>
              <Link to="/play/wardrobe" className="flex-1 min-w-[130px]">
                <Button variant="secondary" size="sm" fullWidth>
                  Nhân vật
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Hot Spot Banner: "Hôm nay nên ghé đâu?" */}
      <Card variant="surface" category="University" className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--sky)] shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--sky)] uppercase tracking-wider font-pixel flex items-center gap-1.5">
                <span>Hôm Nay Nên Ghé Đâu?</span>
              </div>
              <div className="text-sm font-bold text-[var(--text)]">
                {hotspot.name} ({hotspot.recommendedTime})
              </div>
              <p className="text-xs text-[var(--muted)] line-clamp-1">
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
        <Card variant="gold" className="p-4 pixel-event-frame">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--gold)] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--gold)] uppercase font-pixel tracking-wider">
                  Sự Kiện Đang Diễn Ra (Còn {runningEvent.daysRemaining} ngày)
                </div>
                <div className="text-sm font-bold text-[var(--text)]">
                  {runningEvent.event.title}
                </div>
                <div className="text-xs text-[#D5DAE8]">
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
              <h2 className="text-lg font-bold font-heading text-[var(--text)] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[var(--gold)]" />
                <span>Daily Quests Hôm Nay</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Tiến độ: <strong className="text-[var(--text)]">{dailyStatus.completedCount}/{dailyStatus.totalCount}</strong> • Còn nhận được <strong className="text-[var(--gold)] font-num text-[11px]">+{dailyStatus.remainingXpToday} XP</strong>
              </p>
            </div>

            <Link to="/play/quests" className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center">
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
              <h2 className="text-lg font-bold font-heading text-[var(--text)] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[var(--sky)]" />
                <span>Gói Quest Đang Chơi</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {activePackages.length} chuỗi nhiệm vụ đang kích hoạt
              </p>
            </div>

            <Link to="/packages" className="text-xs font-semibold text-[var(--sky)] hover:underline flex items-center">
              Khám phá thêm <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {activePackages.length === 0 ? (
            <Card variant="surface" className="p-8 text-center space-y-3 border-dashed">
              <div className="w-12 h-12 mx-auto rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--gold)]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text)]">
                Bạn chưa mở khóa chuỗi nhiệm vụ nào
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
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
                <Card key={p.pkg.id} variant="surface" category={p.pkg.category} className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)] font-heading">
                        {p.pkg.title}
                      </h4>
                      <p className="text-xs text-[var(--muted)] line-clamp-1">
                        {p.pkg.shortDescription}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text)] font-num shrink-0">
                      {p.completedTasksCount}/{p.totalTasksCount}
                    </span>
                  </div>

                  {/* Segmented Pixel Progress Bar */}
                  <div className="pixel-progress h-2.5 my-2">
                    <div
                      className="pixel-progress-fill"
                      style={{
                        backgroundColor: 'var(--frame-color)',
                        width: `${p.progressPercent}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--muted)]">
                      Đã nhận: <strong className="text-[var(--gold)] font-num text-[11px]">{p.xpEarnedSoFar} XP</strong>
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
              <h3 className="text-sm font-bold font-heading text-[var(--text)] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[var(--gold)]" />
                <span>Thành Tựu Đang Chinh Phục</span>
              </h3>
              <Link to="/play/achievements" className="text-xs text-[var(--muted)] hover:text-[var(--gold)]">
                Tất cả (17)
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {recentAchievements.map(a => (
                <div
                  key={a.achievement.id}
                  className={`p-3 pixel-frame flex flex-col justify-between ${
                    a.isUnlocked
                      ? 'pixel-frame-gold text-[var(--text)]'
                      : 'pixel-frame-muted text-[var(--muted)]'
                  }`}
                >
                  <div className="text-xs font-bold line-clamp-1">{a.achievement.title}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    Tiến độ: {a.currentProgress}/{a.maxProgress}
                  </div>
                  <div className="pixel-progress h-2 mt-2">
                    <div
                      className={`pixel-progress-fill ${a.isUnlocked ? 'bg-[var(--gold)]' : 'bg-[var(--sky)]'}`}
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
