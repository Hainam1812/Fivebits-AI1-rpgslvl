import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { getPackageById, getTotalPotentialXpForPackage, getPackageImageUrl, resolvePackageAssetUrl } from '../data/questPackages.js';
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
  X,
} from 'lucide-react';

export const PackageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useGame();
  const [previewAvatar, setPreviewAvatar] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    if (!previewAvatar) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewAvatar(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAvatar]);

  const pkg = id ? getPackageById(id) : undefined;

  useEffect(() => {
    setPreviewAvatar(null);
  }, [id]);

  if (!pkg) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--danger)] flex items-center justify-center text-[var(--danger)]">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-[var(--text)]">
          Không Tìm Thấy Gói Nhiệm Vụ
        </h2>
        <p className="text-xs text-[var(--muted)]">
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
    <>
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to="/packages"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--gold)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh mục Quest Packages</span>
      </Link>

      {/* Hero Overview Card */}
      <Card variant="surface" category={pkg.category} className="p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[var(--gold)] uppercase font-pixel tracking-wider">
                {pkg.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] text-[var(--text)] text-xs font-semibold">
                {pkg.difficultyLevel}
              </span>
              {isOwned && (
                <span className="px-2.5 py-0.5 rounded-[2px] bg-[var(--bg)] border-2 border-[var(--green)] text-[var(--green)] text-xs font-bold font-pixel">
                  ĐÃ MỞ KHÓA
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {pkg.image && (
                <div className="w-[134px] h-[134px] sm:w-[157px] sm:h-[157px] shrink-0 rounded-[2px] overflow-hidden bg-[var(--bg)] border-2 border-[var(--ink)] p-1">
                  <img
                    src={getPackageImageUrl(pkg)}
                    alt={pkg.title}
                    className="w-full h-full object-cover rounded-[2px] bg-[var(--bg)]"
                  />
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl font-black font-heading text-[var(--text)]">
                  {pkg.title}
                </h1>
                <p className="text-sm text-[#D5DAE8] leading-relaxed max-w-2xl">
                  {pkg.fullDescription}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-pixel text-[var(--muted)] pt-2 flex-wrap">
              <span>{pkg.tasks.length} Nhiệm vụ</span>
              <span>•</span>
              <span className="text-[var(--gold)] font-bold">+{totalPotentialXp} XP Tiềm năng</span>
              <span>•</span>
              <span className="text-[var(--sky)]">Thưởng Boss: +{pkg.clearBonusXp} XP</span>
            </div>
          </div>

          {/* Action Price Box */}
          <div className="p-5 pixel-frame pixel-frame-gold bg-[var(--bg)] shrink-0 w-full md:w-auto text-center space-y-3">
            <div>
              <div className="text-xs text-[var(--muted)] uppercase font-pixel">Giá Mở Khóa Demo</div>
              <div className="text-2xl font-black text-[var(--gold)] font-pixel">
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

            <div className="text-xs text-[var(--muted)] max-w-[200px] mx-auto">
              Nhiệm vụ đầu tiên luôn được thử MIỄN PHÍ!
            </div>
          </div>
        </div>
      </Card>

      {/* Audience & Learning Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="surface" className="p-5 space-y-3">
          <h3 className="font-bold font-heading text-base text-[var(--text)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--gold)]" />
            <span>Gói Này Dành Cho Ai?</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed bg-[var(--bg)] p-3.5 rounded-[2px] border-2 border-[var(--ink)]">
            {pkg.audience}
          </p>
        </Card>

        <Card variant="surface" className="p-5 space-y-3">
          <h3 className="font-bold font-heading text-base text-[var(--text)] flex items-center gap-2">
            <Target className="w-4 h-4 text-[var(--sky)]" />
            <span>Bạn Sẽ Đạt Được Gì?</span>
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-[#D5DAE8]">
            {pkg.learningOutcomes.map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Questline Tasks Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-heading text-[var(--text)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--gold)]" />
            <span>Lộ Trình Các Nhiệm Vụ Trong Gói</span>
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {pkg.tasks.length} chặng thử thách
          </span>
        </div>

        <div className="space-y-3">
          {pkg.tasks.map((task, idx) => {
            const isTrial = idx === 0;
            return (
              <div
                key={task.id}
                className={`p-4 pixel-frame flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.isBoss
                    ? 'pixel-frame-gold pixel-event-frame'
                    : 'pixel-frame-muted'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[var(--muted)] font-num">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[var(--text)]">
                      {task.title}
                    </span>
                    <DifficultyBadge difficulty={task.difficulty} />
                    {isTrial && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-[var(--bg)] text-[var(--green)] border-2 border-[var(--green)] text-xs font-bold font-pixel">
                        THỬ MIỄN PHÍ
                      </span>
                    )}
                    {task.isBoss && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-[var(--panel-2)] text-[var(--gold)] border-2 border-[var(--gold)] text-[11px] font-bold font-num">
                        BOSS DUNGEON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#D5DAE8] leading-relaxed">
                    {task.description}
                  </p>
                  <p className="text-xs text-[var(--gold)] font-medium">
                    Điều kiện: {task.condition}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold font-num text-[var(--gold)]">
                    +{task.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Student Reviews */}
      <div className="space-y-4 pt-4 border-t-2 border-[#2C3563]">
        <h2 className="text-lg font-bold font-heading text-[var(--text)] flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--gold)] fill-[var(--gold)]" />
          <span>Cảm Nhận Từ Sinh Viên (Review Mẫu)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pkg.reviews.map((rev, idx) => (
            <Card key={idx} variant="surface" className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {rev.avatar && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewAvatar({
                          src: resolvePackageAssetUrl(rev.avatar!),
                          alt: rev.author,
                        })
                      }
                      aria-label={`Xem ảnh đại diện của ${rev.author}`}
                      className="shrink-0 rounded-full cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--gold)]"
                    >
                      <img
                        src={resolvePackageAssetUrl(rev.avatar)}
                        alt={rev.author}
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#3B4474] hover:opacity-90 transition-opacity"
                      />
                    </button>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[var(--text)] truncate">{rev.author}</div>
                    <div className="text-xs text-[var(--muted)] truncate">{rev.role}</div>
                  </div>
                </div>
                <div className="flex text-[var(--gold)] text-xs items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const diff = rev.rating - i;
                    if (diff >= 1) {
                      return <Star key={i} className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" />;
                    }
                    if (diff >= 0.5) {
                      return <StarHalf key={i} className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" />;
                    }
                    return <Star key={i} className="w-3.5 h-3.5 text-[#3B4474]" />;
                  })}
                </div>
              </div>
              <p className="text-xs text-[#D5DAE8] italic leading-relaxed">
                "{rev.comment}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>

    {previewAvatar && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        onClick={() => setPreviewAvatar(null)}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => setPreviewAvatar(null)}
          aria-label="Đóng ảnh"
          className="fixed top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={previewAvatar.src}
          alt={previewAvatar.alt}
          onClick={(e) => e.stopPropagation()}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        />
      </div>
    )}
    </>
  );
};
