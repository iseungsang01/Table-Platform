/** 앱 설정 상수 */

export const APP_INFO = {
  name: 'Tarot User Phone',
  version: '1.0.0',
  description: '타로 카드 선택 및 스탬프 적립 앱',
};

export const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export const STAMP_CONFIG = {
  maxStamps: 10,
  stampsPerVisit: 1,
  couponReward: 1,
};

export const REVIEW_CONFIG = {
  maxLength: 100,
  minLength: 0,
};

export const BUG_REPORT_CONFIG = {
  maxTitleLength: 100,
  maxDescriptionLength: 500,
  categories: ['app', 'store'],
  types: {
    app: ['어플 버그', '어플 불편사항', '어플 개선 건의'],
    store: ['가게 불편사항', '서비스 개선 요청', '기타 문의'],
  },
};

export const VOTE_CONFIG = {
  maxSelections: 5,
  minSelections: 1,
};

export const COUPON_CONFIG = {
  types: {
    stamp: { name: '스탬프 쿠폰', icon: '⭐', color: '#ffd700', validDays: null },
    birthday: { name: '생일 쿠폰', icon: '🎂', color: '#ffb6c1', validDays: 30 },
  },
};

export const ANIMATION_CONFIG = {
  duration: { fast: 200, normal: 300, slow: 500 },
  easing: { default: 'ease', inOut: 'ease-in-out' },
};

export const STORAGE_KEYS = {
  customer: 'tarot_user_phone_customer',
  savedPhone: 'saved_phone',
  rememberMe: 'remember_me',
};

export const DATE_FORMATS = {
  full: 'YYYY년 MM월 DD일 HH:mm',
  short: 'MM월 DD일',
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
};

export const ERROR_MESSAGES = {
  network: '네트워크 연결을 확인해주세요.',
  server: '서버 오류가 발생했습니다.',
  unknown: '알 수 없는 오류가 발생했습니다.',
  notFound: '데이터를 찾을 수 없습니다.',
  unauthorized: '권한이 없습니다.',
  validation: '입력값을 확인해주세요.',
};

export const SUCCESS_MESSAGES = {
  login: '✅ 로그인 성공!',
  logout: '로그아웃 되었습니다.',
  save: '✨ 저장되었습니다!',
  update: '✅ 수정되었습니다!',
  delete: '🗑️ 삭제되었습니다.',
  submit: '✅ 접수되었습니다!',
  vote: '✅ 투표가 완료되었습니다!',
  couponUsed: '✅ 쿠폰이 사용되었습니다!',
};