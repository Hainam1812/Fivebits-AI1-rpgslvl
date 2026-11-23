import React from 'react';
import { BRAND } from '../../config/brand.js';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSlogan?: boolean;
  className?: string;
}

const LOGO_SRC = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/assets/aistudio/ava_231acbe6.png`;

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSlogan = false, className = '' }) => {
  const imgSizes = {
    sm: 'h-[65px] sm:h-[72px] w-auto',
    md: 'h-[87px] sm:h-[101px] w-auto',
    lg: 'h-[116px] sm:h-[144px] w-auto',
  };

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <img
        src={LOGO_SRC}
        alt={BRAND.name}
        className={`${imgSizes[size]} max-w-full object-contain select-none`}
      />
      {showSlogan && (
        <span className="text-xs text-[var(--gold)] font-bold tracking-widest uppercase">
          {BRAND.slogan}
        </span>
      )}
    </div>
  );
};
