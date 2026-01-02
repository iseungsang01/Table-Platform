import { supabase } from './supabase';
import { storage } from '../utils/storage';

const CUSTOMER_KEY = 'tarot_customer';

export const authService = {
  /**
   * RLS 정책 테스트 및 디버깅
   */
  async testRLS() {
    try {
      console.log('========================================');
      console.log('🔒 RLS 테스트 시작');
      console.log('========================================');
      
      const { data: allCustomers, error: allError, count: totalCount } = await supabase
        .from('customers')
        .select('phone_number, id, nickname', { count: 'exact' })
        .is('deleted_at', null)
        .limit(10);
      
      console.log('📊 전체 고객 데이터 (RLS 무시):');
      console.log('  - 총 개수:', totalCount);
      console.log('  - 조회된 개수:', allCustomers?.length || 0);
      console.log('  - 오류:', allError?.message || 'none');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('\n🔐 현재 인증 상태:');
      console.log('  - 세션 존재:', session ? 'YES' : 'NO');
      
      const { data: rlsData, error: rlsError, count: rlsCount } = await supabase
        .from('customers')
        .select('phone_number, id, nickname', { count: 'exact' })
        .is('deleted_at', null)
        .limit(10);
      
      console.log('\n🛡️ RLS 정책 적용 후 조회:');
      console.log('  - 총 개수:', rlsCount);
      
      const isBlocked = (totalCount > 0 && rlsCount === 0);
      console.log('\n🚨 RLS 차단 여부:', isBlocked ? 'YES' : 'NO');
      console.log('========================================\n');
      
      return { totalCount, rlsCount, isBlocked, hasData: totalCount > 0 };
    } catch (error) {
      console.error('❌ RLS 테스트 오류:', error);
      return null;
    }
  },

  /**
   * 로그인
   */
  async login(phoneNumber, password) {
    try {
      // 🔍 [추가된 로그] 함수에 인자가 어떻게 들어오는지 바로 확인
      console.log('📌 함수 인자 체크:', { phoneNumber, password }); 
      
      console.log('🔐 로그인 시도:', phoneNumber);
      const normalizedPhone = phoneNumber.trim();

      // 1. 전화번호로 고객 조회 (생략... 기존 코드 그대로)
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', normalizedPhone)
        .is('deleted_at', null);

      const customer = data?.[0];
      if (!customer) return { success: false, message: '등록되지 않은 번호입니다.' };

      // 2. 비밀번호 검증 (RPC)
      // 여기서 password가 undefined면 SQL 함수를 못 찾는 에러(PGRST202)가 납니다.
      const { data: passwordCheck, error: passwordError } = await supabase
        .rpc('verify_password', {
          customer_uuid: customer.id,
          input_password: password || '' // 비번이 없으면 빈 문자열이라도 보냄
        });

      if (passwordError) throw passwordError;
      
      if (passwordCheck) {
        await storage.save(CUSTOMER_KEY, customer);
        return { success: true, customer };
      }
      return { success: false, message: '비밀번호가 틀렸습니다.' };

    } catch (error) {
      console.error('❌ 로그인 오류:', error);
      return { success: false, message: '오류가 발생했습니다.' };
    }
  },

  async logout() {
    await storage.remove(CUSTOMER_KEY);
  },

  async getStoredCustomer() {
    return await storage.get(CUSTOMER_KEY);
  },

  async refreshCustomer(customerId) {
    if (!customerId) return null;
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .is('deleted_at', null);
    
    const customer = data && data.length > 0 ? data[0] : null;
    if (customer) await storage.save(CUSTOMER_KEY, customer);
    return customer;
  },
};