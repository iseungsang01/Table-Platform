import { supabase } from './supabase';
import { storage } from '../utils/storage';

/**
 * 공지사항 및 버그 리포트 서비스
 * 공지사항 읽음 처리는 로컬 스토리지에서만 관리
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
   * 공지사항 읽음 처리 (로컬 스토리지만 사용)
   * 모든 공지사항을 읽음으로 표시
   * 
   * @returns {object} { error }
   */
  async markAllNoticesAsRead() {
    try {
      // 1. 모든 공지사항 ID 조회
      const { data: allNotices, error: noticesError } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (noticesError) throw noticesError;

      // 2. 로컬 스토리지에 읽음 처리
      const noticeIds = (allNotices || []).map(n => n.id);
      await storage.markNoticesAsRead(noticeIds);

      return { error: null };
    } catch (error) {
      console.error('Mark notices as read error:', error);
      return { error };
    }
  },

  /**
   * 특정 공지사항 읽음 처리
   * @param {number} noticeId - 공지사항 ID
   * @returns {object} { error }
   */
  async markNoticeAsRead(noticeId) {
    try {
      await storage.markNoticeAsRead(noticeId);
      return { error: null };
    } catch (error) {
      console.error('Mark notice as read error:', error);
      return { error };
    }
  },

  /**
   * 안 읽은 공지사항 개수 조회 (로컬 스토리지 사용)
   * @returns {object} { count, error }
   */
  async getUnreadNoticeCount() {
    try {
      // 1. 전체 공지사항 ID 조회
      const { data, error } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (error) throw error;

      const allNoticeIds = (data || []).map(n => n.id);

      // 2. 로컬 스토리지에서 읽지 않은 개수 계산
      const unreadCount = await storage.getUnreadNoticeCount(allNoticeIds);

      return { count: unreadCount, error: null };
    } catch (error) {
      console.error('Get unread notice count error:', error);
      return { count: 0, error };
    }
  },

  /**
   * 안 읽은 공지사항이 있는지 확인 (최적화)
   * 개수 대신 boolean 반환으로 성능 개선
   * 
   * @returns {object} { hasUnread, error }
   */
  async hasUnreadNotices() {
    try {
      // 1. 전체 공지사항 ID 조회
      const { data, error } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (error) throw error;

      const allNoticeIds = (data || []).map(n => n.id);

      // 2. 로컬 스토리지에서 읽은 공지사항 조회
      const readNotices = await storage.getReadNotices();

      // 3. 하나라도 안 읽은 공지사항이 있는지 확인
      const hasUnread = allNoticeIds.some(id => !readNotices.includes(id));

      return { hasUnread, error: null };
    } catch (error) {
      console.error('Check unread notices error:', error);
      return { hasUnread: false, error };
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
   * 안 읽은 답변이 있는지 확인 (최적화)
   * @param {number} customerId - 고객 ID
   * @returns {object} { hasUnread, error }
   */
  async hasUnreadResponses(customerId) {
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('id')
        .eq('customer_id', customerId)
        .not('admin_response', 'is', null)
        .eq('response_read', false)
        .limit(1); // 하나만 있어도 확인 가능

      if (error) throw error;

      return { hasUnread: (data || []).length > 0, error: null };
    } catch (error) {
      console.error('Check unread responses error:', error);
      return { hasUnread: false, error };
    }
  },
};