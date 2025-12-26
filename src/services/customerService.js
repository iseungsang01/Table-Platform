import { supabase } from './supabase';

/**
 * 고객 서비스
 * 고객 정보 조회 및 수정
 */
export const customerService = {
  /**
   * 고객 정보 조회
   * @param {number} id - 고객 ID
   * @returns {object} { data, error }
   */
  async getCustomer(id) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * 고객 정보 수정
   * @param {number} id - 고객 ID
   * @param {object} updates - 수정할 필드들
   * @returns {object} { data, error }
   */
  async updateCustomer(id, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * 모든 고객 목록 조회 (관리자용)
   * @returns {object} { data, error }
   */
  async getAllCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },
};