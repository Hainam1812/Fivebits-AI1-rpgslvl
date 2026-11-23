import React from 'react';
import { DifficultyLevel } from '../../config/progression.js';
import { CosmeticRarity } from '../../data/cosmetics.js';

export const DifficultyBadge: React.FC<{ difficulty: DifficultyLevel; className?: string }> = ({
  difficulty,
  className = '',
}) => {
  const configs = {
    Easy: {
      label: 'Easy',
      bg: 'bg-[#161B33] border-[#34D3A0] text-[#34D3A0]',
      gem: '◆',
    },
    Normal: {
      label: 'Normal',
      bg: 'bg-[#161B33] border-[#62B6F7] text-[#62B6F7]',
      gem: '◆◆',
    },
    Hard: {
      label: 'Hard',
      bg: 'bg-[#161B33] border-[#FF8C6B] text-[#FF8C6B]',
      gem: '◆◆◆',
    },
    Boss: {
      label: 'Boss Dungeon',
      bg: 'bg-[#1F2650] border-[#E8C27A] text-[#E8C27A]',
      gem: '★ BOSS ★',
    },
  };

  const c = configs[difficulty] || configs.Normal;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] border-2 text-xs font-bold whitespace-nowrap ${c.bg} ${className}`}
    >
      <span className="text-[11px] leading-none">{c.gem}</span>
      <span>{c.label}</span>
    </span>
  );
};

export const RarityBadge: React.FC<{ rarity: CosmeticRarity; className?: string }> = ({
  rarity,
  className = '',
}) => {
  const configs = {
    Common: {
      label: 'Phổ biến',
      gems: '◆',
      bg: 'bg-[#161B33] border-[#9AA0BD] text-[#F3EFE6]',
    },
    Rare: {
      label: 'Hiếm',
      gems: '◆◆',
      bg: 'bg-[#161B33] border-[#62B6F7] text-[#62B6F7]',
    },
    Epic: {
      label: 'Sử thi',
      gems: '◆◆◆',
      bg: 'bg-[#161B33] border-[#A99BFF] text-[#A99BFF]',
    },
    Legendary: {
      label: 'Huyền thoại',
      gems: '◆◆◆◆',
      bg: 'bg-[#1F2650] border-[#E8C27A] text-[#E8C27A]',
    },
  };

  const c = configs[rarity] || configs.Common;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-xs font-bold border-2 whitespace-nowrap ${c.bg} ${className}`}
    >
      <span className="text-[var(--gold)] tracking-tighter">{c.gems}</span>
      <span>{c.label}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: 'todo' | 'in_progress' | 'completed' | 'locked' | 'overdue';
  className?: string;
}> = ({ status, className = '' }) => {
  const configs = {
    todo: { label: 'Chưa làm', style: 'bg-[#161B33] border-[#4A558A] text-[#C8CEEA]' },
    in_progress: { label: 'Đang làm', style: 'bg-[#1F2650] border-[#E8C27A] text-[#E8C27A]' },
    completed: { label: 'Đã xong', style: 'bg-[#161B33] border-[#34D3A0] text-[#34D3A0]' },
    locked: { label: 'Đang khóa', style: 'bg-[#161B33] border-[#8E93AD] text-[#8E93AD]' },
    overdue: { label: 'Quá hạn', style: 'bg-[#1F2650] border-[#FF6B81] text-[#FF6B81] font-bold' },
  };

  const c = configs[status] || configs.todo;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] text-xs font-semibold border-2 whitespace-nowrap ${c.style} ${className}`}>
      {c.label}
    </span>
  );
};
