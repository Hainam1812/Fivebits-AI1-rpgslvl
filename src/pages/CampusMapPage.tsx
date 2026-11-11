import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { CAMPUS_LOCATIONS, LocationDef } from '../data/locations.js';
import { getAllLocationsMastery, getCampusHotspot } from '../domain/locations.js';
import { CharacterSprite } from '../components/game/CharacterSprite.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { QuestCard } from '../components/game/QuestCard.js';
import { QuestDetailModal } from '../components/game/QuestDetailModal.js';
import { DAILY_QUESTS } from '../data/dailyQuests.js';
import { QUEST_PACKAGES } from '../data/questPackages.js';
import { isDailyQuestCompleted, sortQuestsByCompletionStatus } from '../domain/quests.js';
import { isTaskCompleted, canAttemptTask } from '../domain/packages.js';
import { getDateKey } from '../domain/dates.js';
import {
  Map as MapIcon,
  List,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Compass,
  Calendar,
  ZoomIn,
  ZoomOut,
  Maximize2,
  LocateFixed,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { TimeTableBuilder } from '../components/game/TimeTableBuilder.js';
import { AssignmentManager } from '../components/game/AssignmentManager.js';


const baseUrl = (import.meta.env?.BASE_URL || './').replace(/\/$/, '');
const getAvatarUrl = (file?: string) => (file ? `${baseUrl}/assets/aistudio/${file}?v=navy` : '');

interface CampusMapPageProps {
  defaultView?: 'map' | 'list' | 'assignments' | 'timetable';
}

export const CampusMapPage: React.FC<CampusMapPageProps> = ({ defaultView }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, dispatch, now } = useGame();

  const urlLocId = searchParams.get('loc');
  const urlView = searchParams.get('tab') || searchParams.get('view');
  const initialView: 'map' | 'list' | 'assignments' | 'timetable' =
    urlView === 'timetable'
      ? 'timetable'
      : urlView === 'assignments'
      ? 'assignments'
      : urlView === 'list'
      ? 'list'
      : urlView === 'map'
      ? 'map'
      : defaultView || 'map';

  const [selectedLocId, setSelectedLocId] = useState<string>(
    urlLocId || state.lastLocationId || 'classroom'
  );
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'assignments' | 'timetable'>(initialView);
  const [selectedQuest, setSelectedQuest] = useState<any | null>(null);

  // Map Zoom & Pan State & Controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const dragDistanceRef = useRef<number>(0);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const MIN_ZOOM = 0.45;
  const MAX_ZOOM = 2.8;
  const ZOOM_STEP = 0.25;

  const clampPan = (newX: number, newY: number, currentZoom: number): { x: number; y: number } => {
    if (!mapContainerRef.current) return { x: newX, y: newY };
    const rect = mapContainerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Content bounds around center (handles both zoomed-in and zoomed-out states)
    const maxPanX = Math.max(35, Math.abs(width * (currentZoom - 1)) / 2 + 35);
    const maxPanY = Math.max(35, Math.abs(height * (currentZoom - 1)) / 2 + 35);

    const clampedX = Math.min(Math.max(newX, -maxPanX), maxPanX);
    const clampedY = Math.min(Math.max(newY, -maxPanY), maxPanY);

    return { x: clampedX, y: clampedY };
  };

  const centerOnLocation = (locX: number, locY: number, targetZoom = Math.max(zoom, 1.4)) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const dxFraction = (400 - locX) / 800;
    const dyFraction = (240 - locY) / 480;

    const targetX = dxFraction * width * targetZoom;
    const targetY = dyFraction * height * targetZoom;

    const clamped = clampPan(targetX, targetY, targetZoom);
    setZoom(targetZoom);
    setPan(clamped);
  };

  const handleLocationClick = (locId: string, locX: number, locY: number) => {
    if (dragDistanceRef.current >= 8) {
      return;
    }
    selectLocation(locId);
  };

  const handleZoomIn = () => {
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.round((prev + ZOOM_STEP) * 100) / 100);
      setPan(currentPan => clampPan(currentPan.x, currentPan.y, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.round((prev - ZOOM_STEP) * 100) / 100);
      setPan(currentPan => clampPan(currentPan.x, currentPan.y, next));
      return next;
    });
  };

  const handleResetMap = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleFocusCharacter = () => {
    centerOnLocation(selectedLocation.x, selectedLocation.y, Math.max(zoom, 1.4));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    dragDistanceRef.current = Math.hypot(dx, dy);

    const nextX = dragStartRef.current.startPanX + dx;
    const nextY = dragStartRef.current.startPanY + dy;
    setPan(clampPan(nextX, nextY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistanceRef.current = 0;
      dragStartRef.current = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
      dragDistanceRef.current = 20;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.clientX;
      const dy = e.touches[0].clientY - dragStartRef.current.clientY;
      dragDistanceRef.current = Math.hypot(dx, dy);

      const nextX = dragStartRef.current.startPanX + dx;
      const nextY = dragStartRef.current.startPanY + dy;
      setPan(clampPan(nextX, nextY, zoom));
    } else if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / pinchStartDistRef.current;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, pinchStartZoomRef.current * factor));
      setZoom(Math.round(newZoom * 100) / 100);
      setPan(currentPan => clampPan(currentPan.x, currentPan.y, newZoom));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      pinchStartDistRef.current = null;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
      pinchStartDistRef.current = null;
    }
  };

  // Wheel zoom with passive: false to prevent document scroll when hovering over map
  useEffect(() => {
    if (viewMode !== 'map') return;
    const container = mapContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      if (delta === 0) return;
      const zoomDelta = delta < 0 ? 0.25 : -0.25;

      setZoom(prevZoom => {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((prevZoom + zoomDelta) * 100) / 100));
        if (nextZoom === prevZoom) return prevZoom;

        // Natural zoom towards cursor position
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const zoomRatio = nextZoom / prevZoom;
        setPan(prevPan => {
          const newPanX = mouseX - (mouseX - prevPan.x) * zoomRatio;
          const newPanY = mouseY - (mouseY - prevPan.y) * zoomRatio;
          return clampPan(newPanX, newPanY, nextZoom);
        });

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [viewMode]);

  // Sync URL param
  useEffect(() => {
    if (urlLocId && urlLocId !== selectedLocId) {
      setSelectedLocId(urlLocId);
    }
  }, [urlLocId]);

  useEffect(() => {
    if (urlView && (urlView === 'map' || urlView === 'list' || urlView === 'assignments' || urlView === 'timetable')) {
      setViewMode(urlView as 'map' | 'list' | 'assignments' | 'timetable');
    }
  }, [urlView]);

  const selectLocation = (locId: string) => {
    setSelectedLocId(locId);
    searchParams.set('loc', locId);
    setSearchParams(searchParams);
    dispatch({ type: 'SET_LAST_LOCATION', payload: { locationId: locId } });
  };

  const handleSetViewMode = (mode: 'map' | 'list' | 'assignments' | 'timetable') => {
    setViewMode(mode);
    searchParams.set('view', mode);
    setSearchParams(searchParams);
  };


  const locationsMastery = getAllLocationsMastery(state, now);
  const hotspot = getCampusHotspot(state, now);
  const selectedLocation =
    CAMPUS_LOCATIONS.find(l => l.id === selectedLocId) || CAMPUS_LOCATIONS[0];
  const selectedMastery = locationsMastery.find(m => m.location.id === selectedLocId);

  // Smooth horizontal glide position tracking directly in SVG coordinate space
  // Halved speed (duration: 420ms) with horizontal glide transition
  const [charPos, setCharPos] = useState<{ x: number; y: number; jumpY: number; isMoving: boolean }>({
    x: selectedLocation.x,
    y: selectedLocation.y,
    jumpY: 0,
    isMoving: false,
  });
  const prevLocRef = useRef<{ x: number; y: number }>({
    x: selectedLocation.x,
    y: selectedLocation.y,
  });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const targetX = selectedLocation.x;
    const targetY = selectedLocation.y;
    const startX = prevLocRef.current.x;
    const startY = prevLocRef.current.y;

    if (startX === targetX && startY === targetY) {
      setCharPos({ x: targetX, y: targetY, jumpY: 0, isMoving: false });
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    // Halved speed: duration doubled from 210ms to 420ms for smooth horizontal glide
    const duration = 420;
    const startTime = performance.now();

    const animate = (nowTime: number) => {
      const elapsed = nowTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease out for horizontal gliding motion
      const ease = 1 - Math.pow(1 - progress, 3);

      const curX = Math.round((startX + (targetX - startX) * ease) * 10) / 10;
      const curY = Math.round((startY + (targetY - startY) * ease) * 10) / 10;

      setCharPos({ x: curX, y: curY, jumpY: 0, isMoving: true });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCharPos({ x: targetX, y: targetY, jumpY: 0, isMoving: false });
        prevLocRef.current = { x: targetX, y: targetY };
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [selectedLocation.x, selectedLocation.y]);

  const dateKey = getDateKey(now);

  // Gather all quests available at the selected location
  const locationDailies = DAILY_QUESTS.filter(q => q.locationId === selectedLocId).map(q => {
    const isCompleted = isDailyQuestCompleted(state.completions, q.id, dateKey);
    const activeState = state.activeTasks[q.id];
    return {
      id: q.id,
      name: q.name,
      description: q.description,
      condition: q.condition,
      category: q.category,
      difficulty: q.difficulty,
      xp: q.xp,
      locationId: q.locationId,
      status: (activeState ? 'in_progress' : isCompleted ? 'completed' : 'todo') as any,
      startedAt: activeState?.startedAt,
      source: 'daily' as const,
    };
  });

  const locationPackageTasks: any[] = [];
  for (const pkg of QUEST_PACKAGES) {
    for (const t of pkg.tasks) {
      if (t.locationId === selectedLocId) {
        const check = canAttemptTask(state, pkg, t);
        const isDone = isTaskCompleted(state.completions, t.id);
        const activeState = state.activeTasks[t.id];
        locationPackageTasks.push({
          id: t.id,
          name: `${pkg.title}: ${t.title}`,
          description: t.description,
          condition: t.condition,
          category: t.category,
          difficulty: t.difficulty,
          xp: t.xp,
          locationId: t.locationId,
          status: activeState ? 'in_progress' : isDone ? 'completed' : check.canAttempt ? 'todo' : 'locked',
          startedAt: activeState?.startedAt,
          packageId: pkg.id,
          isBoss: t.isBoss,
          lockReason: check.reason,
          source: 'package' as const,
        });
      }
    }
  }

  const allLocationQuests = sortQuestsByCompletionStatus([
    ...locationDailies,
    ...locationPackageTasks,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            {viewMode === 'timetable' ? (
              <>
                <Calendar className="w-6 h-6 text-cyan-400" />
                <span>Thời Khóa Biểu Campus (TimeTable Builder)</span>
              </>
            ) : viewMode === 'assignments' ? (
              <>
                <ClipboardList className="w-6 h-6 text-cyan-400" />
                <span>Quản Lý Bài Tập & Deadline (Assignments)</span>
              </>
            ) : (
              <>
                <MapIcon className="w-6 h-6 text-cyan-400" />
                <span>Bản Đồ Campus (Campus Map)</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {viewMode === 'timetable'
              ? 'Lập kế hoạch lịch học 12 tiết trong tuần, tự động gộp khối tiết và lưu trữ an toàn'
              : viewMode === 'assignments'
              ? 'Theo dõi, thêm mới, sửa, xóa và quản lý bài tập theo thứ tự hạn chót deadline từ sớm đến muộn'
              : 'Khám phá 9 địa điểm rèn luyện, cày nhiệm vụ và nâng cao độ thân quen khuôn viên trường'}
          </p>
        </div>

        {/* View Mode Toggle: Map / List / Quản Lý Bài Tập / Timetable */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161B40] border border-slate-700/60 self-stretch sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => handleSetViewMode('map')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'map' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Bản Đồ</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('list')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'list' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Danh Sách</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('assignments')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'assignments' ? 'bg-cyan-600 text-white shadow' : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/30'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Quản Lý Bài Tập</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('timetable')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'timetable' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Thời Khóa Biểu</span>
          </button>
        </div>
      </div>

      {viewMode === 'assignments' ? (
        <AssignmentManager onGoToTimetable={() => handleSetViewMode('timetable')} />
      ) : viewMode === 'timetable' ? (
        <TimeTableBuilder
          onGoToMap={() => handleSetViewMode('map')}
          onGoToAssignments={() => handleSetViewMode('assignments')}
        />
      ) : (
        <>
          {/* Main View Area */}
          {viewMode === 'map' ? (

        <div
          ref={mapContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative rounded-3xl bg-[#0A0D22] border border-slate-700/80 shadow-2xl overflow-hidden p-2 sm:p-4 select-none touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Floating Map Controls Widget */}
          <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-1.5 bg-[#161B40]/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="p-2 rounded-xl bg-[#0F132E] hover:bg-violet-600/50 active:bg-violet-600 text-slate-200 hover:text-white disabled:opacity-40 disabled:hover:bg-[#0F132E] transition-colors cursor-pointer"
              title="Phóng to (+)"
              aria-label="Phóng to bản đồ"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="text-[10px] font-pixel font-bold text-cyan-300 px-1 select-none">
              {Math.round(zoom * 100)}%
            </div>

            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="p-2 rounded-xl bg-[#0F132E] hover:bg-violet-600/50 active:bg-violet-600 text-slate-200 hover:text-white disabled:opacity-40 disabled:hover:bg-[#0F132E] transition-colors cursor-pointer"
              title="Thu nhỏ (-)"
              aria-label="Thu nhỏ bản đồ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="w-full h-px bg-slate-700/60 my-0.5" />

            <button
              type="button"
              onClick={handleFocusCharacter}
              className="p-2 rounded-xl bg-[#0F132E] hover:bg-cyan-600/50 active:bg-cyan-600 text-cyan-300 hover:text-white transition-colors cursor-pointer"
              title="Định vị nhân vật"
              aria-label="Định vị nhân vật"
            >
              <LocateFixed className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetMap}
              className="p-2 rounded-xl bg-[#0F132E] hover:bg-slate-700 active:bg-slate-600 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Đặt lại góc nhìn"
              aria-label="Đặt lại góc nhìn"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Hint (Desktop only; deleted on mobile) */}
          <div className="hidden sm:block absolute bottom-4 left-4 z-30 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-[#0F132E]/85 backdrop-blur-md border border-slate-700/60 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kéo chuột để di chuyển • Cuộn để thu phóng</span>
            </div>
          </div>

          {/* Transformable Canvas Layer containing SVG and Sprite */}
          <div
            className="relative w-full aspect-[800/480] will-change-transform"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <svg
              viewBox="0 0 800 480"
              className="w-full h-full select-none"
              aria-label="Sơ đồ tương tác khuôn viên trường"
            >
              <defs>
                {/* Grass Background Pattern */}
                <pattern id="campusGrass" width="40" height="40" patternUnits="userSpaceOnUse">
                  <rect width="40" height="40" fill="#0A0E27" />
                  <circle cx="10" cy="10" r="1.5" fill="#14244D" />
                  <circle cx="30" cy="30" r="1.5" fill="#14244D" />
                </pattern>
                {/* Pathway texture */}
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E2656" />
                  <stop offset="100%" stopColor="#161B40" />
                </linearGradient>
                {/* Clip path for building pin avatar - fills frame with subtle rounded corners */}
                <clipPath id="buildingPinClip">
                  <rect x="-26" y="-26" width="52" height="52" rx="15" />
                </clipPath>
              </defs>

              {/* Background */}
              <rect width="800" height="480" fill="url(#campusGrass)" />

              {/* Campus Walkways */}
              <path
                d="M 400 45 L 400 180 L 230 130 L 150 320 L 280 400 L 390 310 L 510 400 L 650 300 L 580 140 L 400 180 L 390 310"
                stroke="url(#pathGradient)"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M 400 45 L 400 180 L 230 130 L 150 320 L 280 400 L 390 310 L 510 400 L 650 300 L 580 140 L 400 180 L 390 310"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.6"
              />

              {/* Campus Trees and Decorations */}
              <g opacity="0.4" fill="#065F46">
                <circle cx="320" cy="220" r="14" />
                <circle cx="480" cy="240" r="16" />
                <circle cx="180" cy="220" r="12" />
                <circle cx="620" cy="220" r="13" />
                <circle cx="320" cy="110" r="12" />
                <circle cx="490" cy="100" r="12" />
              </g>

              {/* Interactive Location Nodes */}
              {locationsMastery.map(({ location: loc, dailyQuestsToday, dailyQuestsDoneToday, level }) => {
                const isSelected = selectedLocId === loc.id;
                const isHot = hotspot.id === loc.id;
                const unfinished = dailyQuestsToday - dailyQuestsDoneToday;

                return (
                  <g
                    key={loc.id}
                    transform={`translate(${loc.x}, ${loc.y})`}
                    onClick={() => handleLocationClick(loc.id, loc.x, loc.y)}
                    className="cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`${loc.name}, cấp thân quen ${level}, ${unfinished} nhiệm vụ chưa làm`}
                    onKeyDown={e => e.key === 'Enter' && handleLocationClick(loc.id, loc.x, loc.y)}
                  >
                    {/* Hotspot Pulse */}
                    {isHot && (
                      <circle
                        cx="0"
                        cy="0"
                        r="34"
                        fill="none"
                        stroke="#06B6D4"
                        strokeWidth="2"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Building Base Background */}
                    <rect
                      x="-26"
                      y="-26"
                      width="52"
                      height="52"
                      rx="16"
                      fill={isSelected ? '#1E1B4B' : '#0F132E'}
                    />

                    {/* Building Inner Avatar - Zoomed in to bleed completely and fill entire pin frame */}
                    <g clipPath="url(#buildingPinClip)">
                      {loc.avatarFile ? (
                        <image
                          href={getAvatarUrl(loc.avatarFile)}
                          x="-38"
                          y="-38"
                          width="76"
                          height="76"
                          preserveAspectRatio="xMidYMid slice"
                          className="pixelated pointer-events-none select-none"
                        />
                      ) : (
                        <text
                          x="0"
                          y="6"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="14"
                          fontWeight="bold"
                          className="font-pixel pointer-events-none select-none"
                        >
                          {loc.name.charAt(0)}
                        </text>
                      )}
                    </g>

                    {/* Building Frame Outline (layered on top for crisp edge) */}
                    <rect
                      x="-26"
                      y="-26"
                      width="52"
                      height="52"
                      rx="16"
                      fill="none"
                      stroke={isSelected ? '#06B6D4' : loc.accentColor}
                      strokeWidth={isSelected ? '3.5' : '2'}
                      className="transition-all duration-200 drop-shadow-lg pointer-events-none"
                    />

                    {/* Quest Badge on top right */}
                    {unfinished > 0 && (
                      <g transform="translate(18, -18)">
                        <circle cx="0" cy="0" r="10" fill="#EF4444" stroke="#0A0E27" strokeWidth="2" />
                        <text
                          x="0"
                          y="3.5"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          className="font-pixel pointer-events-none"
                        >
                          {unfinished}
                        </text>
                      </g>
                    )}

                    {/* Label underneath */}
                    <rect
                      x="-60"
                      y="32"
                      width="120"
                      height="20"
                      rx="6"
                      fill="#0F132E"
                      opacity="0.9"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="46"
                      textAnchor="middle"
                      fill={isSelected ? '#38BDF8' : '#E2E8F0'}
                      fontSize="10"
                      fontWeight="600"
                      className="pointer-events-none select-none"
                    >
                      {loc.shortName || loc.name}
                    </text>
                  </g>
                );
              })}


              {/* Character Sprite & ground shadow in SVG coordinate space */}
              <g
                className="pointer-events-none"
                transform={`translate(${charPos.x}, ${charPos.y})`}
              >
                {/* Ground shadow beneath character with physics-based scaling */}
                <ellipse
                  cx="0"
                  cy="16"
                  rx="32"
                  ry="9"
                  fill="#000000"
                  className={charPos.isMoving ? '' : 'animate-physics-shadow'}
                  opacity={0.6}
                />

                {/* Embedded HTML character sprite with doubled size and physics jump */}
                <foreignObject
                  x="-64"
                  y="-74"
                  width="128"
                  height="128"
                  className="overflow-visible pointer-events-none"
                >
                  <div
                    className={`w-full h-full flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] ${
                      charPos.isMoving ? '' : 'animate-gentle-bob'
                    }`}
                  >
                    <CharacterSprite characterId={state.profile.characterId} scale={1.4} />
                  </div>
                </foreignObject>
              </g>
            </svg>
          </div>
        </div>
      ) : (
        /* Accessible List View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationsMastery.map(({ location: loc, level, xpEarned, dailyQuestsToday, dailyQuestsDoneToday }) => {
            const isSelected = selectedLocId === loc.id;
            const unfinished = dailyQuestsToday - dailyQuestsDoneToday;

            return (
              <Card
                key={loc.id}
                variant={isSelected ? 'glow' : 'interactive'}
                onClick={() => selectLocation(loc.id)}
                className={`p-4 border-l-4 cursor-pointer`}
                style={{ borderLeftColor: loc.accentColor }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {loc.avatarFile && (
                      <div className="w-10 h-10 rounded-lg bg-[#0F132E] border border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={getAvatarUrl(loc.avatarFile)}
                          alt={loc.name}
                          className="w-full h-full object-cover pixelated scale-[1.42]"
                        />
                      </div>
                    )}
                    <h3 className="font-bold font-heading text-sm text-slate-100 flex items-center gap-1.5 truncate">
                      <MapPin className="w-4 h-4 shrink-0" style={{ color: loc.accentColor }} />
                      <span className="truncate">{loc.name}</span>
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 font-pixel shrink-0">
                    Cấp {level}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {loc.lore}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-700/60 mt-2">
                  <span>{loc.recommendedTime}</span>
                  <span className="font-semibold text-violet-300">
                    {unfinished > 0 ? `${unfinished} nhiệm vụ chưa làm` : 'Đã xong hôm nay'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Location Details Sheet / Card */}
      <Card variant="surface" className="p-5 sm:p-6 space-y-4 border-t-4 border-t-cyan-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-700/60">
          <div className="flex items-start gap-3.5">
            {selectedLocation.avatarFile && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0F132E] border-2 border-slate-700/80 overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
                <img
                  src={getAvatarUrl(selectedLocation.avatarFile)}
                  alt={selectedLocation.name}
                  className="w-full h-full object-cover pixelated scale-[1.42]"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-cyan-400 uppercase font-pixel tracking-wider">
                  {selectedLocation.category}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-pixel">
                  Độ Thân Quen: Cấp {selectedMastery?.level || 1}/5 ({selectedMastery?.xpEarned || 0} XP)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100 mt-1">
                {selectedLocation.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {selectedLocation.lore}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Khung giờ gợi ý: <strong>{selectedLocation.recommendedTime}</strong></span>
            </span>
          </div>
        </div>

        {/* Quests Available at this Location */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-heading text-slate-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" />
            <span>Nhiệm Vụ Có Mặt Tại Địa Điểm Này ({allLocationQuests.length})</span>
          </h3>

          {allLocationQuests.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Hiện chưa có nhiệm vụ nào gắn riêng với khu vực này.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allLocationQuests.map(q => (
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
                  activeTaskState={state.activeTasks[q.id]}
                  isBoss={q.isBoss}
                  lockReason={q.lockReason}
                  onClickDetail={() => setSelectedQuest(q)}
                  onStart={
                    q.status === 'todo'
                      ? () => dispatch({ type: 'START_TASK', payload: { questId: q.id } })
                      : undefined
                  }
                  onReplay={
                    q.status === 'completed'
                      ? () => dispatch({ type: 'START_TASK', payload: { questId: q.id } })
                      : undefined
                  }
                  onPause={
                    q.status === 'in_progress' && !state.activeTasks[q.id]?.isPaused
                      ? (elapsed) => dispatch({ type: 'PAUSE_TASK', payload: { questId: q.id, elapsedSeconds: elapsed } })
                      : undefined
                  }
                  onResume={
                    q.status === 'in_progress' && state.activeTasks[q.id]?.isPaused
                      ? () => dispatch({ type: 'RESUME_TASK', payload: { questId: q.id } })
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
          )}
        </div>
      </Card>
      </>
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
    </div>
  );
};

export default CampusMapPage;
