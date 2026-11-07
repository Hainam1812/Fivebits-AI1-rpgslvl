import { CourseSlot, DayOfWeek, PersonalExamGoal } from '../store/types.js';

export const DAYS_OF_WEEK: { id: DayOfWeek; label: string; shortLabel: string }[] = [
  { id: 'mon', label: 'Thứ 2', shortLabel: 'T2' },
  { id: 'tue', label: 'Thứ 3', shortLabel: 'T3' },
  { id: 'wed', label: 'Thứ 4', shortLabel: 'T4' },
  { id: 'thu', label: 'Thứ 5', shortLabel: 'T5' },
  { id: 'fri', label: 'Thứ 6', shortLabel: 'T6' },
  { id: 'sat', label: 'Thứ 7', shortLabel: 'T7' },
  { id: 'sun', label: 'Chủ nhật', shortLabel: 'CN' },
];

export const PERIODS = [
  { period: 1, time: '07:00 - 07:50', session: 'morning' as const },
  { period: 2, time: '07:50 - 08:40', session: 'morning' as const },
  { period: 3, time: '08:40 - 09:30', session: 'morning' as const },
  { period: 4, time: '09:40 - 10:30', session: 'morning' as const },
  { period: 5, time: '10:30 - 11:20', session: 'morning' as const },
  { period: 6, time: '11:20 - 12:10', session: 'morning' as const },
  // Khoảng nghỉ trưa (Lunch Break)
  { period: 7, time: '12:50 - 13:40', session: 'afternoon' as const },
  { period: 8, time: '13:40 - 14:30', session: 'afternoon' as const },
  { period: 9, time: '14:30 - 15:20', session: 'afternoon' as const },
  { period: 10, time: '15:30 - 16:20', session: 'afternoon' as const },
  { period: 11, time: '16:20 - 17:10', session: 'afternoon' as const },
  { period: 12, time: '17:10 - 18:00', session: 'afternoon' as const },
];

export const TIMETABLE_STORAGE_KEY = 'solo_levelling_timetable_v1';

// Preset RPG & Neon colors for course badges
export const COURSE_COLORS = [
  { bg: 'bg-violet-950/80', border: 'border-violet-500/70', text: 'text-violet-200', tag: 'bg-violet-500/20 text-violet-300' },
  { bg: 'bg-cyan-950/80', border: 'border-cyan-500/70', text: 'text-cyan-200', tag: 'bg-cyan-500/20 text-cyan-300' },
  { bg: 'bg-emerald-950/80', border: 'border-emerald-500/70', text: 'text-emerald-200', tag: 'bg-emerald-500/20 text-emerald-300' },
  { bg: 'bg-amber-950/80', border: 'border-amber-500/70', text: 'text-amber-200', tag: 'bg-amber-500/20 text-amber-300' },
  { bg: 'bg-rose-950/80', border: 'border-rose-500/70', text: 'text-rose-200', tag: 'bg-rose-500/20 text-rose-300' },
  { bg: 'bg-indigo-950/80', border: 'border-indigo-500/70', text: 'text-indigo-200', tag: 'bg-indigo-500/20 text-indigo-300' },
  { bg: 'bg-fuchsia-950/80', border: 'border-fuchsia-500/70', text: 'text-fuchsia-200', tag: 'bg-fuchsia-500/20 text-fuchsia-300' },
  { bg: 'bg-teal-950/80', border: 'border-teal-500/70', text: 'text-teal-200', tag: 'bg-teal-500/20 text-teal-300' },
];

