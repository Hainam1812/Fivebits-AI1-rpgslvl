import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../../store/GameContext.js';
import {
  Assignment,
  sortAssignmentsByDeadline,
  formatDeadlineDisplay,
  SAMPLE_ASSIGNMENTS,
} from '../../domain/assignments.js';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { Modal } from '../ui/Modal.js';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  CalendarDays,
  Flame,
} from 'lucide-react';

/**
 * Tách biệt mã môn học (ví dụ CS101, MATH201) và tên môn học để hiển thị chuẩn xác, không bị tràn trên mobile/tablet
 */
export function parseSubjectInfo(rawSubject: string): { name: string; code: string | null } {
  if (!rawSubject) return { name: 'Chung', code: null };
  const trimmed = rawSubject.trim();
  const match = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))$/);
  if (match && match[1]?.trim()) {
    return {
      name: match[1].trim(),
      code: match[2]?.trim() || null,
    };
  }
  return { name: trimmed, code: null };
}

interface AssignmentManagerProps {
  onGoToTimetable?: () => void;
  compact?: boolean;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({
  onGoToTimetable,
  compact = false,
}) => {
  const { state, dispatch, now } = useGame();
  const assignments = useMemo(
    () => sortAssignmentsByDeadline(state.assignments || []),
    [state.assignments]
  );
  const timetableCourses = state.timetable || [];

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'due_soon' | 'completed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Modal states for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCompleted, setFormCompleted] = useState(false);
  const [formIsUrgent, setFormIsUrgent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Expanded card IDs for seeing full description on mobile/compact
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Unique subjects from assignments and timetable for quick dropdown
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    timetableCourses.forEach(c => set.add(`${c.name} (${c.code})`));
    assignments.forEach(a => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set);
  }, [timetableCourses, assignments]);

