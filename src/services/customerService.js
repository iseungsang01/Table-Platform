import { supabase } from './supabase';

/**
 * 쿠폰 서비스
 * 쿠폰 조회, 사용, 발급
 * 
 * 주의: customers.coupons 컬럼은 사용하지 않음
 * 항상 coupon_history 테이블에서 실시간 카운트
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
   * coupon_history에서 실시간 카운트
   * 
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
   * 쿠폰 사용 (삭제만 수행)
   * customers.coupons 컬럼은 업데이트하지 않음
   * 
   * @param {number} couponId - 쿠폰 ID
   * @returns {object} { error }
   */
  async useCoupon(couponId) {
    try {
      // 쿠폰 삭제만 수행
      const { error: deleteError } = await supabase
        .from('coupon_history')
        .delete()
        .eq('id', couponId);

      if (deleteError) throw deleteError;

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

  /**
   * 유효한 쿠폰만 조회 (만료되지 않은 쿠폰)
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getValidCoupons(customerId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupon_history')
      .select('*')
      .eq('customer_id', customerId)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('issued_at', { ascending: false });

    return { data, error };
  },

  /**
   * 유효한 쿠폰 개수 조회 (만료되지 않은 쿠폰만)
   * @param {number} customerId - 고객 ID
   * @returns {object} { count, error }
   */
  async getValidCouponCount(customerId) {
    const now = new Date().toISOString();

    const { count, error } = await supabase
      .from('coupon_history')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    return { count: count || 0, error };
  },
};