export function getCourseColor(code: string, name: string): typeof COURSE_COLORS[0] {
  const str = `${code}_${name}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

/**
 * Check if a given time slot [startPeriod, endPeriod] overlaps with any existing course on that day.
 * Two intervals [s1, e1] and [s2, e2] overlap if and only if s1 <= e2 && e1 >= s2.
 */
export function findConflictingCourses(
  courses: CourseSlot[],
  day: DayOfWeek,
  startPeriod: number,
  endPeriod: number,
  excludeCourseId?: string
): CourseSlot[] {
  const s = Math.min(startPeriod, endPeriod);
  const e = Math.max(startPeriod, endPeriod);
  return courses.filter(c => {
    if (excludeCourseId && c.id === excludeCourseId) return false;
    if (c.day !== day) return false;
    return s <= c.endPeriod && e >= c.startPeriod;
  });
}

export function isSlotOverlapping(
  courses: CourseSlot[],
  day: DayOfWeek,
  startPeriod: number,
  endPeriod: number,
  excludeCourseId?: string
): boolean {
  return findConflictingCourses(courses, day, startPeriod, endPeriod, excludeCourseId).length > 0;
}

/**
 * Add a course slot into the timetable array.
 * Supports multiple records/slots for the same course (e.g. multiple sessions across days/times).
 * If options.preventOverlap is true, returns unchanged array if time slot conflicts with an existing course.
 */
export function addCourse(
  courses: CourseSlot[],
  newCourse: Omit<CourseSlot, 'id'> | CourseSlot,
  options?: { preventOverlap?: boolean }
): CourseSlot[] {
  const id = 'id' in newCourse && newCourse.id ? newCourse.id : `course-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startPeriod = Math.min(Math.max(1, Math.floor(newCourse.startPeriod)), 12);
  const endPeriod = Math.min(Math.max(startPeriod, Math.floor(newCourse.endPeriod)), 12);

  if (options?.preventOverlap) {
    const conflicts = findConflictingCourses(courses, newCourse.day, startPeriod, endPeriod);
    if (conflicts.length > 0) {
      console.warn('[TimeTable] Overlap detected: cannot add course slot', conflicts);
      return courses;
    }
  }

  const formatted: CourseSlot = {
    id,
    name: newCourse.name.trim(),
    code: newCourse.code.trim().toUpperCase(),
    day: newCourse.day,
    startPeriod,
    endPeriod,
    room: newCourse.room.trim(),
    lecturer: newCourse.lecturer.trim(),
    color: newCourse.color,
    createdAt: newCourse.createdAt || new Date().toISOString(),
  };

  const nextCourses = [...courses, formatted];
  saveToStorage(nextCourses);
  return nextCourses;
}

/**
 * Remove a specific course slot from the timetable.
 */
export function removeCourse(
  courses: CourseSlot[],
  courseId: string
): CourseSlot[] {
  const nextCourses = courses.filter(c => c.id !== courseId);
  saveToStorage(nextCourses);
  return nextCourses;
}

/**
 * Delete an exam schedule item.
 * Helper required by prompt specifications.
 */
export function deleteExamSchedule(
  personalExams: PersonalExamGoal[],
  examId: string
): PersonalExamGoal[] {
  if (!Array.isArray(personalExams)) return [];
  return personalExams.filter(exam => exam.id !== examId);
}

/**
 * Save course slots directly to localStorage.
 */
export function saveToStorage(courses: CourseSlot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(courses));
  } catch (err) {
    console.warn('[TimeTable] Could not save timetable to localStorage:', err);
  }
}

/**
 * Load course slots from localStorage.
 */
export function loadFromStorage(): CourseSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[TimeTable] Could not load timetable from localStorage:', err);
    return [];
  }
}

export interface TimetableCell {
  period: number;
  day: DayOfWeek;
  type: 'empty' | 'course' | 'covered';
  course?: CourseSlot;
  rowSpan?: number;
  conflicts?: CourseSlot[];
}

/**
 * Generate cells for a specific day across periods (1 to 12).
 * Handles multi-period spans and identifies covered slots.
 */
export function generateCourseCells(
  courses: CourseSlot[],
  day: DayOfWeek,
  periods: number[] = PERIODS.map(p => p.period)
): Map<number, TimetableCell> {
  const result = new Map<number, TimetableCell>();
  const dayCourses = courses.filter(c => c.day === day);

  // Mark all periods initially as empty
  for (const p of periods) {
    result.set(p, {
      period: p,
      day,
      type: 'empty',
    });
  }

  // Sort day courses by startPeriod ascending
  const sorted = [...dayCourses].sort((a, b) => a.startPeriod - b.startPeriod);

  for (const course of sorted) {
    const start = course.startPeriod;
    const end = course.endPeriod;
    const span = Math.max(1, end - start + 1);

    const existingStartCell = result.get(start);
    if (existingStartCell && existingStartCell.type === 'course') {
      // Overlap conflict at start period!
      existingStartCell.conflicts = existingStartCell.conflicts || [];
      existingStartCell.conflicts.push(course);
    } else {
      result.set(start, {
        period: start,
        day,
        type: 'course',
        course,
        rowSpan: span,
      });
    }

    // Mark subsequent periods as covered so they are merged/skipped in HTML rowSpan
    for (let p = start + 1; p <= end; p++) {
      if (p <= 12) {
        const existing = result.get(p);
        if (existing && existing.type === 'course') {
          existing.conflicts = existing.conflicts || [];
          existing.conflicts.push(course);
        } else {
          result.set(p, {
            period: p,
            day,
            type: 'covered',
            course,
          });
        }
      }
    }
  }

  return result;
}

