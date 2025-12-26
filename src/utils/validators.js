/**
 * 검증 유틸리티 함수
 * 입력값 유효성 검사
 */

/**
 * 전화번호 검증
 * 010-1234-5678 형식 확인
 * 
 * @param {string} phone - 전화번호
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validatePhoneNumber('010-1234-5678') // true
 * validatePhoneNumber('010-123-4567') // false
 * validatePhoneNumber('01012345678') // false
 */
export const validatePhoneNumber = (phone) => {
  return /^010-\d{4}-\d{4}$/.test(phone);
};

/**
 * 리뷰 길이 검증
 * 
 * @param {string} text - 리뷰 텍스트
 * @param {number} maxLength - 최대 길이 (기본: 100)
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateReview('좋아요!', 100) // true
 * validateReview('a'.repeat(101), 100) // false
 */
export const validateReview = (text, maxLength = 100) => {
  return text.length <= maxLength;
};

/**
 * 이메일 검증
 * 
 * @param {string} email - 이메일
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid-email') // false
 */
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * 빈 문자열 검증
 * 공백만 있는 경우도 빈 문자열로 판단
 * 
 * @param {string} text - 검증할 문자열
 * @returns {boolean} 비어있으면 true
 * 
 * @example
 * isEmpty('') // true
 * isEmpty('   ') // true
 * isEmpty('text') // false
 */
export const isEmpty = (text) => {
  return !text || text.trim().length === 0;
};

/**
 * 길이 범위 검증
 * 
 * @param {string} text - 검증할 문자열
 * @param {number} min - 최소 길이
 * @param {number} max - 최대 길이
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateLength('Hello', 3, 10) // true
 * validateLength('Hi', 3, 10) // false
 * validateLength('Hello World!', 3, 10) // false
 */
export const validateLength = (text, min, max) => {
  const length = text.trim().length;
  return length >= min && length <= max;
};

/**
 * 숫자 범위 검증
 * 
 * @param {number} num - 검증할 숫자
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateNumberRange(5, 1, 10) // true
 * validateNumberRange(0, 1, 10) // false
 */
export const validateNumberRange = (num, min, max) => {
  return num >= min && num <= max;
};

/**
 * 날짜 유효성 검증
 * 
 * @param {string} dateStr - 날짜 문자열
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateDate('2024-12-25') // true
 * validateDate('invalid-date') // false
 */
export const validateDate = (dateStr) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

/**
 * URL 유효성 검증
 * 
 * @param {string} url - URL 문자열
 * @returns {boolean} 유효 여부
 * 
 * @example
 * validateUrl('https://example.com') // true
 * validateUrl('not-a-url') // false
 */
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};