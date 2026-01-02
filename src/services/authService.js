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
   * 전화번호와 비밀번호로 고객 조회 (010-1234-5678 형식)
   * 
   * @param {string} phoneNumber - 전화번호 (010-1234-5678)
   * @param {string} password - 비밀번호
   * @returns {object} { success, customer?, message? }
   */
  async login(phoneNumber, password) {
    try {
      console.log('🔍 로그인 시도:', phoneNumber);
      
      // 전화번호 정규화
      const normalizedPhone = phoneNumber.trim();
      console.log('📝 정규화된 전화번호:', normalizedPhone);
      
      // 1. 전화번호로 고객 조회
      console.log('🔍 고객 조회 시작...');
      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('phone_number', normalizedPhone)
        .is('deleted_at', null);

      console.log('📊 조회 결과:', { 
        count: count,
        dataLength: data?.length,
        error: error?.message,
        hasData: data && data.length > 0
      });

      if (error) {
        console.error('❌ DB 조회 오류:', error);
        throw error;
      }

      const customer = data && data.length > 0 ? data[0] : null;

      if (!customer) {
        console.log('⚠️ 등록되지 않은 전화번호:', normalizedPhone);
        return {
          success: false,
          message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
        };
      }

      if (!customer.id) {
        console.error('❌ 고객 데이터에 ID(UUID)가 없습니다:', customer);
        return {
          success: false,
          message: '고객 정보가 올바르지 않습니다. 매장에 문의해주세요.',
        };
      }

      // 2. 비밀번호 검증 (Supabase의 crypt 함수 사용)
      console.log('🔐 비밀번호 검증 시작...');
      
      const { data: passwordCheck, error: passwordError } = await supabase
        .rpc('verify_password', {
          customer_uuid: customer.id,
          input_password: password
        });

      if (passwordError) {
        console.error('❌ 비밀번호 검증 오류:', passwordError);
        return {
          success: false,
          message: '비밀번호 검증 중 오류가 발생했습니다.',
        };
      }

      if (!passwordCheck) {
        console.log('⚠️ 비밀번호 불일치');
        return {
          success: false,
          message: '비밀번호가 일치하지 않습니다.',
        };
      }

      // 3. 로그인 성공
      await storage.save(CUSTOMER_KEY, customer);
      console.log('✅ 로그인 성공:', customer.nickname, 'UUID:', customer.id);

      return { success: true, customer: customer };
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
   */
  async logout() {
    console.log('🚪 로그아웃 시작');
    await storage.remove(CUSTOMER_KEY);
    console.log('✅ 로그아웃 완료');
  },

  /**
   * 저장된 고객 정보 조회
   */
  async getStoredCustomer() {
    const customer = await storage.get(CUSTOMER_KEY);
    if (customer) {
      console.log('📱 로컬에 저장된 고객 정보 발견:', customer.nickname, 'UUID:', customer.id);
    }
    return customer;
  },

  /**
   * 고객 정보 새로고침
   */
  async refreshCustomer(customerId) {
    try {
      console.log('🔄 고객 정보 새로고침 UUID:', customerId);
      
      if (!customerId) {
        console.error('❌ UUID가 없습니다');
        return null;
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .is('deleted_at', null);

      if (error) {
        console.error('❌ Refresh error:', error);
        throw error;
      }

      const customer = data && data.length > 0 ? data[0] : null;

      if (customer) {
        await storage.save(CUSTOMER_KEY, customer);
        console.log('✅ 고객 정보 갱신 완료:', customer.nickname);
      } else {
        console.log('⚠️ 고객 정보를 찾을 수 없습니다');
      }

      return customer;
    } catch (error) {
      console.error('❌ Refresh customer error:', error);
      return null;
    }
  },
};