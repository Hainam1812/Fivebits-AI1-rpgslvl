import test from 'node:test';
import assert from 'node:assert/strict';

import { getDateKey, getYesterdayKey, getDaysDifference } from './dates.ts';
import { calculateLevelFromXp, getLevelProgress } from './progression.ts';
import { calculateStreak } from './streak.ts';
import { completeDailyQuest, getDailyQuestDedupKey, sortQuestsByCompletionStatus } from './quests.ts';
import { completePackageTask, canAttemptTask, isTaskCompleted } from './packages.ts';
import { calculateCart, calculateComboPrice } from './cart.ts';
import { evaluateAchievements } from './achievements.ts';
import { gradeExamSession, calculateExamHearts, deleteExamSchedule } from './exams.ts';
import { validateCharacterName, sanitizeCharacterInput } from './character.ts';
import { addCourse, removeCourse, generateCourseCells, renderGrid, findConflictingCourses, isSlotOverlapping } from './timetable.ts';
import {
  Assignment,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  toggleAssignment,
  sortAssignmentsByDeadline,
  formatDeadlineDisplay,
} from './assignments.ts';
import { GameState, CourseSlot } from '../store/types.ts';
import { QUEST_PACKAGES } from '../data/questPackages.ts';
import { EXAMS } from '../data/exams/index.ts';
import { gameReducer } from '../store/reducer.ts';

function createMockState(partial: Partial<GameState> = {}): GameState {
  return {
    schemaVersion: 1,
    profile: {
      nickname: 'TestUser',
      characterId: 'hero',
      createdAt: '2026-10-01T00:00:00.000Z',
      motionPreference: 'system',
    },
    completions: [],
    activeTasks: {},
    abandonedPackages: [],
    unlockedPackages: [],
    unlockedAchievements: [],
    equippedCosmetics: {},
    equippedGear: {},
    seenCosmetics: [],
    seenGear: [],
    customGearMeta: [],
    examHistory: [],
    personalExams: [],
    timetable: [],
    assignments: [],
    lastLocationId: 'dorm',
    cart: [],
    appliedCoupon: null,
    orders: [],
    contactMessages: [],
    ...partial,
  };
}


test('Date domain handles local date keys properly', () => {
  const testDate = new Date(2026, 9, 18, 0, 5, 0); // Oct 18 2026 00:05 local
  const key = getDateKey(testDate);
  assert.equal(key, '2026-10-18');

  const yest = getYesterdayKey(key);
  assert.equal(yest, '2026-10-17');

  assert.equal(getDaysDifference(key, yest), 1);
});

test('Progression formula 50 * L * (L - 1) calculates level correctly', () => {
  // L1: 0..99
  assert.equal(calculateLevelFromXp(0), 1);
  assert.equal(calculateLevelFromXp(99), 1);
  // L2: 100..299 (50 * 2 * 1 = 100)
  assert.equal(calculateLevelFromXp(100), 2);
  assert.equal(calculateLevelFromXp(299), 2);
  // L3: 300..599 (50 * 3 * 2 = 300)
  assert.equal(calculateLevelFromXp(300), 3);
  // L4: 600..999 (50 * 4 * 3 = 600)
  assert.equal(calculateLevelFromXp(600), 4);
  // L5: 1000.. (50 * 5 * 4 = 1000)
  assert.equal(calculateLevelFromXp(1000), 5);

  const prog = getLevelProgress(150);
  assert.equal(prog.level, 2);
  assert.equal(prog.xpInCurrentLevel, 50); // 150 - 100
  assert.equal(prog.xpRequiredForNextLevel, 200); // 300 - 100
  assert.equal(prog.progressPercent, 25);
});

test('Daily Quest deduplication prevents duplicate XP', () => {
  const state = createMockState();
  const now = new Date(2026, 9, 18, 10, 0, 0);

  // First completion
  const res1 = completeDailyQuest(state, 'daily-morning-spawn', now);
  assert.equal(res1.nextCompletions.length, 1);
  assert.equal(res1.addedEntry?.xp, 10);
  assert.ok(res1.notification);

  // Second completion on same day (double click / replay)
  const stateWith1 = { ...state, completions: res1.nextCompletions };
  const res2 = completeDailyQuest(stateWith1, 'daily-morning-spawn', now);
  assert.equal(res2.nextCompletions.length, 1);
  assert.equal(res2.addedEntry, null);
  assert.equal(res2.notification?.xpEarned, 0);

  // Next day completion should work
  const tomorrow = new Date(2026, 9, 19, 10, 0, 0);
  const res3 = completeDailyQuest(stateWith1, 'daily-morning-spawn', tomorrow);
  assert.equal(res3.nextCompletions.length, 2);
  assert.equal(res3.addedEntry?.dateKey, '2026-10-19');
});

