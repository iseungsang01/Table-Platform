import { supabase } from './supabase';
import { storage } from '../utils/storage';

const CUSTOMER_KEY = 'tarot_customer';

export const authService = {
  /**
   * RLS 테스트 (디버깅용 - 필요 없다면 삭제 가능)
   */
  async testRLS() {
    // ... (기존 코드 유지해도 무방)
  },

  /**
   * [핵심 변경] 로그인
   * 클라이언트가 조회하지 않고, DB 함수(RPC)에게 검증 요청
   */
  async login(phoneNumber, password) {
    try {
      console.log('========================================');
      console.log('🔐 [authService] 로그인 시도 (RPC 방식)');
      console.log('========================================');

      const normalizedPhone = phoneNumber.trim();

      // 1. Supabase RPC 호출
      // "전화번호랑 비번 줄게, 맞으면 UUID 내놔"
      console.log('🚀 [authService] DB에 인증 요청 중...');
      
      const { data: userUuid, error: rpcError } = await supabase
        .rpc('login_customer', { 
          p_phone: normalizedPhone, 
          p_password: password 
        });

      if (rpcError) {
        console.error('❌ [authService] RPC 에러:', rpcError);
        return { success: false, message: '서버 연결 중 오류가 발생했습니다.' };
      }

      // 2. 결과 확인
      // login_customer 함수는 실패 시 null을 반환함
      if (!userUuid) {
        console.log('❌ [authService] 인증 실패 (정보 불일치)');
        return { success: false, message: '전화번호 또는 비밀번호가 일치하지 않습니다.' };
      }

      console.log('✅ [authService] 인증 성공! UUID:', userUuid);

      // 3. 상세 정보 가져오기 & 저장
      // UUID를 알았으니, 이제 내 정보를 가져옵니다.
      const customerData = await this.refreshCustomer(userUuid);
      
      if (!customerData) {
        return { success: false, message: '회원 정보를 불러올 수 없습니다.' };
      }

      console.log('💾 [authService] 로컬 저장 완료');
      return { success: true, customer: customerData };

    } catch (error) {
      console.error('❌ [authService] 로그인 시스템 오류:', error);
      return { success: false, message: '알 수 없는 오류가 발생했습니다.' };
    }
  },

  /**
   * 로그아웃
   */
  async logout() {
    console.log('🚪 [authService] 로그아웃');
    await storage.remove(CUSTOMER_KEY);
  },

  /**
   * 저장된 고객 정보 조회 (자동 로그인용)
   */
  async getStoredCustomer() {
    try {
      const customer = await storage.get(CUSTOMER_KEY);
      if (customer) {
        // 저장된 정보가 있으면 최신 정보로 한 번 더 갱신해주는 것이 좋습니다
        return await this.refreshCustomer(customer.id);
      }
      return null;
    } catch (error) {
      console.error('Storage Error:', error);
      return null;
    }
  },

  /**
   * 고객 정보 새로고침 (ID로 조회)
   */
  async refreshCustomer(customerId) {
    if (!customerId) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single(); // .single()을 쓰면 배열이 아니라 객체 하나만 반환합니다.

      if (error) {
        console.error('❌ [authService] 정보 갱신 실패:', error.message);
        return null;
      }

      if (data) {
        // 최신 정보를 스토리지에 덮어쓰기
        await storage.save(CUSTOMER_KEY, data);
        return data;
      }
    } catch (e) {
      console.error('Refresh Error:', e);
    }
    return null;
  }
};