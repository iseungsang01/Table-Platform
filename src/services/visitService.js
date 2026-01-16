import { supabase } from './supabase';
import { storage } from '../utils/storage';

export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회 (삭제되지 않은 것만)
   */
  async getVisits(customerId) {
    try {
      // 1. Supabase 조회 (is_deleted가 false인 것만 + id, customer_id, visit_date만 가져옴)
      const { data, error } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date')
        .eq('customer_id', customerId)
        .eq('is_deleted', false) // ✅ 삭제되지 않은 것만
        .order('visit_date', { ascending: false });

      if (error) throw error;

      // 2. 로컬 데이터(이미지/리뷰) 로드
      const allImages = await storage.getAllCardImages();
      const allReviews = await storage.getAllCardReviews();

      // 3. UI용 데이터 병합
      const visitsWithLocalData = (data || []).map(visit => ({
        ...visit,
        is_manual: false, // UI 판별용 플래그 (DB 저장 안 함)
        card_image: allImages[visit.id] || null,
        card_review: allReviews[visit.id] || null,
      }));

      await storage.cacheVisits(visitsWithLocalData);
      return { data: visitsWithLocalData, error: null };
    } catch (error) {
      console.error('❌ [visitService] getVisits 오류:', error.message);
      const cached = await storage.getCachedVisits();
      return { data: cached.map(v => ({ ...v, is_manual: false })), error };
    }
  },

  /**
   * 방문 기록 수정
   */
  async updateVisit(visitId, updates) {
    try {
      // 1. 로컬 데이터 처리 (이미지/리뷰)
      if (updates.card_image !== undefined) {
        updates.card_image ? await storage.saveCardImage(visitId, updates.card_image) : await storage.deleteCardImage(visitId);
      }
      if (updates.card_review !== undefined) {
        updates.card_review ? await storage.saveCardReview(visitId, updates.card_review) : await storage.deleteCardReview(visitId);
      }

      // 2. 서버 업데이트 데이터 필터링 (DB에 있는 컬럼만 추출)
      const serverPayload = {};
      if (updates.visit_date) serverPayload.visit_date = updates.visit_date;
      if (updates.customer_id) serverPayload.customer_id = updates.customer_id;

      let updatedServerData = {};
      
      // 실제 DB 업데이트가 필요한 경우만 실행
      if (Object.keys(serverPayload).length > 0) {
        const { data, error } = await supabase
          .from('visit_history')
          .update(serverPayload)
          .eq('id', visitId)
          .select('id, customer_id, visit_date')
          .single();

        if (error) throw error;
        updatedServerData = data;
      } else {
        // DB 업데이트가 없으면 기본 정보만 가져옴
        const { data } = await this.getVisit(visitId);
        updatedServerData = data;
      }

      return { 
        data: { 
          ...updatedServerData, 
          is_manual: false,
          card_image: await storage.getCardImage(visitId),
          card_review: await storage.getCardReview(visitId)
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ [visitService] updateVisit 오류:', error);
      return { data: null, error };
    }
  },

  /**
   * 새 방문 기록 생성
   */
  async createVisit(visitData) {
    try {
      // 1. 서버용 데이터만 필터링
      const serverPayload = {
        customer_id: visitData.customer_id,
        visit_date: visitData.visit_date
      };

      const { data, error } = await supabase
        .from('visit_history')
        .insert(serverPayload)
        .select()
        .single();

      if (error) throw error;

      // 2. 생성된 ID를 기준으로 로컬 데이터(이미지/리뷰) 저장
      if (visitData.card_image) await storage.saveCardImage(data.id, visitData.card_image);
      if (visitData.card_review) await storage.saveCardReview(data.id, visitData.card_review);

      return { 
        data: { ...data, is_manual: false }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ [visitService] createVisit 오류:', error);
      return { data: null, error };
    }
  },

  /**
   * 단일 방문 기록 조회
   */
  async getVisit(visitId) {
    const { data, error } = await supabase
      .from('visit_history')
      .select('id, customer_id, visit_date')
      .eq('id', visitId)
      .eq('is_deleted', false) // ✅ 삭제되지 않은 것만
      .single();
    
    if (error) return { data: null, error };
    
    return { 
      data: { 
        ...data, 
        is_manual: false,
        card_image: await storage.getCardImage(visitId),
        card_review: await storage.getCardReview(visitId)
      }, 
      error: null 
    };
  },

  /**
   * ✅ 방문 기록 삭제 (Soft Delete)
   * - DB에서 is_deleted = true로 변경
   * - 로컬 스토리지의 이미지/리뷰는 실제 삭제
   */
  async deleteVisit(visitId) {
    try {
      console.log('🗑️ [visitService] 소프트 삭제 시작:', visitId);

      // 1. DB에서 is_deleted = true로 변경
      const { error } = await supabase
        .from('visit_history')
        .update({ is_deleted: true })
        .eq('id', visitId);

      if (error) throw error;

      // 2. 로컬 스토리지의 이미지/리뷰는 실제 삭제
      await storage.deleteCardImage(visitId);
      await storage.deleteCardReview(visitId);

      console.log('✅ [visitService] 소프트 삭제 완료');
      return { error: null };
    } catch (error) {
      console.error('❌ [visitService] 삭제 오류:', error);
      return { error };
    }
  },
  
  /**
   * 고객 통계 조회
   */
  async getCustomerStats(customerId) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('current_stamps, visit_count')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('스탬프 정보 조회 실패:', error);
      return { data: null, error };
    }
  }
};