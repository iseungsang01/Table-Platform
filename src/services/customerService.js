import { supabase } from './supabase';

/**
 * 고객 서비스
 * 고객 정보 조회 및 업데이트
 */
export const customerService = {
  /**
   * 고객 정보 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getCustomer(customerId) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .is('deleted_at', null)
      .single();

    return { data, error };
  },

  /**
   * 전화번호로 고객 조회
   * @param {string} phoneNumber - 전화번호 (010-1234-5678)
   * @returns {object} { data, error }
   */
  async getCustomerByPhone(phoneNumber) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .is('deleted_at', null)
      .single();

    return { data, error };
  },

  /**
   * 고객 정보 업데이트
   * @param {number} customerId - 고객 ID
   * @param {object} updates - 수정할 필드들
   * @returns {object} { data, error }
   */
  async updateCustomer(customerId, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .is('deleted_at', null)
      .select()
      .single();

    return { data, error };
  },

  /**
   * 고객 탈퇴 (Soft Delete)
   * @param {number} customerId - 고객 ID
   * @returns {object} { error }
   */
  async deleteCustomer(customerId) {
    const { error } = await supabase
      .from('customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', customerId);

    return { error };
  },
};