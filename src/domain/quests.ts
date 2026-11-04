import { CompletionEntry, GameState, NotificationItem } from '../store/types.js';
import { DAILY_QUESTS } from '../data/dailyQuests.js';
import { getDateKey } from './dates.js';

export function getDailyQuestDedupKey(questId: string, dateKey: string): string {
  return `${questId}@${dateKey}`;
}

export function isDailyQuestCompleted(
  completions: CompletionEntry[],
  questId: string,
  dateKey: string
): boolean {
  const targetKey = getDailyQuestDedupKey(questId, dateKey);
  return completions.some(c => c.key === targetKey);
}

export interface CompleteDailyQuestResult {
  nextCompletions: CompletionEntry[];
  addedEntry: CompletionEntry | null;
  notification: NotificationItem | null;
  isReplay?: boolean;
}

export function completeDailyQuest(
  state: GameState,
  questId: string,
  now: Date = new Date()
): CompleteDailyQuestResult {
  const dateKey = getDateKey(now);
  const targetKey = getDailyQuestDedupKey(questId, dateKey);

  // Check anti-duplication / Replay mode
  if (state.completions.some(c => c.key === targetKey)) {
    const quest = DAILY_QUESTS.find(q => q.id === questId);
    return {
      nextCompletions: state.completions,
      addedEntry: null,
      isReplay: true,
      notification: quest
        ? {
            id: `notif-replay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'quest_completed',
            title: 'Hoàn Thành Luyện Tập!',
            message: `Bạn đã làm lại thành công nhiệm vụ "${quest.name}". (Chế độ rèn luyện: 0 XP)`,
            xpEarned: 0,
          }
        : null,
    };
  }


  const quest = DAILY_QUESTS.find(q => q.id === questId);
  if (!quest) {
    return {
      nextCompletions: state.completions,
      addedEntry: null,
      notification: null,
    };
  }

  const activeTask = state.activeTasks[questId];
  let onTime = true;
  if (activeTask?.dueAt) {
    onTime = new Date(activeTask.dueAt).getTime() >= now.getTime();
  }

  const newEntry: CompletionEntry = {
    key: targetKey,
    kind: 'daily',
    questId,
    dateKey,
    completedAt: now.toISOString(),
    xp: quest.xp,
    category: quest.category,
    difficulty: quest.difficulty,
    locationId: quest.locationId,
    dueAt: activeTask?.dueAt,
    onTime,
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: 'quest_completed',
    title: 'Nhiệm Vụ Hoàn Thành!',
    message: `Bạn đã hoàn thành "${quest.name}" và nhận được +${quest.xp} XP.`,
    xpEarned: quest.xp,
  };

  return {
    nextCompletions: [...state.completions, newEntry],
    addedEntry: newEntry,
    notification,
  };
}

export interface SortableQuestItem {
  id: string;
  name: string;
  status: 'todo' | 'in_progress' | 'completed' | 'locked' | 'overdue' | string;
  isBoss?: boolean;
  category?: string;
  difficulty?: any;
  [key: string]: any;
}

/**
 * Sorts quest lists deterministically by completion status:
 * - Incomplete quests (in_progress, todo, locked, overdue) ALWAYS appear first
 * - Completed quests ALWAYS appear at the bottom
 * - Within incomplete group: in_progress > todo > locked > overdue
 */
export function sortQuestsByCompletionStatus<T extends SortableQuestItem>(quests: T[]): T[] {
  const getStatusWeight = (status: string): number => {
    switch (status) {
      case 'in_progress':
        return 1; // Highest priority: currently underway
      case 'todo':
        return 2; // Ready to attempt
      case 'locked':
        return 3; // Blocked or locked
      case 'overdue':
        return 4; // Overdue
      case 'completed':
        return 99; // Finished - always at the very bottom
      default:
        return 10;
    }
  };

  return [...quests].sort((a, b) => {
    const isCompletedA = a.status === 'completed';
    const isCompletedB = b.status === 'completed';

    // 1. Quests not completed ALWAYS appear before completed quests
    if (!isCompletedA && isCompletedB) return -1;
    if (isCompletedA && !isCompletedB) return 1;

    // 2. Within the same completion status, prioritize by status weight
    const weightDiff = getStatusWeight(a.status) - getStatusWeight(b.status);
    if (weightDiff !== 0) return weightDiff;

    // 3. Boss quests prioritized if in the same status
    if (a.isBoss && !b.isBoss) return -1;
    if (!a.isBoss && b.isBoss) return 1;

    // 4. Stable secondary sort by name
    return a.name.localeCompare(b.name, 'vi');
  });
}

/**
 * Flexible matching for quest categories.
 * Handles exact matches, case-insensitivity, substring matches,
 * and semantic aliases between Daily quests (e.g. 'Academic', 'Health', 'Daily Life')
 * and Package tasks (e.g. 'Learning & Knowledge', 'Health & Habits', 'Lifestyle & Balance').
 */
export function matchesCategory(itemCategory: string | undefined, filterCategory: string): boolean {
  if (!filterCategory || filterCategory.toLowerCase() === 'all') return true;
  if (!itemCategory) return false;

  const item = itemCategory.trim().toLowerCase();
  const filter = filterCategory.trim().toLowerCase();

  // 1. Exact match
  if (item === filter) return true;

  // 2. Substring match in either direction
  if (item.includes(filter) || filter.includes(item)) return true;

  // 3. Normalized slug matching (e.g. "code & technology" vs "code & technology", "productivity & planning" vs "productivity")
  const normalize = (str: string) => str.replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
  if (normalize(item).includes(normalize(filter)) || normalize(filter).includes(normalize(item))) {
    return true;
  }

  // 4. Semantic group synonyms:
  // Academic / Study / University / Learning
  const academicTerms = ['academic', 'learning', 'knowledge', 'university', 'học tập', 'kiến thức'];
  if (academicTerms.some(t => item.includes(t)) && academicTerms.some(t => filter.includes(t))) {
    return true;
  }

  // Daily Life / Lifestyle / Balance
  const lifeTerms = ['daily life', 'lifestyle', 'balance', 'đời sống', 'sinh hoạt'];
  if (lifeTerms.some(t => item.includes(t)) && lifeTerms.some(t => filter.includes(t))) {
    return true;
  }

  // Health / Habits
  const healthTerms = ['health', 'habits', 'sức khỏe', 'thói quen'];
  if (healthTerms.some(t => item.includes(t)) && healthTerms.some(t => filter.includes(t))) {
    return true;
  }

  return false;
}

