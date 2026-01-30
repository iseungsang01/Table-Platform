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
 * 1단계: 전화번호로 고객 정보 조회
 */
export const findCustomerByPhone = async (phoneNumber) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, phone_number, nickname, birthday, visit_count')
      .eq('phone_number', phoneNumber)
      .is('deleted_at', null)
      .single();

    // 데이터가 없는 경우(PGRST116)는 에러가 아닌 null 반환 처리
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('고객 조회 오류:', error);
    return { data: null, error };
  }
};

/**
 * 신규 고객 등록
 */
export const createCustomer = async (phoneNumber, nickname, birthday) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        phone_number: phoneNumber,
        nickname: nickname,
        birthday: birthday,
        current_stamps: 0,
        total_stamps: 0,
        coupons: 0,
        visit_count: 0,
      })
      .select('id, phone_number, nickname, birthday, visit_count')
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('고객 등록 오류:', error);
    return { data: null, error };
  }
};

/**
 * 2단계: 방문 확인 처리 (방문 횟수 증가 + 방문 기록 생성)
 */
export const confirmVisit = async (customerId) => {
  try {
    // 1. 방문 횟수 증가
    const { error: updateError } = await supabase
      .from('customers')
      .update({ 
        visit_count: supabase.raw('visit_count + 1'),
        last_visit: new Date().toISOString()
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    // 2. 방문 기록 생성
    const { error: insertError } = await supabase
      .from('visit_history')
      .insert({
        customer_id: customerId,
        visit_date: new Date().toISOString(),
        is_deleted: false,
      });

    if (insertError) throw insertError;

    return { success: true, error: null };
  } catch (error) {
    console.error('방문 확인 처리 오류:', error);
    return { success: false, error };
  }
};