import { supabase } from './supabase';

/**
 * 쿠폰 서비스
 * 쿠폰 조회, 사용, 발급
 */
export const couponService = {
  /**
   * 고객의 쿠폰 목록 조회 (사용하지 않은 쿠폰만)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { data, error }
   */
  async getCoupons(customerId) {
    const { data, error } = await supabase
      .from('coupon_history')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_used', false)
      .order('issued_at', { ascending: false });

    return { data, error };
  },

  /**
   * 고객의 쿠폰 개수 조회 (사용하지 않은 쿠폰만)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { count, error }
   */
  async getCouponCount(customerId) {
    const { count, error } = await supabase
      .from('coupon_history')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_used', false);

    return { count: count || 0, error };
  },

  /**
   * 쿠폰 사용
   * @param {number} couponId - 쿠폰 ID
   * @returns {object} { error }
   */
  async useCoupon(couponId) {
    try {
      const { error } = await supabase
        .from('coupon_history')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq('id', couponId);

      if (error) throw error;

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
    // coupon_code가 없으면 자동 생성
    if (!couponData.coupon_code) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      couponData.coupon_code = `STAMP-${timestamp}-${random}`;
    }

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
      .lt('valid_until', new Date().toISOString())
      .eq('is_used', false);

    return { error };
  },

  /**
   * 유효한 쿠폰만 조회 (만료되지 않고 사용하지 않은 쿠폰)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { data, error }
   */
  async getValidCoupons(customerId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('coupon_history')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_used', false)
      .or(`valid_until.is.null,valid_until.gte.${now}`)
      .order('issued_at', { ascending: false });

    return { data, error };
  },

  /**
   * 유효한 쿠폰 개수 조회 (만료되지 않고 사용하지 않은 쿠폰만)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { count, error }
   */
  async getValidCouponCount(customerId) {
    const now = new Date().toISOString();

    const { count, error } = await supabase
      .from('coupon_history')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_used', false)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    return { count: count || 0, error };
  },
};