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
      category="university"
      className="p-4 sm:p-6 space-y-5 overflow-hidden"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-[var(--ink)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--sky)] border-2 border-[var(--sky)] text-xs font-bold font-pixel tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-[var(--sky)]" />
              <span>MODULE QUẢN LÝ BÀI TẬP</span>
            </span>
            <span className="text-xs text-[var(--muted)] font-medium">
              Sắp xếp theo hạn chót (Deadline từ sớm đến muộn)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading text-[var(--text)] mt-1.5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--sky)]" />
            <span>Nhiệm Vụ Học Tập & Deadline Đại Học</span>
          </h2>
          <p className="text-sm text-[var(--muted)] mt-0.5 leading-relaxed">
            Theo dõi, thêm mới, chỉnh sửa và hoàn thành từng bài tập môn học. Dữ liệu tự động lưu trữ an toàn vào máy của bạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Bài Tập Mới</span>
          </Button>

          {onGoToTimetable && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGoToTimetable}
              className="flex items-center gap-1.5 text-xs text-[var(--sky)] border-[var(--sky)]"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[var(--sky)]" />
              <span>Xem Thời Khóa Biểu</span>
            </Button>
          )}

          {totalCount === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadSamples}
              className="flex items-center gap-1.5 text-xs text-[var(--gold)] border-[var(--gold)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>Nạp Bài Mẫu</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted)] font-pixel">TỔNG BÀI TẬP</div>
            <div className="text-lg sm:text-xl font-num text-[var(--text)] mt-1">{totalCount}</div>
          </div>
          <BookOpen className="w-6 h-6 text-[var(--sky)]" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted)] font-pixel">CHƯA LÀM</div>
            <div className="text-lg sm:text-xl font-num text-[var(--gold)] mt-1">{pendingCount}</div>
          </div>
          <Clock className="w-6 h-6 text-[var(--gold)]" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted)] font-pixel">GẤP / HÔM NAY</div>
            <div className="text-lg sm:text-xl font-num text-[var(--danger)] mt-1">{urgentCount}</div>
          </div>
          <Flame className="w-6 h-6 text-[var(--danger)]" />
        </div>

        <div className="p-3 sm:p-3.5 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted)] font-pixel">ĐÃ HOÀN THÀNH</div>
            <div className="text-lg sm:text-xl font-num text-[var(--green)] mt-1">{completedCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[var(--green)]" />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài tập, môn học, mã môn..."
            className="pixel-input w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Filter buttons & Subject dropdown for mobile & tablet */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="pixel-tab-list flex items-center gap-1 p-1 overflow-x-auto w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[var(--gold)] text-[var(--ink)] border border-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Tất cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-[var(--sky)] text-[var(--ink)] border border-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Chưa làm ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('due_soon')}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                statusFilter === 'due_soon'
                  ? 'bg-[var(--danger)] text-[var(--ink)] border border-[var(--ink)]'
                  : 'text-[var(--danger)] hover:text-[var(--text)]'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Gấp ({urgentCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'bg-[var(--green)] text-[var(--ink)] border border-[var(--ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
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
              className="pixel-input w-full sm:w-auto px-3 py-2 text-xs text-[var(--text)] cursor-pointer shrink-0 max-w-full sm:max-w-[200px] truncate"
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
          <div className="text-center py-10 px-4 rounded-[2px] bg-[var(--bg)] border-2 border-dashed border-[#3B4474] space-y-3">
            <ClipboardList className="w-10 h-10 mx-auto text-[var(--muted)]" />
            <div className="space-y-1">
              <h4 className="font-bold text-[var(--text)] text-sm">
                {searchQuery || statusFilter !== 'all' || selectedSubjectFilter !== 'all'
                  ? 'Không tìm thấy bài tập nào khớp với bộ lọc'
                  : 'Chưa có bài tập nào trong danh sách'}
              </h4>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
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
              let badgeColor = 'bg-[var(--bg)] text-[var(--sky)] border-[var(--sky)]';
              if (assignment.completed) {
                badgeColor = 'bg-[var(--bg)] text-[var(--green)] border-[var(--green)]';
              } else if (deadlineInfo.status === 'overdue' || deadlineInfo.status === 'today') {
                badgeColor = 'bg-[var(--bg)] text-[var(--danger)] border-[var(--danger)]';
              } else if (deadlineInfo.status === 'soon') {
                badgeColor = 'bg-[var(--bg)] text-[var(--gold)] border-[var(--gold)]';
              }

              return (
                <div
                  key={assignment.id}
                  className={`p-3.5 sm:p-4 rounded-[2px] border-2 transition-colors flex flex-col gap-2.5 shadow-[4px_5px_0_0_var(--ink)] ${
                    assignment.completed
                      ? 'bg-[var(--bg)] border-[#3B4474] opacity-75'
                      : isUrgent || deadlineInfo.status === 'overdue'
                      ? 'bg-[var(--panel-2)] border-[var(--danger)]'
                      : deadlineInfo.status === 'today'
                      ? 'bg-[var(--panel-2)] border-[var(--gold)]'
                      : 'bg-[var(--bg)] border-[#3B4474] hover:border-[var(--sky)]'
                  }`}
                >
                  {/* Top Row: Checkbox, Course Code, Subject Name, Urgent Badge, Index, and Actions */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(assignment.id)}
                        className={`mt-0.5 w-6 h-6 rounded-[2px] flex items-center justify-center shrink-0 transition-colors cursor-pointer border-2 ${
                          assignment.completed
                            ? 'bg-[var(--green)] border-[var(--ink)] text-[var(--ink)]'
                            : 'bg-[var(--panel)] border-[#3B4474] hover:border-[var(--gold)] text-transparent hover:text-[var(--gold)]'
                        }`}
                        title={assignment.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu đã hoàn thành'}
                        aria-label={`Trạng thái bài tập: ${assignment.completed ? 'Đã xong' : 'Chưa xong'}`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      {/* Badges Flow: Course code badge + Subject badge + Urgent badge + Index */}
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                        {subjectCode && (
                          <span className="font-num text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--panel)] text-[var(--sky)] border border-[var(--sky)] shrink-0">
                            {subjectCode}
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-[2px] bg-[var(--panel)] text-[var(--text)] border border-[#3B4474] break-words leading-normal max-w-full">
                          {subjectName}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg)] border border-[var(--danger)] text-[var(--danger)] text-xs font-bold font-pixel flex items-center gap-1 shrink-0">
                            <Flame className="w-3 h-3 text-[var(--danger)]" />
                            <span>GẤP</span>
                          </span>
                        )}
                        <span className="text-[10px] font-num text-[var(--muted)] shrink-0">
                          #{index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons: Edit, Delete */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(assignment)}
                        className="p-1.5 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--sky)] border-2 border-[#3B4474] transition-colors cursor-pointer"
                        title="Sửa bài tập"
                        aria-label="Sửa bài tập"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignmentToDelete(assignment)}
                        className="p-1.5 rounded-[2px] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--danger)] border-2 border-[#3B4474] transition-colors cursor-pointer"
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
                      className={`font-bold font-heading text-sm sm:text-base text-[var(--text)] leading-snug break-words ${
                        assignment.completed ? 'line-through text-[var(--muted)]' : ''
                      }`}
                    >
                      {assignment.title}
                    </h3>
                  </div>

                  {/* Meta Bar: Deadline Pill, Exact Date/Time, and Expandable Toggle */}
                  <div className="pl-8.5 sm:pl-9 flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-[var(--ink)]">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Deadline relative badge */}
                      <div className={`px-2.5 py-1 rounded-[2px] border text-xs font-medium flex items-center gap-1.5 ${badgeColor}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-pixel font-bold">{deadlineInfo.relative}</span>
                      </div>

                      {/* Formatted full date & time */}
                      <div className="text-xs text-[var(--muted)] flex items-center gap-1.5 bg-[var(--panel)] px-2.5 py-1 rounded-[2px] border border-[#3B4474]">
                        <Calendar className="w-3.5 h-3.5 text-[var(--sky)] shrink-0" />
                        <span>Hạn nộp: <strong className="text-[var(--text)] font-semibold">{deadlineInfo.formatted}</strong></span>
                      </div>
                    </div>

                    {/* Toggle description button */}
                    {assignment.description && assignment.description.length > 70 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(assignment.id)}
                        className="text-xs text-[var(--gold)] hover:text-[var(--text)] font-medium inline-flex items-center gap-0.5 cursor-pointer ml-auto"
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
                        className={`text-xs text-[var(--muted)] leading-relaxed bg-[var(--panel)] p-2.5 rounded-[2px] border border-[#3B4474] break-words ${
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
              <label className="text-xs font-bold text-[var(--muted)]">
                Tên bài tập <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Tên bài tập..."
                maxLength={100}
                className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
              />
            </div>

            {/* Môn học */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted)]">
                Môn học <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  placeholder="Môn học..."
                  maxLength={60}
                  className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)]"
                />

                {/* Quick suggestions from timetable */}
                {availableSubjects.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {availableSubjects.slice(0, 4).map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setFormSubject(subj)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-[2px] border-2 transition-colors cursor-pointer max-w-[220px] truncate ${
                          formSubject === subj
                            ? 'bg-[var(--gold)] text-[var(--ink)] border-[var(--ink)] font-bold'
                            : 'bg-[var(--bg)] text-[var(--muted)] border-[#3B4474] hover:border-[var(--gold)]'
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
              <label className="text-xs font-bold text-[var(--muted)]">
                Hạn chót (Deadline) <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="datetime-local"
                value={formDeadline}
                onChange={e => setFormDeadline(e.target.value)}
                className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] cursor-pointer"
              />
            </div>

            {/* Mô tả bài tập */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--muted)]">
                Mô tả bài tập
              </label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Ghi chú thêm về yêu cầu nộp bài (tùy chọn)..."
                rows={3}
                className="pixel-input w-full px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] resize-none"
              />
            </div>

            {/* Tuỳ chọn Gấp / Quan trọng (Optional) */}
            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsUrgent}
                onChange={e => setFormIsUrgent(e.target.checked)}
                className="w-4 h-4 rounded-[2px] accent-[var(--danger)] bg-[var(--bg)] border-[#3B4474] cursor-pointer"
              />
              <span className="text-xs text-[var(--danger)] font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[var(--danger)]" />
                <span>Quan trọng / Gấp</span>
              </span>
            </label>

            {/* Trạng thái hoàn thành toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formCompleted}
                onChange={e => setFormCompleted(e.target.checked)}
                className="w-4 h-4 rounded-[2px] accent-[var(--green)] bg-[var(--bg)] border-[#3B4474] cursor-pointer"
              />
              <span className="text-xs text-[var(--muted)]">
                Đã hoàn thành
              </span>
            </label>
          </div>

          {formError && (
            <div className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--danger)] text-[var(--danger)] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[var(--ink)]">
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
          <p className="text-sm text-[var(--text)] leading-relaxed">
            Bạn có chắc chắn muốn xóa bài tập{' '}
            <strong className="text-[var(--danger)]">{assignmentToDelete?.title}</strong> khỏi danh sách?
          </p>

          <div className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[#3B4474] text-xs text-[var(--muted)] space-y-1">
            <div>
              Môn học: <strong className="text-[var(--sky)]">{assignmentToDelete?.subject}</strong>
            </div>
            <div>
              Hạn chót: <strong className="text-[var(--gold)]">{assignmentToDelete?.deadline}</strong>
            </div>
            <div className="text-xs text-[var(--danger)] pt-1">
              * Dữ liệu bài tập sẽ được xóa vĩnh viễn khỏi thiết bị của bạn.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[var(--ink)]">
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
