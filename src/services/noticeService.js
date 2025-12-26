import { supabase } from './supabase';

/**
 * 공지사항 및 버그 리포트 서비스
 * 공지사항 조회, 버그 리포트 제출/조회
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
   * 공지사항 읽음 처리
   * @param {number} customerId - 고객 ID
   * @returns {object} { error }
   */
  async markNoticesAsRead(customerId) {
    try {
      // 모든 공지사항 가져오기
      const { data: allNotices, error: noticesError } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (noticesError) throw noticesError;

      // 각 공지사항에 대해 읽음 처리 (중복은 DB에서 처리)
      for (const notice of allNotices || []) {
        await supabase
          .from('notice_reads')
          .insert({
            customer_id: customerId,
            notice_id: notice.id,
          })
          .select();
      }

      return { error: null };
    } catch (error) {
      // 중복 키 에러는 무시 (이미 읽음)
      if (error.code !== '23505') {
        console.error('Mark notices as read error:', error);
      }
      return { error: null };
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
      // 답변이 있고 읽지 않은 리포트만 처리
      const unreadReports = reports.filter(
        (report) => report.admin_response && !report.response_read
      );

      if (unreadReports.length === 0) {
        return { error: null };
      }

      // 각 리포트를 읽음 처리
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

  /**
   * 안 읽은 공지사항 개수 조회
   * @param {number} customerId - 고객 ID
   * @returns {object} { count, error }
   */
  async getUnreadNoticeCount(customerId) {
    try {
      // 전체 공지사항 개수
      const { count: totalCount, error: totalError } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (totalError) throw totalError;

      // 읽은 공지사항 개수
      const { count: readCount, error: readError } = await supabase
        .from('notice_reads')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (readError) throw readError;

      return { count: (totalCount || 0) - (readCount || 0), error: null };
    } catch (error) {
      console.error('Get unread notice count error:', error);
      return { count: 0, error };
    }
  },
};