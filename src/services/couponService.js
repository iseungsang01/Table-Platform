import { supabase } from './supabase';

/**
 * 쿠폰 서비스
 * 쿠폰 조회, 사용, 발급
 */
export const couponService = {
  /**
   * 고객의 쿠폰 목록 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getCoupons(customerId) {
    const { data, error } = await supabase
      .from('coupon_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('issued_at', { ascending: false });

    return { data, error };
  },

  /**
   * 고객의 쿠폰 개수 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { count, error }
   */
  async getCouponCount(customerId) {
    const { count, error } = await supabase
      .from('coupon_history')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId);

    return { count: count || 0, error };
  },

  /**
   * 쿠폰 사용 (삭제)
   * @param {number} couponId - 쿠폰 ID
   * @param {number} customerId - 고객 ID (쿠폰 개수 업데이트용)
   * @returns {object} { error }
   */
  async useCoupon(couponId, customerId) {
    try {
      // 1. 쿠폰 삭제
      const { error: deleteError } = await supabase
        .from('coupon_history')
        .delete()
        .eq('id', couponId);

      if (deleteError) throw deleteError;

      // 2. 고객의 쿠폰 개수 업데이트
      const { count } = await this.getCouponCount(customerId);

      const { error: updateError } = await supabase
        .from('customers')
        .update({ coupons: count })
        .eq('id', customerId);

      if (updateError) throw updateError;

      return { error: null };
    } catch (error) {
      console.error('Use coupon error:', error);
      return { error };
    }
  },

  /**
   * 쿠폰 발급 (관리자용)
   * @param {object} couponData - 쿠폰 데이터
   * @returns {object} { data, error }
   */
  async issueCoupon(couponData) {
    const { data, error } = await supabase
      .from('coupon_history')
      .insert(couponData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * 만료된 쿠폰 삭제 (관리자용)
   * @returns {object} { error }
   */
  async deleteExpiredCoupons() {
    const { error } = await supabase
      .from('coupon_history')
      .delete()
      .lt('valid_until', new Date().toISOString());

    return { error };
  },
};