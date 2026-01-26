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
    console.log('🔍 고객 조회 시작:', phoneNumber);

    const { data, error } = await supabase
      .from('customers')
      .select('id, nickname, birthday, phone_number, visit_count')
      .eq('phone_number', phoneNumber)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ 고객 조회 오류:', error);
      throw error;
    }

    if (!data) {
      console.log('❌ 고객을 찾을 수 없음');
      return { data: null, error: null };
    }

    console.log('✅ 고객 찾음:', data);
    return { data, error: null };
  } catch (error) {
    console.error('고객 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 방문 횟수 증가
 */
export const incrementVisitCount = async (customerId) => {
  try {
    console.log('📈 방문 횟수 증가 시작:', customerId);

    const { data, error } = await supabase
      .from('customers')
      .update({
        visit_count: supabase.raw('visit_count + 1'),
        last_visit: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('❌ 방문 횟수 증가 오류:', error);
      throw error;
    }

    console.log('✅ 방문 횟수 증가 완료:', data);
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
    console.log('📝 방문 기록 생성 시작:', customerId);

    const { data, error } = await supabase
      .from('visit_history')
      .insert({
        customer_id: customerId,
        visit_date: new Date().toISOString(),
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 방문 기록 생성 오류:', error);
      throw error;
    }

    console.log('✅ 방문 기록 생성 완료:', data);
    return { data, error: null };
  } catch (error) {
    console.error('방문 기록 생성 오류:', error);
    return { data: null, error };
  }
};

/**
 * 통합 방문 처리 함수
 */
export const processVisit = async (customerId) => {
  try {
    console.log('🚀 방문 처리 시작:', customerId);

    // 1. 방문 횟수 증가
    const { error: updateError } = await incrementVisitCount(customerId);

    if (updateError) {
      return { 
        success: false, 
        message: '방문 횟수 업데이트 중 오류가 발생했습니다.' 
      };
    }

    // 2. 방문 기록 생성
    const { error: createError } = await createVisitHistory(customerId);

    if (createError) {
      return { 
        success: false, 
        message: '방문 기록 생성 중 오류가 발생했습니다.' 
      };
    }

    console.log('✅ 방문 처리 완료');

    return { 
      success: true, 
      message: '방문이 성공적으로 기록되었습니다! 🎉'
    };
  } catch (error) {
    console.error('방문 처리 오류:', error);
    return { 
      success: false, 
      message: '예상치 못한 오류가 발생했습니다.' 
    };
  }
};