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
      console.log('🔍 로그인 시도:', phoneNumber);
      
      // Supabase 연결 테스트
      const { data: testData, error: testError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase 연결 오류:', testError);
        return {
          success: false,
          message: 'DB 연결 오류가 발생했습니다. 네트워크를 확인해주세요.',
        };
      }
      
      console.log('✅ Supabase 연결 성공');
      
      // 전화번호로 고객 조회
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .is('deleted_at', null)
        .single();

      console.log('📊 조회 결과:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // 데이터가 없는 경우
          console.log('⚠️ 등록되지 않은 전화번호:', phoneNumber);
          return {
            success: false,
            message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
          };
        }
        throw error;
      }

      if (!data) {
        console.log('⚠️ 고객 정보 없음');
        return {
          success: false,
          message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
        };
      }

      // 로컬 스토리지에 고객 정보 저장
      await storage.save(CUSTOMER_KEY, data);
      console.log('✅ 로그인 성공:', data.nickname);

      return { success: true, customer: data };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      };
    }
  },

  /**
   * 로그아웃
   * 로컬 스토리지에서 고객 정보 및 저장된 전화번호 삭제
   */
  async logout() {
    console.log('🚪 로그아웃 시작');
    await storage.remove(CUSTOMER_KEY);
    // remember_me와 saved_phone는 유지 (다음 로그인 시 편의를 위해)
    console.log('✅ 로그아웃 완료');
  },

  /**
   * 저장된 고객 정보 조회
   * 로컬 스토리지에서 고객 정보 가져오기
   * 
   * @returns {object|null} 고객 정보 또는 null
   */
  async getStoredCustomer() {
    const customer = await storage.get(CUSTOMER_KEY);
    if (customer) {
      console.log('📱 로컬에 저장된 고객 정보 발견:', customer.nickname);
    }
    return customer;
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
      console.log('🔄 고객 정보 새로고침:', customerId);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('❌ Refresh error:', error);
        throw error;
      }

      if (data) {
        await storage.save(CUSTOMER_KEY, data);
        console.log('✅ 고객 정보 갱신 완료');
      }

      return data;
    } catch (error) {
      console.error('❌ Refresh customer error:', error);
      return null;
    }
  },
};