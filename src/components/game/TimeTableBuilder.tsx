import React, { useState } from 'react';
import { useGame } from '../../store/GameContext.js';
import { CourseSlot, DayOfWeek } from '../../store/types.js';
import {
  DAYS_OF_WEEK,
  PERIODS,
  SAMPLE_COURSES,
  renderGrid,
  getCourseColor,
  addCourse,
  removeCourse,
  saveToStorage,
  findConflictingCourses,
} from '../../domain/timetable.js';
import { saveStateToStorageImmediate } from '../../store/persistence.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Modal } from '../ui/Modal.js';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  MapPin,
  User,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronDown,
  CalendarDays,
  Coffee,
  ClipboardList,
} from 'lucide-react';
import { AssignmentManager } from './AssignmentManager.js';

interface TimeTableBuilderProps {
  onGoToMap?: () => void;
  onGoToAssignments?: () => void;
}

export const TimeTableBuilder: React.FC<TimeTableBuilderProps> = ({
  onGoToMap,
  onGoToAssignments,
}) => {
  const { state, dispatch } = useGame();
  const timetable = state.timetable || [];

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [day, setDay] = useState<DayOfWeek>('mon');
  const [startPeriod, setStartPeriod] = useState<number>(1);
  const [endPeriod, setEndPeriod] = useState<number>(3);
  const [room, setRoom] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected Day View for Mobile (or 'all' for full week grid)
  const [selectedDayView, setSelectedDayView] = useState<DayOfWeek | 'all'>('all');

  // Deletion Confirmation States
  const [courseToDelete, setCourseToDelete] = useState<CourseSlot | null>(null);
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);

  // Conflict Check (detect any overlapping periods on the selected day)
  const conflictingSlots = findConflictingCourses(timetable, day, startPeriod, endPeriod);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên môn học.');
      return;
    }
    if (!code.trim()) {
      setFormError('Vui lòng nhập mã môn học (VD: CS101, MATH102).');
      return;
    }
    if (startPeriod > endPeriod) {
      setFormError('Tiết kết thúc phải lớn hơn hoặc bằng tiết bắt đầu.');
      return;
    }
    if (!room.trim()) {
      setFormError('Vui lòng nhập phòng học (VD: A1-204, B3-Lab).');
      return;
    }
    if (!lecturer.trim()) {
      setFormError('Vui lòng nhập tên giảng viên phụ trách.');
      return;
    }

    // Do not allow overlapping schedules: show explicit reminder
    if (conflictingSlots.length > 0) {
      const dayLabel = DAYS_OF_WEEK.find(d => d.id === day)?.label || day;
      const conflictNames = conflictingSlots
        .map(c => `"${c.name}" (${c.code}, Tiết ${c.startPeriod}-${c.endPeriod})`)
        .join(', ');
      setFormError(
        `Lịch học bị trùng! Đã có môn ${conflictNames} trên ${dayLabel}. Thời khóa biểu không cho phép trùng lịch (overlap). Vui lòng chọn tiết khác hoặc xóa môn học cũ.`
      );
      return;
    }

    const newSlot: Omit<CourseSlot, 'id'> = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      day,
      startPeriod,
      endPeriod,
      room: room.trim(),
      lecturer: lecturer.trim(),
    };

    // 1. Dispatch action to store
    dispatch({ type: 'ADD_COURSE', payload: { course: newSlot } });

    // 2. Immediate persist
    const nextList = addCourse(timetable, newSlot, { preventOverlap: true });
    saveStateToStorageImmediate({
      ...state,
      timetable: nextList,
    });

    // Reset form fields
    setName('');
    setCode('');
    setRoom('');
    setLecturer('');
    setFormError(null);
    setIsFormOpen(false);
  };

  const confirmDeleteCourse = () => {
    if (!courseToDelete) return;
    const courseId = courseToDelete.id;

    // 1. Dispatch to reducer
    dispatch({ type: 'REMOVE_COURSE', payload: { id: courseId } });

    // 2. Immediate save to localStorage
    const updated = removeCourse(timetable, courseId);
    saveStateToStorageImmediate({
      ...state,
      timetable: updated,
    });

    setCourseToDelete(null);
  };

  const handleLoadSample = () => {
    let nextList = [...timetable];
    for (const sample of SAMPLE_COURSES) {
      nextList = addCourse(nextList, sample, { preventOverlap: true });
    }
    dispatch({ type: 'SET_TIMETABLE', payload: { courses: nextList } });
    saveStateToStorageImmediate({
      ...state,
      timetable: nextList,
    });
  };

  const handleClearAll = () => {
    dispatch({ type: 'SET_TIMETABLE', payload: { courses: [] } });
    saveToStorage([]);
    saveStateToStorageImmediate({
      ...state,
      timetable: [],
    });
    setIsClearAllOpen(false);
  };

  // Render Grid Data
  const gridRows = renderGrid(timetable);

  // Group by day for statistics
  const dayStats = DAYS_OF_WEEK.map(d => ({
    ...d,
    count: timetable.filter(c => c.day === d.id).length,
  }));

  // Determine current day of week (Vietnamese locale)
  const todayJs = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const todayDayId: DayOfWeek =
    todayJs === 0 ? 'sun' : (['mon', 'tue', 'wed', 'thu', 'fri', 'sat'][todayJs - 1] as DayOfWeek);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 pixel-frame pixel-frame-gold">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--gold)] border-2 border-[var(--gold)] text-xs font-bold font-pixel-latin">
              CAMPUS SCHEDULE BUILDER
            </span>
            <span className="text-xs text-[var(--muted)]">
              <span className="font-num text-[var(--text)]">{timetable.length}</span> buổi học đã đăng ký
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-[var(--text)] mt-1.5 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[var(--sky)]" />
            <span>Thời Khóa Biểu Sinh Viên (12 Tiết)</span>
          </h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Xây dựng lịch học tuần, tự động gộp các tiết liền kề và lưu trữ trực tiếp vào thiết bị của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(prev => !prev)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Môn Học</span>
          </Button>

          <button
            type="button"
            onClick={() => {
              if (onGoToAssignments) {
                onGoToAssignments();
              } else {
                document.getElementById('assignments-section')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--bg)] hover:bg-[var(--panel-2)] border-2 border-[var(--sky)] text-[var(--sky)] text-xs font-bold transition-colors cursor-pointer"
            title="Cuộn xuống khu vực quản lý bài tập môn học"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[var(--sky)]" />
            <span>Bài Tập & Deadline (<span className="font-num">{state.assignments?.length || 0}</span>)</span>
          </button>

          {timetable.length === 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 text-xs border-[var(--sky)] text-[var(--sky)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--sky)]" />
              <span>Nạp Lịch Mẫu Demo</span>
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsClearAllOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hết</span>
            </Button>
          )}
        </div>
      </div>

      {/* Form Section: Add Course Slot */}
      {isFormOpen && (
        <Card variant="surface" category="university" className="p-5 sm:p-6 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[var(--ink)]">
            <h3 className="font-bold font-heading text-base sm:text-lg text-[var(--text)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--sky)]" />
              <span>Đăng Ký Buổi Học Mới Vào Thời Khóa Biểu</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
            >
              Đóng form
            </button>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Tên môn học */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Tên Môn Học <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Cấu Trúc Dữ Liệu & Giải Thuật"
                  maxLength={60}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
                />
              </div>

              {/* Mã môn học */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Mã Môn Học <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="VD: IT002, MATH101"
                  maxLength={15}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] uppercase placeholder:text-[var(--muted)]"
                />
              </div>

              {/* Thứ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Thứ Học <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value as DayOfWeek)}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] cursor-pointer"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiết bắt đầu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Tiết Bắt Đầu (1 - 12) <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={startPeriod}
                  onChange={e => {
                    const sp = parseInt(e.target.value, 10);
                    setStartPeriod(sp);
                    if (endPeriod < sp) setEndPeriod(sp);
                  }}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] cursor-pointer"
                >
                  {PERIODS.map(p => (
                    <option key={p.period} value={p.period}>
                      Tiết {p.period} ({p.time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiết kết thúc */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Tiết Kết Thúc (1 - 12) <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={endPeriod}
                  onChange={e => setEndPeriod(parseInt(e.target.value, 10))}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] cursor-pointer"
                >
                  {PERIODS.filter(p => p.period >= startPeriod).map(p => (
                    <option key={p.period} value={p.period}>
                      Tiết {p.period} ({p.time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phòng học */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Phòng Học <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="VD: C2-301, Lab A"
                  maxLength={30}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
                />
              </div>

              {/* Giảng viên */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--muted)]">
                  Giảng Viên Phụ Trách <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={lecturer}
                  onChange={e => setLecturer(e.target.value)}
                  placeholder="VD: PGS. TS. Nguyễn Văn A"
                  maxLength={40}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            {/* Overlap Conflict Reminder notice */}
            {conflictingSlots.length > 0 && (
              <div className="p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--danger)] flex items-start gap-2.5 text-xs text-[var(--text)]">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-[var(--danger)] flex items-center gap-1.5 text-sm">
                    <span>Lịch học bị trùng! Không thể lưu</span>
                  </div>
                  <div>
                    Đã có môn{' '}
                    <strong className="text-[var(--text)] font-semibold">
                      {conflictingSlots
                        .map(c => `"${c.name}" (${c.code}, Tiết ${c.startPeriod}-${c.endPeriod})`)
                        .join(', ')}
                    </strong>{' '}
                    vào thời gian này trên {DAYS_OF_WEEK.find(d => d.id === day)?.label}.
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Thời khóa biểu không cho phép trùng tiết (overlap). Vui lòng chọn tiết khác hoặc xóa môn học cũ trước.
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <p className="text-xs text-[var(--danger)] font-medium bg-[var(--bg)] border-2 border-[var(--danger)] p-2.5 rounded-[2px]">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsFormOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant={conflictingSlots.length > 0 ? "danger" : "primary"}
                size="sm"
                type="submit"
              >
                {conflictingSlots.length > 0 ? 'Lịch Bị Trùng - Nhắc Nhở & Không Thể Lưu' : 'Lưu Môn Học Vào Thời Khóa Biểu'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Day Filter Tabs (Desktop and Mobile) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="pixel-tab-list flex items-center gap-1.5 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedDayView('all')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer ${
              selectedDayView === 'all'
                ? 'bg-[var(--gold)] text-[var(--ink)] border border-[var(--ink)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Toàn Tuần (Lưới 7 Ngày)
          </button>
          {dayStats.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDayView(d.id)}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedDayView === d.id
                  ? 'bg-[var(--gold)] text-[var(--ink)] border border-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              } ${d.id === todayDayId && selectedDayView !== d.id ? 'border border-[var(--gold)]' : ''}`}
            >
              <span>{d.shortLabel}</span>
              {d.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-num ${
                  selectedDayView === d.id ? 'bg-[var(--ink)] text-[var(--gold)]' : 'bg-[var(--panel-2)] text-[var(--sky)]'
                }`}>
                  {d.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-[var(--muted)] font-pixel">
            Hôm nay: <strong className="text-[var(--gold)]">{DAYS_OF_WEEK.find(d => d.id === todayDayId)?.label}</strong>
          </span>
        </div>
      </div>

      {/* Main Timetable Rendering */}
      {selectedDayView === 'all' ? (
        /* Full Week 2D Grid with Period Spans & Lunch Break */
        <div className="pixel-frame pixel-frame-muted overflow-hidden bg-[var(--panel)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[880px]">
              {/* Fixed column definitions so every day column stays strictly identical in width */}
              <colgroup>
                <col style={{ width: '105px' }} />
                {DAYS_OF_WEEK.map(d => (
                  <col key={d.id} style={{ width: 'calc((100% - 105px) / 7)' }} />
                ))}
              </colgroup>

              {/* Header: Days of the week */}
              <thead>
                <tr className="bg-[var(--bg)] border-b-2 border-[var(--ink)] text-xs text-[var(--text)] font-heading">
                  <th className="py-3 px-2 text-center w-[105px] min-w-[105px] max-w-[105px] shrink-0 border-r-2 border-[var(--ink)] font-bold text-[var(--muted)]">
                    <div className="flex items-center justify-center gap-1 truncate">
                      <Clock className="w-3.5 h-3.5 text-[var(--sky)] shrink-0" />
                      <span className="truncate">Tiết / Giờ</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map(d => {
                    const isToday = d.id === todayDayId;
                    return (
                      <th
                        key={d.id}
                        style={{ width: 'calc((100% - 105px) / 7)' }}
                        className={`py-3 px-2 text-center border-r-2 border-[var(--ink)] last:border-r-0 w-[calc((100%-105px)/7)] min-w-[110px] ${
                          isToday ? 'bg-[var(--panel-2)] text-[var(--gold)]' : ''
                        }`}
                      >
                        <div className="font-black text-sm truncate">{d.label}</div>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-[2px] bg-[var(--gold)] text-[var(--ink)] text-[10px] font-bold font-pixel truncate">
                            HÔM NAY
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body: Periods 1 to 12 with Lunch Break Row between 6 and 7 */}
              <tbody className="divide-y-2 divide-[var(--ink)] text-xs">
                {gridRows.map(row => {
                  const isLunchDivider = row.period === 7;

                  return (
                    <React.Fragment key={row.period}>
                      {/* Lunch Break Banner between period 6 and 7 */}
                      {isLunchDivider && (
                        <tr className="bg-[var(--panel-2)] border-y-2 border-[var(--gold)]">
                          <td
                            colSpan={8}
                            className="py-2.5 px-4 text-center text-xs font-pixel text-[var(--gold)] tracking-wider select-none"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Coffee className="w-4 h-4 text-[var(--gold)]" />
                              <span>🍱 KHOẢNG NGHỈ TRƯA (LUNCH BREAK • 12:10 - 12:50) • TIẾT 1-6 CA SÁNG / TIẾT 7-12 CA CHIỀU</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-[var(--panel-2)]/40 transition-colors">
                        {/* Period & Time Column */}
                        <td className="py-2 px-2 text-center bg-[var(--bg)] border-r-2 border-[var(--ink)] font-pixel text-[var(--text)] w-[105px] min-w-[105px] max-w-[105px] shrink-0">
                          <div className="font-bold text-xs text-[var(--sky)]">
                            Tiết {row.period}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-num mt-0.5 whitespace-nowrap">
                            {row.time}
                          </div>
                        </td>

                        {/* 7 Days Columns */}
                        {DAYS_OF_WEEK.map(d => {
                          const cell = row.cells[d.id];
                          const isToday = d.id === todayDayId;

                          if (cell.type === 'covered') {
                            // Slot already covered by a multi-period rowSpan from an earlier start period!
                            return null;
                          }

                          if (cell.type === 'course' && cell.course) {
                            const course = cell.course;
                            const color = getCourseColor(course.code, course.name);
                            const rowSpan = cell.rowSpan || 1;

                            return (
                              <td
                                key={d.id}
                                rowSpan={rowSpan}
                                style={{ width: 'calc((100% - 105px) / 7)' }}
                                className={`p-1.5 sm:p-2 align-top border-r-2 border-[var(--ink)] last:border-r-0 transition-all w-[calc((100%-105px)/7)] min-w-[110px] max-w-0 overflow-hidden ${
                                  isToday ? 'bg-[var(--panel-2)]/30' : ''
                                }`}
                              >
                                <div
                                  className={`rounded-[2px] p-2 sm:p-2.5 border-2 shadow-[2px_3px_0_0_var(--ink)] flex flex-col justify-between h-full w-full overflow-hidden ${color.bg} ${color.border} ${color.text}`}
                                  style={{ minHeight: `${rowSpan * 58 - 10}px` }}
                                >
                                  <div className="w-full overflow-hidden">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className={`text-[10px] font-bold font-num px-1.5 py-0.5 rounded-[2px] truncate max-w-[76px] ${color.tag}`}>
                                        {course.code}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setCourseToDelete(course)}
                                        className="text-[var(--muted)] hover:text-[var(--danger)] p-1 rounded-[2px] transition-colors shrink-0 cursor-pointer"
                                        title={`Xóa môn ${course.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="font-bold text-xs sm:text-sm text-[var(--text)] font-heading mt-1 leading-snug break-words line-clamp-2">
                                      {course.name}
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-[#3B4474] space-y-1 text-xs text-[var(--muted)] w-full overflow-hidden">
                                    <div className="flex items-center gap-1 truncate" title={`Phòng: ${course.room}`}>
                                      <MapPin className="w-3 h-3 text-[var(--sky)] shrink-0" />
                                      <span className="truncate">{course.room}</span>
                                    </div>
                                    <div className="flex items-center gap-1 truncate" title={`GV: ${course.lecturer}`}>
                                      <User className="w-3 h-3 text-[var(--violet)] shrink-0" />
                                      <span className="truncate">{course.lecturer}</span>
                                    </div>
                                    <div className="text-xs font-pixel text-[var(--gold)] font-bold truncate">
                                      Tiết {course.startPeriod} - {course.endPeriod}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          // Empty slot cell
                          return (
                            <td
                              key={d.id}
                              style={{ width: 'calc((100% - 105px) / 7)' }}
                              className={`p-1.5 sm:p-2 text-center border-r-2 border-[var(--ink)] last:border-r-0 w-[calc((100%-105px)/7)] min-w-[110px] max-w-0 overflow-hidden ${
                                isToday ? 'bg-[var(--panel-2)]/20' : ''
                              }`}
                            >
                              <div className="h-10 rounded-[2px] border border-dashed border-[#3B4474] flex items-center justify-center text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors group">
                                <span className="text-xs opacity-50 font-pixel group-hover:hidden">—</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDay(d.id);
                                    setStartPeriod(row.period);
                                    // Default safely without overlapping next course on this day
                                    const nextCourse = timetable
                                      .filter(c => c.day === d.id && c.startPeriod > row.period)
                                      .sort((a, b) => a.startPeriod - b.startPeriod)[0];
                                    const safeEnd = nextCourse
                                      ? Math.min(row.period + 1, nextCourse.startPeriod - 1)
                                      : Math.min(12, row.period + 1);
                                    setEndPeriod(Math.max(row.period, safeEnd));
                                    setFormError(null);
                                    setIsFormOpen(true);
                                  }}
                                  className="hidden group-hover:flex items-center justify-center w-full h-full text-[var(--gold)] font-bold text-xs cursor-pointer"
                                  title={`Thêm môn vào ${d.label}, Tiết ${row.period}`}
                                >
                                  + Thêm
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mobile-friendly Single Day View */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 pixel-frame pixel-frame-muted">
            <div>
              <span className="text-xs font-bold text-[var(--sky)] uppercase font-pixel">LỊCH THEO NGÀY</span>
              <h3 className="text-lg font-bold font-heading text-[var(--text)]">
                {DAYS_OF_WEEK.find(d => d.id === selectedDayView)?.label}
              </h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDay(selectedDayView);
                setIsFormOpen(true);
              }}
            >
              + Thêm môn ngày này
            </Button>
          </div>

          <div className="space-y-2">
            {PERIODS.map(pDef => {
              const coursesThisPeriod = timetable.filter(
                c => c.day === selectedDayView && pDef.period >= c.startPeriod && pDef.period <= c.endPeriod
              );
              const isStart = timetable.find(
                c => c.day === selectedDayView && c.startPeriod === pDef.period
              );
              const isLunch = pDef.period === 7;

              return (
                <React.Fragment key={pDef.period}>
                  {isLunch && (
                    <div className="py-2 px-3 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] text-[var(--gold)] font-pixel text-xs text-center flex items-center justify-center gap-2">
                      <Coffee className="w-4 h-4 text-[var(--gold)]" />
                      <span>🍱 GIỜ NGHỈ TRƯA (12:10 - 12:50)</span>
                    </div>
                  )}

                  <div className="p-3 rounded-[2px] bg-[var(--panel)] border-2 border-[#3B4474] flex items-center justify-between gap-3 text-xs">
                    <div className="w-24 shrink-0 font-pixel">
                      <div className="font-bold text-[var(--sky)]">Tiết {pDef.period}</div>
                      <div className="text-[10px] text-[var(--muted)] font-num">{pDef.time}</div>
                    </div>

                    <div className="flex-1">
                      {isStart ? (
                        <div
                          className={`p-3 rounded-[2px] border-2 flex items-center justify-between gap-2 ${
                            getCourseColor(isStart.code, isStart.name).bg
                          } ${getCourseColor(isStart.code, isStart.name).border}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-num text-[10px] font-bold text-[var(--gold)] bg-[var(--bg)] border border-[var(--gold)] px-1.5 py-0.5 rounded-[2px]">
                                {isStart.code}
                              </span>
                              <strong className="text-[var(--text)] text-sm font-heading">{isStart.name}</strong>
                            </div>
                            <div className="text-xs text-[var(--muted)] mt-1 flex flex-wrap items-center gap-3">
                              <span>📍 {isStart.room}</span>
                              <span>👤 {isStart.lecturer}</span>
                              <span className="text-[var(--gold)] font-pixel">
                                Tiết {isStart.startPeriod} - {isStart.endPeriod}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCourseToDelete(isStart)}
                            className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] rounded-[2px] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : coursesThisPeriod.length > 0 ? (
                        <div className="text-[var(--muted)] text-xs italic">
                          (Tiếp tục môn {coursesThisPeriod[0].name})
                        </div>
                      ) : (
                        <span className="text-[var(--muted)] italic">Trống</span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Assignment Management Module - Situated directly between Timetable and Course List */}
      <div id="assignments-section" className="scroll-mt-6">
        <AssignmentManager />
      </div>

      {/* Course List & Stats */}
      <Card variant="surface" category="university" className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b-2 border-[var(--ink)]">
          <div>
            <h3 className="font-bold font-heading text-base text-[var(--text)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--sky)]" />
              <span>Danh Sách Tất Cả Môn Học & Buổi Học (<span className="font-num text-[var(--gold)]">{timetable.length}</span>)</span>
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Hỗ trợ cùng một môn học có nhiều buổi khác nhau trong tuần (Multi-slots).
            </p>
          </div>
        </div>

        {timetable.length === 0 ? (
          <div className="text-center py-8 text-[var(--muted)] space-y-3">
            <CalendarDays className="w-10 h-10 mx-auto text-[var(--muted)]" />
            <p className="text-xs italic">
              Thời khóa biểu hiện đang trống. Hãy bấm "Thêm Môn Học" hoặc "Nạp Lịch Mẫu Demo" để bắt đầu!
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
              + Thêm Môn Học Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timetable.map(course => {
              const dayLabel = DAYS_OF_WEEK.find(d => d.id === course.day)?.label;
              const color = getCourseColor(course.code, course.name);

              return (
                <div
                  key={course.id}
                  className={`p-3.5 rounded-[2px] border-2 shadow-[4px_5px_0_0_var(--ink)] flex flex-col justify-between gap-3 ${color.bg} ${color.border}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-num text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--sky)] border border-[var(--sky)]">
                        {course.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        className="text-[var(--muted)] hover:text-[var(--danger)] p-1 rounded-[2px] transition-colors cursor-pointer"
                        title={`Xóa buổi học ${course.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold font-heading text-sm text-[var(--text)] mt-2">
                      {course.name}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[#3B4474] space-y-1 text-xs text-[var(--muted)]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--gold)] font-pixel">{dayLabel}</span>
                      <span className="font-pixel text-[var(--text)]">
                        Tiết {course.startPeriod} - {course.endPeriod} ({course.endPeriod - course.startPeriod + 1} tiết)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--muted)]">
                      <MapPin className="w-3 h-3 text-[var(--sky)] shrink-0" />
                      <span>{course.room}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--muted)]">
                      <User className="w-3 h-3 text-[var(--violet)] shrink-0" />
                      <span>{course.lecturer}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Delete Course Confirmation Modal */}
      <Modal
        isOpen={Boolean(courseToDelete)}
        onClose={() => setCourseToDelete(null)}
        title="Xác Nhận Xóa Buổi Học"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text)] leading-relaxed">
            Bạn có chắc muốn xóa buổi học môn{' '}
            <strong className="text-[var(--gold)]">{courseToDelete?.name}</strong> (
            {courseToDelete?.code}) khỏi thời khóa biểu?
          </p>

          <div className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] text-xs text-[var(--muted)] space-y-1.5">
            <div>
              <span className="text-[var(--muted)]">Thời gian: </span>
              <strong className="text-[var(--gold)]">
                {DAYS_OF_WEEK.find(d => d.id === courseToDelete?.day)?.label}, Tiết{' '}
                {courseToDelete?.startPeriod} - {courseToDelete?.endPeriod}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)]">Phòng học: </span>
              <strong className="text-[var(--text)]">{courseToDelete?.room}</strong>
            </div>
            <div className="text-xs text-[var(--danger)]">
              * Dữ liệu buổi học này sẽ được xóa ngay lập tức khỏi bộ nhớ và bảng thời khóa biểu.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[var(--ink)]">
            <Button variant="secondary" size="sm" onClick={() => setCourseToDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDeleteCourse}>
              Xác Nhận Xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={isClearAllOpen}
        onClose={() => setIsClearAllOpen(false)}
        title="Xác Nhận Xóa Toàn Bộ Thời Khóa Biểu"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text)]">
            Bạn có chắc chắn muốn xóa toàn bộ{' '}
            <strong className="text-[var(--danger)]">{timetable.length} môn học</strong> khỏi thời khóa
            biểu?
          </p>
          <p className="text-xs text-[var(--muted)]">
            Thao tác này sẽ làm trống toàn bộ bảng thời khóa biểu và xóa dữ liệu đã lưu.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[var(--ink)]">
            <Button variant="secondary" size="sm" onClick={() => setIsClearAllOpen(false)}>
              Hủy Bỏ
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearAll}>
              Xác Nhận Xóa Hết
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
