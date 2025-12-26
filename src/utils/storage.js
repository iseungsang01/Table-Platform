import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage 헬퍼
 * localStorage 대신 사용
 */
export const storage = {
  /**
   * 데이터 저장
   * @param {string} key - 저장할 키
   * @param {any} value - 저장할 값 (자동으로 JSON 변환)
   * 
   * @example
   * await storage.save('user', { name: 'John', age: 30 });
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
   * 
   * @example
   * const user = await storage.get('user');
   * console.log(user.name); // 'John'
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
   * 
   * @example
   * await storage.remove('user');
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
   * 
   * @example
   * await storage.clear(); // 앱 데이터 전체 삭제
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
   * 
   * @example
   * const keys = await storage.getAllKeys();
   * console.log(keys); // ['user', 'settings', ...]
   */
  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};