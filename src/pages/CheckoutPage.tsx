import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { selectCartCalculations } from '../store/selectors.js';
import { processCheckout } from '../domain/checkout.js';
import { formatVnd } from '../domain/cart.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import {
  CreditCard,
  Wallet,
  Building,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';

import { validateCharacterName, sanitizeCharacterInput } from '../domain/character.js';

export const CheckoutPage: React.FC = () => {
  const { state, dispatch, now } = useGame();
  const navigate = useNavigate();
  const cartCalc = selectCartCalculations(state);

  const [characterName, setCharacterName] = useState(state.profile.nickname || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'bank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // If cart is empty, redirect safely inside useEffect
  useEffect(() => {
    if (cartCalc.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartCalc.items.length, navigate]);

  if (cartCalc.items.length === 0) {
    return null;
  }

  const handleConfirmOrder = () => {
    if (isProcessing) return;
    const val = validateCharacterName(characterName);
    if (!val.isValid) {
      setNameError(val.error || 'Tên thợ săn không được để trống.');
      return;
    }

    setNameError(null);
    setIsProcessing(true);

    setTimeout(() => {
      const result = processCheckout(state, paymentMethod, val.cleanName, now);

      dispatch({
        type: 'CONFIRM_CHECKOUT',
        payload: {
          order: result.order,
          newlyUnlockedPackageIds: result.newlyUnlockedPackageIds,
          nextUnlockedPackages: result.nextUnlockedPackages,
        },
      });

      navigate(`/order/${result.order.id}`);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Banner: Mandatory Demo Notice */}
      <div className="p-4 pixel-frame pixel-frame-gold text-xs sm:text-sm text-[var(--text)] flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--gold)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block text-[var(--gold)] font-bold uppercase tracking-wider text-xs font-pixel-latin">
            Demo checkout — no real payment will be collected.
          </strong>
          <p className="text-xs text-[#D5DAE8] leading-relaxed">
            Đây là giao diện thanh toán mô phỏng DEMO. Ứng dụng không thu tiền, không yêu cầu thẻ tín dụng, OTP hay bất kỳ thông tin tài chính nhạy cảm nào. Bấm xác nhận để mở khóa ngay các gói nhiệm vụ!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Form & Mock Payment Selection */}
        <div className="md:col-span-2 space-y-4">
          {/* Character Name Input */}
          <Card variant="surface" className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-heading text-base text-[var(--text)]">
                1. Tên Thợ Săn Nhận Gói (Bắt buộc)
              </h3>
              <span className="text-xs text-[var(--muted)] font-num">
                {characterName.trim().length}/20
              </span>
            </div>
            <input
              type="text"
              value={characterName}
              onChange={e => {
                setCharacterName(sanitizeCharacterInput(e.target.value));
                if (nameError) setNameError(null);
              }}
              onBlur={() => setCharacterName(prev => prev.trim())}
              placeholder="Nhập tên thợ săn (2 - 20 ký tự)..."
              maxLength={20}
              className={`w-full px-3.5 py-2.5 pixel-input text-xs sm:text-sm transition-colors ${
                nameError
                  ? '!border-[var(--danger)] focus:!border-[var(--danger)]'
                  : ''
              }`}
            />
            {nameError ? (
              <p className="text-xs text-[var(--danger)] font-medium">⚠️ {nameError}</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                * Tên không được để trống, khoảng trắng dư ở đầu & cuối sẽ tự động bị bỏ.
              </p>
            )}
          </Card>

          {/* Simulated Payment Methods */}
          <Card variant="surface" className="p-5 space-y-3">
            <h3 className="font-bold font-heading text-base text-[var(--text)]">
              2. Chọn Phương Thức Mô Phỏng
            </h3>

            <div className="space-y-2.5">
              {[
                {
                  id: 'card',
                  title: 'Test Card (Thẻ Kiểm Thử Ảo)',
                  desc: 'Mô phỏng thẻ thanh toán nội bộ thử nghiệm (không cần nhập số thẻ).',
                  icon: CreditCard,
                },
                {
                  id: 'wallet',
                  title: 'Demo Wallet (Ví Điện Tử Ảo)',
                  desc: 'Mô phỏng số dư ví coin trong ứng dụng.',
                  icon: Wallet,
                },
                {
                  id: 'bank',
                  title: 'Demo Bank Transfer (Chuyển Khoản Tham Chiếu Ảo)',
                  desc: 'Chỉ hiển thị mã tham chiếu mẫu để đối soát giả định, không có tài khoản ngân hàng thật.',
                  icon: Building,
                },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <label
                    key={method.id}
                    className={`p-3.5 rounded-[2px] border-2 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--panel-2)] border-[var(--gold)] shadow-[2px_3px_0_0_var(--ink)]'
                        : 'bg-[var(--bg)] border-[#3B4474] hover:border-[var(--muted)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setPaymentMethod(method.id as any)}
                      className="mt-1 accent-[var(--gold)]"
                    />
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-[var(--gold)]' : 'text-[var(--muted)]'}`} />
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-[var(--text)]">{method.title}</div>
                      <div className="text-[var(--muted)] text-xs mt-0.5">{method.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Order Summary & Confirm */}
        <div className="space-y-4">
          <Card variant="gold" className="p-5 space-y-4">
            <h3 className="font-bold font-heading text-base text-[var(--text)] pb-2 border-b border-[#2C3563]">
              Đơn Hàng Demo
            </h3>

            <div className="space-y-2 text-xs text-[#D5DAE8]">
              {cartCalc.items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span className="truncate pr-2">{i.title}</span>
                  <span className="font-pixel text-[var(--text)] shrink-0">{formatVnd(i.price)}</span>
                </div>
              ))}

              <div className="pt-2 border-t border-[#2C3563] flex justify-between">
                <span>Tạm tính:</span>
                <span className="font-pixel text-[var(--text)]">{formatVnd(cartCalc.subtotal)}</span>
              </div>

              {cartCalc.discount > 0 && (
                <div className="flex justify-between text-[var(--green)]">
                  <span>Giảm giá:</span>
                  <span className="font-pixel">-{formatVnd(cartCalc.discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#3B4474] flex justify-between text-base font-bold text-[var(--text)]">
                <span>Tổng cộng:</span>
                <span className="text-[var(--gold)] font-pixel text-lg">
                  {formatVnd(cartCalc.total)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isProcessing}
                onClick={handleConfirmOrder}
              >
                {isProcessing ? 'Đang Mở Khóa...' : 'Xác Nhận Mở Khóa Demo'}
              </Button>

              <Link to="/cart" className="block text-center">
                <Button variant="ghost" size="sm" fullWidth icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                  Quay lại giỏ hàng
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
