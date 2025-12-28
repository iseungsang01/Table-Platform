import { supabase } from './supabase';

/**
 * 공지사항 및 버그 리포트 서비스 (최적화)
 * notice_reads 테이블 제거 → customers.last_notice_read_at 사용
 */
export const noticeService = {
  /**
   * 공지사항 목록 조회
   * @returns {object} { data, error }
   */
  async getNotices() {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * 공지사항 읽음 처리 (단순화)
   * 고객의 last_notice_read_at만 업데이트
   * @param {number} customerId - 고객 ID
   * @returns {object} { error }
   */
  async markNoticesAsRead(customerId) {
    try {
      const { error } = await supabase.rpc('mark_notices_as_read', {
        p_customer_id: customerId,
      });

      return { error };
    } catch (error) {
      console.error('Mark notices as read error:', error);
      return { error };
    }
  },

  /**
   * 안 읽은 공지사항 개수 조회 (최적화)
   * @param {number} customerId - 고객 ID
   * @returns {object} { count, error }
   */
  async getUnreadNoticeCount(customerId) {
    try {
      const { data, error } = await supabase.rpc('get_unread_notice_count', {
        p_customer_id: customerId,
      });

      if (error) throw error;

      return { count: data || 0, error: null };
    } catch (error) {
      console.error('Get unread notice count error:', error);
      return { count: 0, error };
    }
  },

  /**
   * 버그 리포트 제출
   * @param {object} reportData - 리포트 데이터
   * @returns {object} { data, error }
   */
  async submitReport(reportData) {
    const { data, error } = await supabase
      .from('bug_reports')
      .insert({
        ...reportData,
        status: '접수',
        response_read: false,
      })
      .select()
      .single();

    return { data, error };
  },

  /**
   * 내 버그 리포트 목록 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getMyReports(customerId) {
    const { data, error } = await supabase
      .from('bug_reports')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * 버그 리포트 답변 읽음 처리
   * @param {number} customerId - 고객 ID
   * @param {array} reports - 리포트 목록
   * @returns {object} { error }
   */
  async markReportsAsRead(customerId, reports) {
    try {
      const unreadReports = reports.filter(
        (report) => report.admin_response && !report.response_read
      );

      if (unreadReports.length === 0) {
        return { error: null };
      }

      for (const report of unreadReports) {
        await supabase
          .from('bug_reports')
          .update({ response_read: true })
          .eq('id', report.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Mark reports as read error:', error);
      return { error };
    }
  },
};