import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL 또는 Anon Key가 설정되지 않았습니다!');
  console.error('환경 변수를 확인해주세요: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * 전화번호로 고객 찾기
 */
export const findCustomerByPhone = async (phoneNumber) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('고객 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 방문 횟수 증가
 */
/**
 * 방문 횟수 증가 (RPC 사용)
 */
export const incrementVisitCount = async (customerId) => {
  try {
    // .update() 대신 .rpc() 사용
    const { data, error } = await supabase
      .rpc('increment_visit_count', { customer_id: customerId });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('방문 횟수 증가 오류:', error);
    return { data: null, error };
  }
};

/**
 * 방문 기록 생성
 */
export const createVisitHistory = async (customerId) => {
  try {
    const { data, error } = await supabase
      .from('visit_history')
      .insert({
        customer_id: customerId,
        visit_date: new Date().toISOString(),
        is_deleted: false,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('방문 기록 생성 오류:', error);
    return { data: null, error };
  }
};

/**
 * 통합 방문 처리 함수
 */
export const processVisit = async (phoneNumber) => {
  try {
    console.log('🔍 고객 조회 시작:', phoneNumber);

    // 1. 고객 찾기
    const { data: customer, error: findError } = await findCustomerByPhone(phoneNumber);

    if (findError) {
      return { 
        success: false, 
        message: '고객 조회 중 오류가 발생했습니다.' 
      };
    }

    if (!customer) {
      return { 
        success: false, 
        message: '등록되지 않은 전화번호입니다.' 
      };
    }

    console.log('✅ 고객 찾음:', customer.nickname);

    // 2. 방문 횟수 증가
    const { error: updateError } = await incrementVisitCount(customer.id);

    if (updateError) {
      return { 
        success: false, 
        message: '방문 횟수 업데이트 중 오류가 발생했습니다.' 
      };
    }

    console.log('✅ 방문 횟수 증가 완료');

    // 3. 방문 기록 생성
    const { error: createError } = await createVisitHistory(customer.id);

    if (createError) {
      return { 
        success: false, 
        message: '방문 기록 생성 중 오류가 발생했습니다.' 
      };
    }

    console.log('✅ 방문 기록 생성 완료');

    return { 
      success: true, 
      message: `${customer.nickname}님, 방문해주셔서 감사합니다! 🎉`,
      customer 
    };
  } catch (error) {
    console.error('방문 처리 오류:', error);
    return { 
      success: false, 
      message: '예상치 못한 오류가 발생했습니다.' 
    };
  }
};