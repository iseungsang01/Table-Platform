import { supabase } from './supabase';

/**
 * 투표 서비스
 * 투표 목록 조회, 투표하기, 결과 조회
 */
export const voteService = {
  /**
   * 활성화된 투표 목록 조회
   * @returns {object} { data, error }
   */
  async getVotes() {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * 특정 투표 조회
   * @param {number} voteId - 투표 ID
   * @returns {object} { data, error }
   */
  async getVote(voteId) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('id', voteId)
      .single();

    return { data, error };
  },

  /**
   * 내 투표 기록 조회
   * @param {number} voteId - 투표 ID
   * @param {number} customerId - 고객 ID
   * @returns {object} { data, error }
   */
  async getMyVote(voteId, customerId) {
    const { data, error } = await supabase
      .from('vote_responses')
      .select('*')
      .eq('vote_id', voteId)
      .eq('customer_id', customerId)
      .single();

    // 데이터가 없어도 에러로 처리하지 않음
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null };
    }

    return { data, error };
  },

  /**
   * 투표하기 또는 수정하기
   * @param {number} voteId - 투표 ID
   * @param {number} customerId - 고객 ID
   * @param {array} selectedOptions - 선택한 옵션 ID 배열
   * @param {number} existingVoteId - 기존 투표 ID (수정 시)
   * @returns {object} { data, error }
   */
  async submitVote(voteId, customerId, selectedOptions, existingVoteId = null) {
    try {
      if (existingVoteId) {
        // 투표 수정
        const { data, error } = await supabase
          .from('vote_responses')
          .update({
            selected_options: selectedOptions,
            voted_at: new Date().toISOString(),
          })
          .eq('id', existingVoteId)
          .select()
          .single();

        return { data, error };
      } else {
        // 새 투표
        const { data, error } = await supabase
          .from('vote_responses')
          .insert({
            vote_id: voteId,
            customer_id: customerId,
            selected_options: selectedOptions,
          })
          .select()
          .single();

        return { data, error };
      }
    } catch (error) {
      console.error('Submit vote error:', error);
      return { data: null, error };
    }
  },

  /**
   * 투표 결과 조회
   * @param {number} voteId - 투표 ID
   * @returns {object} { results, error }
   */
  async getVoteResults(voteId) {
    try {
      const { data, error } = await supabase
        .from('vote_responses')
        .select('selected_options')
        .eq('vote_id', voteId);

      if (error) throw error;

      // 각 옵션의 투표 수 집계
      const results = {};
      (data || []).forEach((response) => {
        (response.selected_options || []).forEach((optionId) => {
          results[optionId] = (results[optionId] || 0) + 1;
        });
      });

      return { results, error: null };
    } catch (error) {
      console.error('Get vote results error:', error);
      return { results: {}, error };
    }
  },

  /**
   * 투표 총 참여자 수 조회
   * @param {number} voteId - 투표 ID
   * @returns {object} { count, error }
   */
  async getVoteParticipants(voteId) {
    const { count, error } = await supabase
      .from('vote_responses')
      .select('*', { count: 'exact', head: true })
      .eq('vote_id', voteId);

    return { count: count || 0, error };
  },
};