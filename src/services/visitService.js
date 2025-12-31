import { supabase } from './supabase';
import { storage } from '../utils/storage';

/**
 * 방문 기록 서비스
 * 방문 기록 조회, 수정, 삭제
 * selected_card와 card_review는 로컬 스토리지에서 관리
 */
export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회 (카드 정보는 로컬에서 병합)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { data, error }
   */
  async getVisits(customerId) {
    try {
      // 1. Supabase에서 방문 기록 조회
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('visit_date', { ascending: false });

      if (error) throw error;

      // 2. 로컬 스토리지에서 카드 정보 가져오기
      const allCards = await storage.getAllSelectedCards();
      const allReviews = await storage.getAllCardReviews();

      // 3. 데이터 병합
      const visitsWithCardData = (data || []).map(visit => ({
        ...visit,
        selected_card: allCards[visit.id] || null,
        card_review: allReviews[visit.id] || null,
      }));

      // 4. 캐시 저장
      await storage.cacheVisits(visitsWithCardData);

      return { data: visitsWithCardData, error: null };
    } catch (error) {
      console.error('Get visits error:', error);
      
      // 오류 시 캐시된 데이터 반환
      const cachedVisits = await storage.getCachedVisits();
      return { data: cachedVisits, error };
    }
  },

  /**
   * 특정 방문 기록 조회
   * @param {number} visitId - 방문 기록 ID
   * @returns {object} { data, error }
   */
  async getVisit(visitId) {
    try {
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('id', visitId)
        .single();

      if (error) throw error;

      // 로컬 스토리지에서 카드 정보 가져오기
      const selectedCard = await storage.getSelectedCard(visitId);
      const review = await storage.getCardReview(visitId);

      return { 
        data: { 
          ...data, 
          selected_card: selectedCard,
          card_review: review 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Get visit error:', error);
      return { data: null, error };
    }
  },

  /**
   * 방문 기록 수정 (카드 선택과 리뷰는 로컬에만 저장)
   * @param {number} visitId - 방문 기록 ID
   * @param {object} updates - 수정할 필드들
   * @returns {object} { data, error }
   */
  async updateVisit(visitId, updates) {
    try {
      // selected_card와 card_review는 로컬에만 저장
      const { selected_card, card_review, ...serverUpdates } = updates;

      // 1. 선택한 카드 저장 (로컬)
      if (selected_card !== undefined) {
        if (selected_card) {
          await storage.saveSelectedCard(visitId, selected_card);
        } else {
          await storage.deleteSelectedCard(visitId);
        }
      }

      // 2. 리뷰 저장 (로컬)
      if (card_review !== undefined) {
        if (card_review) {
          await storage.saveCardReview(visitId, card_review);
        } else {
          await storage.deleteCardReview(visitId);
        }
      }

      // 3. 나머지 데이터는 Supabase에 저장
      if (Object.keys(serverUpdates).length > 0) {
        const { data, error } = await supabase
          .from('visit_history')
          .update(serverUpdates)
          .eq('id', visitId)
          .select()
          .single();

        if (error) throw error;

        // 4. 로컬 데이터 포함하여 반환
        const savedCard = await storage.getSelectedCard(visitId);
        const savedReview = await storage.getCardReview(visitId);
        
        return { 
          data: { 
            ...data, 
            selected_card: savedCard,
            card_review: savedReview 
          }, 
          error: null 
        };
      }

      // 로컬 데이터만 업데이트한 경우
      const savedCard = await storage.getSelectedCard(visitId);
      const savedReview = await storage.getCardReview(visitId);
      
      return { 
        data: { 
          id: visitId, 
          selected_card: savedCard,
          card_review: savedReview 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Update visit error:', error);
      return { data: null, error };
    }
  },

  /**
   * 방문 기록 삭제 (로컬 데이터도 함께 삭제)
   * @param {number} visitId - 방문 기록 ID
   * @returns {object} { error }
   */
  async deleteVisit(visitId) {
    try {
      // 1. Supabase에서 삭제
      const { error } = await supabase
        .from('visit_history')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      // 2. 로컬 데이터도 삭제
      await storage.deleteSelectedCard(visitId);
      await storage.deleteCardReview(visitId);

      return { error: null };
    } catch (error) {
      console.error('Delete visit error:', error);
      return { error };
    }
  },

  /**
   * 새 방문 기록 생성 (관리자용)
   * @param {object} visitData - 방문 기록 데이터
   * @returns {object} { data, error }
   */
  async createVisit(visitData) {
    const { data, error } = await supabase
      .from('visit_history')
      .insert(visitData)
      .select()
      .single();

    return { data, error };
  },

  /**
   * 로컬 데이터 정리 (삭제된 방문 기록의 카드/리뷰 제거)
   * @param {string} customerId - 고객 ID (UUID)
   */
  async cleanupLocalData(customerId) {
    try {
      // 1. 현재 유효한 방문 기록 ID 목록 가져오기
      const { data, error } = await supabase
        .from('visit_history')
        .select('id')
        .eq('customer_id', customerId);

      if (error) throw error;

      const validVisitIds = (data || []).map(v => v.id);

      // 2. 로컬 스토리지 정리
      await storage.cleanupOrphanedCards(validVisitIds);
      await storage.cleanupOrphanedReviews(validVisitIds);
    } catch (error) {
      console.error('Cleanup local data error:', error);
    }
  },
};