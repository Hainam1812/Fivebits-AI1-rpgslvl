import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { selectActiveEvents } from '../store/selectors.js';
import { EXAMS } from '../data/exams/index.js';
import { ExamDef, ExamQuestion } from '../data/exams/types.js';
import { PersonalExamGoal } from '../store/types.js';
import { pickExamQuestions, calculateExamHearts, gradeExamSession, deleteExamSchedule } from '../domain/exams.js';
import { saveStateToStorageImmediate } from '../store/persistence.js';
import { CharacterSprite } from '../components/game/CharacterSprite.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { DifficultyBadge } from '../components/ui/Badge.js';

import {
  CalendarCheck2,
  Swords,
  Calendar,
  Heart,
  Clock,
  Check,
  AlertCircle,
  Trophy,
  Sparkles,
  ChevronRight,
  Trash2,
  Plus,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, dispatch, now } = useGame();

  const currentTab = searchParams.get('tab') || 'events';

  const setTab = (tab: string) => {
    searchParams.set('tab', tab);
    setSearchParams(searchParams);
  };

  const activeEvents = selectActiveEvents(state, now);

  // Exam Arena State
  const [selectedExam, setSelectedExam] = useState<ExamDef | null>(null);
  const [isExamActive, setIsExamActive] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [hearts, setHearts] = useState(4);
  const [bossHp, setBossHp] = useState(1000);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [timerSec, setTimerSec] = useState(30);
  const [isQuestionAnswered, setIsQuestionAnswered] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);

  // Personal Exam Goal state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<PersonalExamGoal | null>(null);

  const confirmDeleteExam = () => {
    if (!examToDelete) return;
    const examId = examToDelete.id;
    // 1. Dispatch action to state
    dispatch({ type: 'REMOVE_PERSONAL_EXAM', payload: { id: examId } });
    // 2. Immediately persist to localStorage to guarantee synchronization
    const updatedExams = deleteExamSchedule(state.personalExams, examId);
    saveStateToStorageImmediate({
      ...state,
      personalExams: updatedExams,
    });
    // 3. Clear modal
    setExamToDelete(null);
  };


  // Keyboard shortcut listener (keys 1, 2, 3, 4) during exam
  useEffect(() => {
    if (!isExamActive || isQuestionAnswered || examResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        handleAnswer(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExamActive, isQuestionAnswered, examResult, currentQIndex, examQuestions]);

  // Exam 30-second timer countdown
  useEffect(() => {
    if (!isExamActive || isQuestionAnswered || examResult) return;

    const timer = setInterval(() => {
      setTimerSec(prev => {
        if (prev <= 1) {
          // Timeout counts as incorrect answer
          handleAnswer(-1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamActive, isQuestionAnswered, examResult, currentQIndex]);

  const startExam = (exam: ExamDef) => {
    const questions = pickExamQuestions(exam, 10);
    const initialHearts = calculateExamHearts(10, exam.passPercentage);
    setSelectedExam(exam);
    setExamQuestions(questions);
    setCurrentQIndex(0);
    setHearts(initialHearts);
    setBossHp(exam.bossHp);
    setUserAnswers({});
    setTimerSec(exam.timeLimitSecPerQuestion);
    setIsQuestionAnswered(false);
    setExamResult(null);
    setIsExamActive(true);
  };

  const handleAnswer = (optionIndex: number) => {
    if (isQuestionAnswered || !selectedExam) return;

    const currentQ = examQuestions[currentQIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;

    const updatedAnswers = { ...userAnswers, [currentQ.id]: optionIndex };
    setUserAnswers(updatedAnswers);
    setIsQuestionAnswered(true);

    if (isCorrect) {
      setBossHp(prev => Math.max(0, prev - Math.round(selectedExam.bossHp / 10)));
    } else {
      const nextHearts = hearts - 1;
      setHearts(nextHearts);
      if (nextHearts <= 0) {
        // Game Over early!
        setTimeout(() => {
          finishExam(updatedAnswers);
        }, 1200);
        return;
      }
    }
  };

  const nextQuestion = () => {
    if (!selectedExam) return;
    if (currentQIndex + 1 < examQuestions.length) {
      setCurrentQIndex(prev => prev + 1);
      setIsQuestionAnswered(false);
      setTimerSec(selectedExam.timeLimitSecPerQuestion);
    } else {
      finishExam(userAnswers);
    }
  };

  const finishExam = (finalAnswers: Record<string, number>) => {
    if (!selectedExam) return;
    const result = gradeExamSession(state, selectedExam, finalAnswers, examQuestions, now);
    dispatch({
      type: 'RECORD_EXAM_RESULT',
      payload: {
        historyEntry: result.historyEntry,
        addedCompletions: result.addedCompletions,
        notifications: result.notifications,
      },
    });
    setExamResult(result);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) {
      setGoalError('Vui lòng nhập tên kỳ thi/môn học.');
      return;
    }
    if (!newGoalDate) {
      setGoalError('Vui lòng chọn ngày thi.');
      return;
    }
    dispatch({
      type: 'ADD_PERSONAL_EXAM',
      payload: { title: newGoalTitle.trim(), examDate: newGoalDate },
    });
    setNewGoalTitle('');
    setNewGoalDate('');
    setGoalError(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-[var(--text)] flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-[var(--gold)]" />
            <span>Sự Kiện & Đấu Trường Thi Cử</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Nhiệm vụ theo mùa giải, boss battle ôn thi và lịch trình học thuật cá nhân
          </p>
        </div>

        {/* Tab switchers */}
        <div className="pixel-tab-list flex items-center gap-1 p-1 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'events', label: 'Sự Kiện Mùa', icon: Calendar },
            { id: 'exams', label: 'Đấu Trường Thi', icon: Swords },
            { id: 'schedule', label: 'Lịch Thi Của Tôi', icon: CalendarCheck2 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer select-none min-h-[38px] ${
                  currentTab === t.id
                    ? 'bg-[var(--gold)] text-[var(--ink)] border-2 border-[var(--ink)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] border-2 border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Seasonal Events */}
      {currentTab === 'events' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEvents.map(({ event, isActive, daysRemaining, completedTaskIds, isCleared, progressPercent }) => (
              <Card
                key={event.id}
                variant={isActive ? 'gold' : 'surface'}
                className={`p-5 space-y-4 ${isActive ? 'pixel-event-frame' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-bold uppercase font-pixel px-2 py-0.5 rounded-[2px] border-2 ${
                          isActive
                            ? 'bg-[var(--panel-2)] text-[var(--gold)] border-[var(--gold)]'
                            : 'bg-[var(--bg)] text-[var(--muted)] border-[#3B4474]'
                        }`}
                      >
                        {isActive ? `Đang diễn ra • Còn ${daysRemaining} ngày` : 'Sắp diễn ra'}
                      </span>
                      {isCleared && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--green)] border-2 border-[var(--green)] font-num">
                          CLEARED
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold font-heading text-lg text-[var(--text)] mt-2">
                      {event.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold font-num text-[var(--gold)] shrink-0">
                    +{event.clearBonusXp} XP
                  </span>
                </div>

                <p className="text-xs text-[#D5DAE8] leading-relaxed">
                  {event.description}
                </p>

                {/* Segmented Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--muted)] font-pixel">
                    <span>Tiến độ sự kiện</span>
                    <span className="font-num text-[11px] text-[var(--text)]">
                      {completedTaskIds.length}/{event.tasks.length} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="pixel-progress h-2.5">
                    <div
                      className="pixel-progress-fill bg-[var(--gold)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Tasks inside this event */}
                <div className="space-y-2 pt-2 border-t-2 border-[#2C3563]">
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                    Nhiệm vụ sự kiện:
                  </div>
                  {event.tasks.map(t => {
                    const isDone = completedTaskIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-[2px] border-2 flex items-center justify-between gap-3 text-xs ${
                          isDone
                            ? 'bg-[var(--bg)] border-[var(--green)] text-[var(--text)]'
                            : 'bg-[var(--bg)] border-[#2C3563] text-[var(--text)]'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            {isDone && <Check className="w-3.5 h-3.5 text-[var(--green)]" />}
                            <span>{t.name}</span>
                          </div>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{t.condition}</p>
                        </div>

                        {isActive && !isDone && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              dispatch({
                                type: 'COMPLETE_EVENT_TASK',
                                payload: { eventId: event.id, taskId: t.id },
                              })
                            }
                          >
                            Xong (+{t.xp} XP)
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Exam Arena */}
      {currentTab === 'exams' && (
        <div className="space-y-6">
          {!isExamActive ? (
            /* Exam Selection Grid */
            <div className="space-y-4">
              <div className="p-4 pixel-frame pixel-frame-gold text-xs text-[var(--text)] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--gold)] mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Đề ôn tập trắc nghiệm mô phỏng mang tính tham khảo tự học, không phải đề thi chính thức của trường. Mỗi kỳ thi gồm 10 câu ngẫu nhiên, đạt 70% để vượt qua và nhận thưởng XP!
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAMS.map(exam => {
                  const passKey = `exam:${exam.id}:pass`;
                  const isPassed = state.completions.some(c => c.key === passKey);
                  const perfectKey = `exam:${exam.id}:perfect`;
                  const isPerfect = state.completions.some(c => c.key === perfectKey);

                  const historyForExam = state.examHistory.filter(h => h.examId === exam.id);
                  const bestRun = historyForExam.reduce((best, cur) => (cur.score > (best?.score || 0) ? cur : best), historyForExam[0]);

                  return (
                    <Card key={exam.id} variant="surface" category={exam.category} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[var(--sky)] uppercase font-pixel">
                              {exam.category}
                            </span>
                            {isPassed && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--green)] border-2 border-[var(--green)] font-num">
                                PASSED ({bestRun?.grade || 'C'})
                              </span>
                            )}
                            {isPerfect && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-[2px] bg-[var(--panel-2)] text-[var(--gold)] border-2 border-[var(--gold)] font-num">
                                PERFECT S
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold font-heading text-lg text-[var(--text)] mt-1">
                            {exam.title}
                          </h3>
                        </div>

                        <span className="text-[11px] font-bold text-[var(--gold)] font-num shrink-0">
                          +50 XP
                        </span>
                      </div>

                      <p className="text-xs text-[#D5DAE8] leading-relaxed">
                        {exam.shortDesc}
                      </p>

                      <div className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--ink)] text-xs text-[#D5DAE8] flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-[var(--muted)]">Trùm bảo vệ:</span> <strong>{exam.bossName}</strong>
                        </div>
                        <div className="text-xs text-[var(--muted)] font-pixel">
                          10 câu • 30s/câu • Đạt 70%
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-[var(--muted)]">
                          Đã thi: <strong className="text-[var(--text)]">{historyForExam.length} lần</strong>
                        </span>
                        <Button
                          variant={isPassed ? 'secondary' : 'gold'}
                          icon={<Swords className="w-4 h-4" />}
                          onClick={() => startExam(exam)}
                        >
                          {isPassed ? 'Thi lại cải thiện' : 'Vào Đấu Trường'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : examResult ? (
            /* Results Screen */
            <Card variant="gold" className="p-6 text-center space-y-6 max-w-lg mx-auto">
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto rounded-[2px] bg-[var(--panel-2)] border-[3px] border-[var(--gold)] shadow-[inset_0_0_0_2px_var(--ink)] flex items-center justify-center text-2xl font-bold font-num text-[var(--gold)]">
                  {examResult.historyEntry.grade}
                </div>
                <h2 className="text-2xl font-black font-heading text-[var(--text)]">
                  {examResult.historyEntry.passed ? 'CHIẾN THẮNG TRÙM CUỐI!' : 'THẤT BẠI TRONG ĐẤU TRƯỜNG'}
                </h2>
                <p className="text-sm text-[#D5DAE8]">
                  Điểm số: <strong className="text-[var(--gold)] font-num text-xs">{examResult.historyEntry.score}/{examResult.historyEntry.totalQuestions} ({examResult.historyEntry.percentage}%)</strong>
                </p>
              </div>

              {examResult.addedCompletions.length > 0 && (
                <div className="p-3 bg-[var(--bg)] border-2 border-[var(--green)] rounded-[2px] text-xs text-[var(--green)] font-pixel">
                  Thưởng lần đầu: +{examResult.addedCompletions.reduce((s: any, c: any) => s + c.xp, 0)} XP đã ghi vào sổ cái!
                </div>
              )}

              {/* Review wrong answers */}
              {examResult.historyEntry.wrongQuestionIds.length > 0 && (
                <div className="text-left space-y-3 pt-3 border-t-2 border-[#2C3563] max-h-60 overflow-y-auto">
                  <div className="text-xs font-bold uppercase text-[var(--muted)]">
                    Xem lại câu trả lời chưa đúng:
                  </div>
                  {examQuestions
                    .filter(q => examResult.historyEntry.wrongQuestionIds.includes(q.id))
                    .map(q => (
                      <div key={q.id} className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--ink)] text-xs space-y-1">
                        <div className="font-bold text-[var(--text)]">{q.question}</div>
                        <div className="text-[var(--green)] font-semibold">
                          Đáp án đúng: {q.options[q.correctIndex]}
                        </div>
                        <div className="text-[var(--muted)] text-xs">{q.explanation}</div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setIsExamActive(false)}>
                  Rời Đấu Trường
                </Button>
                {selectedExam && (
                  <Button variant="gold" fullWidth onClick={() => startExam(selectedExam)}>
                    Thi Lại
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            /* Live Boss Battle Quiz Screen */
            selectedExam && (
              <div className="space-y-5 max-w-2xl mx-auto">
                {/* Boss Battle HUD */}
                <div className="p-4 pixel-frame pixel-frame-gold flex items-center justify-between gap-4">
                  {/* Player HP / Hearts */}
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center">
                      <CharacterSprite characterId={state.profile.characterId} scale={0.7} />
                    </div>
                    <div>
                      <div className="text-xs text-[var(--muted)] font-pixel">Người Chơi</div>
                      <div className="flex gap-1 text-[var(--danger)] text-sm">
                        {Array.from({ length: Math.max(0, hearts) }).map((_, i) => (
                          <Heart key={i} className="w-4 h-4 fill-[var(--danger)] text-[var(--danger)]" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 30-sec Timer */}
                  <div className="flex flex-col items-center">
                    <div className="w-11 h-11 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--gold)] flex items-center justify-center font-num text-sm font-bold text-[var(--gold)]">
                      {timerSec}
                    </div>
                    <span className="text-xs text-[var(--muted)] mt-0.5 font-pixel">Giây</span>
                  </div>

                  {/* Boss Info & HP */}
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-xs text-[var(--gold)] font-pixel">{selectedExam.bossName}</div>
                      <div className="text-xs font-bold text-[var(--text)]">Máu: <span className="font-num text-[11px]">{bossHp} HP</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-xl">
                      👹
                    </div>
                  </div>
                </div>

                {/* Question Card */}
                {examQuestions[currentQIndex] && (
                  <Card variant="surface" className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs text-[var(--muted)] font-pixel">
                      <span>CÂU {currentQIndex + 1} / {examQuestions.length}</span>
                      <span>Chủ đề: {examQuestions[currentQIndex].topic}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-heading leading-relaxed">
                      {examQuestions[currentQIndex].question}
                    </h3>

                    {/* Options (1-4) */}
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {examQuestions[currentQIndex].options.map((option, idx) => {
                        const isChosen = userAnswers[examQuestions[currentQIndex].id] === idx;
                        const isCorrectOption = idx === examQuestions[currentQIndex].correctIndex;

                        let btnStyle = 'bg-[var(--bg)] border-[#3B4474] text-[var(--text)] hover:border-[var(--gold)]';
                        if (isQuestionAnswered) {
                          if (isCorrectOption) {
                            btnStyle = 'bg-[var(--panel-2)] border-[var(--green)] text-[var(--green)] font-bold';
                          } else if (isChosen) {
                            btnStyle = 'bg-[var(--panel-2)] border-[var(--danger)] text-[var(--danger)]';
                          } else {
                            btnStyle = 'bg-[var(--bg)] border-[var(--ink)] text-[var(--muted)]';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAnswer(idx)}
                            disabled={isQuestionAnswered}
                            className={`p-3.5 rounded-[2px] border-2 text-left text-xs sm:text-sm transition-colors flex items-center gap-3 cursor-pointer min-h-[44px] ${btnStyle}`}
                          >
                            <span className="w-7 h-7 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center font-num text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation feedback */}
                    {isQuestionAnswered && (
                      <div className="p-3.5 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] text-xs text-[var(--text)] space-y-1 animate-fade-in">
                        <div className="font-bold text-[var(--gold)]">Giải thích:</div>
                        <div>{examQuestions[currentQIndex].explanation}</div>
                      </div>
                    )}

                    {/* Next Button */}
                    {isQuestionAnswered && (
                      <div className="pt-2">
                        <Button variant="primary" fullWidth onClick={nextQuestion}>
                          {currentQIndex + 1 < examQuestions.length ? 'Câu Tiếp Theo' : 'Xem Kết Quả Trận Đấu'}
                        </Button>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Tab 3: Personal Exam Goals */}
      {currentTab === 'schedule' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Add Goal Form */}
          <Card variant="surface" className="p-5 space-y-4">
            <h3 className="font-bold font-heading text-base text-[var(--text)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--gold)]" />
              <span>Thêm Môn Thi Sắp Tới</span>
            </h3>

            <form onSubmit={handleAddGoal} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={e => setNewGoalTitle(e.target.value)}
                  placeholder="Tên môn thi (VD: Vi Tích Phân 1, Python...)"
                  maxLength={40}
                  className="pixel-input px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] min-h-[44px]"
                />
                <input
                  type="date"
                  value={newGoalDate}
                  onChange={e => setNewGoalDate(e.target.value)}
                  className="pixel-input px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] min-h-[44px]"
                />
              </div>

              {goalError && <p className="text-xs text-[var(--danger)] font-medium">{goalError}</p>}

              <Button variant="gold" size="sm" type="submit" fullWidth>
                Lưu Lịch Thi (Đếm Ngược)
              </Button>
            </form>
          </Card>

          {/* List of goals */}
          <div className="space-y-3">
            <h3 className="font-bold font-heading text-sm text-[var(--text)]">
              Danh Sách Lịch Thi Của Bạn ({state.personalExams.length}/10)
            </h3>

            {state.personalExams.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic p-4 text-center pixel-frame pixel-frame-muted">
                Chưa có lịch thi nào được lưu. Hãy thêm môn thi sắp tới để nhận nhắc nhở ôn luyện!
              </p>
            ) : (
              state.personalExams.map(goal => {
                const targetDate = new Date(goal.examDate);
                const diffTime = targetDate.getTime() - now.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft >= 0 && daysLeft <= 7;

                return (
                  <Card
                    key={goal.id}
                    variant={isUrgent ? 'gold' : 'surface'}
                    className="p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-[var(--text)]">{goal.title}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        Ngày thi: {goal.examDate} •{' '}
                        {daysLeft > 0 ? (
                          <strong className={isUrgent ? 'text-[var(--gold)] font-pixel' : 'text-[var(--text)] font-pixel'}>
                            Còn {daysLeft} ngày
                          </strong>
                        ) : daysLeft === 0 ? (
                          <strong className="text-[var(--danger)] font-pixel">HÔM NAY!</strong>
                        ) : (
                          <span className="text-[var(--muted)]">Đã qua</span>
                        )}
                      </div>
                      {isUrgent && (
                        <p className="text-xs text-[var(--gold)] mt-1">
                          ⚡ Còn dưới 7 ngày! Đừng quên ghé Đấu trường thi để luyện đề giữ phong độ nhé!
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setTab('exams')}
                        >
                          Luyện đề
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExamToDelete(goal)}
                        className="p-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--panel-2)] rounded-[2px] border border-transparent hover:border-[var(--danger)] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={`Xóa lịch thi ${goal.title}`}
                        aria-label={`Xóa lịch thi ${goal.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Exam Confirmation Modal (replaces browser confirm) */}
      <Modal
        isOpen={Boolean(examToDelete)}
        onClose={() => setExamToDelete(null)}
        title="Xác Nhận Xóa Lịch Thi"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text)] leading-relaxed">
            Bạn có chắc chắn muốn xóa lịch thi môn{' '}
            <strong className="text-[var(--gold)] font-bold">{examToDelete?.title}</strong>?
          </p>
          <div className="p-3 rounded-[2px] bg-[var(--bg)] border-2 border-[#2C3563] text-xs text-[#D5DAE8] space-y-1.5">
            <div>
              <span className="text-[var(--muted)]">Ngày thi: </span>
              <strong className="text-[var(--text)] font-pixel">{examToDelete?.examDate}</strong>
            </div>
            <div className="text-xs text-[var(--danger)] flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Dữ liệu lịch thi này sẽ được xóa hoàn toàn khỏi hệ thống lưu trữ ngay lập tức.</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-[#2C3563]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExamToDelete(null)}
            >
              Hủy Bỏ
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteExam}
            >
              Xác Nhận Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