test('Streak calculation works across multiple days and skips correctly', () => {
  const today = '2026-10-18';
  const completions = [
    {
      key: 'daily-morning-spawn@2026-10-16',
      kind: 'daily' as const,
      questId: 'daily-morning-spawn',
      dateKey: '2026-10-16',
      completedAt: '2026-10-16T08:00:00Z',
      xp: 10,
      category: 'Daily Life',
      difficulty: 'Easy' as const,
    },
    {
      key: 'daily-morning-spawn@2026-10-17',
      kind: 'daily' as const,
      questId: 'daily-morning-spawn',
      dateKey: '2026-10-17',
      completedAt: '2026-10-17T08:00:00Z',
      xp: 10,
      category: 'Daily Life',
      difficulty: 'Easy' as const,
    },
    // Multiple quests on same day 2026-10-17 only counts as 1 day
    {
      key: 'daily-academic-grind@2026-10-17',
      kind: 'daily' as const,
      questId: 'daily-academic-grind',
      dateKey: '2026-10-17',
      completedAt: '2026-10-17T09:00:00Z',
      xp: 25,
      category: 'Academic',
      difficulty: 'Normal' as const,
    },
  ];

  // If today has no completion yet, streak is preserved from yesterday (streak = 2)
  const resBeforeToday = calculateStreak(completions, today);
  assert.equal(resBeforeToday.currentStreak, 2);
  assert.equal(resBeforeToday.hasCompletedToday, false);

  // Now complete today
  completions.push({
    key: 'daily-morning-spawn@2026-10-18',
    kind: 'daily' as const,
    questId: 'daily-morning-spawn',
    dateKey: '2026-10-18',
    completedAt: '2026-10-18T08:00:00Z',
    xp: 10,
    category: 'Daily Life',
    difficulty: 'Easy' as const,
  });

  const resAfterToday = calculateStreak(completions, today);
  assert.equal(resAfterToday.currentStreak, 3);
  assert.equal(resAfterToday.longestStreak, 3);
  assert.equal(resAfterToday.hasCompletedToday, true);
});

test('Package tasks: trial is free, Boss requires prior tasks, clear bonus awarded', () => {
  const pythonPkg = QUEST_PACKAGES.find(p => p.id === 'pkg-master-python')!;
  const state = createMockState({ unlockedPackages: [] }); // User does not own package

  // First task (trial) is allowed
  const trialCheck = canAttemptTask(state, pythonPkg, pythonPkg.tasks[0]);
  assert.equal(trialCheck.canAttempt, true);

  // Second task is blocked because package is locked
  const secondCheck = canAttemptTask(state, pythonPkg, pythonPkg.tasks[1]);
  assert.equal(secondCheck.canAttempt, false);

  // Now user unlocks package
  const stateUnlocked = createMockState({ unlockedPackages: ['pkg-master-python'] });

  // Boss task (last) is blocked because preceding tasks are not done yet
  const bossTask = pythonPkg.tasks[pythonPkg.tasks.length - 1];
  const bossCheck = canAttemptTask(stateUnlocked, pythonPkg, bossTask);
  assert.equal(bossCheck.canAttempt, false);

  // Complete Boss task after preceding tasks done
  const precedingCompletions = pythonPkg.tasks.slice(0, -1).map(t => ({
    key: t.id,
    kind: 'task' as const,
    questId: t.id,
    packageId: pythonPkg.id,
    dateKey: '2026-10-18',
    completedAt: '2026-10-18T08:00:00Z',
    xp: t.xp,
    category: t.category,
    difficulty: t.difficulty,
  }));

  const stateReadyForBoss = createMockState({
    unlockedPackages: ['pkg-master-python'],
    completions: precedingCompletions,
  });

  const bossReadyCheck = canAttemptTask(stateReadyForBoss, pythonPkg, bossTask);
  assert.equal(bossReadyCheck.canAttempt, true);

  // Complete Boss
  const bossRes = completePackageTask(stateReadyForBoss, pythonPkg.id, bossTask.id);
  // Should include boss task + package clear bonus
  assert.equal(bossRes.addedEntries.length, 2);
  const clearEntry = bossRes.addedEntries.find(e => e.kind === 'clear');
  assert.ok(clearEntry);
  assert.equal(clearEntry?.xp, pythonPkg.clearBonusXp); // 200 XP bonus
});

test('Cart calculations: combo pricing and coupons LEVELUP10 & FRESHMAN', () => {
  // If user owns 0 packages, combo can be purchased (7 unowned >= 3)
  const { canBuy } = calculateComboPrice([]);
  assert.equal(canBuy, true);

  // Cart with single package 15.000đ + coupon LEVELUP10 (10% off)
  const cart1 = calculateCart(['pkg-master-python'], [], 'LEVELUP10');
  assert.equal(cart1.subtotal, 15000);
  assert.equal(cart1.discount, 1500);
  assert.equal(cart1.total, 13500);

  // Coupon FRESHMAN (5.000đ off for orders >= 20.000đ)
  const cart2 = calculateCart(['pkg-master-python'], [], 'FRESHMAN');
  assert.equal(cart2.isCouponValid, false); // 15.000 < 20.000

  const cart3 = calculateCart(['pkg-master-python', 'pkg-gym-rat'], [], 'FRESHMAN');
  // 15.000 + 10.000 = 25.000 >= 20.000
  assert.equal(cart3.subtotal, 25000);
  assert.equal(cart3.discount, 5000);
  assert.equal(cart3.total, 20000);
});

