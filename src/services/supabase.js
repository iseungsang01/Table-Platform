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
 * 2단계: 방문 확인 처리 (방문 횟수는 하루에 한 번만 증가 + 방문 기록은 지정된 개수만큼 생성)
 */
export const confirmVisit = async (customerId, count = 1) => {
  try {
    // 1. 현재 고객 정보 조회
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('visit_count, last_visit')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('고객 정보 조회 오류:', fetchError);
      throw fetchError;
    }

    const now = new Date();
    // 한국 시간(KST) 기준 날짜 생성 (YYYY-MM-DD)
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const today = kstNow.toISOString().split('T')[0];

    let lastVisitDate = null;
    if (customer.last_visit) {
      const kstLast = new Date(new Date(customer.last_visit).getTime() + (9 * 60 * 60 * 1000));
      lastVisitDate = kstLast.toISOString().split('T')[0];
    }

    // 오늘 첫 방문인 경우에만 방문 횟수 증가 (단, 방문 횟수가 0인 신규 고객은 항상 증가)
    const currentCount = Number(customer.visit_count) || 0;
    const shouldIncrementVisit = lastVisitDate !== today || currentCount === 0;
    const newVisitCount = shouldIncrementVisit ? currentCount + 1 : currentCount;

    // 2. 방문 정보 업데이트
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        visit_count: newVisitCount,
        last_visit: now.toISOString()
      })
      .eq('id', customerId);

    if (updateError) {
      console.error('방문 정보 업데이트 오류:', updateError);
      throw updateError;
    }

    // 3. 방문 기록 생성 (유저 서랍 개수용 - 최대 9개로 제한)
    const safeCount = Math.max(1, Math.min(9, count));
    const historyEntries = Array.from({ length: safeCount }).map(() => ({
      customer_id: customerId,
      visit_date: now.toISOString(),
      is_deleted: false,
    }));

    const { error: insertError } = await supabase
      .from('visit_history')
      .insert(historyEntries);

    if (insertError) {
      console.error('방문 기록 생성 오류:', insertError);
      throw insertError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('방문 확인 처리 오류:', error);
    return { success: false, error };
  }
};