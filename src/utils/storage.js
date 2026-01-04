import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage 헬퍼 - 로컬 스토리지 활용 최대화
 */

export const STORAGE_KEYS = {
  CUSTOMER: 'tarot_customer',
  SAVED_PHONE: 'saved_phone',
  REMEMBER_ME: 'remember_me',
  SELECTED_CARDS: 'selected_cards',
  CARD_REVIEWS: 'card_reviews',
  CARD_IMAGES: 'card_images',
  READ_NOTICES: 'read_notices',
  APP_SETTINGS: 'app_settings',
  VISIT_CACHE: 'visit_cache',
  COUPON_CACHE: 'coupon_cache',
  LAST_SYNC: 'last_sync',
};

export const storage = {
  // 기본 CRUD
  async save(key, value) {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error(`Storage save error (${key}):`, e); }
  },

  async get(key) {
    try {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (e) { console.error(`Storage get error (${key}):`, e); return null; }
  },

  async remove(key) {
    try { await AsyncStorage.removeItem(key); }
    catch (e) { console.error(`Storage remove error (${key}):`, e); }
  },

  async clear() {
    try { await AsyncStorage.clear(); }
    catch (e) { console.error('Storage clear error:', e); }
  },

  async getAllKeys() {
    try { return await AsyncStorage.getAllKeys(); }
    catch (e) { console.error('Storage getAllKeys error:', e); return []; }
  },

  // 내부 유틸리티: 객체 형태의 데이터 업데이트 공통 로직
  async _updateMap(key, id, value, isDelete = false) {
    const data = await this.get(key) || {};
    if (isDelete) delete data[id]; else data[id] = value;
    await this.save(key, data);
  },

  // 카드 선택 관련
  async saveSelectedCard(visitId, cardName) { await this._updateMap(STORAGE_KEYS.SELECTED_CARDS, visitId, cardName); },
  async getSelectedCard(visitId) { return (await this.get(STORAGE_KEYS.SELECTED_CARDS) || {})[visitId] || null; },
  async getAllSelectedCards() { return await this.get(STORAGE_KEYS.SELECTED_CARDS) || {}; },
  async deleteSelectedCard(visitId) { await this._updateMap(STORAGE_KEYS.SELECTED_CARDS, visitId, null, true); },

  // 카드 이미지 관련
  async saveCardImage(visitId, imageData) { await this._updateMap(STORAGE_KEYS.CARD_IMAGES, visitId, imageData); },
  async getCardImage(visitId) { return (await this.get(STORAGE_KEYS.CARD_IMAGES) || {})[visitId] || null; },
  async getAllCardImages() { return await this.get(STORAGE_KEYS.CARD_IMAGES) || {}; },
  async deleteCardImage(visitId) { await this._updateMap(STORAGE_KEYS.CARD_IMAGES, visitId, null, true); },

  // 카드 리뷰 관련
  async saveCardReview(visitId, review) { await this._updateMap(STORAGE_KEYS.CARD_REVIEWS, visitId, review); },
  async getCardReview(visitId) { return (await this.get(STORAGE_KEYS.CARD_REVIEWS) || {})[visitId] || null; },
  async getAllCardReviews() { return await this.get(STORAGE_KEYS.CARD_REVIEWS) || {}; },
  async deleteCardReview(visitId) { await this._updateMap(STORAGE_KEYS.CARD_REVIEWS, visitId, null, true); },

  // 공지사항 관련
  async markNoticeAsRead(noticeId) { await this.markNoticesAsRead([noticeId]); },
  async markNoticesAsRead(noticeIds) {
    const read = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
    await this.save(STORAGE_KEYS.READ_NOTICES, [...new Set([...read, ...noticeIds])]);
  },
  async isNoticeRead(noticeId) { return (await this.get(STORAGE_KEYS.READ_NOTICES) || []).includes(noticeId); },
  async getReadNotices() { return await this.get(STORAGE_KEYS.READ_NOTICES) || []; },
  async getUnreadNoticeCount(allNoticeIds) {
    const read = await this.get(STORAGE_KEYS.READ_NOTICES) || [];
    return allNoticeIds.filter(id => !read.includes(id)).length;
  },

  // 앱 설정 및 캐시
  async saveAppSettings(settings) { 
    const curr = await this.get(STORAGE_KEYS.APP_SETTINGS) || {};
    await this.save(STORAGE_KEYS.APP_SETTINGS, { ...curr, ...settings });
  },
  async getAppSettings() { 
    return await this.get(STORAGE_KEYS.APP_SETTINGS) || { darkMode: true, notifications: true, autoRefresh: true };
  },
  async cacheVisits(visits) { 
    await this.save(STORAGE_KEYS.VISIT_CACHE, visits);
    await this.save(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  },
  async getCachedVisits() { return await this.get(STORAGE_KEYS.VISIT_CACHE) || []; },
  async cacheCoupons(coupons) { await this.save(STORAGE_KEYS.COUPON_CACHE, coupons); },
  async getCachedCoupons() { return await this.get(STORAGE_KEYS.COUPON_CACHE) || []; },
  async getLastSyncTime() { return await this.get(STORAGE_KEYS.LAST_SYNC); },

  // 데이터 정리
  async clearOldCache(days = 7) {
    const last = await this.getLastSyncTime();
    if (last && (new Date() - new Date(last)) / 864e5 > days) {
      await Promise.all([this.remove(STORAGE_KEYS.VISIT_CACHE), this.remove(STORAGE_KEYS.COUPON_CACHE), this.remove(STORAGE_KEYS.LAST_SYNC)]);
    }
  },

  // Orphaned 데이터 정리 공통 로직
  async _cleanup(key, validIds) {
    const data = await this.get(key) || {};
    const filtered = Object.fromEntries(Object.entries(data).filter(([id]) => validIds.includes(parseInt(id))));
    await this.save(key, filtered);
  },
  async cleanupOrphanedCards(ids) { await this._cleanup(STORAGE_KEYS.SELECTED_CARDS, ids); },
  async cleanupOrphanedReviews(ids) { await this._cleanup(STORAGE_KEYS.CARD_REVIEWS, ids); },
  async cleanupOrphanedImages(ids) { await this._cleanup(STORAGE_KEYS.CARD_IMAGES, ids); },
};