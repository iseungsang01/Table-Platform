/**
 * 색상 팔레트
 * 앱 전체에서 사용하는 일관된 색상 정의
 */
export const Colors = {
  // 보라색 계열
  purpleDark: '#1a0033',
  purpleMid: '#2d004d',
  purpleLight: '#8a2be2',
  purpleLighter: '#9370db',

  // 강조 색상 (Gold Unification)
  goldMain: '#D4AF37', // 메인 금색 (Metallic Gold)
  goldSub: '#F3E5AB',  // 보조 연금색 (Pale Gold / Vanilla)

  // 기존 호환성을 위해 남겨두되, 위 2가지 색상으로 매핑
  gold: '#D4AF37',       // -> goldMain
  goldBright: '#F3E5AB', // -> goldSub
  goldDark: '#B8860B',   // -> 유지를 위해 남김 (그림자/테두리용으로 필요할 수 있음, 하지만 최소화)

  lavender: '#e0b0ff',

  // 경고/오류
  red: '#ff4500',
  redSoft: '#ff6b6b',
  errorRed: '#f44336',

  // 성공
  green: '#4caf50',
};

/**
 * 그라데이션 색상 배열
 * LinearGradient에서 사용
 */
export const Gradients = {
  // 메인 배경 그라데이션
  purple: ['#1a0033', '#2d004d'],

  // 버튼 그라데이션
  button: ['#8a2be2', '#9370db'],

  // ✅ 골드 브라운 버튼 (LoginScreen용)
  goldBrown: ['#D4AF37', '#B8860B'], // Modified to match goldMain range roughly

  // 위험 버튼 그라데이션
  red: ['#ff6b6b', '#ee5a6f'],
};