test('Exam grading and hearts calculation', () => {
  // 10 questions, 70% pass threshold -> 4 hearts
  assert.equal(calculateExamHearts(10, 70), 4);

  const pythonExam = EXAMS.find(e => e.id === 'exam-python')!;
  const testQuestions = pythonExam.questions.slice(0, 10);

  // User answers all correctly
  const userAnswers: Record<string, number> = {};
  for (const q of testQuestions) {
    userAnswers[q.id] = q.correctIndex;
  }

  const state = createMockState();
  const result = gradeExamSession(state, pythonExam, userAnswers, testQuestions);

  assert.equal(result.historyEntry.percentage, 100);
  assert.equal(result.historyEntry.passed, true);
  assert.equal(result.historyEntry.grade, 'S');
  // Should award pass XP (50) and perfect XP (25)
  assert.equal(result.addedCompletions.length, 2);
});

test('Wardrobe: UNEQUIP_ALL_GEAR and UNEQUIP_EVERYTHING clear all gear and accessories', () => {
  const initial = createMockState({
    profile: {
      nickname: 'Hero',
      characterId: 'hero',
      createdAt: '2026-10-01T00:00:00.000Z',
      motionPreference: 'system',
    },
    equippedGear: {
      hero: {
        head: 'gear-headband-red',
        body: 'gear-hoodie-pixel',
      },
    },
    equippedCustomGearIds: ['custom-hat-1', 'custom-glasses-2'],
    equippedCosmetics: {
      backdrop: 'cos-bg-starry',
      aura: 'cos-aura-fire',
    },
  });

  // Test UNEQUIP_ALL_GEAR
  const afterGearUnequip = gameReducer(initial, {
    type: 'UNEQUIP_ALL_GEAR',
    payload: { characterId: 'hero' },
  }).state;
  assert.deepEqual(afterGearUnequip.equippedGear.hero, undefined);
  assert.deepEqual(afterGearUnequip.equippedCustomGearIds, []);
  assert.equal(afterGearUnequip.equippedCosmetics.backdrop, 'cos-bg-starry');

  // Test UNEQUIP_EVERYTHING
  const afterEverythingUnequip = gameReducer(initial, {
    type: 'UNEQUIP_EVERYTHING',
    payload: { characterId: 'hero' },
  }).state;
  assert.deepEqual(afterEverythingUnequip.equippedGear, {});
  assert.deepEqual(afterEverythingUnequip.equippedCustomGearIds, []);
  assert.deepEqual(afterEverythingUnequip.equippedCosmetics, {});
});

