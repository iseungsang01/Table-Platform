import { supabase } from './supabase';
import { storage } from '../utils/storage';

export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회
   */
  async getVisits(customerId) {
    try {
      console.log('📥 [visitService] getVisits 시작:', customerId);

      // 1. Supabase 조회 (삭제되지 않은 기록만)
      const { data, error } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('visit_date', { ascending: false });

      if (error) throw error;

      console.log('✅ [visitService] DB 조회 완료:', data?.length || 0, '개');

      // 2. 유효한 visit ID 목록 추출
      const validVisitIds = (data || []).map(v => v.id);
      console.log('📋 [visitService] 유효한 ID 목록:', validVisitIds);

      // 3. ✅ Orphaned 데이터 정리 (DB에 없는 이미지/리뷰 삭제)
      console.log('🧹 [visitService] Orphaned 데이터 정리 시작...');
      await storage.cleanupOrphanedImages(validVisitIds);
      await storage.cleanupOrphanedReviews(validVisitIds);
      console.log('✅ [visitService] Orphaned 데이터 정리 완료');

      // 4. 로컬 데이터(이미지/리뷰) 로드
      const allImages = await storage.getAllCardImages();
      const allReviews = await storage.getAllCardReviews();

      console.log('📸 [visitService] 로컬 이미지 개수:', Object.keys(allImages).length);
      console.log('📝 [visitService] 로컬 리뷰 개수:', Object.keys(allReviews).length);

      // 5. UI용 데이터 병합
      const visitsWithLocalData = (data || []).map(visit => ({
        ...visit,
        is_manual: false,
        card_image: allImages[visit.id] || null,
        card_review: allReviews[visit.id] || null,
      }));

      // 6. 캐시 저장
      await storage.cacheVisits(visitsWithLocalData);

      console.log('✅ [visitService] getVisits 완료:', visitsWithLocalData.length, '개');
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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗑️ [visitService] 삭제 프로세스 시작');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📌 Visit ID:', visitId);
      console.log('📌 Visit ID 타입:', typeof visitId);

      // 1. 삭제 전 현재 상태 확인
      console.log('\n[STEP 1] 현재 상태 확인 중...');
      const { data: beforeData, error: beforeError } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date, is_deleted')
        .eq('id', visitId)
        .single();

      if (beforeError) {
        console.error('❌ 현재 상태 조회 실패:', beforeError);
        throw beforeError;
      }

      console.log('✅ 삭제 전 데이터:', JSON.stringify(beforeData, null, 2));

      // 2. is_deleted를 true로 업데이트
      console.log('\n[STEP 2] is_deleted 업데이트 실행 중...');
      console.log('📝 UPDATE visit_history SET is_deleted = true WHERE id =', visitId);

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

      console.log('✅ UPDATE 쿼리 성공');
      console.log('✅ 업데이트된 데이터:', JSON.stringify(updateData, null, 2));

      // 3. 업데이트 후 상태 재확인
      console.log('\n[STEP 3] 업데이트 후 상태 재확인 중...');
      const { data: afterData, error: afterError } = await supabase
        .from('visit_history')
        .select('id, customer_id, visit_date, is_deleted')
        .eq('id', visitId)
        .single();

      if (afterError) {
        console.error('❌ 재확인 조회 실패:', afterError);
      } else {
        console.log('✅ 삭제 후 데이터:', JSON.stringify(afterData, null, 2));
        
        if (afterData.is_deleted === true) {
          console.log('✅✅✅ is_deleted 업데이트 성공! ✅✅✅');
        } else {
          console.error('❌❌❌ is_deleted가 여전히 false입니다! ❌❌❌');
        }
      }

      // 4. ✅ 로컬 스토리지 완전 정리
      console.log('\n[STEP 4] 로컬 스토리지 완전 정리 중...');
      
      // 4-1. 이미지 삭제
      console.log('  🖼️ 이미지 삭제 중...');
      const imageDeleted = await storage.deleteCardImage(visitId);
      console.log('  ✅ 이미지 삭제:', imageDeleted ? '성공' : '없음');
      
      // 4-2. 리뷰 삭제
      console.log('  📝 리뷰 삭제 중...');
      const reviewDeleted = await storage.deleteCardReview(visitId);
      console.log('  ✅ 리뷰 삭제:', reviewDeleted ? '성공' : '없음');

      // 4-3. ✅ 캐시 무효화 (중요!)
      console.log('  🗑️ 캐시 무효화 중...');
      await storage.remove(storage.STORAGE_KEYS.VISIT_CACHE);
      await storage.remove(storage.STORAGE_KEYS.LAST_SYNC);
      console.log('  ✅ 캐시 무효화 완료');

      // 4-4. ✅ 전체 스토리지 상태 확인 (디버깅용)
      const allImages = await storage.getAllCardImages();
      const allReviews = await storage.getAllCardReviews();
      console.log('  📊 남은 이미지 개수:', Object.keys(allImages).length);
      console.log('  📊 남은 리뷰 개수:', Object.keys(allReviews).length);
      console.log('  📊 삭제된 ID가 남아있나?');
      console.log('    - 이미지:', visitId in allImages ? '❌ 여전히 존재!' : '✅ 삭제됨');
      console.log('    - 리뷰:', visitId in allReviews ? '❌ 여전히 존재!' : '✅ 삭제됨');

      console.log('✅ 로컬 스토리지 정리 완료');

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ 삭제 프로세스 완료');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return { error: null };
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌❌❌ deleteVisit 전체 실패 ❌❌❌');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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