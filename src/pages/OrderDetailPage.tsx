import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../store/GameContext.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { formatVnd } from '../domain/cart.js';
import { CheckCircle2, Sparkles, ArrowRight, Layers, Home } from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useGame();

  const order = state.orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold font-heading text-[var(--text)]">
          Không Tìm Thấy Đơn Hàng
        </h2>
        <p className="text-xs sm:text-sm text-[var(--muted)]">
          Mã đơn hàng không tồn tại trong lịch sử lưu trữ cục bộ.
        </p>
        <Link to="/play">
          <Button variant="primary" size="sm">
            Về Trang Tổng Quan
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center py-6">
      {/* Victory Celebration Graphic */}
      <div className="relative inline-block">
        <div className="w-20 h-20 mx-auto rounded-[2px] bg-[var(--panel-2)] border-[3px] border-[var(--gold)] shadow-[6px_6px_0_0_var(--ink)] flex items-center justify-center animate-celebrate-bounce">
          <CheckCircle2 className="w-10 h-10 text-[var(--green)]" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--green)] text-[var(--green)] text-xs font-bold font-pixel">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Xác Nhận Thành Công</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-pixel-latin text-[var(--text)] tracking-tight uppercase">
          QUEST PACKAGES UNLOCKED!
        </h1>
        <p className="text-xs sm:text-sm text-[#D5DAE8] max-w-md mx-auto leading-relaxed">
          Chúc mừng thợ săn <strong>{order.characterName}</strong>! Các gói nhiệm vụ mới đã được mở khóa hoàn tất và sẵn sàng để bạn cày lấy XP.
        </p>
      </div>

      {/* Order Receipt Details */}
      <Card variant="gold" className="p-6 text-left space-y-4 max-w-md mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#2C3563]">
          <div>
            <div className="text-xs text-[var(--muted)] uppercase font-pixel">Mã Đơn Hàng Demo</div>
            <div className="text-sm font-bold text-[var(--text)] font-num">{order.id}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--muted)] font-pixel">Thời Gian</div>
            <div className="text-xs text-[#D5DAE8]">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold uppercase text-[var(--muted)]">Các gói đã mở khóa:</div>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs py-1">
              <span className="text-[var(--text)]">{item.title}</span>
              <span className="text-[var(--gold)] font-pixel">{formatVnd(item.price)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#2C3563] space-y-1.5 text-xs text-[#D5DAE8]">
          {order.discount > 0 && (
            <div className="flex justify-between text-[var(--green)]">
              <span>Giảm giá ({order.couponCode}):</span>
              <span className="font-pixel">-{formatVnd(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-[var(--text)] pt-1 border-t border-[#3B4474]">
            <span>Tổng cộng Demo:</span>
            <span className="text-[var(--gold)] font-pixel text-base">{formatVnd(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/play/quests" className="w-full sm:w-auto">
          <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />}>
            Bắt Đầu Cày Nhiệm Vụ Ngay
          </Button>
        </Link>
        <Link to="/play" className="w-full sm:w-auto">
          <Button variant="secondary" size="lg" fullWidth icon={<Home className="w-4 h-4" />}>
            Về Trang Tổng Quan
          </Button>
        </Link>
      </div>
    </div>
  );
};
