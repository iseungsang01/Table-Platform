import { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../services/noticeService';
import { useAuth } from './useAuth';

/**
 * 알림 관리 Hook
 * 안 읽은 공지사항 및 답변 개수 추적
 * 
 * @returns {object} { 
 *   unreadNoticeCount, 
 *   unreadResponseCount, 
 *   totalUnreadCount,
 *   loading,
 *   refresh 
 * }
 * 
 * @example
 * const { unreadNoticeCount, totalUnreadCount, refresh } = useNotifications();
 * 
 * // 탭 바에 알림 배지 표시
 * {totalUnreadCount > 0 && <Badge count={totalUnreadCount} />}
 * 
 * // 알림 읽은 후 새로고침
 * await markAsRead();
 * refresh();
 */
export const useNotifications = () => {
  const { customer } = useAuth();
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);
  const [unreadResponseCount, setUnreadResponseCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      loadNotifications();
    }
  }, [customer]);

  /**
   * 알림 개수 로드
   */
  const loadNotifications = async () => {
    if (!customer) return;

    setLoading(true);

    try {
      // 1. 안 읽은 공지사항 개수
      const { count: noticeCount } = await noticeService.getUnreadNoticeCount(customer.id);
      setUnreadNoticeCount(noticeCount || 0);

      // 2. 안 읽은 버그 리포트 답변 개수
      const { data: myReports } = await noticeService.getMyReports(customer.id);
      const unreadResponses = (myReports || []).filter(
        (report) => report.admin_response && !report.response_read
      );
      setUnreadResponseCount(unreadResponses.length);
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 알림 새로고침
   */
  const refresh = useCallback(() => {
    loadNotifications();
  }, [customer]);

  /**
   * 전체 안 읽은 알림 개수
   */
  const totalUnreadCount = unreadNoticeCount + unreadResponseCount;

  return {
    unreadNoticeCount,       // 안 읽은 공지사항 개수
    unreadResponseCount,     // 안 읽은 답변 개수
    totalUnreadCount,        // 전체 안 읽은 알림 개수
    loading,
    refresh,                 // 새로고침 함수
  };
};