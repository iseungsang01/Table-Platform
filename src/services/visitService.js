import { supabase } from './supabase';

/**
 * 방문 기록 서비스
 * 방문 기록 조회, 수정, 삭제
 */
export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getVisits(customerId) {
    const { data, error } = await supabase
      .from('visit_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('visit_date', { ascending: false });

    return { data, error };
  },

  /**
   * 특정 방문 기록 조회
   * @param {number} visitId - 방문 기록 ID
   * @returns {object} { data, error }
   */
  async getVisit(visitId) {
    const { data, error } = await supabase
      .from('visit_history')
      .select('*')
      .eq('id', visitId)
      .single();

    return { data, error };
  },

  /**
   * 방문 기록 수정 (카드 선택, 리뷰 작성 등)
   * @param {number} visitId - 방문 기록 ID
   * @param {object} updates - 수정할 필드들 (selected_card, card_review 등)
   * @returns {object} { data, error }
   */
  async updateVisit(visitId, updates) {
    const { data, error } = await supabase
      .from('visit_history')
      .update(updates)
      .eq('id', visitId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * 방문 기록 삭제
   * @param {number} visitId - 방문 기록 ID
   * @returns {object} { error }
   */
  async deleteVisit(visitId) {
    const { error } = await supabase
      .from('visit_history')
      .delete()
      .eq('id', visitId);

    return { error };
  },

  /**
   * 새 방문 기록 생성 (관리자용)
   * @param {object} visitData - 방문 기록 데이터
   * @returns {object} { data, error }
   */
  async createVisit(visitData) {
    const { data, error } = await supabase
      .from('visit_history')
      .insert(visitData)
      .select()
      .single();

    return { data, error };
  },
};