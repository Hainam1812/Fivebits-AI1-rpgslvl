import React, { useState } from 'react';
import { useGame } from '../store/GameContext.js';
import { selectLevelProgress, selectStreak, selectTotalXp } from '../store/selectors.js';
import { CharacterStage } from '../components/game/CharacterStage.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { ShareModal } from '../components/share/ShareModal.js';
import { CharacterSelectModal } from '../components/game/CharacterSelectModal.js';
import charactersData from '../data/characters.json' with { type: 'json' };
import { getDateKey, getYesterdayKey, formatVietnameseDate } from '../domain/dates.js';
import {
  User,
  Flame,
  Trophy,
  History,
  Settings,
  Share2,
  RotateCcw,
  FastForward,
  Check,
  Sparkles,
} from 'lucide-react';
import { validateCharacterName, sanitizeCharacterInput } from '../domain/character.js';
import { ResetDataModal } from '../components/ui/ResetDataModal.js';

export const ProfilePage: React.FC = () => {
  const { state, dispatch, now, advanceDateByDays } = useGame();
  const levelProg = selectLevelProgress(state);
  const streak = selectStreak(state, now);
  const totalXp = selectTotalXp(state);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingNick, setEditingNick] = useState(state.profile.nickname || '');
  const [nickSuccess, setNickSuccess] = useState(false);
  const [nickError, setNickError] = useState<string | null>(null);

  // Compute 7-day completion activity bar chart
  const last7Days = [];
  let curKey = getDateKey(now);
  for (let i = 0; i < 7; i++) {
    last7Days.unshift(curKey);
    curKey = getYesterdayKey(curKey);
  }

  const activityByDay = last7Days.map(dateKey => {
    const count = state.completions.filter(c => c.dateKey === dateKey).length;
    const dayXp = state.completions.filter(c => c.dateKey === dateKey).reduce((s, c) => s + c.xp, 0);
    const dayName = new Date(dateKey).toLocaleDateString('vi-VN', { weekday: 'narrow' });
    return { dateKey, count, dayXp, dayName };
  });

  const maxDayXp = Math.max(1, ...activityByDay.map(d => d.dayXp));

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateCharacterName(editingNick);
    if (!val.isValid) {
      setNickError(val.error || 'Tên nhân vật không hợp lệ.');
      return;
    }

    setNickError(null);
    dispatch({ type: 'SET_PROFILE', payload: { nickname: val.cleanName } });
    setEditingNick(val.cleanName);
    setNickSuccess(true);
    setTimeout(() => setNickSuccess(false), 2000);
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Profile Card */}
      <Card variant="surface" className="p-6 relative overflow-hidden border-violet-500/40">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <CharacterStage size="md" showNameplate={false} />

          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  {levelProg.title}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
                  {state.profile.nickname || 'Tân Binh'}
                </h1>
                {(() => {
                  const activeCharId = state.profile.characterId || 'boy1';
                  const charObj = state.customCharacters?.find(c => c.id === activeCharId) ||
                    charactersData.find((c: any) => c.id === activeCharId);
                  const desc = charObj?.description || charObj?.tagline;
                  return (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 max-w-md">
                      <span className="text-cyan-300 font-semibold">{charObj?.displayName || 'Sinh Viên'}</span>
                      {desc && <span className="text-slate-400"> — {desc}</span>}
                    </p>
                  );
                })()}
              </div>

              <div className="flex items-center justify-center sm:justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={() => setIsShareOpen(true)}
                >
                  Mời bạn bè
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCharModalOpen(true)}
                >
                  Đổi nhân vật
                </Button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-pixel uppercase">Cấp Độ</div>
                <div className="text-xl font-black text-amber-400 font-pixel">LV.{levelProg.level}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-pixel uppercase">Tổng XP</div>
                <div className="text-xl font-black text-violet-300 font-pixel">{totalXp.toLocaleString()}</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0F132E] border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-pixel uppercase">Streak</div>
                <div className="text-xl font-black text-amber-300 font-pixel flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{streak.currentStreak}d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 7-Day Activity Chart (Pure CSS) */}
      <Card variant="surface" className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-violet-400" />
            <span>Hoạt Động Hoàn Thành 7 Ngày Gần Nhất</span>
          </h2>
          <span className="text-xs text-slate-400 font-pixel">
            Hôm nay: {formatVietnameseDate(getDateKey(now))}
          </span>
        </div>

        <div className="h-40 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
          {activityByDay.map(d => {
            const heightPercent = Math.max(8, Math.round((d.dayXp / maxDayXp) * 100));
            const isToday = d.dateKey === getDateKey(now);

            return (
              <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-pixel text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  +{d.dayXp}
                </span>
                <div
                  className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? 'bg-gradient-to-t from-violet-600 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : d.count > 0
                      ? 'bg-gradient-to-t from-slate-700 to-violet-500'
                      : 'bg-slate-800/60'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span
                  className={`text-xs font-semibold ${
                    isToday ? 'text-cyan-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  {d.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Settings & Customization */}
      <Card variant="surface" className="p-5 space-y-4">
        <h2 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Cài Đặt Cá Nhân</span>
        </h2>

        {/* Change Nickname form */}
        <form onSubmit={handleSaveNickname} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              Đổi tên nhân vật / biệt danh (2 - 20 ký tự):
            </label>
            <span className="text-[10px] text-slate-400 font-pixel">
              {editingNick.trim().length}/20
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={editingNick}
              onChange={e => {
                const clean = sanitizeCharacterInput(e.target.value);
                setEditingNick(clean);
                if (nickError) setNickError(null);
              }}
              onBlur={() => {
                setEditingNick(prev => prev.trim());
              }}
              maxLength={20}
              placeholder="Nhập tên nhân vật mới..."
              className={`flex-1 px-3.5 py-2 rounded-xl bg-[#0F132E] border text-xs text-slate-100 focus:outline-none transition-colors ${
                nickError
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-slate-700 focus:border-violet-500'
              }`}
            />
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!editingNick.trim()}
            >
              Lưu
            </Button>
          </div>

          {nickError && (
            <p className="text-xs text-rose-400 font-medium">
              ⚠️ {nickError}
            </p>
          )}

          {nickSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Đã cập nhật tên nhân vật mới: "{editingNick.trim()}"!</span>
            </p>
          )}

          {!nickError && !nickSuccess && (
            <p className="text-[11px] text-slate-400">
              * Tên không được để trống, khoảng trắng dư ở đầu & cuối sẽ tự động bị bỏ.
            </p>
          )}
        </form>

        {/* Motion Preference */}
        <div className="space-y-2 pt-2 border-t border-slate-700/60">
          <label className="text-xs font-bold text-slate-300">Tùy chỉnh chuyển động & hoạt họa:</label>
          <div className="flex gap-2">
            {(['system', 'reduced', 'full'] as const).map(pref => (
              <button
                key={pref}
                type="button"
                onClick={() =>
                  dispatch({ type: 'SET_PROFILE', payload: { motionPreference: pref } })
                }
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  state.profile.motionPreference === pref
                    ? 'bg-violet-600 border-violet-400 text-white'
                    : 'bg-[#0F132E] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {pref === 'system' ? 'Theo hệ thống' : pref === 'reduced' ? 'Giảm tối đa' : 'Đầy đủ'}
              </button>
            ))}
          </div>
        </div>

        {/* DEV Time Travel & Testing Tool */}
        {import.meta.env.DEV && advanceDateByDays && (
          <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-violet-300 font-pixel">DEV Test: Time Travel (Nhảy ngày)</span>
              <span className="text-[11px] text-slate-400">{getDateKey(now)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<FastForward className="w-3.5 h-3.5" />}
                onClick={() => advanceDateByDays(1)}
              >
                +1 Ngày (Kiểm tra Streak / Sang ngày mới)
              </Button>
            </div>
          </div>
        )}

        {/* Danger zone: Reset Data */}
        <div className="pt-3 border-t border-rose-900/40 flex items-center justify-between gap-4 bg-rose-950/20 p-3.5 rounded-2xl border">
          <div>
            <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span>Đặt lại toàn bộ dữ liệu (Reset Data)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Xóa sạch tiến trình, level, streak, bộ đếm giờ và chơi lại từ đầu
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleOpenResetModal}>
            Reset Data
          </Button>
        </div>
      </Card>

      {/* Demo Order History */}
      <Card variant="surface" className="p-5 space-y-3">
        <h2 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span>Lịch Sử Đơn Hàng Mở Khóa Demo ({state.orders.length})</span>
        </h2>

        {state.orders.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            Chưa có đơn hàng nào. Các gói bạn mở khóa tại Giỏ hàng demo sẽ xuất hiện tại đây.
          </p>
        ) : (
          <div className="space-y-2">
            {state.orders.map(order => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#0F132E] border border-slate-800 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-200 font-pixel">{order.id}</div>
                  <div className="text-slate-400 text-[11px]">
                    {order.items.map(i => i.title).join(', ')} • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-300 font-pixel">{order.total.toLocaleString()} ₫</div>
                  <span className="text-[10px] text-emerald-400 font-semibold">Đã xác nhận Demo</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modals */}
      <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
      <CharacterSelectModal isOpen={isCharModalOpen} onClose={() => setIsCharModalOpen(false)} />
      <ResetDataModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          setIsCharModalOpen(true);
        }}
      />
    </div>
  );
};
