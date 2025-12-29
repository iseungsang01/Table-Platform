import { supabase } from './supabase';
import { storage } from '../utils/storage';

const CUSTOMER_KEY = 'tarot_customer';

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
      // 전화번호는 이미 010-1234-5678 형식으로 포맷팅됨
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber) // 010-1234-5678 그대로 조회
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
        };
      }

      // 로컬 스토리지에 고객 정보 저장
      await storage.save(CUSTOMER_KEY, data);

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
    await storage.remove(CUSTOMER_KEY);
    await storage.remove('remember_me');
    await storage.remove('saved_phone');
  },

  /**
   * 저장된 고객 정보 조회
   * 로컬 스토리지에서 고객 정보 가져오기
   * 
   * @returns {object|null} 고객 정보 또는 null
   */
  async getStoredCustomer() {
    return await storage.get(CUSTOMER_KEY);
  },

  /**
   * 고객 정보 새로고침
   * DB에서 최신 정보 조회 후 로컬 스토리지 업데이트
   * 
   * @param {number} customerId - 고객 ID
   * @returns {object|null} 갱신된 고객 정보 또는 null
   */
  async refreshCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      if (data) {
        await storage.save(CUSTOMER_KEY, data);
      }

      return data;
    } catch (error) {
      console.error('Refresh customer error:', error);
      return null;
    }
  },
};