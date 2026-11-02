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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#161B40] via-[#1A2255] to-[#161B40] border border-cyan-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-pixel">
              CAMPUS SCHEDULE BUILDER
            </span>
            <span className="text-xs text-slate-400">
              {timetable.length} buổi học đã đăng ký
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100 mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <span>Thời Khóa Biểu Sinh Viên (12 Tiết)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Xây dựng lịch học tuần, tự động gộp các tiết liền kề và lưu trữ trực tiếp vào thiết bị của bạn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsFormOpen(prev => !prev)}
            className="flex items-center gap-1.5 shadow-lg shadow-violet-600/20"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F132E] hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
            title="Cuộn xuống khu vực quản lý bài tập môn học"
          >
            <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bài Tập & Deadline ({state.assignments?.length || 0})</span>
          </button>

          {timetable.length === 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSample}
              className="flex items-center gap-1.5 text-xs border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nạp Lịch Mẫu Demo</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsClearAllOpen(true)}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:bg-rose-950/40 border-rose-800/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Hết</span>
            </Button>
          )}
        </div>
      </div>

      {/* Form Section: Add Course Slot */}
      {isFormOpen && (
        <Card variant="surface" className="p-5 sm:p-6 space-y-4 border-2 border-cyan-500/40 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="font-bold font-heading text-base sm:text-lg text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Đăng Ký Buổi Học Mới Vào Thời Khóa Biểu</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng form
            </button>
          </div>

          <form onSubmit={handleAddCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Tên môn học */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Tên Môn Học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="VD: Cấu Trúc Dữ Liệu & Giải Thuật"
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Mã môn học */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Mã Môn Học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="VD: IT002, MATH101"
                  maxLength={15}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 uppercase placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Thứ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Thứ Học <span className="text-rose-400">*</span>
                </label>
                <select
                  value={day}
                  onChange={e => setDay(e.target.value as DayOfWeek)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                <label className="text-xs font-bold text-slate-300">
                  Tiết Bắt Đầu (1 - 12) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={startPeriod}
                  onChange={e => {
                    const sp = parseInt(e.target.value, 10);
                    setStartPeriod(sp);
                    if (endPeriod < sp) setEndPeriod(sp);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                <label className="text-xs font-bold text-slate-300">
                  Tiết Kết Thúc (1 - 12) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={endPeriod}
                  onChange={e => setEndPeriod(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 cursor-pointer"
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
                <label className="text-xs font-bold text-slate-300">
                  Phòng Học <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="VD: C2-301, Lab A"
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Giảng viên */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Giảng Viên Phụ Trách <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={lecturer}
                  onChange={e => setLecturer(e.target.value)}
                  placeholder="VD: PGS. TS. Nguyễn Văn A"
                  maxLength={40}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Overlap Conflict Reminder notice */}
            {conflictingSlots.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/80 flex items-start gap-2.5 text-xs text-rose-200 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                    <span>Lịch học bị trùng! Không thể lưu</span>
                  </div>
                  <div>
                    Đã có môn{' '}
                    <strong className="text-white font-semibold">
                      {conflictingSlots
                        .map(c => `"${c.name}" (${c.code}, Tiết ${c.startPeriod}-${c.endPeriod})`)
                        .join(', ')}
                    </strong>{' '}
                    vào thời gian này trên {DAYS_OF_WEEK.find(d => d.id === day)?.label}.
                  </div>
                  <div className="text-[11px] text-rose-300/80">
                    Thời khóa biểu không cho phép trùng tiết (overlap). Vui lòng chọn tiết khác hoặc xóa môn học cũ trước.
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <p className="text-xs text-rose-400 font-medium bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-xl">
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
                variant={conflictingSlots.length > 0 ? "secondary" : "primary"}
                size="sm"
                type="submit"
                className={conflictingSlots.length > 0 ? "border-rose-700/60 text-rose-300 hover:bg-rose-950/30" : ""}
              >
                {conflictingSlots.length > 0 ? 'Lịch Bị Trùng - Nhắc Nhở & Không Thể Lưu' : 'Lưu Môn Học Vào Thời Khóa Biểu'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Day Filter Pills (Desktop and Mobile) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-[#161B40] p-1 rounded-xl border border-slate-700/60 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedDayView('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedDayView === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toàn Tuần (Lưới 7 Ngày)
          </button>
          {dayStats.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDayView(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedDayView === d.id
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              } ${d.id === todayDayId ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <span>{d.shortLabel}</span>
              {d.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-900 text-[10px] flex items-center justify-center font-pixel text-cyan-300">
                  {d.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] text-slate-400 font-pixel">
            Hôm nay: <strong className="text-amber-400">{DAYS_OF_WEEK.find(d => d.id === todayDayId)?.label}</strong>
          </span>
        </div>
      </div>

      {/* Main Timetable Rendering */}
      {selectedDayView === 'all' ? (
        /* Full Week 2D Grid with Period Spans & Lunch Break */
        <div className="rounded-2xl bg-[#0D112B] border border-slate-800 shadow-2xl overflow-hidden">
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
                <tr className="bg-[#14193D] border-b border-slate-700/80 text-xs text-slate-300 font-heading">
                  <th className="py-3 px-2 text-center w-[105px] min-w-[105px] max-w-[105px] shrink-0 border-r border-slate-800 font-bold text-slate-400">
                    <div className="flex items-center justify-center gap-1 truncate">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Tiết / Giờ</span>
                    </div>
                  </th>
                  {DAYS_OF_WEEK.map(d => {
                    const isToday = d.id === todayDayId;
                    return (
                      <th
                        key={d.id}
                        style={{ width: 'calc((100% - 105px) / 7)' }}
                        className={`py-3 px-2 text-center border-r border-slate-800 last:border-r-0 w-[calc((100%-105px)/7)] min-w-[110px] ${
                          isToday ? 'bg-cyan-950/40 text-cyan-200' : ''
                        }`}
                      >
                        <div className="font-black text-sm truncate">{d.label}</div>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-pixel truncate">
                            HÔM NAY
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body: Periods 1 to 12 with Lunch Break Row between 6 and 7 */}
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {gridRows.map(row => {
                  const isLunchDivider = row.period === 7;

                  return (
                    <React.Fragment key={row.period}>
                      {/* Lunch Break Banner between period 6 and 7 */}
                      {isLunchDivider && (
                        <tr className="bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border-y-2 border-amber-500/40">
                          <td
                            colSpan={8}
                            className="py-2.5 px-4 text-center text-xs font-pixel text-amber-300 tracking-wider select-none"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Coffee className="w-4 h-4 text-amber-400 animate-bounce" />
                              <span>🍱 KHOẢNG NGHỈ TRƯA (LUNCH BREAK • 12:05 - 12:35) • TIẾT 1-6 CA SÁNG / TIẾT 7-12 CA CHIỀU</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-800/20 transition-colors">
                        {/* Period & Time Column */}
                        <td className="py-2 px-2 text-center bg-[#101538] border-r border-slate-800 font-pixel text-slate-300 w-[105px] min-w-[105px] max-w-[105px] shrink-0">
                          <div className="font-bold text-xs text-cyan-300">
                            Tiết {row.period}
                          </div>
                          <div className="text-[10px] text-slate-500 font-sans mt-0.5 whitespace-nowrap">
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
                                className={`p-1.5 sm:p-2 align-top border-r border-slate-800 last:border-r-0 transition-all w-[calc((100%-105px)/7)] min-w-[110px] max-w-0 overflow-hidden ${
                                  isToday ? 'bg-cyan-950/20' : ''
                                }`}
                              >
                                <div
                                  className={`rounded-xl p-2 sm:p-2.5 border shadow-lg flex flex-col justify-between h-full transition-transform hover:scale-[1.01] w-full overflow-hidden ${color.bg} ${color.border} ${color.text}`}
                                  style={{ minHeight: `${rowSpan * 58 - 10}px` }}
                                >
                                  <div className="w-full overflow-hidden">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className={`text-[10px] font-bold font-pixel px-1.5 py-0.5 rounded-md truncate max-w-[70px] ${color.tag}`}>
                                        {course.code}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setCourseToDelete(course)}
                                        className="text-slate-400 hover:text-rose-400 p-1 hover:bg-black/20 rounded transition-colors shrink-0 cursor-pointer"
                                        title={`Xóa môn ${course.name}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="font-bold text-xs sm:text-sm text-slate-100 font-heading mt-1 leading-snug break-words line-clamp-2">
                                      {course.name}
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1 text-[11px] text-slate-300 w-full overflow-hidden">
                                    <div className="flex items-center gap-1 truncate" title={`Phòng: ${course.room}`}>
                                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                                      <span className="truncate">{course.room}</span>
                                    </div>
                                    <div className="flex items-center gap-1 truncate" title={`GV: ${course.lecturer}`}>
                                      <User className="w-3 h-3 text-violet-300 shrink-0" />
                                      <span className="truncate">{course.lecturer}</span>
                                    </div>
                                    <div className="text-[10px] font-pixel text-amber-300 font-bold truncate">
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
                              className={`p-1.5 sm:p-2 text-center border-r border-slate-800 last:border-r-0 w-[calc((100%-105px)/7)] min-w-[110px] max-w-0 overflow-hidden ${
                                isToday ? 'bg-cyan-950/10' : ''
                              }`}
                            >
                              <div className="h-10 rounded-lg border border-dashed border-slate-800/80 flex items-center justify-center text-slate-600 hover:border-slate-600 hover:text-slate-400 transition-colors group">
                                <span className="text-[10px] opacity-40 font-pixel group-hover:hidden">—</span>
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
                                  className="hidden group-hover:flex items-center justify-center w-full h-full text-cyan-400 font-bold text-xs cursor-pointer"
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
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#161B40] border border-slate-700/60">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase font-pixel">LỊCH THEO NGÀY</span>
              <h3 className="text-lg font-bold font-heading text-slate-100">
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
                    <div className="py-2 px-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-pixel text-xs text-center flex items-center justify-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span>🍱 GIỜ NGHỈ TRƯA (12:05 - 12:35)</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="w-24 shrink-0 font-pixel">
                      <div className="font-bold text-cyan-300">Tiết {pDef.period}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{pDef.time}</div>
                    </div>

                    <div className="flex-1">
                      {isStart ? (
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            getCourseColor(isStart.code, isStart.name).bg
                          } ${getCourseColor(isStart.code, isStart.name).border}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-pixel text-[10px] font-bold text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded">
                                {isStart.code}
                              </span>
                              <strong className="text-slate-100 text-sm font-heading">{isStart.name}</strong>
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                              <span>📍 {isStart.room}</span>
                              <span>👤 {isStart.lecturer}</span>
                              <span className="text-amber-300 font-pixel">
                                Tiết {isStart.startPeriod} - {isStart.endPeriod}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCourseToDelete(isStart)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-black/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : coursesThisPeriod.length > 0 ? (
                        <div className="text-slate-400 text-xs italic">
                          (Tiếp tục môn {coursesThisPeriod[0].name})
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Trống</span>
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
      <Card variant="surface" className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
          <div>
            <h3 className="font-bold font-heading text-base text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Danh Sách Tất Cả Môn Học & Buổi Học ({timetable.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hỗ trợ cùng một môn học có nhiều buổi khác nhau trong tuần (Multi-slots).
            </p>
          </div>
        </div>

        {timetable.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-3">
            <CalendarDays className="w-10 h-10 mx-auto text-slate-600" />
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
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${color.bg} ${color.border}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-pixel text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/40 text-cyan-300 border border-cyan-500/30">
                        {course.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        className="text-slate-400 hover:text-rose-400 p-1 hover:bg-black/20 rounded transition-colors"
                        title={`Xóa buổi học ${course.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="font-bold font-heading text-sm text-slate-100 mt-2">
                      {course.name}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300 font-pixel">{dayLabel}</span>
                      <span className="font-pixel text-slate-300">
                        Tiết {course.startPeriod} - {course.endPeriod} ({course.endPeriod - course.startPeriod + 1} tiết)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{course.room}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3 h-3 text-violet-300 shrink-0" />
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
          <p className="text-sm text-slate-200 leading-relaxed">
            Bạn có chắc muốn xóa buổi học môn{' '}
            <strong className="text-cyan-300">{courseToDelete?.name}</strong> (
            {courseToDelete?.code}) khỏi thời khóa biểu?
          </p>

          <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-700/80 text-xs text-slate-300 space-y-1.5">
            <div>
              <span className="text-slate-400">Thời gian: </span>
              <strong className="text-amber-300">
                {DAYS_OF_WEEK.find(d => d.id === courseToDelete?.day)?.label}, Tiết{' '}
                {courseToDelete?.startPeriod} - {courseToDelete?.endPeriod}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Phòng học: </span>
              <strong className="text-slate-100">{courseToDelete?.room}</strong>
            </div>
            <div className="text-[11px] text-rose-400">
              * Dữ liệu buổi học này sẽ được xóa ngay lập tức khỏi bộ nhớ và bảng thời khóa biểu.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-700/60">
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
          <p className="text-sm text-slate-200">
            Bạn có chắc chắn muốn xóa toàn bộ{' '}
            <strong className="text-rose-400">{timetable.length} môn học</strong> khỏi thời khóa
            biểu?
          </p>
          <p className="text-xs text-slate-400">
            Thao tác này sẽ làm trống toàn bộ bảng thời khóa biểu và xóa dữ liệu đã lưu.
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-700/60">
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
