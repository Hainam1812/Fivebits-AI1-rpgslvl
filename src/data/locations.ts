export interface LocationDef {
  id: string;
  name: string;
  shortName?: string;
  lore: string;
  category: string;
  x: number; // SVG map coordinate
  y: number; // SVG map coordinate
  iconName: string;
  accentColor: string;
  recommendedTime: string;
}

export const CAMPUS_LOCATIONS: LocationDef[] = [
  {
    id: 'classroom',
    name: 'Giảng Đường Trung Tâm',
    shortName: 'Giảng đường',
    lore: 'Nơi diễn ra các buổi học lý thuyết, giải tích, toán rời rạc và các màn hỏi đáp căng não cùng giảng viên.',
    category: 'Academic',
    x: 400,
    y: 180,
    iconName: 'school',
    accentColor: '#3B82F6',
    recommendedTime: 'Sáng 07:30 - 11:30',
  },
  {
    id: 'library',
    name: 'Thư Viện Tri Thức',
    shortName: 'Thư viện',
    lore: 'Kho tàng tài liệu, điều hòa mát rượi và không gian yên tĩnh tuyệt đối cho các buổi học sâu và active recall.',
    category: 'Learning & Knowledge',
    x: 230,
    y: 130,
    iconName: 'book-open',
    accentColor: '#8B5CF6',
    recommendedTime: 'Trưa 12:00 - 15:30',
  },
  {
    id: 'computer-lab',
    name: 'Phòng Máy Thực Hành',
    shortName: 'Phòng máy',
    lore: 'Âm thanh bàn phím lách cách và những màn hình sáng đèn gõ Python, thuật toán thâu đêm.',
    category: 'Code & Technology',
    x: 580,
    y: 140,
    iconName: 'terminal',
    accentColor: '#06B6D4',
    recommendedTime: 'Chiều 14:00 - 17:00',
  },
  {
    id: 'gym',
    name: 'Phòng Thể Thao & Gym',
    shortName: 'Phòng gym',
    lore: 'Khu phức hợp thể chất giúp xua tan cảm giác mỏi lưng, giãn cơ và phục hồi thể lực sau giờ học.',
    category: 'Health & Habits',
    x: 650,
    y: 300,
    iconName: 'dumbbell',
    accentColor: '#10B981',
    recommendedTime: 'Chiều tối 17:00 - 18:30',
  },
  {
    id: 'park',
    name: 'Sân Cỏ & Công Viên Xanh',
    shortName: 'Công viên',
    lore: 'Thảm cỏ xanh mát dưới bóng cây cổ thụ – nơi lý tưởng để "touch grass", trò chuyện cùng bạn bè.',
    category: 'Lifestyle & Social Life',
    x: 390,
    y: 310,
    iconName: 'trees',
    accentColor: '#34D399',
    recommendedTime: 'Sáng sớm hoặc Hoàng hôn',
  },
  {
    id: 'dorm',
    name: 'Ký Túc Xá Sinh Viên',
    shortName: 'Ký túc xá',
    lore: 'Căn cứ địa xuất phát mỗi ngày: nơi ngả lưng, dọn dẹp góc học tập và nhìn lại một ngày đã qua.',
    category: 'Daily Life',
    x: 150,
    y: 320,
    iconName: 'home',
    accentColor: '#F59E0B',
    recommendedTime: 'Tối 21:00 - 23:00',
  },
  {
    id: 'club-stage',
    name: 'Sân Khấu CLB & Kỹ Năng',
    shortName: 'Sân khấu CLB',
    lore: 'Không gian mở của các câu lạc bộ, nơi rèn luyện sự tự tin, phát biểu trước đám đông và bứt phá cá nhân.',
    category: 'Personal Growth',
    x: 280,
    y: 400,
    iconName: 'mic',
    accentColor: '#EC4899',
    recommendedTime: 'Chiều muộn 16:30 - 18:00',
  },
  {
    id: 'study-hub',
    name: 'Phòng Làm Việc Nhóm',
    shortName: 'Phòng học nhóm',
    lore: 'Bảng trắng bút dạ khắp nơi, bàn tròn và những cuộc họp sprint gấp rút tiêu diệt deadline đồ án.',
    category: 'Productivity & Planning',
    x: 510,
    y: 400,
    iconName: 'users',
    accentColor: '#EF4444',
    recommendedTime: 'Bất kỳ lúc nào deadline cận kề',
  },
  {
    id: 'event-hall',
    name: 'Hội Trường Lớn & Đấu Trường Thi',
    shortName: 'Hội trường',
    lore: 'Nơi tổ chức các sự kiện mùa giải, tuần lễ tân sinh viên và những kỳ thi boss kiểm tra kiến thức.',
    category: 'Sự kiện & Thi',
    x: 400,
    y: 45,
    iconName: 'landmark',
    accentColor: '#EAB308',
    recommendedTime: 'Khi có mùa giải & kỳ thi diễn ra',
  },
];

export function getLocationById(id: string): LocationDef | undefined {
  return CAMPUS_LOCATIONS.find(l => l.id === id);
}
