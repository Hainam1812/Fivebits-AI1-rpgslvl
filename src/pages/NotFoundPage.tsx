import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 text-center space-y-6 max-w-md mx-auto">
      <div className="w-24 h-20 mx-auto pixel-frame pixel-frame-gold flex items-center justify-center text-2xl font-num text-[var(--gold)]">
        404
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-heading text-[var(--text)] uppercase">
          Lạc Vào Hầm Ngục Hư Vô!
        </h1>
        <p className="text-xs sm:text-sm text-[#D5DAE8] leading-relaxed">
          Tọa độ dungeon này không tồn tại hoặc đã bị đóng cổng không gian. Hãy quay lại căn cứ để tiếp tục hành trình!
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <Link to="/play">
          <Button variant="primary" icon={<Home className="w-4 h-4" />}>
            Về Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Về Trang Chủ
          </Button>
        </Link>
      </div>
    </div>
  );
};