  // Stable modal close
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setFormError(null);
  }, []);

  // Open modal for new assignment
  const handleOpenCreateModal = useCallback((presetSubject?: string) => {
    setEditingAssignment(null);
    setFormTitle('');
    setFormSubject(presetSubject || '');
    // Default deadline: tomorrow at 23:59
    const defaultDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateStr = defaultDate.toISOString().slice(0, 10);
    setFormDeadline(`${dateStr}T23:59`);
    setFormDescription('');
    setFormCompleted(false);
    setFormIsUrgent(false);
    setFormError(null);
    setIsModalOpen(true);
  }, []);

  // Open modal for editing
  const handleOpenEditModal = useCallback((assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormTitle(assignment.title || '');
    setFormSubject(assignment.subject || '');
    setFormDeadline(assignment.deadline || '');
    setFormDescription(assignment.description || '');
    setFormCompleted(Boolean(assignment.completed));
    setFormIsUrgent(Boolean(assignment.isUrgent || assignment.priority === 'high'));
    setFormError(null);
    setIsModalOpen(true);
  }, []);

  // Save (Create or Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      setFormError('Vui lòng nhập tên bài tập.');
      return;
    }

    const cleanSubject = formSubject.trim() || 'Chung';
    const cleanDeadline =
      formDeadline.trim() ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    try {
      if (editingAssignment) {
        dispatch({
          type: 'UPDATE_ASSIGNMENT',
          payload: {
            assignment: {
              ...editingAssignment,
              title: cleanTitle,
              subject: cleanSubject,
              deadline: cleanDeadline,
              description: formDescription.trim(),
              completed: formCompleted,
              isUrgent: formIsUrgent,
              priority: formIsUrgent ? 'high' : 'medium',
            },
          },
        });
      } else {
        dispatch({
          type: 'ADD_ASSIGNMENT',
          payload: {
            assignment: {
              title: cleanTitle,
              subject: cleanSubject,
              deadline: cleanDeadline,
              description: formDescription.trim(),
              completed: formCompleted,
              isUrgent: formIsUrgent,
              priority: formIsUrgent ? 'high' : 'medium',
            },
          },
        });
      }

      setIsModalOpen(false);
      setFormError(null);
    } catch (err: any) {
      console.error('Lỗi khi lưu bài tập:', err);
      setFormError('Có lỗi xảy ra khi lưu bài tập. Vui lòng thử lại.');
    }
  };

  // Toggle completion
  const handleToggle = (id: string) => {
    dispatch({ type: 'TOGGLE_ASSIGNMENT', payload: { id } });
  };

  // Delete
  const handleConfirmDelete = () => {
    if (!assignmentToDelete) return;
    dispatch({ type: 'DELETE_ASSIGNMENT', payload: { id: assignmentToDelete.id } });
    setAssignmentToDelete(null);
  };

  // Load sample assignments if empty
  const handleLoadSamples = () => {
    dispatch({ type: 'SET_ASSIGNMENTS', payload: { assignments: SAMPLE_ASSIGNMENTS } });
  };

  // Filtered & Sorted assignments
  const filteredAssignments = useMemo(() => {
    const list = assignments.filter(item => {
      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubject = item.subject.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchSubject && !matchDesc) return false;
      }

      // Subject filter
      if (selectedSubjectFilter !== 'all' && item.subject !== selectedSubjectFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'completed') {
        return item.completed;
      }
      if (statusFilter === 'pending') {
        return !item.completed;
      }
      if (statusFilter === 'due_soon') {
        if (item.completed) return false;
        if (item.isUrgent || item.priority === 'high') return true;
        const dInfo = formatDeadlineDisplay(item.deadline, now);
        return dInfo.status === 'today' || dInfo.status === 'soon' || dInfo.status === 'overdue';
      }

      return true;
    });

    // Sort: Incomplete Urgent first, then Incomplete by deadline, then Completed
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const aUrgent = Boolean(a.isUrgent || a.priority === 'high');
      const bUrgent = Boolean(b.isUrgent || b.priority === 'high');
      if (aUrgent !== bUrgent) {
        return aUrgent ? -1 : 1;
      }
      const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return timeA - timeB;
    });
  }, [assignments, searchQuery, statusFilter, selectedSubjectFilter, now]);

  // Statistics
  const totalCount = assignments.length;
  const completedCount = assignments.filter(a => a.completed).length;
  const pendingCount = totalCount - completedCount;
  const urgentCount = assignments.filter(a => {
    if (a.completed) return false;
    if (a.isUrgent || a.priority === 'high') return true;
    const dInfo = formatDeadlineDisplay(a.deadline, now);
    return dInfo.status === 'today' || dInfo.status === 'soon' || dInfo.status === 'overdue';
  }).length;

  return (
    <Card
      variant="surface"
      className="p-4 sm:p-6 space-y-5 border-2 border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold font-pixel tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              <span>MODULE QUẢN LÝ BÀI TẬP</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Sắp xếp theo hạn chót (Deadline từ sớm đến muộn)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100 mt-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <span>Nhiệm Vụ Học Tập & Deadline Đại Học</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5 leading-relaxed">
            Theo dõi, thêm mới, chỉnh sửa và hoàn thành từng bài tập môn học. Dữ liệu tự động lưu trữ an toàn vào máy của bạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bài Tập Mới</span>
          </Button>

          {onGoToTimetable && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGoToTimetable}
              className="flex items-center gap-1.5 text-xs text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/40"
            >
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xem Thời Khóa Biểu</span>
            </Button>
          )}

          {totalCount === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSamples}
              className="flex items-center gap-1.5 text-xs text-amber-300 border-amber-500/40 hover:bg-amber-950/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Nạp Bài Mẫu</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#0F132E] border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-pixel">TỔNG BÀI TẬP</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-slate-100">{totalCount}</div>
          </div>
          <BookOpen className="w-6 h-6 text-cyan-400/60" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-[#0F132E] border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-pixel">CHƯA LÀM</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-amber-300">{pendingCount}</div>
          </div>
          <Clock className="w-6 h-6 text-amber-400/60" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-[#0F132E] border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-pixel">GẤP / HÔM NAY</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-rose-400">{urgentCount}</div>
          </div>
          <Flame className="w-6 h-6 text-rose-400/60 animate-pulse" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-[#0F132E] border border-slate-700/60 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-pixel">ĐÃ HOÀN THÀNH</div>
            <div className="text-xl sm:text-2xl font-bold font-heading text-emerald-400">{completedCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400/60" />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài tập, môn học, mã môn..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Filter buttons & Subject dropdown for mobile & tablet */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-[#0F132E] p-1 rounded-xl border border-slate-700/80 overflow-x-auto w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Chưa làm ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('due_soon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'due_soon'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Gấp ({urgentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>

          {/* Subject dropdown if available */}
          {availableSubjects.length > 0 && (
            <select
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#0F132E] border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer shrink-0 max-w-full sm:max-w-[200px] truncate"
            >
              <option value="all">Tất cả môn học</option>
              {availableSubjects.map(subj => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Assignment List - Sorted by Deadline from Earliest to Latest */}
      <div className="space-y-3 pt-1">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl bg-[#0F132E]/60 border border-dashed border-slate-700/80 space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-300 text-sm">
                {searchQuery || statusFilter !== 'all' || selectedSubjectFilter !== 'all'
                  ? 'Không tìm thấy bài tập nào khớp với bộ lọc'
                  : 'Chưa có bài tập nào trong danh sách'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || selectedSubjectFilter !== 'all'
                  ? 'Hãy thử xóa từ khóa tìm kiếm hoặc đổi tab bộ lọc để xem các bài tập khác.'
                  : 'Bấm "Thêm Bài Tập Mới" hoặc "Nạp Bài Mẫu" để bắt đầu theo dõi các deadline môn học của bạn!'}
              </p>
            </div>
            {totalCount === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={() => handleOpenCreateModal()}>
                  + Thêm Bài Tập Đầu Tiên
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLoadSamples}>
                  Nạp Bài Tập Mẫu
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredAssignments.map((assignment, index) => {
              const deadlineInfo = formatDeadlineDisplay(assignment.deadline, now);
              const isExpanded = Boolean(expandedIds[assignment.id]);
              const isUrgent = Boolean(assignment.isUrgent || assignment.priority === 'high');
              const { name: subjectName, code: subjectCode } = parseSubjectInfo(assignment.subject);

              // Status badge styling
              let badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
              if (assignment.completed) {
                badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
              } else if (deadlineInfo.status === 'overdue') {
                badgeColor = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
              } else if (deadlineInfo.status === 'today') {
                badgeColor = 'bg-rose-900/80 text-rose-200 border-rose-400/50';
              } else if (deadlineInfo.status === 'soon') {
                badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
              }

              return (
                <div
                  key={assignment.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    assignment.completed
                      ? 'bg-[#0E122B]/80 border-slate-800 opacity-80'
                      : isUrgent
                      ? 'bg-gradient-to-r from-rose-950/35 via-[#14183E] to-[#0F132E] border-rose-500/60 hover:border-rose-400 shadow-lg shadow-rose-950/30'
                      : deadlineInfo.status === 'overdue'
                      ? 'bg-gradient-to-r from-rose-950/20 via-[#121638] to-[#0F132E] border-rose-900/60 hover:border-rose-700/80 shadow-md'
                      : deadlineInfo.status === 'today'
                      ? 'bg-gradient-to-r from-amber-950/20 via-[#121638] to-[#0F132E] border-amber-900/60 hover:border-amber-600/80 shadow-md'
                      : 'bg-[#101435] border-slate-700/70 hover:border-cyan-500/50 hover:shadow-lg'
                  }`}
                >
                  {/* Top Row: Checkbox, Course Code, Subject Name, Urgent Badge, Index, and Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(assignment.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer border ${
                          assignment.completed
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'bg-[#0B0E24] border-slate-600 hover:border-cyan-400 text-transparent hover:text-cyan-400/40'
                        }`}
                        title={assignment.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                        aria-label={`Trạng thái bài tập: ${assignment.completed ? 'Đã xong' : 'Chưa xong'}`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      {/* Badges Flow: Course code badge + Subject badge + Urgent badge + Index */}
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                        {subjectCode && (
                          <span className="font-pixel text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-900/70 text-cyan-200 border border-cyan-400/50 shrink-0 shadow-xs">
                            {subjectCode}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 break-words leading-normal max-w-full">
                          {subjectName}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-500/70 text-rose-300 text-[10px] font-bold font-pixel flex items-center gap-1 shadow-sm shrink-0">
                            <Flame className="w-3 h-3 text-rose-400 fill-rose-500 animate-pulse" />
                            <span>GẤP</span>
                          </span>
                        )}
                        <span className="text-[10px] font-pixel text-slate-500 shrink-0">
                          #{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Edit, Delete */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(assignment)}
                        className="p-1.5 rounded-lg bg-[#0F132E] hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-slate-700/60 transition-colors cursor-pointer"
                        title="Sửa bài tập"
                        aria-label="Sửa bài tập"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentToDelete(assignment)}
                        className="p-1.5 rounded-lg bg-[#0F132E] hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700/60 transition-colors cursor-pointer"
                        title="Xóa bài tập"
                        aria-label="Xóa bài tập"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Assignment Title: Clean and prominent, full width under badges */}
                  <div className="pl-8.5 sm:pl-9">
                    <h3
                      className={`font-bold font-heading text-sm sm:text-base text-slate-100 leading-snug break-words ${
                        assignment.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {assignment.title}
                    </h3>
                  </div>

                  {/* Meta Bar: Deadline Pill, Exact Date/Time, and Expandable Toggle */}
                  <div className="pl-8.5 sm:pl-9 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Deadline relative badge */}
                      <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${badgeColor}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-pixel font-bold">{deadlineInfo.relative}</span>
                      </div>

                      {/* Formatted full date & time */}
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-[#0B0E24]/70 px-2.5 py-1 rounded-xl border border-slate-700/60 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Hạn nộp: <strong className="text-slate-100 font-semibold">{deadlineInfo.formatted}</strong></span>
                      </div>
                    </div>

                    {/* Toggle description button */}
                    {assignment.description && assignment.description.length > 70 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(assignment.id)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-0.5 cursor-pointer ml-auto"
                      >
                        <span>{isExpanded ? 'Thu gọn' : 'Xem mô tả'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Description Preview / Content */}
                  {assignment.description && (
                    <div className="pl-8.5 sm:pl-9">
                      <p
                        className={`text-xs text-slate-300 leading-relaxed bg-[#0B0E24]/50 p-2.5 rounded-xl border border-slate-800/80 break-words ${
                          isExpanded || assignment.description.length <= 70 ? '' : 'line-clamp-2'
                        }`}
                      >
                        {assignment.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingAssignment ? 'Chỉnh Sửa Bài Tập' : 'Thêm Bài Tập Mới'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="space-y-3.5">
            {/* Tên bài tập */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Tên bài tập <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Tên bài tập..."
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Môn học */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Môn học <span className="text-rose-400">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  placeholder="Môn học..."
                  maxLength={60}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />

                {/* Quick suggestions from timetable */}
                {availableSubjects.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {availableSubjects.slice(0, 4).map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setFormSubject(subj)}
                        className={`text-xs font-sans font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer max-w-[220px] truncate ${
                          formSubject === subj
                            ? 'bg-cyan-600 text-white border-cyan-400 shadow-xs'
                            : 'bg-[#161B40] text-slate-300 border-slate-700 hover:border-cyan-500/50'
                        }`}
                        title={subj}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian / Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Hạn chót (Deadline) <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
              />
            </div>

            {/* Mô tả bài tập */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Mô tả bài tập
              </label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Ghi chú thêm về yêu cầu nộp bài (tùy chọn)..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F132E] border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 resize-none transition-colors"
              />
            </div>

            {/* Tuỳ chọn Gấp / Quan trọng (Optional) */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsUrgent}
                onChange={e => setFormIsUrgent(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-[#0F132E] border-slate-700 focus:ring-rose-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-rose-300 font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Quan trọng / Gấp</span>
              </span>
            </label>

            {/* Trạng thái hoàn thành toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formCompleted}
                onChange={e => setFormCompleted(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-600 bg-[#0F132E] border-slate-700 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-xs text-slate-300">
                Đã hoàn thành
              </span>
            </label>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-700/60">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingAssignment ? 'Lưu Thay Đổi' : 'Thêm Bài Tập'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(assignmentToDelete)}
        onClose={() => setAssignmentToDelete(null)}
        title="Xác Nhận Xóa Bài Tập"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed">
            Bạn có chắc chắn muốn xóa bài tập{' '}
            <strong className="text-rose-400">{assignmentToDelete?.title}</strong> khỏi danh sách?
          </p>

          <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-700/80 text-xs text-slate-300 space-y-1">
            <div>
              Môn học: <strong className="text-cyan-300">{assignmentToDelete?.subject}</strong>
            </div>
            <div>
              Hạn chót: <strong className="text-amber-300">{assignmentToDelete?.deadline}</strong>
            </div>
            <div className="text-[11px] text-rose-400 pt-1">
              * Dữ liệu bài tập sẽ được xóa vĩnh viễn khỏi thiết bị của bạn.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-700/60">
            <Button variant="secondary" size="sm" onClick={() => setAssignmentToDelete(null)}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
              Xác Nhận Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
