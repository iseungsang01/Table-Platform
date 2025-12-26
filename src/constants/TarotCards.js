/**
 * 타로 카드 데이터
 * 카드 선택 및 표시에 사용
 */
export const TAROT_CARDS = [
  { id: 1, emoji: '🃏', name: 'The Fool', meaning: '새로운 시작' },
  { id: 2, emoji: '🎩', name: 'The Magician', meaning: '창조와 의지' },
  { id: 3, emoji: '👸', name: 'The Empress', meaning: '풍요와 사랑' },
  { id: 4, emoji: '🤴', name: 'The Emperor', meaning: '권위와 안정' },
  { id: 5, emoji: '⚖️', name: 'Justice', meaning: '정의와 균형' },
  { id: 6, emoji: '🌙', name: 'The Moon', meaning: '직관과 꿈' },
  { id: 7, emoji: '☀️', name: 'The Sun', meaning: '성공과 기쁨' },
  { id: 8, emoji: '⭐', name: 'The Star', meaning: '희망과 영감' },
  { id: 9, emoji: '🎭', name: 'The Lovers', meaning: '선택과 사랑' },
  { id: 10, emoji: '🔱', name: 'The Devil', meaning: '유혹과 집착' },
];

/**
 * 카드 이름으로 이모지 찾기
 * @param {string} cardName - 타로 카드 이름
 * @returns {string} 이모지 (없으면 기본 카드 이모지)
 * 
 * @example
 * getTarotEmoji('The Fool') // '🃏'
 * getTarotEmoji('Unknown') // '🃏'
 */
export const getTarotEmoji = (cardName) => {
  const card = TAROT_CARDS.find((c) => c.name === cardName);
  return card ? card.emoji : '🃏';
};

/**
 * 카드 이름으로 의미 찾기
 * @param {string} cardName - 타로 카드 이름
 * @returns {string} 의미
 */
export const getTarotMeaning = (cardName) => {
  const card = TAROT_CARDS.find((c) => c.name === cardName);
  return card ? card.meaning : '';
};