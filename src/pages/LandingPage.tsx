import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config/brand.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { HomeCarousel } from '../components/ui/HomeCarousel.js';
import { DAILY_QUESTS } from '../data/dailyQuests.js';
import { QUEST_PACKAGES } from '../data/questPackages.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import charactersData from '../data/characters.json' with { type: 'json' };
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Target,
  Trophy,
  CheckCircle2,
  Layers,
  Flame,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const characters = Array.isArray(charactersData) ? charactersData.slice(0, 4) : [];
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <div className="space-y-16 sm:space-y-24 py-2 sm:py-6">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-1 sm:pt-2 overflow-hidden">
        {/* Intro Carousel */}
        <div className="relative z-10 pb-2">
          <HomeCarousel />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[2px] bg-[var(--panel)] border-2 border-[var(--gold)] text-[var(--gold)] text-xs sm:text-sm font-pixel shadow-[4px_4px_0_0_var(--ink)]">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <span>Web App To-Do RPG Dành Cho Sinh Viên Đại Học</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-pixel-latin tracking-tight leading-tight max-w-4xl mx-auto uppercase text-[var(--text)]">
          READY TO BECOME <span className="text-[var(--gold)]">BETTER?</span>
        </h1>

        <p className="text-sm sm:text-lg text-[#D5DAE8] max-w-2xl mx-auto leading-relaxed">
          Biến bài vở, thói quen sinh hoạt và đồ án đại học thành những chuỗi nhiệm vụ RPG kịch tính. Nhận XP, lên cấp, duy trì streak và mở khóa ngoại trang độc bản!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/play" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" fullWidth icon={<ArrowRight className="w-5 h-5" />}>
              Bắt Đầu Hành Trình
            </Button>
          </Link>
          <Link to="/packages" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" fullWidth icon={<Layers className="w-4 h-4 text-[var(--sky)]" />}>
              Xem Quest Packages
            </Button>
          </Link>
        </div>

        {/* Character Showcase Grid */}
        <div className="pt-8">
          <div className="text-xs uppercase font-bold text-[var(--muted)] tracking-widest font-pixel mb-4">
            Bạn Đồng Hành Của Bạn
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {characters.map((char: any) => {
              const imgSrc = `${baseUrl}/${char.idle.src.replace(/^\//, '')}`;
              return (
                <div
                  key={char.id}
                  className="p-3 pixel-frame pixel-frame-muted pixel-frame-interactive flex items-center gap-3"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-[var(--bg)] rounded-[2px] border-2 border-[var(--ink)] p-1">
                    <img
                      src={imgSrc}
                      alt={char.displayName}
                      className={`max-w-full max-h-full object-contain ${char.pixelArt ? 'pixelated' : ''}`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-[var(--text)] font-heading">{char.displayName}</div>
                    <div className="text-xs text-[var(--gold)] font-medium">{char.tagline}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Core Benefits */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text)] uppercase">
            Vì Sao Sinh Viên Yêu Thích Solo Levelling?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Giải quyết triệt để vấn đề trì hoãn và quá tải bằng cơ chế game hóa thông minh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card variant="surface" category="Học tập" className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--violet)]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-[var(--text)]">
              Chống Trì Hoãn Bằng Pomodoro & Streak
            </h3>
            <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
              Chia nhỏ bài tập lớn thành các mini tasks 25 phút. Duy trì chuỗi ngày liên tục để tích lũy streak và không bao giờ phải thức trắng đêm trước ngày thi.
            </p>
          </Card>

          <Card variant="surface" category="Lập trình" className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--sky)]">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-[var(--text)]">
              Lên Cấp & Săn Đồ Thật Sự Tự Hào
            </h3>
            <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
              Mỗi bài tập nộp xong mang lại XP thực tế. Mở khóa khung viền, linh vật đồng hành, danh hiệu và trang phục cá tính không cần tốn một xu tiền thật.
            </p>
          </Card>

          <Card variant="surface" category="Daily" className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--ink)] flex items-center justify-center text-[var(--gold)]">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-[var(--text)]">
              Bản Đồ Campus & Đấu Trường Thi Cử
            </h3>
            <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
              Mô phỏng khuôn viên trường với 9 địa điểm thực hành. Thử thách kiến thức nền tảng trong các màn đấu Boss trắc nghiệm kịch tính.
            </p>
          </Card>
        </div>
      </section>

      {/* 4 Steps How to Play */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[var(--text)] uppercase">
            Hành Trình Lên Cấp 4 Bước
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
            Đơn giản, trực quan và chạy hoàn toàn trên thiết bị của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Chọn Bạn Đồng Hành', desc: 'Chọn nhân vật RPG và đặt biệt danh thợ săn cho riêng bạn.' },
            { step: '02', title: 'Cày Daily Quests', desc: 'Hoàn thành 7 nhiệm vụ hằng ngày lúc 00:00 để tích lũy XP và giữ streak.' },
            { step: '03', title: 'Mở Khóa Gói Quest', desc: 'Khám phá các chuỗi nhiệm vụ chuyên sâu Python, Gym, AI, Deadline Survivor.' },
            { step: '04', title: 'Thu Thập Ngoại Trang', desc: 'Trang bị đồ trong Tủ đồ để nhân vật tỏa sáng trên bảng thành tích.' },
          ].map(s => (
            <Card key={s.step} variant="surface" className="p-5 relative">
              <div className="text-xl font-bold font-num text-[var(--gold)] mb-3">
                {s.step}
              </div>
              <h4 className="font-bold font-heading text-base text-[var(--text)]">{s.title}</h4>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Daily Quests & Packages Live Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Quests Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-heading text-[var(--text)]">Daily Quests Hôm Nay</h3>
              <p className="text-xs text-[var(--muted)]">7 nhiệm vụ mặc định mỗi ngày</p>
            </div>
            <Link to="/play/quests" className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {DAILY_QUESTS.slice(0, 3).map(q => (
              <Card
                key={q.id}
                variant="surface"
                category={q.category}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text)]">{q.name}</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-[2px] bg-[var(--panel-2)] text-[var(--gold)] border border-[var(--ink)] font-num whitespace-nowrap">
                      +{q.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{q.condition}</p>
                </div>
                <Link to="/play/quests" className="shrink-0">
                  <Button variant="secondary" size="sm">Cày ngay</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Packages Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-heading text-[var(--text)]">Gói Nhiệm Vụ Nổi Bật</h3>
              <p className="text-xs text-[var(--muted)]">Nhiệm vụ đầu tiên luôn được thử miễn phí!</p>
            </div>
            <Link to="/packages" className="text-xs font-semibold text-[var(--gold)] hover:underline flex items-center">
              Xem catalog <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {QUEST_PACKAGES.slice(0, 3).map(p => (
              <Card
                key={p.id}
                variant="surface"
                category={p.category}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[var(--text)]">{p.title}</span>
                    <span className="text-xs text-[var(--gold)] font-pixel whitespace-nowrap">
                      {p.tasks.length} quests • +{p.clearBonusXp} XP bonus
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{p.shortDescription}</p>
                </div>
                <Link to={`/packages/${p.id}`} className="shrink-0">
                  <Button variant="primary" size="sm">Chi tiết</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t-2 border-[#2C3563] space-y-6 text-center text-xs text-[var(--muted)]">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <Link to="/about" className="hover:text-[var(--gold)] transition-colors">Về Dự Án & Đội Ngũ</Link>
          <Link to="/contact" className="hover:text-[var(--gold)] transition-colors">Liên Hệ & FAQ</Link>
          <Link to="/packages" className="hover:text-[var(--gold)] transition-colors">Kho Gói Quest</Link>
          <Link to="/cart" className="hover:text-[var(--gold)] transition-colors">Giỏ Hàng Demo</Link>
        </div>

        <p className="max-w-md mx-auto text-[var(--muted)]">
          SOLO LEVELLING © {BRAND.year}. Không sử dụng tài sản có bản quyền. Hệ thống thanh toán chỉ là phiên bản mô phỏng demo.
        </p>
      </footer>
    </div>
  );
};
