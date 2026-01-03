import { supabase } from './supabase';
import { storage } from '../utils/storage';

/**
 * 방문 기록 서비스
 * 방문 기록 조회, 수정, 삭제
 * card_image와 card_review는 로컬 스토리지에서 관리
 */
export const visitService = {
  /**
   * 고객의 방문 기록 목록 조회 (이미지/리뷰는 로컬에서 병합)
   * @param {string} customerId - 고객 ID (UUID)
   * @returns {object} { data, error }
   */
  async getVisits(customerId) {
    try {
      console.log('========================================');
      console.log('📥 [visitService] getVisits 시작');
      console.log('📥 [visitService] Customer ID:', customerId);
      console.log('📥 [visitService] Customer ID 타입:', typeof customerId);
      console.log('========================================');

      // 1. Supabase에서 방문 기록 조회
      console.log('🔍 [visitService] Supabase 쿼리 시작...');
      
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('❌ [visitService] Supabase 조회 오류:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ [visitService] Supabase 조회 성공');
      console.log('📊 [visitService] 조회된 데이터 개수:', data?.length || 0);
      
      // 🔍 첫 번째 데이터 상세 로깅
      if (data && data.length > 0) {
        console.log('📋 [visitService] 첫 번째 방문 기록:', {
          id: data[0].id,
          customer_id: data[0].customer_id,
          visit_date: data[0].visit_date,
          stamps_added: data[0].stamps_added,
          note: data[0].note
        });
      }

      // 2. 로컬 스토리지에서 이미지/리뷰 가져오기
      console.log('💾 [visitService] 로컬 스토리지 데이터 로드 중...');
      
      const allImages = await storage.getAllCardImages();
      const allReviews = await storage.getAllCardReviews();

      console.log('📸 [visitService] 저장된 이미지 개수:', Object.keys(allImages).length);
      console.log('📝 [visitService] 저장된 리뷰 개수:', Object.keys(allReviews).length);

      // 3. 데이터 병합
      console.log('🔗 [visitService] 데이터 병합 중...');
      
      const visitsWithLocalData = (data || []).map(visit => {
        const hasImage = !!allImages[visit.id];
        const hasReview = !!allReviews[visit.id];
        
        if (hasImage || hasReview) {
          console.log(`📎 [visitService] Visit ${visit.id}:`, {
            이미지: hasImage ? 'O' : 'X',
            리뷰: hasReview ? 'O' : 'X'
          });
        }
        
        return {
          ...visit,
          card_image: allImages[visit.id] || null,
          card_review: allReviews[visit.id] || null,
        };
      });

      console.log('✅ [visitService] 데이터 병합 완료:', visitsWithLocalData.length, '건');

      // 4. 캐시 저장
      console.log('💾 [visitService] 캐시 저장 중...');
      await storage.cacheVisits(visitsWithLocalData);
      console.log('✅ [visitService] 캐시 저장 완료');

      console.log('========================================');
      console.log('✅ [visitService] getVisits 완료');
      console.log('========================================');

      return { data: visitsWithLocalData, error: null };
    } catch (error) {
      console.error('========================================');
      console.error('❌ [visitService] getVisits 전체 오류:', error);
      console.error('❌ [visitService] 오류 메시지:', error.message);
      console.error('❌ [visitService] 오류 스택:', error.stack);
      console.error('========================================');
      
      // 오류 시 캐시된 데이터 반환
      console.log('🔄 [visitService] 캐시 데이터 로드 시도...');
      const cachedVisits = await storage.getCachedVisits();
      console.log('🔄 [visitService] 캐시 데이터 개수:', cachedVisits.length, '건');
      
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
      console.log('🔍 [visitService] getVisit:', visitId);
      
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('id', visitId)
        .single();

      if (error) {
        console.error('❌ [visitService] getVisit 오류:', error);
        throw error;
      }

      console.log('✅ [visitService] getVisit 성공');

      // 로컬 스토리지에서 이미지/리뷰 가져오기
      const cardImage = await storage.getCardImage(visitId);
      const review = await storage.getCardReview(visitId);

      return { 
        data: { 
          ...data, 
          card_image: cardImage,
          card_review: review 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ [visitService] getVisit 오류:', error);
      return { data: null, error };
    }
  },

  /**
   * 방문 기록 수정 (이미지와 리뷰는 로컬에만 저장)
   * @param {number} visitId - 방문 기록 ID
   * @param {object} updates - 수정할 필드들
   * @returns {object} { data, error }
   */
  async updateVisit(visitId, updates) {
    try {
      console.log('📝 [visitService] updateVisit:', visitId);
      console.log('📝 [visitService] 업데이트 내용:', Object.keys(updates));
      
      // card_image와 card_review는 로컬에만 저장
      const { card_image, card_review, ...serverUpdates } = updates;

      // 1. 이미지 저장 (로컬)
      if (card_image !== undefined) {
        console.log('📸 [visitService] 이미지 저장:', card_image ? '있음' : '삭제');
        
        if (card_image) {
          await storage.saveCardImage(visitId, card_image);
        } else {
          await storage.deleteCardImage(visitId);
        }
      }

      // 2. 리뷰 저장 (로컬)
      if (card_review !== undefined) {
        console.log('📝 [visitService] 리뷰 저장:', card_review ? card_review : '삭제');
        
        if (card_review) {
          await storage.saveCardReview(visitId, card_review);
        } else {
          await storage.deleteCardReview(visitId);
        }
      }

      // 3. 나머지 데이터는 Supabase에 저장
      if (Object.keys(serverUpdates).length > 0) {
        console.log('☁️ [visitService] Supabase 업데이트:', Object.keys(serverUpdates));
        
        const { data, error } = await supabase
          .from('visit_history')
          .update(serverUpdates)
          .eq('id', visitId)
          .select()
          .single();

        if (error) throw error;

        console.log('✅ [visitService] Supabase 업데이트 성공');

        // 4. 로컬 데이터 포함하여 반환
        const savedImage = await storage.getCardImage(visitId);
        const savedReview = await storage.getCardReview(visitId);
        
        return { 
          data: { 
            ...data, 
            card_image: savedImage,
            card_review: savedReview 
          }, 
          error: null 
        };
      }

      // 로컬 데이터만 업데이트한 경우
      console.log('💾 [visitService] 로컬 데이터만 업데이트됨');
      
      const savedImage = await storage.getCardImage(visitId);
      const savedReview = await storage.getCardReview(visitId);
      
      return { 
        data: { 
          id: visitId, 
          card_image: savedImage,
          card_review: savedReview 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('❌ [visitService] updateVisit 오류:', error);
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
      console.log('🗑️ [visitService] deleteVisit:', visitId);
      
      // 1. Supabase에서 삭제
      const { error } = await supabase
        .from('visit_history')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      console.log('✅ [visitService] Supabase 삭제 성공');

      // 2. 로컬 데이터도 삭제
      await storage.deleteCardImage(visitId);
      await storage.deleteCardReview(visitId);
      
      console.log('✅ [visitService] 로컬 데이터 삭제 성공');

      return { error: null };
    } catch (error) {
      console.error('❌ [visitService] deleteVisit 오류:', error);
      return { error };
    }
  },

  /**
   * 새 방문 기록 생성 (관리자용)
   * @param {object} visitData - 방문 기록 데이터
   * @returns {object} { data, error }
   */
  async createVisit(visitData) {
    console.log('➕ [visitService] createVisit:', visitData);
    
    const { data, error } = await supabase
      .from('visit_history')
      .insert(visitData)
      .select()
      .single();

    if (error) {
      console.error('❌ [visitService] createVisit 오류:', error);
    } else {
      console.log('✅ [visitService] createVisit 성공:', data.id);
    }

    return { data, error };
  },

  /**
   * 로컬 데이터 정리 (삭제된 방문 기록의 이미지/리뷰 제거)
   * @param {string} customerId - 고객 ID (UUID)
   */
  async cleanupLocalData(customerId) {
    try {
      console.log('🧹 [visitService] cleanupLocalData 시작:', customerId);
      
      // 1. 현재 유효한 방문 기록 ID 목록 가져오기
      const { data, error } = await supabase
        .from('visit_history')
        .select('id')
        .eq('customer_id', customerId);

      if (error) throw error;

      const validVisitIds = (data || []).map(v => v.id);

      console.log('📋 [visitService] 유효한 방문 ID:', validVisitIds);

      // 2. 로컬 스토리지 정리
      await storage.cleanupOrphanedImages(validVisitIds);
      await storage.cleanupOrphanedReviews(validVisitIds);
      
      console.log('✅ [visitService] cleanupLocalData 완료');
    } catch (error) {
      console.error('❌ [visitService] cleanupLocalData 오류:', error);
    }
  },

  /**
   * 🔍 디버깅: 데이터베이스 직접 조회 테스트
   * @param {string} customerId - 고객 ID (UUID)
   */
  async debugVisits(customerId) {
    try {
      console.log('========================================');
      console.log('🔍 [DEBUG] 방문 기록 디버깅 시작');
      console.log('🔍 [DEBUG] Customer ID:', customerId);
      console.log('🔍 [DEBUG] Customer ID 타입:', typeof customerId);
      console.log('========================================');
      
      // 1. RLS 정책 확인
      console.log('🔒 [DEBUG] RLS 정책 확인...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [DEBUG] 현재 인증 세션:', session ? 'YES' : 'NO');
      
      // 2. 전체 방문 기록 조회 (필터 없이)
      console.log('📊 [DEBUG] 전체 방문 기록 조회...');
      
      const { data: allVisits, error: allError, count: totalCount } = await supabase
        .from('visit_history')
        .select('*', { count: 'exact' });
      
      console.log('📊 [DEBUG] 전체 방문 기록 개수:', totalCount);
      console.log('📊 [DEBUG] 조회된 데이터 개수:', allVisits?.length || 0);
      
      if (allError) {
        console.error('❌ [DEBUG] 전체 조회 오류:', allError);
      }
      
      if (allVisits && allVisits.length > 0) {
        console.log('📋 [DEBUG] 첫 번째 방문 기록:', {
          id: allVisits[0].id,
          customer_id: allVisits[0].customer_id,
          customer_id_type: typeof allVisits[0].customer_id,
          visit_date: allVisits[0].visit_date
        });
        
        // UUID 비교 테스트
        console.log('🔍 [DEBUG] UUID 비교:', {
          입력값: customerId,
          DB값: allVisits[0].customer_id,
          일치: customerId === allVisits[0].customer_id
        });
      }
      
      // 3. 특정 고객 방문 기록 조회
      console.log('👤 [DEBUG] 특정 고객 방문 기록 조회...');
      
      const { data: myVisits, error: myError, count: myCount } = await supabase
        .from('visit_history')
        .select('*', { count: 'exact' })
        .eq('customer_id', customerId);
      
      console.log('👤 [DEBUG] 내 방문 기록 개수:', myCount);
      console.log('👤 [DEBUG] 조회된 데이터 개수:', myVisits?.length || 0);
      
      if (myError) {
        console.error('❌ [DEBUG] 내 방문 조회 오류:', {
          message: myError.message,
          details: myError.details,
          hint: myError.hint
        });
      }
      
      // 4. 쿼리 테스트 (다양한 방식)
      console.log('🧪 [DEBUG] 다양한 쿼리 방식 테스트...');
      
      // 방법 1: 문자열 비교
      const { data: test1, count: count1 } = await supabase
        .from('visit_history')
        .select('*', { count: 'exact' })
        .eq('customer_id', `${customerId}`);
      
      console.log('🧪 [DEBUG] 테스트 1 (문자열):', count1);
      
      // 방법 2: UUID 타입 캐스팅
      const { data: test2, count: count2 } = await supabase
        .from('visit_history')
        .select('*', { count: 'exact' })
        .eq('customer_id', customerId);
      
      console.log('🧪 [DEBUG] 테스트 2 (UUID):', count2);
      
      console.log('========================================');
      console.log('✅ [DEBUG] 디버깅 완료');
      console.log('========================================');
      
      return { 
        allVisits, 
        myVisits,
        totalCount,
        myCount,
        tests: {
          method1: count1,
          method2: count2
        }
      };
    } catch (error) {
      console.error('========================================');
      console.error('❌ [DEBUG] 디버깅 오류:', error);
      console.error('❌ [DEBUG] 오류 메시지:', error.message);
      console.error('❌ [DEBUG] 오류 스택:', error.stack);
      console.error('========================================');
      return null;
    }
  },
};