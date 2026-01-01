import { supabase } from './supabase';
import { storage, STORAGE_KEYS } from '../utils/storage';

/**
 * 인증 서비스
 * 로그인, 로그아웃, 고객 정보 관리
 */
export const authService = {
  /**
   * 로그인
   * 전화번호로 고객 조회 (010-1234-5678 형식)
   * 
   * @param {string} phoneNumber - 전화번호 (010-1234-5678)
   * @returns {object} { success, customer?, message? }
   */
  async login(phoneNumber) {
    try {
      console.log('Attempting login with phone:', phoneNumber);

      // 전화번호로 고객 조회
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .is('deleted_at', null)
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없음
          return {
            success: false,
            message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
          };
        }
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
        };
      }

      // 로컬 스토리지에 고객 정보 저장
      await storage.save(STORAGE_KEYS.CUSTOMER, data);
      console.log('Customer data saved to storage');

      return { success: true, customer: data };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '로그인 중 오류가 발생했습니다.',
      };
    }
  },

  /**
   * 로그아웃
   * 로컬 스토리지에서 고객 정보 및 저장된 전화번호 삭제
   */
  async logout() {
    try {
      await storage.remove(STORAGE_KEYS.CUSTOMER);
      await storage.remove(STORAGE_KEYS.REMEMBER_ME);
      await storage.remove(STORAGE_KEYS.SAVED_PHONE);
      console.log('Logout completed - all storage cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  /**
   * 저장된 고객 정보 조회
   * 로컬 스토리지에서 고객 정보 가져오기
   * 
   * @returns {object|null} 고객 정보 또는 null
   */
  async getStoredCustomer() {
    try {
      const customer = await storage.get(STORAGE_KEYS.CUSTOMER);
      console.log('Retrieved stored customer:', customer ? 'Found' : 'Not found');
      return customer;
    } catch (error) {
      console.error('Get stored customer error:', error);
      return null;
    }
  },

  /**
   * 고객 정보 새로고침
   * DB에서 최신 정보 조회 후 로컬 스토리지 업데이트
   * 
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object|null} 갱신된 고객 정보 또는 null
   */
  async refreshCustomer(customerId) {
    try {
      console.log('Refreshing customer:', customerId);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Refresh customer error:', error);
        throw error;
      }

      if (data) {
        await storage.save(STORAGE_KEYS.CUSTOMER, data);
        console.log('Customer data refreshed');
      }

      return data;
    } catch (error) {
      console.error('Refresh customer error:', error);
      return null;
    }
  },
};