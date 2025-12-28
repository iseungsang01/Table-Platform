import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage 헬퍼
 * 로컬 스토리지 활용 최대화
 */

// 저장소 키 상수
export const STORAGE_KEYS = {
  // 인증
  CUSTOMER: 'tarot_customer',
  SAVED_PHONE: 'saved_phone',
  REMEMBER_ME: 'remember_me',
  
  // 카드 리뷰 (방문 ID를 키로 사용)
  CARD_REVIEWS: 'card_reviews', // { visitId: reviewText }
  
  // 읽은 공지사항
  READ_NOTICES: 'read_notices', // [noticeId1, noticeId2, ...]
  
  // 앱 설정
  APP_SETTINGS: 'app_settings',
  
  // 캐시
  VISIT_CACHE: 'visit_cache',
  COUPON_CACHE: 'coupon_cache',
  LAST_SYNC: 'last_sync',
};

export const storage = {
  /**
   * 데이터 저장
   * @param {string} key - 저장할 키
   * @param {any} value - 저장할 값 (자동으로 JSON 변환)
   */
  async save(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage save error:', error);
    }
  },

  /**
   * 데이터 조회
   * @param {string} key - 조회할 키
   * @returns {any} 저장된 값 (없으면 null)
   */
  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * 데이터 삭제
   * @param {string} key - 삭제할 키
   */
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },

  /**
   * 모든 데이터 삭제
   */
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  /**
   * 모든 키 조회
   * @returns {string[]} 저장된 모든 키 배열
   */
  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },

  // ========================================
  // 카드 리뷰 관련 (로컬 전용)
  // ========================================

  /**
   * 카드 리뷰 저장
   * @param {number} visitId - 방문 기록 ID
   * @param {string} review - 리뷰 텍스트
   */
  async saveCardReview(visitId, review) {
    try {
      const reviews = await this.get(STORAGE_KEYS.CARD_REVIEWS) || {};
      reviews[visitId] = review;
      await this.save(STORAGE_KEYS.CARD_REVIEWS, reviews);
    } catch (error) {
      console.error('Save card review error:', error);
    }
  },

  /**
   * 카드 리뷰 조회
   * @param {number} visitId - 방문 기록 ID
   * @returns {string|null} 리뷰 텍스트
   */
  async getCardReview(visitId) {
    try {
      const reviews = await this.get(STORAGE_KEYS.CARD_REVIEWS) || {};
      return reviews[visitId] || null;
    } catch (error) {
      console.error('Get card review error:', error);
      return null;
    }
  },

  /**
   * 모든 카드 리뷰 조회
   * @returns {object} { visitId: reviewText }
   */
  async getAllCardReviews() {
    try {
      return await this.get(STORAGE_KEYS.CARD_REVIEWS) || {};
    } catch (error) {
      console.error('Get all card reviews error:', error);
      return {};
    }
  },

  /**
   * 카드 리뷰 삭제
   * @param {number} visitId - 방문 기록 ID
   */
  async deleteCardReview(visitId) {
    try {
      const reviews = await this.get(STORAGE_KEYS.CARD_REVIEWS) || {};
      delete reviews[visitId];
      await this.save(STORAGE_KEYS.CARD_REVIEWS, reviews);
    } catch (error) {
      console.error('Delete card review error:', error);
    }
  },

  // ========================================
  // 읽은 공지사항 관련 (로컬 전용)
  // ========================================

  /**
   * 공지사항 읽음 처리
   * @param {number} noticeId - 공지사항 ID
   */
  async markNoticeAsRead(noticeId) {
    try {
      const readNotices = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
      if (!readNotices.includes(noticeId)) {
        readNotices.push(noticeId);
        await this.save(STORAGE_KEYS.READ_NOTICES, readNotices);
      }
    } catch (error) {
      console.error('Mark notice as read error:', error);
    }
  },

  /**
   * 여러 공지사항 읽음 처리
   * @param {number[]} noticeIds - 공지사항 ID 배열
   */
  async markNoticesAsRead(noticeIds) {
    try {
      const readNotices = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
      const newReadNotices = [...new Set([...readNotices, ...noticeIds])];
      await this.save(STORAGE_KEYS.READ_NOTICES, newReadNotices);
    } catch (error) {
      console.error('Mark notices as read error:', error);
    }
  },

  /**
   * 공지사항 읽음 여부 확인
   * @param {number} noticeId - 공지사항 ID
   * @returns {boolean} 읽음 여부
   */
  async isNoticeRead(noticeId) {
    try {
      const readNotices = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
      return readNotices.includes(noticeId);
    } catch (error) {
      console.error('Check notice read error:', error);
      return false;
    }
  },

  /**
   * 읽은 공지사항 목록 조회
   * @returns {number[]} 읽은 공지사항 ID 배열
   */
  async getReadNotices() {
    try {
      return await this.get(STORAGE_KEYS.READ_NOTICES) || [];
    } catch (error) {
      console.error('Get read notices error:', error);
      return [];
    }
  },

  /**
   * 안 읽은 공지사항 개수 계산
   * @param {number[]} allNoticeIds - 전체 공지사항 ID 배열
   * @returns {number} 안 읽은 개수
   */
  async getUnreadNoticeCount(allNoticeIds) {
    try {
      const readNotices = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
      return allNoticeIds.filter(id => !readNotices.includes(id)).length;
    } catch (error) {
      console.error('Get unread notice count error:', error);
      return 0;
    }
  },

  // ========================================
  // 앱 설정
  // ========================================

  /**
   * 앱 설정 저장
   * @param {object} settings - 설정 객체
   */
  async saveAppSettings(settings) {
    try {
      const currentSettings = await this.get(STORAGE_KEYS.APP_SETTINGS) || {};
      await this.save(STORAGE_KEYS.APP_SETTINGS, { ...currentSettings, ...settings });
    } catch (error) {
      console.error('Save app settings error:', error);
    }
  },

  /**
   * 앱 설정 조회
   * @returns {object} 설정 객체
   */
  async getAppSettings() {
    try {
      return await this.get(STORAGE_KEYS.APP_SETTINGS) || {
        darkMode: true,
        notifications: true,
        autoRefresh: true,
      };
    } catch (error) {
      console.error('Get app settings error:', error);
      return {};
    }
  },

  // ========================================
  // 캐시 관리
  // ========================================

  /**
   * 방문 기록 캐시 저장
   * @param {array} visits - 방문 기록 배열
   */
  async cacheVisits(visits) {
    try {
      await this.save(STORAGE_KEYS.VISIT_CACHE, visits);
      await this.save(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Cache visits error:', error);
    }
  },

  /**
   * 방문 기록 캐시 조회
   * @returns {array} 방문 기록 배열
   */
  async getCachedVisits() {
    try {
      return await this.get(STORAGE_KEYS.VISIT_CACHE) || [];
    } catch (error) {
      console.error('Get cached visits error:', error);
      return [];
    }
  },

  /**
   * 쿠폰 캐시 저장
   * @param {array} coupons - 쿠폰 배열
   */
  async cacheCoupons(coupons) {
    try {
      await this.save(STORAGE_KEYS.COUPON_CACHE, coupons);
    } catch (error) {
      console.error('Cache coupons error:', error);
    }
  },

  /**
   * 쿠폰 캐시 조회
   * @returns {array} 쿠폰 배열
   */
  async getCachedCoupons() {
    try {
      return await this.get(STORAGE_KEYS.COUPON_CACHE) || [];
    } catch (error) {
      console.error('Get cached coupons error:', error);
      return [];
    }
  },

  /**
   * 마지막 동기화 시간 조회
   * @returns {string|null} ISO 날짜 문자열
   */
  async getLastSyncTime() {
    try {
      return await this.get(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Get last sync time error:', error);
      return null;
    }
  },

  // ========================================
  // 데이터 정리
  // ========================================

  /**
   * 오래된 캐시 삭제
   * @param {number} days - 보관 기간 (일)
   */
  async clearOldCache(days = 7) {
    try {
      const lastSync = await this.getLastSyncTime();
      if (!lastSync) return;

      const daysSinceSync = Math.floor(
        (new Date() - new Date(lastSync)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceSync > days) {
        await this.remove(STORAGE_KEYS.VISIT_CACHE);
        await this.remove(STORAGE_KEYS.COUPON_CACHE);
        await this.remove(STORAGE_KEYS.LAST_SYNC);
      }
    } catch (error) {
      console.error('Clear old cache error:', error);
    }
  },

  /**
   * 삭제된 방문 기록의 리뷰 정리
   * @param {number[]} validVisitIds - 유효한 방문 기록 ID 배열
   */
  async cleanupOrphanedReviews(validVisitIds) {
    try {
      const reviews = await this.getAllCardReviews();
      const cleanedReviews = {};

      Object.keys(reviews).forEach(visitId => {
        if (validVisitIds.includes(parseInt(visitId))) {
          cleanedReviews[visitId] = reviews[visitId];
        }
      });

      await this.save(STORAGE_KEYS.CARD_REVIEWS, cleanedReviews);
    } catch (error) {
      console.error('Cleanup orphaned reviews error:', error);
    }
  },
};