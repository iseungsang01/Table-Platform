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
      console.log('========================================');
      console.log('🔐 [authService] 로그인 시작');
      console.log('========================================');
      console.log('📞 [authService] 전화번호:', phoneNumber);
      console.log('🔑 [authService] 비밀번호:', password ? '입력됨' : '입력 안됨');
      
      const normalizedPhone = phoneNumber.trim();
      console.log('📞 [authService] 정규화된 전화번호:', normalizedPhone);

      // 1. 전화번호로 고객 조회
      console.log('🔍 [authService] 고객 조회 중...');
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', normalizedPhone)
        .is('deleted_at', null);

      if (error) {
        console.error('❌ [authService] 조회 오류:', error);
        return { success: false, message: '데이터베이스 오류가 발생했습니다.' };
      }

      console.log('📊 [authService] 조회 결과:', data?.length || 0, '건');

      const customer = data?.[0];
      if (!customer) {
        console.log('❌ [authService] 등록되지 않은 번호');
        return { success: false, message: '등록되지 않은 번호입니다.' };
      }

      console.log('✅ [authService] 고객 조회 성공:', {
        id: customer.id,
        nickname: customer.nickname,
        phone: customer.phone_number
      });

      // 2. 비밀번호 검증 (RPC)
      console.log('🔑 [authService] 비밀번호 검증 중...');
      console.log('🔑 [authService] Customer UUID:', customer.id);
      console.log('🔑 [authService] Password:', password || '(empty)');
      
      const { data: passwordCheck, error: passwordError } = await supabase
        .rpc('verify_password', {
          customer_uuid: customer.id,
          input_password: password || ''
        });

      if (passwordError) {
        console.error('❌ [authService] RPC 오류:', passwordError);
        return { success: false, message: '비밀번호 검증 중 오류가 발생했습니다.' };
      }

      console.log('🔑 [authService] 비밀번호 검증 결과:', passwordCheck);
      
      if (passwordCheck) {
        console.log('✅ [authService] 로그인 성공!');
        console.log('💾 [authService] 로컬 스토리지 저장 중...');
        
        await storage.save(CUSTOMER_KEY, customer);
        
        console.log('✅ [authService] 로컬 스토리지 저장 완료');
        console.log('========================================');
        
        return { success: true, customer };
      }
      
      console.log('❌ [authService] 비밀번호 불일치');
      console.log('========================================');
      
      return { success: false, message: '비밀번호가 틀렸습니다.' };

    } catch (error) {
      console.error('========================================');
      console.error('❌ [authService] 로그인 전체 오류:', error);
      console.error('❌ [authService] 오류 메시지:', error.message);
      console.error('❌ [authService] 오류 스택:', error.stack);
      console.error('========================================');
      
      return { success: false, message: '오류가 발생했습니다.' };
    }
  },

  /**
   * 로그아웃
   */
  async logout() {
    console.log('🚪 [authService] 로그아웃 시작');
    await storage.remove(CUSTOMER_KEY);
    console.log('✅ [authService] 로그아웃 완료');
  },

  /**
   * 저장된 고객 정보 조회
   */
  async getStoredCustomer() {
    console.log('📥 [authService] 저장된 고객 정보 조회');
    const customer = await storage.get(CUSTOMER_KEY);
    
    if (customer) {
      console.log('✅ [authService] 저장된 고객:', customer.nickname);
    } else {
      console.log('❌ [authService] 저장된 고객 없음');
    }
    
    return customer;
  },

  /**
   * 고객 정보 새로고침
   */
  async refreshCustomer(customerId) {
    if (!customerId) {
      console.log('❌ [authService] refreshCustomer: customerId 없음');
      return null;
    }
    
    console.log('🔄 [authService] 고객 정보 새로고침:', customerId);
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .is('deleted_at', null);
    
    if (error) {
      console.error('❌ [authService] 새로고침 오류:', error);
      return null;
    }
    
    const customer = data && data.length > 0 ? data[0] : null;
    
    if (customer) {
      console.log('✅ [authService] 새로고침 성공:', customer.nickname);
      await storage.save(CUSTOMER_KEY, customer);
    } else {
      console.log('❌ [authService] 고객 정보 없음');
    }
    
    return customer;
  },
};