export interface TimetableGridRow {
  period: number;
  time: string;
  session: 'morning' | 'afternoon';
  cells: Record<DayOfWeek, TimetableCell>;
}

/**
 * Render complete 2D timetable grid (rows = periods 1..12, columns = Mon..Sun).
 */
export function renderGrid(courses: CourseSlot[]): TimetableGridRow[] {
  // Pre-calculate cells for each day
  const dayCellMaps: Record<DayOfWeek, Map<number, TimetableCell>> = {
    mon: generateCourseCells(courses, 'mon'),
    tue: generateCourseCells(courses, 'tue'),
    wed: generateCourseCells(courses, 'wed'),
    thu: generateCourseCells(courses, 'thu'),
    fri: generateCourseCells(courses, 'fri'),
    sat: generateCourseCells(courses, 'sat'),
    sun: generateCourseCells(courses, 'sun'),
  };

  return PERIODS.map(pDef => {
    const rowCells: Record<DayOfWeek, TimetableCell> = {
      mon: dayCellMaps.mon.get(pDef.period)!,
      tue: dayCellMaps.tue.get(pDef.period)!,
      wed: dayCellMaps.wed.get(pDef.period)!,
      thu: dayCellMaps.thu.get(pDef.period)!,
      fri: dayCellMaps.fri.get(pDef.period)!,
      sat: dayCellMaps.sat.get(pDef.period)!,
      sun: dayCellMaps.sun.get(pDef.period)!,
    };

    return {
      period: pDef.period,
      time: pDef.time,
      session: pDef.session,
      cells: rowCells,
    };
  });
}

/**
 * Default sample schedule so university students can immediately test the timetable.
 */
export const SAMPLE_COURSES: Omit<CourseSlot, 'id'>[] = [
  {
    name: 'Giải Tích & Toán Cao Cấp',
    code: 'MATH101',
    day: 'mon',
    startPeriod: 1,
    endPeriod: 3,
    room: 'A1-204',
    lecturer: 'TS. Nguyễn Văn Hùng',
  },
  {
    name: 'Lập Trình Python & Thuật Toán',
    code: 'CS102',
    day: 'mon',
    startPeriod: 7,
    endPeriod: 9,
    room: 'B3-Lab01',
    lecturer: 'ThS. Lê Hoàng Nam',
  },
  {
    name: 'Cấu Trúc Dữ Liệu & Giải Thuật',
    code: 'CS201',
    day: 'tue',
    startPeriod: 3,
    endPeriod: 5,
    room: 'C2-301',
    lecturer: 'PGS. Trần Thị Mai',
  },
  {
    name: 'Lập Trình Python & Thuật Toán', // Slot 2 for CS102 (multiple sessions per course!)
    code: 'CS102',
    day: 'wed',
    startPeriod: 4,
    endPeriod: 6,
    room: 'B3-Lab01',
    lecturer: 'ThS. Lê Hoàng Nam',
  },
  {
    name: 'Toán Rời Rạc & Lý Thuyết Đồ Thị',
    code: 'MATH205',
    day: 'thu',
    startPeriod: 2,
    endPeriod: 4,
    room: 'A2-105',
    lecturer: 'TS. Đặng Minh Tuấn',
  },
  {
    name: 'Nhập Môn Trí Tuệ Nhân Tạo',
    code: 'AI101',
    day: 'fri',
    startPeriod: 7,
    endPeriod: 10,
    room: 'Hội Trường A',
    lecturer: 'GS. Vũ Quốc Hưng',
  },
];
