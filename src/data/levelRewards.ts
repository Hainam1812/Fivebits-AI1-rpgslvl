/**
 * Dữ liệu các gói phần thưởng Giftcode Game theo cấp độ (Level Rewards)
 * Bạn có thể dễ dàng thay đổi ảnh game (gameImage), tên game (gameName),
 * cấp yêu cầu (requiredLevel) hoặc mã giftcode thật (giftcode) tại đây.
 */

export interface LevelRewardDef {
  /** Định danh duy nhất của gói thưởng */
  id: string;
  /** Cấp độ tối thiểu để mở khóa phần thưởng */
  requiredLevel: number;
  /** Tên gói phần thưởng */
  rewardName: string;
  /** Tên tựa game nhận giftcode */
  gameName: string;
  /**
   * Đường dẫn ảnh bìa game (tỉ lệ 16:9).
   * Có thể dùng ảnh SVG cục bộ trong /assets/rewards/ hoặc thay bằng ảnh PNG/JPG thật.
   */
  gameImage: string;
  /** Mô tả chi tiết vật phẩm nhận được (2-3 câu) */
  description: string;
  /**
   * Mã Giftcode game (Thay mã thật vào đây khi triển khai thực tế).
   */
  giftcode: string;
}

export const LEVEL_REWARDS: LevelRewardDef[] = [
  {
    id: 'reward-lv8-starter',
    requiredLevel: 8,
    rewardName: 'Gói Tân Thủ 500 Gems',
    gameName: 'Genshin Impact',
    // CHỖ THAY ẢNH THẬT: Bạn có thể đổi sang ảnh PNG/JPG cục bộ, ví dụ: '/assets/rewards/genshin.png'
    gameImage: '/assets/rewards/game_genshin.svg',
    description:
      'Gói tiếp tế nhà thám hiểm Teyvat bao gồm 300 Nguyên Thạch, 5 Kinh Nghiệm Anh Hùng và 50.000 Mora. Phần quà lý tưởng giúp các tân thủ nhanh chóng bứt phá sức mạnh và chiêu mộ nhân vật yêu thích.',
    // CHỖ THAY GIFTCODE THẬT:
    giftcode: 'SOLO-LV8-GENSHIN-2026',
  },
  {
    id: 'reward-lv12-warrior',
    requiredLevel: 12,
    rewardName: 'Gói Chiến Binh Ngân Hà',
    gameName: 'Honkai: Star Rail',
    // CHỖ THAY ẢNH THẬT:
    gameImage: '/assets/rewards/game_starrail.svg',
    description:
      'Tiếp tế hành trình Đội Tàu Astral bao gồm 300 Ngọc Ánh Sao, 3 Hướng Dẫn Dạo Bước và 40.000 Điểm Tín Dụng. Cung cấp tài nguyên dồi dào để nâng cấp nón ánh sáng và đột phá chiến binh.',
    // CHỖ THAY GIFTCODE THẬT:
    giftcode: 'SOLO-LV12-HSR-STAR500',
  },
  {
    id: 'reward-lv15-elite',
    requiredLevel: 15,
    rewardName: 'Gói Tinh Anh Đấu Trường',
    gameName: 'Liên Quân Mobile',
    // CHỖ THAY ẢNH THẬT:
    gameImage: '/assets/rewards/game_lienquan.svg',
    description:
      'Hòm kho báu đấu trường đỉnh cao bao gồm 500 Ruby, Thẻ thử Tướng & Trang Phục S+ 7 ngày cùng 5 Vé Quay Kho Báu cao cấp. Tự tin làm chủ mọi trận xếp hạng cùng đồng đội.',
    // CHỖ THAY GIFTCODE THẬT:
    giftcode: 'SOLO-LV15-LQM-ARENA99',
  },
  {
    id: 'reward-lv20-mythic',
    requiredLevel: 20,
    rewardName: 'Gói Huyền Thoại New Eridu',
    gameName: 'Zenless Zone Zero',
    // CHỖ THAY ẢNH THẬT:
    gameImage: '/assets/rewards/game_zzz.svg',
    description:
      'Viện trợ điều tra viên đặc nhiệm cấp cao gồm 600 Polychrome, 10 Băng Ghi Hình và 100.000 Denny. Đặc quyền dành riêng cho thợ săn Lỗ Hổng đạt cấp bậc danh giá trong hệ thống Solo Levelling.',
    // CHỖ THAY GIFTCODE THẬT:
    giftcode: 'SOLO-LV20-ZZZ-LEGEND',
  },
];
