import { supabase } from './supabase';
import { storage } from '../utils/storage';

const CUSTOMER_KEY = 'tarot_customer';

/**
 * 인증 서비스
 * 로그인, 로그아웃, 고객 정보 관리
 */
export const authService = {
  /**
   * RLS 정책 테스트
   * RLS 문제인지 확인
   */
  async testRLS() {
    try {
      console.log('🔒 RLS 테스트 시작...');
      
      // 1. RLS 비활성화 상태에서 조회 (서비스 롤)
      const { data: allData, error: allError, count: allCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);
      
      console.log('📊 RLS 무시하고 전체 조회:', {
        count: allCount,
        error: allError?.message,
        dataLength: allData?.length
      });
      
      // 2. 현재 인증 상태 확인
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 현재 세션:', session ? 'EXISTS' : 'NULL');
      console.log('🔐 현재 사용자:', session?.user?.id || 'ANONYMOUS');
      
      // 3. auth.uid() 값 확인
      const { data: uidTest, error: uidError } = await supabase
        .rpc('get_current_user_id');
      
      console.log('🆔 auth.uid() 값:', {
        uid: uidTest,
        error: uidError?.message
      });
      
      return {
        hasData: allCount > 0,
        isAuthenticated: !!session,
        userId: session?.user?.id || null
      };
    } catch (error) {
      console.error('❌ RLS 테스트 오류:', error);
      return null;
    }
  },

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
      
      // RLS 테스트 먼저 실행
      await this.testRLS();
      
      // Supabase 연결 및 RLS 상태 테스트
      console.log('📡 Supabase 연결 테스트...');
      
      // 테스트 1: 전체 customers 테이블 접근 가능 여부
      const { data: testData, error: testError, count: testCount } = await supabase
        .from('customers')
        .select('phone_number, id', { count: 'exact' })
        .is('deleted_at', null)
        .limit(10);
      
      console.log('📊 테스트 쿼리 결과:', {
        count: testCount,
        dataLength: testData?.length,
        error: testError?.message,
        errorCode: testError?.code,
        errorDetails: testError?.details
      });
      
      if (testError) {
        console.error('❌ Supabase 연결 오류 또는 RLS 차단:', testError);
        
        if (testError.code === '42501' || testError.message?.includes('policy')) {
          return {
            success: false,
            message: 'RLS 정책으로 인해 접근이 차단되었습니다. Supabase 설정을 확인해주세요.',
          };
        }
        
        return {
          success: false,
          message: 'DB 연결 오류가 발생했습니다. 네트워크를 확인해주세요.',
        };
      }
      
      console.log('✅ Supabase 연결 성공');
      console.log('📋 DB에 있는 전화번호 샘플:', testData?.map(d => d.phone_number));
      
      if (!testData || testData.length === 0) {
        console.warn('⚠️ RLS로 인해 데이터에 접근할 수 없습니다!');
        return {
          success: false,
          message: 'RLS 정책으로 인해 로그인할 수 없습니다. 관리자에게 문의해주세요.',
        };
      }
      
      // 전화번호 정규화
      const normalizedPhone = phoneNumber.trim();
      console.log('📝 정규화된 전화번호:', normalizedPhone);
      
      // 전화번호로 고객 조회
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
        console.log('💡 입력한 전화번호:', `"${normalizedPhone}"`);
        console.log('💡 DB 전화번호 샘플:', testData?.map(d => `"${d.phone_number}"`));
        
        // 문자열 비교
        testData?.forEach(d => {
          const match = d.phone_number === normalizedPhone;
          console.log(`  ${match ? '✅' : '❌'} "${d.phone_number}" vs "${normalizedPhone}"`);
        });
        
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