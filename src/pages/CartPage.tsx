import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { selectCartCalculations } from '../store/selectors.js';
import { formatVnd } from '../domain/cart.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import {
  ShoppingBag,
  Trash2,
  Tag,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const cartCalc = selectCartCalculations(state);

  const [couponInput, setCouponInput] = useState(state.appliedCoupon || '');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'APPLY_COUPON', payload: { coupon: couponInput.trim() || null } });
  };

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { packageId: id } });
  };

  if (cartCalc.items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto pixel-frame pixel-frame-muted flex items-center justify-center text-[var(--muted)]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-heading text-[var(--text)]">
          Túi Đồ Của Bạn Đang Trống
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
          Hãy khám phá các gói nhiệm vụ theo mục tiêu để trang bị thêm lộ trình lên cấp kỹ năng!
        </p>
        <Link to="/packages">
          <Button variant="primary" size="sm">
            Khám Phá Quest Packages
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-[var(--text)] flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[var(--gold)]" />
            <span>Giỏ Hàng Mở Khóa (Bản Demo)</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            {cartCalc.items.length} gói nhiệm vụ đã chọn
          </p>
        </div>

        <Link to="/packages" className="text-xs font-semibold text-[var(--gold)] hover:underline whitespace-nowrap shrink-0">
          Tiếp tục chọn gói
        </Link>
      </div>

      {/* Demo Disclaimer Alert */}
      <div className="p-3.5 pixel-frame pixel-frame-gold text-xs text-[var(--text)] flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 shrink-0 text-[var(--gold)] mt-0.5" />
        <span>
          <strong>Lưu ý:</strong> Đây là bản mở khóa mô phỏng DEMO. Không thu tiền thật, không cần tài khoản ngân hàng. Giá VNĐ hiển thị cho trải nghiệm giỏ hàng chân thực.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Items list */}
        <div className="lg:col-span-2 space-y-3">
          {cartCalc.items.map(item => (
            <Card key={item.id} variant="surface" className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold text-sm text-[var(--text)] font-heading">
                  {item.title}
                </div>
                {item.isCombo ? (
                  <span className="text-xs text-[var(--gold)] font-pixel">
                    Combo giảm 20% ({item.packageCount} gói)
                  </span>
                ) : (
                  <Link
                    to={`/packages/${item.id}`}
                    className="text-xs text-[var(--sky)] hover:text-[var(--gold)]"
                  >
                    Xem chi tiết gói
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="font-bold text-sm text-[var(--gold)] font-pixel">
                  {formatVnd(item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 text-[var(--muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                  aria-label={`Xóa ${item.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}

          {/* Coupon Input Form */}
          <Card variant="surface" className="p-4 space-y-2">
            <label className="text-xs font-bold text-[#D5DAE8] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>Mã giảm giá (Gợi ý: LEVELUP10 hoặc FRESHMAN):</span>
            </label>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value)}
                placeholder="Nhập mã giảm giá..."
                className="flex-1 px-3 py-2 pixel-input text-xs sm:text-sm uppercase"
              />
              <Button variant="secondary" size="sm" type="submit">
                Áp dụng
              </Button>
            </form>
            {cartCalc.couponMessage && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  cartCalc.isCouponValid ? 'text-[var(--green)]' : 'text-[var(--danger)]'
                }`}
              >
                {cartCalc.isCouponValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{cartCalc.couponMessage}</span>
              </p>
            )}
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          <Card variant="gold" className="p-5 space-y-4">
            <h3 className="font-bold font-heading text-base text-[var(--text)] pb-2 border-b border-[#2C3563]">
              Tổng Kết Giỏ Hàng
            </h3>

            <div className="space-y-2 text-xs text-[#D5DAE8]">
              <div className="flex justify-between">
                <span>Số gói nhiệm vụ:</span>
                <strong className="text-[var(--text)] font-num">{cartCalc.items.length}</strong>
              </div>

              <div className="flex justify-between text-[var(--gold)]">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--gold)]" />
                  <span>Tổng XP tiềm năng:</span>
                </span>
                <strong className="font-num text-[11px] text-[var(--gold)]">+{cartCalc.potentialXp} XP</strong>
              </div>
              <p className="text-xs text-[var(--muted)] italic">
                * Đây là XP tiềm năng bạn sẽ nhận được khi cày xong các nhiệm vụ, không phải XP cấp ngay lập tức.
              </p>

              <div className="pt-2 border-t border-[#2C3563] flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-pixel text-[var(--text)]">{formatVnd(cartCalc.subtotal)}</span>
              </div>

              {cartCalc.discount > 0 && (
                <div className="flex justify-between text-[var(--green)]">
                  <span>Giảm giá ({state.appliedCoupon}):</span>
                  <span className="font-pixel">-{formatVnd(cartCalc.discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#3B4474] flex justify-between text-base font-bold text-[var(--text)]">
                <span>Tổng cộng Demo:</span>
                <span className="text-[var(--gold)] font-pixel text-lg">
                  {formatVnd(cartCalc.total)}
                </span>
              </div>
            </div>

            <Link to="/checkout" className="block pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Tiến Hành Mở Khóa Demo
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Bottom Summary Bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 p-3 bg-[var(--panel)] border-t-2 border-[var(--ink)] flex items-center justify-between gap-3 shadow-[0_-4px_0_0_var(--ink)]">
        <div>
          <div className="text-xs text-[var(--muted)] font-pixel">Tổng cộng Demo</div>
          <div className="text-base font-bold text-[var(--gold)] font-pixel">
            {formatVnd(cartCalc.total)}
          </div>
        </div>
        <Link to="/checkout" className="flex-1 max-w-[200px]">
          <Button variant="primary" size="sm" fullWidth>
            Mở Khóa Demo
          </Button>
        </Link>
      </div>
    </div>
  );
};
