/**
 * 포맷팅 유틸리티 함수
 * 날짜, 전화번호 등 데이터 포맷팅
 */

/**
 * 전화번호 포맷팅
 * 숫자만 입력받아 010-1234-5678 형식으로 변환
 * 
 * @param {string} value - 입력된 전화번호
 * @returns {string} 포맷된 전화번호
 * 
 * @example
 * formatPhoneNumber('01012345678') // '010-1234-5678'
 * formatPhoneNumber('010-1234-5678') // '010-1234-5678'
 * formatPhoneNumber('010123') // '010-123'
 */
export const formatPhoneNumber = (value) => {
  const numbers = value.replace(/[^0-9]/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  }
  
  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }
  
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * 날짜 포맷팅 (전체)
 * ISO 문자열을 한국어 형식으로 변환
 * 
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜
 * 
 * @example
 * formatDate('2024-12-25T10:30:00') // '2024년 12월 25일 10:30'
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 날짜 포맷팅 (짧은 형식)
 * ISO 문자열을 '12월25일' 형식으로 변환
 * 
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string} 포맷된 날짜
 * 
 * @example
 * formatDateShort('2024-12-25T10:30:00') // '12월25일'
 */
export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월${day}일`;
};

/**
 * 숫자에 천 단위 콤마 추가
 * 
 * @param {number} num - 숫자
 * @returns {string} 포맷된 숫자
 * 
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 상대 시간 포맷팅
 * 
 * @param {string} dateStr - ISO 날짜 문자열
 * @returns {string} 상대 시간
 * 
 * @example
 * formatRelativeTime('2024-12-25T10:00:00') // '5분 전' 또는 '3시간 전'
 */
export const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
};