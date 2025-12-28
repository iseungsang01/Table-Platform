import { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../services/noticeService';
import { useAuth } from './useAuth';

/**
 * 알림 관리 Hook (최적화 - 빨간점만 표시)
 * 개수 대신 hasUnread 불린 값만 반환
 * 
 * @returns {object} { 
 *   hasUnreadNotices,
 *   hasUnreadResponses,
 *   hasAnyUnread,
 *   loading,
 *   refresh 
 * }
 * 
 * @example
 * const { hasAnyUnread, refresh } = useNotifications();
 * 
 * // 탭 바에 빨간 점 표시
 * {hasAnyUnread && <View style={styles.redDot} />}
 */
export const useNotifications = () => {
  const { customer } = useAuth();
  const [hasUnreadNotices, setHasUnreadNotices] = useState(false);
  const [hasUnreadResponses, setHasUnreadResponses] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      loadNotifications();
    }
  }, [customer]);

  /**
   * 알림 상태 로드
   */
  const loadNotifications = async () => {
    if (!customer) return;

    setLoading(true);

    try {
      // 1. 안 읽은 공지사항 있는지 확인
      const { count: noticeCount } = await noticeService.getUnreadNoticeCount(customer.id);
      setHasUnreadNotices(noticeCount > 0);

      // 2. 안 읽은 버그 리포트 답변 있는지 확인
      const { data: myReports } = await noticeService.getMyReports(customer.id);
      const hasUnread = (myReports || []).some(
        (report) => report.admin_response && !report.response_read
      );
      setHasUnreadResponses(hasUnread);
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
   * 하나라도 안 읽은 알림이 있는지
   */
  const hasAnyUnread = hasUnreadNotices || hasUnreadResponses;

  return {
    hasUnreadNotices,      // 안 읽은 공지사항 있음
    hasUnreadResponses,    // 안 읽은 답변 있음
    hasAnyUnread,          // 둘 중 하나라도 있음
    loading,
    refresh,
  };
};