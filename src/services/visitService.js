import { supabase } from './supabase';
import { storage } from '../utils/storage';

export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회
   */
  async getVisits(customerId) {
    try {


      // 1. Supabase 조회 (삭제되지 않은 기록만)
      const { data, error } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('visit_date', { ascending: false });

      if (error) throw error;



      // 2. 유효한 visit ID 목록 추출
      const validVisitIds = (data || []).map(v => v.id);


      // 3. ✅ Orphaned 데이터 정리 (DB에 없는 이미지/리뷰 삭제)

      await storage.cleanupOrphanedImages(validVisitIds);
      await storage.cleanupOrphanedReviews(validVisitIds);


      // 4. 로컬 데이터(이미지/리뷰) 로드
      const allImages = await storage.getAllCardImages();
      const allReviews = await storage.getAllCardReviews();



      // 5. UI용 데이터 병합
      const visitsWithLocalData = (data || []).map(visit => ({
        ...visit,
        is_manual: false,
        card_image: allImages[visit.id] || null,
        card_review: allReviews[visit.id] || null,
      }));

      // 6. 캐시 저장
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

      // 2. 서버 업데이트 데이터 필터링
      const serverPayload = {};
      if (updates.visit_date) serverPayload.visit_date = updates.visit_date;
      if (updates.customer_id) serverPayload.customer_id = updates.customer_id;

      let updatedServerData = {};

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

  async getVisit(visitId) {
    const { data, error } = await supabase
      .from('visit_history')
      .select('id, customer_id, visit_date')
      .eq('id', visitId)
      .eq('is_deleted', false)
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
   * ✅ 방문 기록 삭제 (Soft Delete + 로컬 스토리지 완전 정리)
   */
  async deleteVisit(visitId) {
    try {


      // 1. 삭제 전 현재 상태 확인

      const { data: beforeData, error: beforeError } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date, is_deleted')
        .eq('id', visitId)
        .single();

      if (beforeError) {
        console.error('❌ 현재 상태 조회 실패:', beforeError);
        throw beforeError;
      }



      // 2. is_deleted를 true로 업데이트


      const { data: updateData, error: updateError } = await supabase
        .from('visit_history')
        .update({ is_deleted: true })
        .eq('id', visitId)
        .select('id, customer_id, visit_date, is_deleted');

      if (updateError) {
        console.error('❌ UPDATE 쿼리 실패:', updateError);
        console.error('❌ 에러 코드:', updateError.code);
        console.error('❌ 에러 메시지:', updateError.message);
        throw updateError;
      }



      // 3. 업데이트 후 상태 재확인

      const { data: afterData, error: afterError } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date, is_deleted')
        .eq('id', visitId)
        .single();

      if (afterError) {
        console.error('❌ 재확인 조회 실패:', afterError);
      }

      // 4. 로컬 스토리지 완전 정리
      await storage.deleteCardImage(visitId);
      await storage.deleteCardReview(visitId);

      // 캐시 무효화
      await storage.remove(storage.STORAGE_KEYS.VISIT_CACHE);
      await storage.remove(storage.STORAGE_KEYS.LAST_SYNC);



      return { error: null };
    } catch (error) {

      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);

      return { error };
    }
  },

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