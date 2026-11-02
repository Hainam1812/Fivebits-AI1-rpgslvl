import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { getPackageById, getTotalPotentialXpForPackage } from '../data/questPackages.js';
import { formatVnd } from '../domain/cart.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { DifficultyBadge } from '../components/ui/Badge.js';
import {
  Layers,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Star,
  StarHalf,
  Users,
  Target,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useGame();

  const pkg = id ? getPackageById(id) : undefined;

  if (!pkg) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-100">
          Không Tìm Thấy Gói Nhiệm Vụ
        </h2>
        <p className="text-xs text-slate-400">
          Đường dẫn không tồn tại hoặc gói nhiệm vụ đã bị xóa khỏi catalog.
        </p>
        <Link to="/packages">
          <Button variant="primary" size="sm">
            Quay Lại Danh Mục Gói
          </Button>
        </Link>
      </div>
    );
  }

  const isOwned = state.unlockedPackages.includes(pkg.id);
  const isInCart = state.cart.includes(pkg.id);
  const totalPotentialXp = getTotalPotentialXpForPackage(pkg);

  const handleAddToCart = () => {
    dispatch({ type: 'ADD_TO_CART', payload: { packageId: pkg.id } });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to="/packages"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh mục Quest Packages</span>
      </Link>

      {/* Hero Overview Card */}
      <Card variant="surface" className="p-6 sm:p-8 relative overflow-hidden border-t-4" style={{ borderTopColor: pkg.color }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-violet-300 uppercase font-pixel tracking-wider">
                {pkg.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-semibold">
                {pkg.difficultyLevel}
              </span>
              {isOwned && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold font-pixel">
                  ĐÃ MỞ KHÓA
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-100">
              {pkg.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {pkg.fullDescription}
            </p>

            <div className="flex items-center gap-4 text-xs font-pixel text-slate-400 pt-2">
              <span>{pkg.tasks.length} Nhiệm vụ</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">+{totalPotentialXp} XP Tiềm năng</span>
              <span>•</span>
              <span className="text-cyan-300">Thưởng Boss: +{pkg.clearBonusXp} XP</span>
            </div>
          </div>

          {/* Action Price Box */}
          <div className="p-5 rounded-2xl bg-[#0F132E] border border-slate-700/80 shrink-0 w-full md:w-auto text-center space-y-3 shadow-xl">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-pixel">Giá Mở Khóa Demo</div>
              <div className="text-2xl font-black text-amber-400 font-pixel">
                {formatVnd(pkg.price)}
              </div>
            </div>

            {isOwned ? (
              <Link to="/play/quests" className="block">
                <Button variant="primary" fullWidth>
                  Tiếp Tục Cày Gói
                </Button>
              </Link>
            ) : isInCart ? (
              <Link to="/cart" className="block">
                <Button variant="secondary" fullWidth icon={<ShoppingBag className="w-4 h-4" />}>
                  Đã Có Trong Giỏ
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                fullWidth
                icon={<ShoppingBag className="w-4 h-4" />}
                onClick={handleAddToCart}
              >
                Mở Khóa Gói Demo
              </Button>
            )}

            <div className="text-[10px] text-slate-500 max-w-[200px] mx-auto">
              Nhiệm vụ đầu tiên luôn được thử MIỄN PHÍ!
            </div>
          </div>
        </div>
      </Card>

      {/* Audience & Learning Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="surface" className="p-5 space-y-3">
          <h3 className="font-bold font-heading text-base text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <span>Gói Này Dành Cho Ai?</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0F132E]/60 p-3.5 rounded-xl border border-slate-800">
            {pkg.audience}
          </p>
        </Card>

        <Card variant="surface" className="p-5 space-y-3">
          <h3 className="font-bold font-heading text-base text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Bạn Sẽ Đạt Được Gì?</span>
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
            {pkg.learningOutcomes.map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Questline Tasks Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Lộ Trình Các Nhiệm Vụ Trong Gói</span>
          </h2>
          <span className="text-xs text-slate-400">
            {pkg.tasks.length} chặng thử thách
          </span>
        </div>

        <div className="space-y-3">
          {pkg.tasks.map((task, idx) => {
            const isTrial = idx === 0;
            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.isBoss
                    ? 'bg-amber-950/20 border-amber-400/60 shadow-lg'
                    : 'bg-[#161B40]/70 border-slate-700/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 font-pixel">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-100">
                      {task.title}
                    </span>
                    <DifficultyBadge difficulty={task.difficulty} />
                    {isTrial && (
                      <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-pixel">
                        THỬ MIỄN PHÍ
                      </span>
                    )}
                    {task.isBoss && (
                      <span className="px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-pixel">
                        BOSS DUNGEON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {task.description}
                  </p>
                  <p className="text-[11px] text-amber-300/90 font-medium">
                    Điều kiện: {task.condition}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-pixel text-violet-300">
                    +{task.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Student Reviews */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span>Cảm Nhận Từ Sinh Viên (Review Mẫu)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pkg.reviews.map((rev, idx) => (
            <Card key={idx} variant="surface" className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-200">{rev.author}</div>
                  <div className="text-[11px] text-slate-400">{rev.role}</div>
                </div>
                <div className="flex text-amber-400 text-xs items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const diff = rev.rating - i;
                    if (diff >= 1) {
                      return <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />;
                    }
                    if (diff >= 0.5) {
                      return <StarHalf key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />;
                    }
                    return <Star key={i} className="w-3.5 h-3.5 text-slate-600/50" />;
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{rev.comment}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
