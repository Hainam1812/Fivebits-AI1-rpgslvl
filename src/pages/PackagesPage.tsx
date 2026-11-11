import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { QUEST_PACKAGES, FULL_PARTY_COMBO_ID, getPackageImageUrl } from '../data/questPackages.js';
import { calculateComboPrice, formatVnd } from '../domain/cart.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { DifficultyBadge } from '../components/ui/Badge.js';
import {
  Layers,
  Search,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
} from 'lucide-react';

export const PackagesPage: React.FC = () => {
  const { state, dispatch } = useGame();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name' | 'xp'>('price_asc');

  const { price: comboPrice, canBuy: canBuyCombo } = calculateComboPrice(state.unlockedPackages);

  const categories = [
    'all',
    'Code & Technology',
    'Health & Habits',
    'Learning & Knowledge',
    'University & AI',
    'Lifestyle & Balance',
    'Personal Growth',
    'Productivity & Planning',
  ];

  const filteredPackages = QUEST_PACKAGES.filter(pkg => {
    const isOwned = state.unlockedPackages.includes(pkg.id);
    if (filterStatus === 'unlocked' && !isOwned) return false;
    if (filterStatus === 'locked' && isOwned) return false;

    if (filterCategory !== 'all' && pkg.category.toLowerCase() !== filterCategory.toLowerCase()) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pkg.title.toLowerCase().includes(q) ||
        pkg.shortDescription.toLowerCase().includes(q) ||
        pkg.category.toLowerCase().includes(q)
      );
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'xp') {
      const xpA = a.tasks.reduce((s, t) => s + t.xp, 0) + a.clearBonusXp;
      const xpB = b.tasks.reduce((s, t) => s + t.xp, 0) + b.clearBonusXp;
      return xpB - xpA;
    }
    return 0;
  });

  const handleAddToCart = (pkgId: string) => {
    dispatch({ type: 'ADD_TO_CART', payload: { packageId: pkgId } });
  };

  const isComboInCart = state.cart.includes(FULL_PARTY_COMBO_ID);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-400" />
            <span>Quest Packages</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chuỗi nhiệm vụ theo mục tiêu thực chiến. Nhiệm vụ đầu tiên luôn được thử MIỄN PHÍ!
          </p>
        </div>

        <Link to="/cart">
          <Button variant="secondary" icon={<ShoppingBag className="w-4 h-4 text-violet-400" />}>
            Xem Giỏ Hàng ({state.cart.length})
          </Button>
        </Link>
      </div>

      {/* Full Party Combo Promo Card */}
      {canBuyCombo ? (
        <Card variant="gold" className="p-5 sm:p-6 bg-gradient-to-r from-[#2B1705] via-[#1E1236] to-[#0F132E]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold font-pixel">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ƯU ĐÃI COMBO TIẾT KIỆM 20%</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-slate-100">
                Combo "Full Party" (Toàn Bộ Gói Chưa Sở Hữu)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Mở khóa tất cả các gói còn lại chỉ trong 1 lần xác nhận demo với mức giá ưu đãi giảm 20%!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 w-full md:w-auto">
              <div className="text-right">
                <div className="text-2xl font-black text-amber-300 font-pixel">
                  {formatVnd(comboPrice)}
                </div>
                <div className="text-[10px] text-amber-400/80 font-pixel uppercase">
                  Đã giảm 20% (Làm tròn nghìn đồng)
                </div>
              </div>

              {isComboInCart ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-950 border border-violet-500/50 text-violet-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Đã có trong giỏ</span>
                </div>
              ) : (
                <Button
                  variant="gold"
                  icon={<ShoppingBag className="w-4 h-4" />}
                  onClick={() => handleAddToCart(FULL_PARTY_COMBO_ID)}
                >
                  Thêm Combo Vào Giỏ
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="p-3 bg-[#161B40]/60 border border-slate-700/60 rounded-xl text-xs text-slate-400 text-center">
          💡 Bạn chỉ còn dưới 3 gói chưa sở hữu: <strong>Mua lẻ sẽ hợp lý hơn</strong> so với gói Combo!
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên gói, mô tả..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 focus:border-violet-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? 'Tất cả lĩnh vực' : c}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-[#161B40] border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
        >
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="name">Tên A-Z</option>
          <option value="xp">Tổng XP nhiều nhất</option>
        </select>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPackages.map(pkg => {
          const isOwned = state.unlockedPackages.includes(pkg.id);
          const isInCart = state.cart.includes(pkg.id) || isComboInCart;
          const totalPotentialXp = pkg.tasks.reduce((s, t) => s + t.xp, 0) + pkg.clearBonusXp;

          return (
            <Card
              key={pkg.id}
              variant={isOwned ? 'glow' : 'surface'}
              className="p-5 flex flex-col justify-between space-y-4 border-t-4"
              style={{ borderTopColor: pkg.color }}
            >
              <div className="space-y-3">
                {/* Meta */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase font-pixel tracking-wider text-violet-300">
                    {pkg.category}
                  </span>
                  <span className="text-sm font-black font-pixel text-amber-400">
                    {formatVnd(pkg.price)}
                  </span>
                </div>

                {/* Ảnh đại diện cho gói - Căn giữa, phía dưới đề mục và giá tiền, kích cỡ đồng nhất */}
                {pkg.image && (
                  <div className="flex justify-center py-1">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#0A0E27] border-2 border-violet-500/40 p-1 flex items-center justify-center shadow-lg shadow-violet-950/40 transition-transform duration-200 hover:scale-105">
                      <img
                        src={getPackageImageUrl(pkg)}
                        alt={pkg.title}
                        className="w-full h-full object-cover rounded-xl bg-[#0A0E27]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-black font-heading text-lg text-slate-100 flex items-center gap-1.5">
                    <span>{pkg.title}</span>
                    {isOwned && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {pkg.shortDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-pixel pt-2 border-t border-slate-700/60">
                  <span>{pkg.tasks.length} nhiệm vụ</span>
                  <span className="text-violet-300">+{totalPotentialXp} XP tiềm năng</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                <Link to={`/packages/${pkg.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" fullWidth>
                    Xem Chi Tiết
                  </Button>
                </Link>

                {isOwned ? (
                  <Link to="/play/quests" className="flex-1">
                    <Button variant="primary" size="sm" fullWidth>
                      Tiếp Tục
                    </Button>
                  </Link>
                ) : isInCart ? (
                  <Button variant="secondary" size="sm" fullWidth disabled>
                    Đã Trong Giỏ
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleAddToCart(pkg.id)}
                  >
                    Thêm Vào Giỏ
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
