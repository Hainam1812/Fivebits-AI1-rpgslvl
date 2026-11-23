export type CategoryThemeKey =
  | 'health'
  | 'lifestyle'
  | 'code'
  | 'learning'
  | 'university'
  | 'productivity'
  | 'growth'
  | 'daily'
  | 'academic'
  | 'default';

const CATEGORY_MAP: Record<string, CategoryThemeKey> = {
  // Quest Packages & Exams
  'health & habits': 'health',
  health: 'health',
  'lifestyle & balance': 'lifestyle',
  'lifestyle & social life': 'lifestyle',
  'code & technology': 'code',
  'learning & knowledge': 'learning',
  'university & ai': 'university',
  'productivity & planning': 'productivity',
  'personal growth': 'growth',
  'daily life': 'daily',
  academic: 'academic',

  // Achievements & Map Locations
  'phát triển bản thân': 'growth',
  'học tập': 'academic',
  'daily quests': 'daily',
  'quest packages': 'learning',
  'cửa hàng': 'default',
  'sự kiện và thi': 'default',
  'sự kiện & thi': 'default',
  'bản đồ': 'university',
};

export function getCategoryKey(category?: string): CategoryThemeKey {
  if (!category) return 'default';
  const normalized = category.trim().toLowerCase();
  return CATEGORY_MAP[normalized] || 'default';
}

export const CATEGORY_CSS_VAR: Record<CategoryThemeKey, string> = {
  health: 'var(--cat-health)',
  lifestyle: 'var(--cat-lifestyle)',
  code: 'var(--cat-code)',
  learning: 'var(--cat-learning)',
  university: 'var(--cat-university)',
  productivity: 'var(--cat-productivity)',
  growth: 'var(--cat-growth)',
  daily: 'var(--cat-daily)',
  academic: 'var(--cat-academic)',
  default: 'var(--cat-default)',
};
