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
        {/* Glow ambient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Intro Carousel */}
        <div className="relative z-10 pb-2">
          <HomeCarousel />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/70 border border-violet-500/40 text-violet-300 text-xs sm:text-sm font-semibold shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Web App To-Do RPG Dành Cho Sinh Viên Đại Học</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-tight max-w-4xl mx-auto uppercase">
          READY TO BECOME <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">BETTER?</span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
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
            <Button variant="secondary" size="lg" fullWidth icon={<Layers className="w-4 h-4 text-violet-400" />}>
              Xem Quest Packages
            </Button>
          </Link>
        </div>

        {/* Character Showcase Grid */}
        <div className="pt-8">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-widest font-heading mb-4">
            Bạn Đồng Hành Của Bạn
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {characters.map((char: any) => {
              const imgSrc = `${baseUrl}/${char.idle.src.replace(/^\//, '')}`;
              return (
                <div
                  key={char.id}
                  className="p-3 rounded-2xl bg-[#161B40]/70 border border-slate-700/60 flex items-center gap-3 hover:border-violet-500/60 transition-all shadow-lg"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-[#0F132E] rounded-xl border border-slate-800 p-1">
                    <img
                      src={imgSrc}
                      alt={char.displayName}
                      className={`max-w-full max-h-full object-contain ${char.pixelArt ? 'pixelated' : ''}`}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-slate-100 font-heading">{char.displayName}</div>
                    <div className="text-xs text-violet-300 font-medium">{char.tagline}</div>
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
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100 uppercase">
            Vì Sao Sinh Viên Yêu Thích Solo Levelling?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Giải quyết triệt để vấn đề trì hoãn và quá tải bằng cơ chế game hóa thông minh
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card variant="surface" className="p-6 space-y-3 border-t-2 border-t-violet-500">
            <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-500/50 flex items-center justify-center text-violet-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-slate-100">
              Chống Trì Hoãn Bằng Pomodoro & Streak
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Chia nhỏ bài tập lớn thành các mini tasks 25 phút. Duy trì chuỗi ngày liên tục để tích lũy streak và không bao giờ phải thức trắng đêm trước ngày thi.
            </p>
          </Card>

          <Card variant="surface" className="p-6 space-y-3 border-t-2 border-t-cyan-500">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-slate-100">
              Lên Cấp & Săn Đồ Thật Sự Tự Hào
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mỗi bài tập nộp xong mang lại XP thực tế. Mở khóa khung viền, linh vật đồng hành, danh hiệu và trang phục cá tính không cần tốn một xu tiền thật.
            </p>
          </Card>

          <Card variant="surface" className="p-6 space-y-3 border-t-2 border-t-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold font-heading text-lg text-slate-100">
              Bản Đồ Campus & Đấu Trường Thi Cử
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mô phỏng khuôn viên trường với 9 địa điểm thực hành. Thử thách kiến thức nền tảng trong các màn đấu Boss trắc nghiệm kịch tính.
            </p>
          </Card>
        </div>
      </section>

      {/* 4 Steps How to Play */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100 uppercase">
            Hành Trình Lên Cấp 4 Bước
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
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
              <div className="text-3xl font-black font-pixel text-violet-500/30 mb-2">
                {s.step}
              </div>
              <h4 className="font-bold font-heading text-base text-slate-100">{s.title}</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{s.desc}</p>
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
              <h3 className="text-xl font-bold font-heading text-slate-100">Daily Quests Hôm Nay</h3>
              <p className="text-xs text-slate-400">7 nhiệm vụ mặc định mỗi ngày</p>
            </div>
            <Link to="/play/quests" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
              Xem tất cả <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {DAILY_QUESTS.slice(0, 3).map(q => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-[#161B40]/80 border border-slate-700/60 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{q.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-500/30 font-pixel">
                      +{q.xp} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{q.condition}</p>
                </div>
                <Link to="/play/quests">
                  <Button variant="secondary" size="sm">Cày ngay</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Packages Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-100">Gói Nhiệm Vụ Nổi Bật</h3>
              <p className="text-xs text-slate-400">Nhiệm vụ đầu tiên luôn được thử miễn phí!</p>
            </div>
            <Link to="/packages" className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center">
              Xem catalog <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {QUEST_PACKAGES.slice(0, 3).map(p => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-[#161B40]/80 border border-slate-700/60 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{p.title}</span>
                    <span className="text-[10px] text-slate-400 font-pixel">
                      {p.tasks.length} quests • +{p.clearBonusXp} XP bonus
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.shortDescription}</p>
                </div>
                <Link to={`/packages/${p.id}`}>
                  <Button variant="primary" size="sm">Chi tiết</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 border-t border-slate-800 space-y-6 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <Link to="/about" className="hover:text-violet-300 transition-colors">Về Dự Án & Đội Ngũ</Link>
          <Link to="/contact" className="hover:text-violet-300 transition-colors">Liên Hệ & FAQ</Link>
          <Link to="/packages" className="hover:text-violet-300 transition-colors">Kho Gói Quest</Link>
          <Link to="/cart" className="hover:text-violet-300 transition-colors">Giỏ Hàng Demo</Link>
        </div>

        <p className="max-w-md mx-auto text-slate-500">
          SOLO LEVELLING © {BRAND.year}. Không sử dụng tài sản có bản quyền. Hệ thống thanh toán chỉ là phiên bản mô phỏng demo.
        </p>
      </footer>
    </div>
  );
};
