import React from 'react';
import { Card } from '../components/ui/Card.js';
import { TEAM_MEMBERS } from '../data/team.js';
import { BRAND } from '../config/brand.js';
import { Users, Sparkles, Target, ShieldCheck, Heart } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-12 max-w-4xl mx-auto py-4">
      {/* Story Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[2px] bg-[var(--panel)] border-2 border-[var(--gold)] text-[var(--gold)] text-xs font-bold font-pixel">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
          <span>Câu Chuyện Phát Triển</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-heading text-[var(--text)] tracking-tight uppercase">
          VỀ DỰ ÁN {BRAND.name}
        </h1>
        <p className="text-sm sm:text-base text-[#D5DAE8] max-w-2xl mx-auto leading-relaxed">
          Xuất phát từ nỗi trăn trở của chính những sinh viên đại học: áp lực deadline dồn dập, sự ngần ngại bắt đầu và cảm giác mơ hồ trước các kỳ thi học kỳ.
        </p>
      </div>

      {/* Origin Story & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card category="Learning" className="p-6 space-y-3">
          <h2 className="text-xl font-bold font-heading text-[var(--text)] flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--violet)]" />
            <span>Vấn Đề & Giải Pháp</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
            Sinh viên thường trì hoãn không phải vì lười biếng, mà vì công việc quá lớn và thiếu phản hồi tức thì (instant gratification).
          </p>
          <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
            Bằng cách áp dụng cơ chế nhập vai RPG: mỗi 25 phút học bài là một lần hoàn thành nhiệm vụ, mỗi ngày kỷ luật là một nấc thang giữ chuỗi streak, và mỗi đồ án nộp trước hạn là một chiến tích hạ gục Boss Dungeon!
          </p>
        </Card>

        <Card category="Code" className="p-6 space-y-3">
          <h2 className="text-xl font-bold font-heading text-[var(--text)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--sky)]" />
            <span>Mô Hình Hoạt Động & Bảo Mật</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
            Toàn bộ dữ liệu của bạn được lưu trữ hoàn toàn trên trình duyệt (client-side storage). Ứng dụng không thu thập dữ liệu cá nhân, không quảng cáo rác, không tạo sự phụ thuộc vào mạng.
          </p>
          <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
            Mô hình kinh doanh tương lai: Cung cấp các Quest Packages chuyên sâu theo môn học và lộ trình kỹ năng (hiện đang chạy dưới dạng thanh toán mô phỏng demo).
          </p>
        </Card>
      </div>

      {/* Team of 5 Members */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-heading text-[var(--text)] uppercase flex items-center justify-center gap-2">
            <Users className="w-6 h-6 text-[var(--gold)]" />
            <span>Đội Ngũ Phát Triển</span>
          </h2>
          <p className="text-xs text-[var(--muted)]">
            Dữ liệu nhóm được đồng bộ từ <code>src/data/team.ts</code>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEAM_MEMBERS.map(member => (
            <Card key={member.id} variant="surface" className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[2px] bg-[var(--panel-2)] border-2 border-[var(--gold)] shadow-[2px_3px_0_0_var(--ink)] flex items-center justify-center font-bold text-sm text-[var(--gold)] font-num shrink-0">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text)]">{member.name}</h3>
                  <p className="text-xs text-[var(--violet)] font-pixel">{member.role}</p>
                </div>
              </div>

              <p className="text-xs text-[#D5DAE8] leading-relaxed">
                {member.bio}
              </p>

              <div className="pt-2 border-t border-[#2C3563] text-xs text-[var(--muted)]">
                Nhiệm vụ yêu thích: <strong className="text-[var(--gold)] font-pixel">{member.favoriteQuest}</strong>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