test('Custom GIFs: CLEAR_ALL_CUSTOM_GIFS and REMOVE_CUSTOM_CHARACTER work properly', () => {
  const initial = createMockState({
    profile: {
      nickname: 'CustomGuy',
      characterId: 'custom-char-123',
      createdAt: '2026-10-01T00:00:00.000Z',
      motionPreference: 'system',
    },
    customCharacters: [
      {
        id: 'custom-char-123',
        displayName: 'Custom Hero',
        tagline: 'Pixel fan',
        idleSrc: 'blob:http://localhost/abc',
        pixelArt: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    customGearMeta: [
      {
        id: 'custom-gear-456',
        name: 'Cool Hat',
        slot: 'head',
        imageBlobUrl: 'blob:http://localhost/def',
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        flipX: false,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    equippedCustomGearIds: ['custom-gear-456'],
  });

  // Test removing the active custom character
  const afterRemoveChar = gameReducer(initial, {
    type: 'REMOVE_CUSTOM_CHARACTER',
    payload: { id: 'custom-char-123' },
  }).state;
  assert.equal(afterRemoveChar.customCharacters?.length, 0);
  assert.equal(afterRemoveChar.profile.characterId, 'hero');

  // Test CLEAR_ALL_CUSTOM_GIFS
  const afterClearAll = gameReducer(initial, {
    type: 'CLEAR_ALL_CUSTOM_GIFS',
  }).state;
  assert.deepEqual(afterClearAll.customCharacters, []);
  assert.deepEqual(afterClearAll.customGearMeta, []);
  assert.deepEqual(afterClearAll.equippedCustomGearIds, []);
  assert.equal(afterClearAll.profile.characterId, 'hero');
});

test('Character naming constraints: not empty, strips leading and trailing spaces, enforces 2-20 length', () => {
  // Empty or whitespace-only is rejected
  const emptyRes = validateCharacterName('');
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.error?.includes('không được để trống'));

  const spacesRes = validateCharacterName('     ');
  assert.equal(spacesRes.isValid, false);
  assert.ok(spacesRes.error?.includes('không được để trống'));

  // Leading and trailing spaces are stripped
  const trimmedRes = validateCharacterName('   Jin-Woo   ');
  assert.equal(trimmedRes.isValid, true);
  assert.equal(trimmedRes.cleanName, 'Jin-Woo');

  // Input sanitization strips leading space immediately
  assert.equal(sanitizeCharacterInput('   Nam'), 'Nam');
  assert.equal(sanitizeCharacterInput('Minh  '), 'Minh  ');

  // Length constraints (2 to 20)
  assert.equal(validateCharacterName('A').isValid, false);
  assert.equal(validateCharacterName('Ab').isValid, true);
  assert.equal(validateCharacterName('a'.repeat(20)).isValid, true);
  assert.equal(validateCharacterName('a'.repeat(21)).isValid, false);
});

test('Task timers: start from 0, independent timers, pause and resume, reset timer, and RESET_DATA', () => {
  const initial = createMockState();
  const startTime = new Date(2026, 9, 20, 10, 0, 0);

  // 1. START_TASK: starts timer from 0 with isPaused = false
  const state1 = gameReducer(initial, {
    type: 'START_TASK',
    payload: { questId: 'quest-morning' },
  }, startTime).state;

  const task1 = state1.activeTasks['quest-morning'];
  assert.ok(task1);
  assert.equal(task1.elapsedSeconds, 0);
  assert.equal(task1.isPaused, false);
  assert.equal(task1.startedAt, startTime.toISOString());

  // 2. Start a second independent task
  const state2 = gameReducer(state1, {
    type: 'START_TASK',
    payload: { questId: 'quest-gym' },
  }, startTime).state;

  assert.ok(state2.activeTasks['quest-gym']);
  assert.equal(state2.activeTasks['quest-gym'].elapsedSeconds, 0);

  // 3. PAUSE_TASK: after 120 seconds, pause quest-morning
  const pauseTime = new Date(2026, 9, 20, 10, 2, 0); // 120s later
  const state3 = gameReducer(state2, {
    type: 'PAUSE_TASK',
    payload: { questId: 'quest-morning' },
  }, pauseTime).state;

  // quest-morning is paused with 120 seconds elapsed
  assert.equal(state3.activeTasks['quest-morning'].isPaused, true);
  assert.equal(state3.activeTasks['quest-morning'].elapsedSeconds, 120);

  // quest-gym is NOT paused (independent timer!)
  assert.equal(state3.activeTasks['quest-gym'].isPaused, false);

  // 4. RESUME_TASK: resume quest-morning
  const resumeTime = new Date(2026, 9, 20, 10, 5, 0);
  const state4 = gameReducer(state3, {
    type: 'RESUME_TASK',
    payload: { questId: 'quest-morning' },
  }, resumeTime).state;

  assert.equal(state4.activeTasks['quest-morning'].isPaused, false);
  assert.equal(state4.activeTasks['quest-morning'].elapsedSeconds, 120);
  assert.equal(state4.activeTasks['quest-morning'].lastResumedAt, resumeTime.toISOString());

  // 5. RESET_TASK_TIMER: restart quest-morning timer to 0
  const state5 = gameReducer(state4, {
    type: 'RESET_TASK_TIMER',
    payload: { questId: 'quest-morning' },
  }, resumeTime).state;

  assert.equal(state5.activeTasks['quest-morning'].elapsedSeconds, 0);
  assert.equal(state5.activeTasks['quest-morning'].isPaused, false);

  // 6. ABANDON_TASK: removes task from active tasks completely
  const state6 = gameReducer(state5, {
    type: 'ABANDON_TASK',
    payload: { questId: 'quest-morning' },
  }, resumeTime).state;

  assert.equal(state6.activeTasks['quest-morning'], undefined);
  assert.ok(state6.activeTasks['quest-gym']); // other task remains intact

  // 7. Character alignment & zoom transform
  const stateTransformed = gameReducer(state6, {
    type: 'UPDATE_CHARACTER_TRANSFORM',
    payload: { scale: 1.35, offsetX: 15, offsetY: -10 },
  }).state;

  assert.equal(stateTransformed.profile.characterScale, 1.35);
  assert.equal(stateTransformed.profile.characterOffsetX, 15);
  assert.equal(stateTransformed.profile.characterOffsetY, -10);

  const stateResetTransform = gameReducer(stateTransformed, {
    type: 'RESET_CHARACTER_TRANSFORM',
  }).state;

  assert.equal(stateResetTransform.profile.characterScale, 1);
  assert.equal(stateResetTransform.profile.characterOffsetX, 0);
  assert.equal(stateResetTransform.profile.characterOffsetY, 0);

  // 8. RESET_DATA: resets all game data back to default
  const stateReset = gameReducer(stateResetTransform, {
    type: 'RESET_DATA',
  }).state;

  assert.deepEqual(stateReset.activeTasks, {});
  assert.deepEqual(stateReset.completions, []);
  assert.equal(stateReset.profile.nickname, 'TestUser');
});

test('Exam deletion logic: deleteExamSchedule and REMOVE_PERSONAL_EXAM remove exam cleanly', () => {
  const initialGoals = [
    { id: 'exam-1', title: 'Toán Cao Cấp 1', examDate: '2026-11-05', createdAt: '2026-10-01' },
    { id: 'exam-2', title: 'Python Cơ Bản', examDate: '2026-11-12', createdAt: '2026-10-02' },
    { id: 'exam-3', title: 'Triết Học Mác - Lênin', examDate: '2026-11-20', createdAt: '2026-10-03' },
  ];

  // Direct helper test
  const afterDelete = deleteExamSchedule(initialGoals, 'exam-2');
  assert.equal(afterDelete.length, 2);
  assert.equal(afterDelete.some(g => g.id === 'exam-2'), false);
  assert.equal(afterDelete[0].id, 'exam-1');
  assert.equal(afterDelete[1].id, 'exam-3');

  // Reducer integration test
  const stateWithExams = createMockState({ personalExams: initialGoals });
  const reducedState = gameReducer(stateWithExams, {
    type: 'REMOVE_PERSONAL_EXAM',
    payload: { id: 'exam-1' },
  }).state;

  assert.equal(reducedState.personalExams.length, 2);
  assert.equal(reducedState.personalExams.some(g => g.id === 'exam-1'), false);
  assert.equal(reducedState.personalExams[0].id, 'exam-2');
});

test('TimeTable builder: addCourse, removeCourse, and multiple slots for same course', () => {
  let list: CourseSlot[] = [];

  // Slot 1: IT002 on Monday period 1-3
  list = addCourse(list, {
    name: 'Cấu Trúc Dữ Liệu',
    code: 'IT002',
    day: 'mon',
    startPeriod: 1,
    endPeriod: 3,
    room: 'A1-204',
    lecturer: 'TS. Nguyễn Văn A',
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].code, 'IT002');
  assert.equal(list[0].startPeriod, 1);
  assert.equal(list[0].endPeriod, 3);

  // Slot 2: Same course IT002 on Wednesday period 4-5 (multi-slot requirement!)
  list = addCourse(list, {
    name: 'Cấu Trúc Dữ Liệu',
    code: 'IT002',
    day: 'wed',
    startPeriod: 4,
    endPeriod: 5,
    room: 'B2-Lab',
    lecturer: 'TS. Nguyễn Văn A',
  });
  assert.equal(list.length, 2);
  assert.equal(list.filter(c => c.code === 'IT002').length, 2);

  // Delete slot 1
  const slot1Id = list[0].id;
  list = removeCourse(list, slot1Id);
  assert.equal(list.length, 1);
  assert.equal(list[0].day, 'wed');
});

test('TimeTable overlap prevention: findConflictingCourses, isSlotOverlapping, and addCourse with preventOverlap', () => {
  let list: CourseSlot[] = [];

  // Add initial course: Monday periods 3 to 5
  list = addCourse(list, {
    name: 'Giải Tích 1',
    code: 'MATH101',
    day: 'mon',
    startPeriod: 3,
    endPeriod: 5,
    room: 'A1-101',
    lecturer: 'Thầy Hùng',
  });
  assert.equal(list.length, 1);

  // 1. Candidate on Monday period 1-2 (before MATH101): NO overlap
  assert.equal(isSlotOverlapping(list, 'mon', 1, 2), false);
  assert.equal(findConflictingCourses(list, 'mon', 1, 2).length, 0);

  // 2. Candidate on Monday period 6-8 (after MATH101): NO overlap
  assert.equal(isSlotOverlapping(list, 'mon', 6, 8), false);

  // 3. Candidate on Tuesday period 3-5 (different day): NO overlap
  assert.equal(isSlotOverlapping(list, 'tue', 3, 5), false);

  // 4. Overlap cases on Monday:
  // - Overlaps end of candidate (period 1 to 3)
  assert.equal(isSlotOverlapping(list, 'mon', 1, 3), true);
  // - Inside existing slot (period 4 to 4)
  assert.equal(isSlotOverlapping(list, 'mon', 4, 4), true);
  // - Enclosing existing slot (period 2 to 6)
  assert.equal(isSlotOverlapping(list, 'mon', 2, 6), true);
  // - Exact match (period 3 to 5)
  assert.equal(isSlotOverlapping(list, 'mon', 3, 5), true);
  // - Overlaps start of candidate (period 5 to 7)
  assert.equal(isSlotOverlapping(list, 'mon', 5, 7), true);

  const conflicts = findConflictingCourses(list, 'mon', 2, 4);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].code, 'MATH101');

  // 5. addCourse with preventOverlap: true rejects overlapping addition
  const listAfterOverlapAttempt = addCourse(
    list,
    {
      name: 'Toán Rời Rạc',
      code: 'MATH205',
      day: 'mon',
      startPeriod: 4,
      endPeriod: 6,
      room: 'B2-202',
      lecturer: 'Cô Lan',
    },
    { preventOverlap: true }
  );
  // Length should remain 1 (rejected)
  assert.equal(listAfterOverlapAttempt.length, 1);
  assert.equal(listAfterOverlapAttempt[0].code, 'MATH101');

  // 6. Non-overlapping course succeeds
  const listAfterValidAdd = addCourse(
    list,
    {
      name: 'Toán Rời Rạc',
      code: 'MATH205',
      day: 'mon',
      startPeriod: 7,
      endPeriod: 9,
      room: 'B2-202',
      lecturer: 'Cô Lan',
    },
    { preventOverlap: true }
  );
  assert.equal(listAfterValidAdd.length, 2);
  assert.equal(listAfterValidAdd[1].code, 'MATH205');
});

test('TimeTable grid: merges consecutive periods into rowSpan blocks and marks covered cells', () => {
  const testCourses: CourseSlot[] = [
    {
      id: 'course-calc',
      name: 'Giải Tích 1',
      code: 'MATH101',
      day: 'mon',
      startPeriod: 3,
      endPeriod: 5, // Periods 3, 4, 5 (span = 3)
      room: 'C1-302',
      lecturer: 'PGS. Trần Mai',
    },
  ];

  const mondayCells = generateCourseCells(testCourses, 'mon');

  // Period 1 and 2: empty
  assert.equal(mondayCells.get(1)?.type, 'empty');
  assert.equal(mondayCells.get(2)?.type, 'empty');

  // Period 3: start of course with rowSpan = 3
  const p3 = mondayCells.get(3);
  assert.equal(p3?.type, 'course');
  assert.equal(p3?.rowSpan, 3);
  assert.equal(p3?.course?.code, 'MATH101');

  // Period 4 and 5: covered by the span of period 3
  assert.equal(mondayCells.get(4)?.type, 'covered');
  assert.equal(mondayCells.get(5)?.type, 'covered');

  // Period 6: empty
  assert.equal(mondayCells.get(6)?.type, 'empty');

  // Full 2D Grid rendering
  const grid = renderGrid(testCourses);
  assert.equal(grid.length, 12); // 12 periods
  assert.equal(grid[2].period, 3); // index 2 is period 3
  assert.equal(grid[2].cells.mon.type, 'course');
  assert.equal(grid[2].cells.mon.rowSpan, 3);
  assert.equal(grid[3].cells.mon.type, 'covered');
  assert.equal(grid[4].cells.mon.type, 'covered');
});

test('RESET_DATA preserves unlockedPackages, orders, cart, cosmetics, and timetable', () => {
  const initialState = createMockState({
    unlockedPackages: ['pkg-first-year', 'pkg-exam-warrior'],
    orders: [
      {
        id: 'ORD-123',
        createdAt: '2026-10-20T10:00:00.000Z',
        items: [{ packageId: 'pkg-first-year', title: 'Năm Nhất Sinh Viên', price: 50000 }],
        subtotal: 50000,
        discount: 0,
        total: 50000,
        paymentMethod: 'bank',
        characterName: 'TestUser',
      },
    ],
    equippedCosmetics: { aura: 'au-gold-radiance' },
    completions: [
      {
        key: 'daily:2026-10-20:daily-morning-spawn',
        questId: 'daily-morning-spawn',
        completedAt: '2026-10-20T08:00:00.000Z',
        xp: 10,
        kind: 'daily',
        dateKey: '2026-10-20',
        category: 'academic',
        difficulty: 'Easy',
      },
    ],
    timetable: [
      {
        id: 'c1',
        name: 'Giải tích',
        code: 'MATH',
        day: 'mon',
        startPeriod: 1,
        endPeriod: 3,
        room: 'A1',
        lecturer: 'Thầy A',
      },
    ],
  });

  const nextState = gameReducer(initialState, { type: 'RESET_DATA' }).state;

  // Progress is reset
  assert.equal(nextState.completions.length, 0);
  assert.deepEqual(nextState.activeTasks, {});

  // Purchased items & permanent inventory are preserved
  assert.deepEqual(nextState.unlockedPackages, ['pkg-first-year', 'pkg-exam-warrior']);
  assert.equal(nextState.orders.length, 1);
  assert.equal(nextState.orders[0].id, 'ORD-123');
  assert.equal(nextState.equippedCosmetics.aura, 'au-gold-radiance');
  assert.equal(nextState.timetable.length, 1);
});

test('Replay completed quest does not grant duplicate XP or duplicate completion records', () => {
  const todayKey = getDateKey(new Date());
  const initialState = createMockState({
    unlockedPackages: ['pkg-first-year'],
    completions: [
      {
        key: getDailyQuestDedupKey('daily-morning-spawn', todayKey),
        questId: 'daily-morning-spawn',
        completedAt: new Date().toISOString(),
        xp: 10,
        kind: 'daily',
        category: 'daily',
        difficulty: 'Easy',
        dateKey: todayKey,
      },
    ],
  });

  // 1. Start replaying daily quest
  const stateStarted = gameReducer(initialState, {
    type: 'START_TASK',
    payload: { questId: 'daily-morning-spawn' },
  }).state;
  assert.equal(stateStarted.activeTasks['daily-morning-spawn']?.isReplay, true);

  // 2. Complete the replaying daily quest
  const stateFinished = gameReducer(stateStarted, {
    type: 'COMPLETE_DAILY_QUEST',
    payload: { questId: 'daily-morning-spawn' },
  }).state;

  // activeTasks is cleared
  assert.equal(stateFinished.activeTasks['daily-morning-spawn'], undefined);
  // completions count does NOT increase (remains 1)
  assert.equal(stateFinished.completions.length, 1);
  // XP does not increase
  const totalXp = stateFinished.completions.reduce((acc, c) => acc + c.xp, 0);
  assert.equal(totalXp, 10);
});

test('Package task replay allows re-attempt without duplicate XP', () => {
  const pkg = QUEST_PACKAGES[0];
  const task = pkg.tasks[0];

  const stateWithCompletion = createMockState({
    unlockedPackages: [pkg.id],
    completions: [
      {
        key: task.id,
        questId: task.id,
        completedAt: '2026-10-20T08:00:00.000Z',
        xp: task.xp,
        kind: 'task',
        category: 'academic',
        difficulty: 'Easy',
        dateKey: '2026-10-20',
        packageId: pkg.id,
      },
    ],
  });

  // Check canAttemptTask on completed task gives canAttempt: true and isReplay: true
  const check = canAttemptTask(stateWithCompletion, pkg, task);
  assert.equal(check.canAttempt, true);
  assert.equal(check.isReplay, true);

  // Complete package task replay
  const res = completePackageTask(stateWithCompletion, pkg.id, task.id);
  assert.equal(res.isReplay, true);
  assert.equal(res.addedEntries.length, 0);
  assert.equal(res.notifications[0]?.xpEarned, 0);
});

test('sortQuestsByCompletionStatus sorts incomplete quests to top and completed to bottom', () => {
  const mixedQuests = [
    { id: '1', name: 'Z-Completed Quest', status: 'completed' },
    { id: '2', name: 'A-Todo Quest', status: 'todo' },
    { id: '3', name: 'B-In-Progress Quest', status: 'in_progress' },
    { id: '4', name: 'C-Another Completed', status: 'completed' },
    { id: '5', name: 'D-Locked Quest', status: 'locked' },
  ];

  const sorted = sortQuestsByCompletionStatus(mixedQuests);

  // Incomplete quests MUST all be before any completed quests
  const firstCompletedIdx = sorted.findIndex(q => q.status === 'completed');
  assert.ok(firstCompletedIdx > 0, 'Completed quests must be after incomplete quests');

  // Verify elements before firstCompletedIdx are NOT completed
  sorted.slice(0, firstCompletedIdx).forEach(q => {
    assert.notEqual(q.status, 'completed');
  });

  // Verify elements starting from firstCompletedIdx ARE completed
  sorted.slice(firstCompletedIdx).forEach(q => {
    assert.equal(q.status, 'completed');
  });

  // Specifically in_progress should be at the very top
  assert.equal(sorted[0].status, 'in_progress');
  assert.equal(sorted[0].id, '3');

  // Next is todo
  assert.equal(sorted[1].status, 'todo');
  assert.equal(sorted[1].id, '2');

  // Next is locked
  assert.equal(sorted[2].status, 'locked');
  assert.equal(sorted[2].id, '5');
});

test('Assignments: sorting by deadline ascending (earliest to latest)', () => {
  const list: Assignment[] = [
    {
      id: 'a3',
      title: 'Đồ án cuối kỳ',
      subject: 'Nhập Môn AI',
      deadline: '2026-11-20T23:59',
      description: 'Mô tả',
      completed: false,
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'a1',
      title: 'Báo cáo Lab 1',
      subject: 'Cấu Trúc Dữ Liệu',
      deadline: '2026-10-30T17:00',
      description: 'Mô tả',
      completed: false,
      createdAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'a2',
      title: 'Bài tập tuần 4',
      subject: 'Giải Tích',
      deadline: '2026-11-05T12:00',
      description: 'Mô tả',
      completed: false,
      createdAt: '2026-10-01T00:00:00Z',
    },
  ];

  const sorted = sortAssignmentsByDeadline(list);
  assert.equal(sorted[0].id, 'a1', 'Earliest deadline (Oct 30) should be first');
  assert.equal(sorted[1].id, 'a2', 'Middle deadline (Nov 05) should be second');
  assert.equal(sorted[2].id, 'a3', 'Latest deadline (Nov 20) should be third');
});

test('Assignments: CRUD functions (add, update, delete, toggle) work accurately', () => {
  let list: Assignment[] = [];

  // Add first assignment
  list = addAssignment(list, {
    title: 'Bài tập Giải tích',
    subject: 'Giải Tích 1',
    deadline: '2026-11-10T23:59',
    description: 'Chương 2 bài 1 đến 5',
    completed: false,
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Bài tập Giải tích');
  assert.ok(list[0].id);

  // Add second assignment with earlier deadline
  list = addAssignment(list, {
    id: 'asg-early',
    title: 'Quiz Python',
    subject: 'Lập trình Python',
    deadline: '2026-11-02T10:00',
    description: 'Trắc nghiệm online',
    completed: false,
  });
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'asg-early', 'Earlier deadline should automatically sort to the top');

  // Toggle completed
  list = toggleAssignment(list, 'asg-early');
  assert.equal(list[0].completed, true);
  list = toggleAssignment(list, 'asg-early');
  assert.equal(list[0].completed, false);

  // Update assignment
  list = updateAssignment(list, {
    ...list[0],
    title: 'Quiz Python Chuyên Sâu',
    deadline: '2026-11-15T10:00', // Pushed later than Nov 10
  });
  assert.equal(list.length, 2);
  assert.equal(list[1].title, 'Quiz Python Chuyên Sâu', 'Updated assignment should re-sort to position 2 due to later deadline');

  // Delete assignment
  list = deleteAssignment(list, 'asg-early');
  assert.equal(list.length, 1);
  assert.equal(list[0].subject, 'Giải Tích 1');
});

test('Assignments: Reducer actions and RESET_DATA preservation', () => {
  const state = createMockState();
  const now = new Date(2026, 9, 20);

  // 1. ADD_ASSIGNMENT
  const { state: state1 } = gameReducer(
    state,
    {
      type: 'ADD_ASSIGNMENT',
      payload: {
        assignment: {
          id: 'asg-state-1',
          title: 'Thuyết trình nhóm',
          subject: 'Kỹ Năng Giao Tiếp',
          deadline: '2026-11-01T08:00',
          description: 'Slide 10 trang',
          completed: false,
        },
      },
    },
    now
  );
  assert.equal(state1.assignments?.length, 1);
  assert.equal(state1.assignments?.[0].title, 'Thuyết trình nhóm');

  // 2. TOGGLE_ASSIGNMENT
  const { state: state2 } = gameReducer(
    state1,
    {
      type: 'TOGGLE_ASSIGNMENT',
      payload: { id: 'asg-state-1' },
    },
    now
  );
  assert.equal(state2.assignments?.[0].completed, true);

  // 3. RESET_DATA preserves assignments
  const { state: resetState } = gameReducer(state2, { type: 'RESET_DATA' }, now);
  assert.equal(resetState.assignments?.length, 1);
  assert.equal(resetState.assignments?.[0].id, 'asg-state-1');
  assert.equal(resetState.assignments?.[0].completed, true);

  // 4. DELETE_ASSIGNMENT
  const { state: deletedState } = gameReducer(
    resetState,
    {
      type: 'DELETE_ASSIGNMENT',
      payload: { id: 'asg-state-1' },
    },
    now
  );
  assert.equal(deletedState.assignments?.length, 0);
});

test('Character creation: CustomCharacterDef supports description and persists through state', () => {
  const state = createMockState();

  const customChar = {
    id: 'char-test-bio',
    displayName: 'Thợ Săn IT',
    tagline: 'Cày đề án thâu đêm',
    description: 'Sinh viên năm 3 ngành Khoa Học Máy Tính, chuyên gia debug lúc 3 giờ sáng.',
    idleSrc: 'blob:mock-idle',
    pixelArt: true,
    createdAt: new Date().toISOString(),
  };

  const { state: stateWithChar } = gameReducer(state, {
    type: 'ADD_CUSTOM_CHARACTER',
    payload: { character: customChar },
  });

  assert.equal(stateWithChar.customCharacters?.length, 1);
  assert.equal(stateWithChar.customCharacters?.[0].description, customChar.description);
  assert.equal(stateWithChar.customCharacters?.[0].displayName, 'Thợ Săn IT');

  // Verify RESET_DATA preserves custom characters and their description
  const { state: afterReset } = gameReducer(stateWithChar, { type: 'RESET_DATA' });
  assert.equal(afterReset.customCharacters?.length, 1);
  assert.equal(afterReset.customCharacters?.[0].description, customChar.description);
});

test('Assignments: isUrgent flag is optional, persists on create and update', () => {
  let list: Assignment[] = [];

  // Add non-urgent assignment (default/optional)
  list = addAssignment(list, {
    title: 'Đọc tài liệu tuần 5',
    subject: 'Toán Rời Rạc',
    deadline: '2026-11-20T23:59',
    description: 'Đọc chương 3',
    completed: false,
    isUrgent: false,
  });
  assert.equal(list[0].isUrgent, false);

  // Add urgent assignment
  list = addAssignment(list, {
    id: 'asg-urgent-1',
    title: 'Nộp báo cáo đồ án giữa kỳ',
    subject: 'Trí Tuệ Nhân Tạo',
    deadline: '2026-11-05T12:00',
    description: 'Báo cáo 20 trang kèm mã nguồn',
    completed: false,
    isUrgent: true,
    priority: 'high',
  });
  assert.equal(list.length, 2);
  const urgentItem = list.find(a => a.id === 'asg-urgent-1');
  assert.equal(urgentItem?.isUrgent, true);
  assert.equal(urgentItem?.priority, 'high');

  // Update assignment to turn off isUrgent
  list = updateAssignment(list, {
    ...urgentItem!,
    isUrgent: false,
    priority: 'medium',
  });
  const updatedItem = list.find(a => a.id === 'asg-urgent-1');
  assert.equal(updatedItem?.isUrgent, false);
});


