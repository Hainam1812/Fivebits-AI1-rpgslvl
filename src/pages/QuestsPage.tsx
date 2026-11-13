import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { selectDailyQuestsStatus, selectPackagesStatus } from '../store/selectors.js';
import { QuestCard } from '../components/game/QuestCard.js';
import { QuestDetailModal } from '../components/game/QuestDetailModal.js';
import { QuestVideoOverlay } from '../components/game/QuestVideoOverlay.js';
import { Button } from '../components/ui/Button.js';
import { Search, Filter, SlidersHorizontal, CheckCircle2, Compass, Layers, Check, Clock, Headphones } from 'lucide-react';
import { canAttemptTask, isTaskCompleted } from '../domain/packages.js';
import { sortQuestsByCompletionStatus, matchesCategory } from '../domain/quests.js';
import { QUEST_PACKAGES } from '../data/questPackages.js';
import { DAILY_QUESTS } from '../data/dailyQuests.js';

export const QuestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, dispatch, now } = useGame();

  const currentTab = searchParams.get('tab') || 'daily';
  const searchQuery = searchParams.get('q') || '';
  const filterCategory = searchParams.get('cat') || 'all';
  const filterDifficulty = searchParams.get('diff') || 'all';

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<any | null>(null);
  const [videoQuest, setVideoQuest] = useState<any | null>(null);
  const [lastVideoQuest, setLastVideoQuest] = useState<any | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStartQuestWithVideo = (q: any) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setLastVideoQuest(q);
    dispatch({ type: 'START_TASK', payload: { questId: q.id } });
    setVideoQuest(q);
  };

  const handleOpenQuietZone = (targetQuest?: any) => {
    if (isTransitioning) return;
    if (targetQuest) {
      setIsTransitioning(true);
      setLastVideoQuest(targetQuest);
      setVideoQuest(targetQuest);
      return;
    }
    if (lastVideoQuest) {
      setIsTransitioning(true);
      setVideoQuest(lastVideoQuest);
      return;
    }
    const activeQuest = rawQuests.find(q => q.status === 'in_progress');
    if (activeQuest) {
      setIsTransitioning(true);
      setLastVideoQuest(activeQuest);
      setVideoQuest(activeQuest);
      return;
    }
    const defaultQuietQuest = {
      id: 'quiet-zone-focus',
      name: 'Vùng Yên Tĩnh: Không Gian Tập Trung',
      description: 'Không gian tĩnh lặng, hình ảnh thư giãn và nhịp điệu êm dịu giúp bạn lấy lại sự tập trung cao độ để hoàn thành các mục tiêu trong ngày.',
      condition: 'Xem video, thư giãn và duy trì phiên tập trung liên tục.',
      category: 'Tập Trung',
      difficulty: 'Normal' as const,
      xp: 25,
      locationId: 'library',
    };
    setIsTransitioning(true);
    setLastVideoQuest(defaultQuietQuest);
    setVideoQuest(defaultQuietQuest);
  };

  const handleCloseVideo = () => {
    setVideoQuest(null);
    setIsTransitioning(false);
  };

  const setTab = (tab: string) => {
    searchParams.set('tab', tab);
    searchParams.delete('cat');
    searchParams.delete('diff');
    setSearchParams(searchParams);
  };

  const setQuery = (q: string) => {
    if (q) searchParams.set('q', q);
    else searchParams.delete('q');
    setSearchParams(searchParams);
  };

  const setCategory = (cat: string) => {
    if (cat !== 'all') searchParams.set('cat', cat);
    else searchParams.delete('cat');
    setSearchParams(searchParams);
  };

  const setDifficulty = (diff: string) => {
    if (diff !== 'all') searchParams.set('diff', diff);
    else searchParams.delete('diff');
    setSearchParams(searchParams);
  };

  const dailyStatus = selectDailyQuestsStatus(state, now);
  const packagesStatus = selectPackagesStatus(state);

  // Compile unfiltered list of quests according to active tab
  const rawQuests = useMemo(() => {
    let list: Array<{
      id: string;
      name: string;
      description: string;
      condition: string;
      category: string;
      difficulty: any;
      xp: number;
      locationId: string;
      status: 'todo' | 'in_progress' | 'completed' | 'locked' | 'overdue';
      startedAt?: string;
      dueAt?: string;
      activeTaskState?: any;
      packageId?: string;
      isBoss?: boolean;
      lockReason?: string;
      source: 'daily' | 'package';
    }> = [];

    if (currentTab === 'daily') {
      list = dailyStatus.items.map(item => ({
        id: item.quest.id,
        name: item.quest.name,
        description: item.quest.description,
        condition: item.quest.condition,
        category: item.quest.category,
        difficulty: item.quest.difficulty,
        xp: item.quest.xp,
        locationId: item.quest.locationId,
        status: (item.activeState ? 'in_progress' : item.isCompleted ? 'completed' : 'todo') as 'in_progress' | 'completed' | 'todo',
        startedAt: item.activeState?.startedAt,
        dueAt: item.activeState?.dueAt,
        activeTaskState: item.activeState,
        source: 'daily' as const,
      }));
    } else if (currentTab === 'active') {
      // In progress daily quests
      const activeDailies = dailyStatus.items
        .filter(item => Boolean(item.activeState))
        .map(item => ({
          id: item.quest.id,
          name: item.quest.name,
          description: item.quest.description,
          condition: item.quest.condition,
          category: item.quest.category,
          difficulty: item.quest.difficulty,
          xp: item.quest.xp,
          locationId: item.quest.locationId,
          status: 'in_progress' as const,
          startedAt: item.activeState?.startedAt,
          dueAt: item.activeState?.dueAt,
          activeTaskState: item.activeState,
          source: 'daily' as const,
        }));

      // In progress package tasks - include ANY package task that has an active state in state.activeTasks
      const activePkgTasks: any[] = [];
      for (const pkg of QUEST_PACKAGES) {
        for (const task of pkg.tasks) {
          const activeState = state.activeTasks[task.id];
          if (activeState) {
            activePkgTasks.push({
              id: task.id,
              name: `${pkg.title}: ${task.title}`,
              description: task.description,
              condition: task.condition,
              category: task.category,
              difficulty: task.difficulty,
              xp: task.xp,
              locationId: task.locationId,
              status: 'in_progress' as const,
              startedAt: activeState.startedAt,
              dueAt: activeState.dueAt,
              activeTaskState: activeState,
              packageId: pkg.id,
              isBoss: task.isBoss,
              source: 'package' as const,
            });
          }
        }
      }
      list = [...activeDailies, ...activePkgTasks];
    } else if (currentTab === 'packages') {
      // All tasks from packages
      for (const p of packagesStatus) {
        for (const task of p.pkg.tasks) {
          const check = canAttemptTask(state, p.pkg, task);
          const isDone = isTaskCompleted(state.completions, task.id);
          const activeState = state.activeTasks[task.id];

          const status = activeState
            ? 'in_progress'
            : isDone
            ? 'completed'
            : check.canAttempt
            ? 'todo'
            : 'locked';

          list.push({
            id: task.id,
            name: `${p.pkg.title}: ${task.title}`,
            description: task.description,
            condition: task.condition,
            category: task.category,
            difficulty: task.difficulty,
            xp: task.xp,
            locationId: task.locationId,
            status,
            startedAt: activeState?.startedAt,
            dueAt: activeState?.dueAt,
            activeTaskState: activeState,
            packageId: p.pkg.id,
            isBoss: task.isBoss,
            lockReason: check.reason,
            source: 'package' as const,
          });
        }
      }
    } else if (currentTab === 'completed') {
      // Direct from ledger completions with friendly names
      list = state.completions.map(c => {
        let displayName = c.questId;
        let cat = c.category;
        let diff = c.difficulty;

        if (c.kind === 'daily') {
          const d = DAILY_QUESTS.find(q => q.id === c.questId);
          if (d) {
            displayName = d.name;
            cat = cat || d.category;
            diff = diff || d.difficulty;
          }
        } else {
          for (const pkg of QUEST_PACKAGES) {
            const t = pkg.tasks.find(tk => tk.id === c.questId);
            if (t) {
              displayName = `${pkg.title}: ${t.title}`;
              cat = cat || t.category;
              diff = diff || t.difficulty;
              break;
            }
          }
        }

        return {
          id: c.key,
          name: displayName,
          description: `Hoàn thành lúc ${new Date(c.completedAt).toLocaleString('vi-VN')}`,
          condition: 'Đã hoàn thành xác nhận',
          category: cat || 'General',
          difficulty: diff || 'Normal',
          xp: c.xp,
          locationId: c.locationId || 'classroom',
          status: 'completed' as const,
          source: (c.kind === 'daily' ? 'daily' : 'package') as 'daily' | 'package',
        };
      });
    }

    return list;
  }, [currentTab, dailyStatus, packagesStatus, state]);

  // Dynamically compute unique categories present in the current tab's items
  const availableCategories = useMemo(() => {
    const map = new Map<string, number>();
    rawQuests.forEach(item => {
      if (item.category) {
        map.set(item.category, (map.get(item.category) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [rawQuests]);

  // Dynamically compute unique difficulties present in the current tab's items
  const availableDifficulties = useMemo(() => {
    const map = new Map<string, number>();
    rawQuests.forEach(item => {
      if (item.difficulty) {
        map.set(item.difficulty, (map.get(item.difficulty) || 0) + 1);
      }
    });
    const order = ['Easy', 'Normal', 'Hard', 'Boss'];
    return order
      .filter(diff => map.has(diff))
      .map(diff => {
        let label = diff;
        if (diff === 'Easy') label = 'Easy (10 XP)';
        else if (diff === 'Normal') label = 'Normal (25 XP)';
        else if (diff === 'Hard') label = 'Hard (50 XP)';
        else if (diff === 'Boss') label = 'Boss (100 XP)';
        return { name: diff, label, count: map.get(diff) || 0 };
      });
  }, [rawQuests]);

  // Total active tasks count across daily quests and packages
  const activeCount = useMemo(() => {
    let count = dailyStatus.items.filter(item => Boolean(item.activeState)).length;
    for (const pkg of QUEST_PACKAGES) {
      for (const task of pkg.tasks) {
        if (state.activeTasks[task.id]) {
          count += 1;
        }
      }
    }
    return count;
  }, [dailyStatus, state.activeTasks]);

  // Filtered displayed list
  const displayedQuests = useMemo(() => {
    let list = [...rawQuests];

    // Apply Search Filter
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter(
        item =>
          item.name.toLowerCase().includes(qLower) ||
          item.description.toLowerCase().includes(qLower) ||
          (item.category && item.category.toLowerCase().includes(qLower)) ||
          (item.condition && item.condition.toLowerCase().includes(qLower))
      );
    }

    // Apply Category Filter with flexible/smart matching
    if (filterCategory !== 'all') {
      list = list.filter(item => matchesCategory(item.category, filterCategory));
    }

    // Apply Difficulty Filter
    if (filterDifficulty !== 'all') {
      list = list.filter(item => item.difficulty === filterDifficulty);
    }

    // Sort quests deterministically: Incomplete on top, Completed at bottom
    return sortQuestsByCompletionStatus(list);
  }, [rawQuests, searchQuery, filterCategory, filterDifficulty]);

  // Derived groups for clean UI sectioning and metrics
  const pendingQuests = useMemo(
    () => displayedQuests.filter(q => q.status !== 'completed'),
    [displayedQuests]
  );
  const completedQuests = useMemo(
    () => displayedQuests.filter(q => q.status === 'completed'),
    [displayedQuests]
  );

  return (
    <div className="space-y-6">
      {/* Title & Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            <Compass className="w-6 h-6 text-violet-400" />
            <span>Nhiệm Vụ (Quests)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chinh phục thử thách, tích lũy XP và nâng cấp bản thân mỗi ngày
          </p>
        </div>

        {/* Actions & Tab switchers */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* Nút Vùng Yên Tĩnh */}
          <button
            type="button"
            onClick={() => handleOpenQuietZone()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-950/90 via-[#161B40] to-violet-950/90 hover:from-cyan-900 hover:to-violet-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer text-xs font-bold font-pixel group shrink-0"
            title="Quay lại trang video Vùng Yên Tĩnh với hiệu ứng Mosaic"
          >
            <Headphones className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
            <span>Vùng yên tĩnh</span>
          </button>

          {/* Tab switchers */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#161B40] border border-slate-700/60 overflow-x-auto">
          {[
            { id: 'daily', label: 'Daily', count: dailyStatus.totalCount - dailyStatus.completedCount },
            { id: 'active', label: 'Đang làm', count: activeCount },
            { id: 'packages', label: 'Gói Quest' },
            { id: 'completed', label: 'Lịch sử', count: state.completions.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-1.5 ${
                currentTab === t.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{t.label}</span>
              {typeof t.count === 'number' && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-pixel leading-none ${
                  currentTab === t.id
                    ? 'bg-white/20 text-white'
                    : t.id === 'active'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-slate-700/60 text-slate-300'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm nhiệm vụ, danh mục, từ khóa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 focus:border-violet-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Desktop Quick Category Select */}
        <div className="hidden sm:flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer max-w-[200px]"
          >
            <option value="all">Tất cả danh mục ({rawQuests.length})</option>
            {availableCategories.map(c => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={filterDifficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="all">Tất cả độ khó</option>
            {availableDifficulties.length > 0 ? (
              availableDifficulties.map(d => (
                <option key={d.name} value={d.name}>
                  {d.label} ({d.count})
                </option>
              ))
            ) : (
              <>
                <option value="Easy">Easy (10 XP)</option>
                <option value="Normal">Normal (25 XP)</option>
                <option value="Hard">Hard (50 XP)</option>
                <option value="Boss">Boss (100 XP)</option>
              </>
            )}
          </select>
        </div>

        {/* Mobile Filter Button */}
        <button
          type="button"
          onClick={() => setIsFilterSheetOpen(true)}
          className="sm:hidden p-2.5 rounded-xl bg-[#161B40] border border-slate-700 text-slate-300 hover:text-white"
          aria-label="Mở bộ lọc"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Summary indicator */}
      {displayedQuests.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span>Cần làm: <strong className="text-slate-200">{pendingQuests.length}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Đã xong: <strong className="text-emerald-300">{completedQuests.length}</strong></span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-pixel">
            Chưa xong ở trên • Đã xong ở dưới
          </span>
        </div>
      )}

      {/* Quest Cards Grid */}
      {displayedQuests.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#161B40]/50 border border-dashed border-slate-700 space-y-3">
          <Compass className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Không tìm thấy nhiệm vụ phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy thử xóa bộ lọc tìm kiếm hoặc chuyển sang tab khác để tiếp tục cày nhiệm vụ.
          </p>
          {(searchQuery || filterCategory !== 'all' || filterDifficulty !== 'all') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setDifficulty('all');
              }}
            >
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Incomplete / Active Quests */}
          {pendingQuests.length > 0 && (
            <div className="space-y-3">
              {completedQuests.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-pixel uppercase tracking-wider text-violet-300 px-1">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Nhiệm Vụ Chưa Hoàn Thành ({pendingQuests.length})</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingQuests.map(q => (
                  <QuestCard
                    key={q.id}
                    id={q.id}
                    name={q.name}
                    description={q.description}
                    category={q.category}
                    difficulty={q.difficulty}
                    xp={q.xp}
                    status={q.status}
                    startedAt={q.startedAt}
                    dueAt={q.dueAt}
                    activeTaskState={q.activeTaskState}
                    isBoss={q.isBoss}
                    lockReason={q.lockReason}
                    onClickDetail={() => setSelectedQuest(q)}
                    onStart={
                      q.status === 'todo' && !isTransitioning
                        ? () => handleStartQuestWithVideo(q)
                        : undefined
                    }
                    onOpenVideo={
                      q.status === 'in_progress'
                        ? () => handleOpenQuietZone(q)
                        : undefined
                    }
                    onReplay={
                      q.status === 'completed'
                        ? () => dispatch({ type: 'START_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onPause={
                      q.status === 'in_progress' && !q.activeTaskState?.isPaused
                        ? (elapsed) => dispatch({ type: 'PAUSE_TASK', payload: { questId: q.id, elapsedSeconds: elapsed } })
                        : undefined
                    }
                    onResume={
                      q.status === 'in_progress' && q.activeTaskState?.isPaused
                        ? () => dispatch({ type: 'RESUME_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onResetTimer={
                      q.status === 'in_progress'
                        ? () => dispatch({ type: 'RESET_TASK_TIMER', payload: { questId: q.id } })
                        : undefined
                    }
                    onAbandon={
                      q.status === 'in_progress'
                        ? () => dispatch({ type: 'ABANDON_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onComplete={
                      q.status === 'in_progress'
                        ? () => {
                            if (q.source === 'daily') {
                              dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: q.id } });
                            } else if (q.packageId) {
                              dispatch({
                                type: 'COMPLETE_PACKAGE_TASK',
                                payload: { packageId: q.packageId, taskId: q.id },
                              });
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Completed Quests (Always below) */}
          {completedQuests.length > 0 && (
            <div className="space-y-3">
              {pendingQuests.length > 0 && (
                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-pixel uppercase tracking-wider text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nhiệm Vụ Đã Xong ({completedQuests.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-pixel">Hoàn thành</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedQuests.map(q => (
                  <QuestCard
                    key={q.id}
                    id={q.id}
                    name={q.name}
                    description={q.description}
                    category={q.category}
                    difficulty={q.difficulty}
                    xp={q.xp}
                    status={q.status}
                    startedAt={q.startedAt}
                    dueAt={q.dueAt}
                    activeTaskState={q.activeTaskState}
                    isBoss={q.isBoss}
                    lockReason={q.lockReason}
                    onClickDetail={() => setSelectedQuest(q)}
                    onStart={
                      q.status === 'todo' && !isTransitioning
                        ? () => handleStartQuestWithVideo(q)
                        : undefined
                    }
                    onOpenVideo={
                      q.status === 'in_progress'
                        ? () => handleOpenQuietZone(q)
                        : undefined
                    }
                    onReplay={
                      q.status === 'completed'
                        ? () => dispatch({ type: 'START_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onPause={
                      q.status === 'in_progress' && !q.activeTaskState?.isPaused
                        ? (elapsed) => dispatch({ type: 'PAUSE_TASK', payload: { questId: q.id, elapsedSeconds: elapsed } })
                        : undefined
                    }
                    onResume={
                      q.status === 'in_progress' && q.activeTaskState?.isPaused
                        ? () => dispatch({ type: 'RESUME_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onResetTimer={
                      q.status === 'in_progress'
                        ? () => dispatch({ type: 'RESET_TASK_TIMER', payload: { questId: q.id } })
                        : undefined
                    }
                    onAbandon={
                      q.status === 'in_progress'
                        ? () => dispatch({ type: 'ABANDON_TASK', payload: { questId: q.id } })
                        : undefined
                    }
                    onComplete={
                      q.status === 'in_progress'
                        ? () => {
                            if (q.source === 'daily') {
                              dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: q.id } });
                            } else if (q.packageId) {
                              dispatch({
                                type: 'COMPLETE_PACKAGE_TASK',
                                payload: { packageId: q.packageId, taskId: q.id },
                              });
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Filter Sheet Modal */}
      {isFilterSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full bg-[#161B40] border-t border-slate-700 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <h3 className="font-bold text-base text-slate-100">Bộ Lọc Nhiệm Vụ</h3>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="text-xs text-violet-400 font-bold"
              >
                Xong
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Danh mục:</label>
              <select
                value={filterCategory}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs text-slate-200"
              >
                <option value="all">Tất cả danh mục ({rawQuests.length})</option>
                {availableCategories.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400">Độ khó:</label>
              <select
                value={filterDifficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs text-slate-200"
              >
                <option value="all">Tất cả độ khó</option>
                {availableDifficulties.length > 0 ? (
                  availableDifficulties.map(d => (
                    <option key={d.name} value={d.name}>
                      {d.label} ({d.count})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Easy">Easy (10 XP)</option>
                    <option value="Normal">Normal (25 XP)</option>
                    <option value="Hard">Hard (50 XP)</option>
                    <option value="Boss">Boss (100 XP)</option>
                  </>
                )}
              </select>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Áp Dụng Bộ Lọc
            </Button>
          </div>
        </div>
      )}

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
              if (selectedQuest && !isTransitioning) {
                const target = selectedQuest;
                setSelectedQuest(null);
                handleStartQuestWithVideo(target);
              }
            }}
            onOpenVideo={() => {
              if (selectedQuest) {
                handleOpenQuietZone(selectedQuest);
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
                if (selectedQuest.source === 'daily') {
                  dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: selectedQuest.id } });
                } else if (selectedQuest.packageId) {
                  dispatch({
                    type: 'COMPLETE_PACKAGE_TASK',
                    payload: { packageId: selectedQuest.packageId, taskId: selectedQuest.id },
                  });
                }
              }
            }}
          />
        );
      })()}
      {/* Video Overlay with Mosaic Transition */}
      {videoQuest && (
        <QuestVideoOverlay
          quest={videoQuest}
          isCompleted={state.completions.some(c => c.questId === videoQuest.id)}
          onComplete={() => {
            if (videoQuest.source === 'daily') {
              dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: videoQuest.id } });
            } else if (videoQuest.packageId) {
              dispatch({
                type: 'COMPLETE_PACKAGE_TASK',
                payload: { packageId: videoQuest.packageId, taskId: videoQuest.id },
              });
            } else {
              const isDaily = DAILY_QUESTS.some(d => d.id === videoQuest.id);
              if (isDaily) {
                dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: videoQuest.id } });
              } else {
                let foundInPkg = false;
                for (const pkg of QUEST_PACKAGES) {
                  const t = pkg.tasks.find(tk => tk.id === videoQuest.id);
                  if (t) {
                    dispatch({ type: 'COMPLETE_PACKAGE_TASK', payload: { packageId: pkg.id, taskId: t.id } });
                    foundInPkg = true;
                    break;
                  }
                }
                if (!foundInPkg) {
                  dispatch({ type: 'COMPLETE_DAILY_QUEST', payload: { questId: videoQuest.id } });
                }
              }
            }
          }}
          onClose={handleCloseVideo}
        />
      )}
    </div>
  );
};
