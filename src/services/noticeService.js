import { supabase } from './supabase';
import { storage, STORAGE_KEYS } from '../utils/storage';

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
    try {
      console.log('Fetching notices...');

      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch notices error:', error);
        throw error;
      }

      console.log('Fetched notices:', data?.length || 0);

      return { data, error: null };
    } catch (error) {
      console.error('Get notices error:', error);
      return { data: [], error };
    }
  },

  /**
   * 공지사항 읽음 처리 (로컬 스토리지만 사용)
   * 모든 공지사항을 읽음으로 표시
   * 
   * @returns {object} { error }
   */
  async markAllNoticesAsRead() {
    try {
      console.log('Marking all notices as read...');

      // 1. 모든 공지사항 ID 조회
      const { data: allNotices, error: noticesError } = await supabase
        .from('notices')
        .select('id')
        .eq('is_published', true);

      if (noticesError) throw noticesError;

      // 2. 로컬 스토리지에 읽음 처리
      const noticeIds = (allNotices || []).map(n => n.id);
      await storage.markNoticesAsRead(noticeIds);

      console.log('Marked notices as read:', noticeIds.length);

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
      console.log('Marked notice as read:', noticeId);
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

      console.log('Unread notice count:', unreadCount);

      return { count: unreadCount, error: null };
    } catch (error) {
      console.error('Get unread notice count error:', error);
      return { count: 0, error };
    }
  },

  /**
   * 안 읽은 공지사항이 있는지 확인 (최적화)
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

      console.log('Has unread notices:', hasUnread);

      return { hasUnread, error: null };
    } catch (error) {
      console.error('Check unread notices error:', error);
      return { hasUnread: false, error };
    }
  },

  /**
   * 버그 리포트 제출 (간소화된 구조)
   * @param {object} reportData - 리포트 데이터
   * @returns {object} { data, error }
   */
  async submitReport(reportData) {
    try {
      console.log('Submitting bug report...');

      const { data, error } = await supabase
        .from('bug_reports')
        .insert({
          customer_id: reportData.customer_id || null,
          title: reportData.title,
          description: reportData.description,
          report_type: reportData.report_type,
          status: '접수',
        })
        .select()
        .single();

      if (error) {
        console.error('Submit report error:', error);
        throw error;
      }

      console.log('Bug report submitted successfully');

      return { data, error: null };
    } catch (error) {
      console.error('Submit report error:', error);
      return { data: null, error };
    }
  },

  /**
   * 내 버그 리포트 목록 조회
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { data, error }
   */
  async getMyReports(customerId) {
    try {
      console.log('Fetching reports for customer:', customerId);

      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch reports error:', error);
        throw error;
      }

      console.log('Fetched reports:', data?.length || 0);

      return { data, error: null };
    } catch (error) {
      console.error('Get my reports error:', error);
      return { data: [], error };
    }
  },

  /**
   * 안 읽은 버그 리포트 답변이 있는지 확인 (최적화)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { hasUnread, error }
   */
  async hasUnreadResponses(customerId) {
    try {
      // 답변이 있는 리포트 조회
      const { data, error } = await supabase
        .from('bug_reports')
        .select('id, admin_response')
        .eq('customer_id', customerId)
        .not('admin_response', 'is', null);

      if (error) throw error;

      // 하나라도 답변이 있으면 true
      const hasUnread = (data || []).length > 0;

      console.log('Has unread responses:', hasUnread);

      return { hasUnread, error: null };
    } catch (error) {
      console.error('Check unread responses error:', error);
      return { hasUnread: false, error };
    }
  },

  /**
   * 버그 리포트 답변 읽음 처리
   * @param {string} customerId - 고객 ID (UUID)
   * @param {array} reports - 리포트 목록
   * @returns {object} { error }
   */
  async markReportsAsRead(customerId, reports) {
    try {
      console.log('Marking reports as read for customer:', customerId);
      // 현재는 별도 처리 없음 (필요시 로컬 스토리지 활용 가능)
      return { error: null };
    } catch (error) {
      console.error('Mark reports as read error:', error);
      return { error };
    }
  },
};