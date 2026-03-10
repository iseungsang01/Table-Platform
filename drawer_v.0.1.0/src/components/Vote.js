import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function Vote({ customer, onBack }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showResults, setShowResults] = useState(false);
  const [voteResults, setVoteResults] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadVotes();
  }, []);

  const loadVotes = async () => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVotes(data || []);
    } catch (error) {
      console.error('Load votes error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyVote = async (voteId) => {
    try {
      const { data, error } = await supabase
        .from('vote_responses')
        .select('*')
        .eq('vote_id', voteId)
        .eq('customer_id', customer.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setMyVote(data);
      if (data) {
        setSelectedOptions(data.selected_options || []);
        setShowResults(true); // 기존 투표가 있으면 결과 보기 모드
      } else {
        setShowResults(false); // 투표 안했으면 투표 모드
      }
    } catch (error) {
      console.error('Load my vote error:', error);
      setMyVote(null);
      setShowResults(false);
    }
  };

  const loadVoteResults = async (voteId) => {
    try {
      const { data, error } = await supabase
        .from('vote_responses')
        .select('selected_options')
        .eq('vote_id', voteId);

      if (error) throw error;

      const results = {};
      (data || []).forEach(response => {
        (response.selected_options || []).forEach(optionId => {
          results[optionId] = (results[optionId] || 0) + 1;
        });
      });

      setVoteResults(results);
    } catch (error) {
      console.error('Load vote results error:', error);
    }
  };

  const handleVoteSelect = async (vote) => {
    setSelectedVote(vote);
    setSelectedOptions([]);
    setMessage({ text: '', type: '' });
    setShowResults(false);
    setIsEditMode(false);
    await loadMyVote(vote.id);
    await loadVoteResults(vote.id);
  };

  const handleOptionToggle = (optionId) => {
    if (!selectedVote) return;

    const isMultiple = selectedVote.allow_multiple;
    const maxSelections = selectedVote.max_selections || 1;

    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else {
      if (isMultiple) {
        if (selectedOptions.length < maxSelections) {
          setSelectedOptions([...selectedOptions, optionId]);
        } else {
          setMessage({ 
            text: `최대 ${maxSelections}개까지만 선택 가능합니다.`, 
            type: 'error' 
          });
        }
      } else {
        setSelectedOptions([optionId]);
      }
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVote) return;

    if (selectedOptions.length === 0) {
      setMessage({ text: '투표할 항목을 선택해주세요.', type: 'error' });
      return;
    }

    const isMultiple = selectedVote.allow_multiple;
    const minSelections = 1;
    const maxSelections = selectedVote.max_selections || 1;

    if (selectedOptions.length < minSelections) {
      setMessage({ text: '최소 1개 이상 선택해주세요.', type: 'error' });
      return;
    }

    if (isMultiple && selectedOptions.length > maxSelections) {
      setMessage({ text: `최대 ${maxSelections}개까지만 선택 가능합니다.`, type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      // 기존 투표가 있으면 수정, 없으면 새로 삽입
      if (myVote) {
        // 투표 수정
        const { error } = await supabase
          .from('vote_responses')
          .update({
            selected_options: selectedOptions,
            voted_at: new Date().toISOString()
          })
          .eq('id', myVote.id);

        if (error) throw error;
        setMessage({ text: '✅ 투표가 수정되었습니다!', type: 'success' });
      } else {
        // 새 투표
        const { error } = await supabase
          .from('vote_responses')
          .insert({
            vote_id: selectedVote.id,
            customer_id: customer.id,
            selected_options: selectedOptions
          });

        if (error) throw error;
        setMessage({ text: '✅ 투표가 완료되었습니다!', type: 'success' });
      }

      await loadMyVote(selectedVote.id);
      await loadVoteResults(selectedVote.id);
      setShowResults(true);
      setIsEditMode(false);

      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error('Submit vote error:', error);
      setMessage({ text: '투표 중 오류가 발생했습니다: ' + error.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVote = () => {
    console.log('수정 버튼 클릭됨'); // 디버그용
    setShowResults(false);
    setIsEditMode(true);
    setMessage({ text: '', type: '' });
  };

  const handleCancelEdit = () => {
    setShowResults(true);
    setIsEditMode(false);
    // 원래 투표로 복원
    if (myVote) {
      setSelectedOptions(myVote.selected_options || []);
    }
    setMessage({ text: '', type: '' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '제한 없음';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalVotes = () => {
    return Object.values(voteResults).reduce((sum, count) => sum + count, 0);
  };

  const getOptionPercentage = (optionId) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round(((voteResults[optionId] || 0) / total) * 100);
  };

  const renderVoteList = () => (
    <div className="vote-list-section">
      <h3>📊 진행 중인 투표</h3>
      {votes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗳️</div>
          <h3>진행 중인 투표가 없습니다</h3>
        </div>
      ) : (
        <div className="vote-list">
          {votes.map((vote) => (
            <div
              key={vote.id}
              className="vote-item"
              onClick={() => handleVoteSelect(vote)}
              style={{
                background: 'rgba(138, 43, 226, 0.2)',
                border: '3px solid var(--purple-light)',
                borderRadius: '15px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                marginBottom: '15px'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <span style={{
                  background: 'rgba(138, 43, 226, 0.3)',
                  color: 'var(--gold)',
                  padding: '4px 10px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginRight: '8px'
                }}>
                  {vote.allow_multiple ? `복수선택 (최대 ${vote.max_selections}개)` : '단일선택'}
                </span>
                {vote.is_anonymous && (
                  <span style={{
                    background: 'rgba(76, 175, 80, 0.3)',
                    color: '#4caf50',
                    padding: '4px 10px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    익명투표
                  </span>
                )}
              </div>
              
              <div style={{ 
                color: 'var(--gold)', 
                fontSize: '20px', 
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                {vote.title}
              </div>
              
              {vote.description && (
                <div style={{ 
                  color: 'var(--lavender)', 
                  fontSize: '14px',
                  marginBottom: '12px',
                  lineHeight: '1.5'
                }}>
                  {vote.description}
                </div>
              )}
              
              <div style={{ 
                color: 'var(--lavender)', 
                fontSize: '13px',
                opacity: 0.8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>📅 마감: {formatDate(vote.ends_at)}</span>
                <span style={{ 
                  background: 'rgba(138, 43, 226, 0.3)',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}>
                  {vote.options?.length || 0}개 항목
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVoteDetail = () => {
    if (!selectedVote) return null;

    const options = selectedVote.options || [];
    const totalVotes = getTotalVotes();
    const hasVoted = myVote !== null;

    return (
      <div className="vote-detail-section">
        <button 
          className="btn-back" 
          onClick={() => {
            setSelectedVote(null);
            setSelectedOptions([]);
            setMyVote(null);
            setShowResults(false);
            setIsEditMode(false);
            setMessage({ text: '', type: '' });
          }}
          style={{ marginBottom: '20px' }}
        >
          ← 목록으로
        </button>

        <div style={{
          background: 'var(--gradient-purple)',
          border: '3px solid var(--gold)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 20px 60px rgba(255, 215, 0, 0.3)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <span style={{
              background: 'rgba(138, 43, 226, 0.3)',
              color: 'var(--gold)',
              padding: '6px 12px',
              borderRadius: '15px',
              fontSize: '13px',
              fontWeight: '600',
              marginRight: '8px'
            }}>
              {selectedVote.allow_multiple ? `복수선택 (최대 ${selectedVote.max_selections}개)` : '단일선택'}
            </span>
            {selectedVote.is_anonymous && (
              <span style={{
                background: 'rgba(76, 175, 80, 0.3)',
                color: '#4caf50',
                padding: '6px 12px',
                borderRadius: '15px',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                익명투표
              </span>
            )}
          </div>

          <h2 style={{ 
            color: 'var(--gold)', 
            fontSize: '26px',
            marginBottom: '15px',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
          }}>
            {selectedVote.title}
          </h2>

          {selectedVote.description && (
            <p style={{ 
              color: 'var(--lavender)', 
              fontSize: '16px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              {selectedVote.description}
            </p>
          )}

          <div style={{ 
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            marginTop: '20px'
          }}>
            <div style={{
              background: 'rgba(138, 43, 226, 0.2)',
              border: '2px solid var(--purple-light)',
              borderRadius: '10px',
              padding: '12px 20px',
              flex: 1,
              minWidth: '150px'
            }}>
              <div style={{ color: 'var(--lavender)', fontSize: '13px', marginBottom: '5px' }}>
                📅 마감일
              </div>
              <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
                {formatDate(selectedVote.ends_at)}
              </div>
            </div>

            <div style={{
              background: 'rgba(138, 43, 226, 0.2)',
              border: '2px solid var(--purple-light)',
              borderRadius: '10px',
              padding: '12px 20px',
              flex: 1,
              minWidth: '150px'
            }}>
              <div style={{ color: 'var(--lavender)', fontSize: '13px', marginBottom: '5px' }}>
                🗳️ 총 투표 수
              </div>
              <div style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
                {totalVotes}표
              </div>
            </div>
          </div>
        </div>

        {/* 투표 상태 표시 */}
        {hasVoted && showResults && !isEditMode && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.2)',
            border: '2px solid #4caf50',
            borderRadius: '15px',
            padding: '15px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#4caf50', fontSize: '16px', fontWeight: '600' }}>
              ✓ 투표 완료
            </div>
            <div style={{ color: 'var(--lavender)', fontSize: '14px', marginTop: '5px' }}>
              투표 결과를 확인하거나 수정할 수 있습니다
            </div>
          </div>
        )}

        {/* 투표 옵션 또는 결과 */}
        {showResults && !isEditMode ? (
          // 결과 보기 모드
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: 'var(--gold)', margin: 0 }}>
                📊 투표 결과
              </h3>
              {hasVoted && (
                <button
                  onClick={handleEditVote}
                  style={{
                    background: 'var(--gradient-button)',
                    color: 'white',
                    border: '2px solid var(--gold)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 5px 15px rgba(138, 43, 226, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(138, 43, 226, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(138, 43, 226, 0.4)';
                  }}
                >
                  ✏️ 투표 수정
                </button>
              )}
            </div>

            {options.map((option) => {
              const votes = voteResults[option.id] || 0;
              const percentage = getOptionPercentage(option.id);
              const isMyChoice = myVote && (myVote.selected_options || []).includes(option.id);

              return (
                <div
                  key={option.id}
                  style={{
                    background: isMyChoice 
                      ? 'rgba(255, 215, 0, 0.15)' 
                      : 'rgba(138, 43, 226, 0.2)',
                    border: isMyChoice 
                      ? '3px solid var(--gold)' 
                      : '2px solid var(--purple-light)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '15px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* 진행바 배경 */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${percentage}%`,
                    background: isMyChoice
                      ? 'linear-gradient(90deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%)'
                      : 'linear-gradient(90deg, rgba(138, 43, 226, 0.4) 0%, rgba(138, 43, 226, 0.1) 100%)',
                    transition: 'width 0.5s ease',
                    borderRadius: '12px'
                  }} />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ 
                        color: isMyChoice ? 'var(--gold)' : 'white',
                        fontSize: '16px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {isMyChoice && <span style={{ fontSize: '18px' }}>✓</span>}
                        {option.text}
                      </div>
                      <div style={{ 
                        color: 'var(--gold)',
                        fontSize: '18px',
                        fontWeight: '700'
                      }}>
                        {percentage}%
                      </div>
                    </div>
                    <div style={{ 
                      color: 'var(--lavender)', 
                      fontSize: '14px'
                    }}>
                      {votes}표
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // 투표하기/수정 모드
          <div>
            <h3 style={{ color: 'var(--gold)', marginBottom: '20px' }}>
              🗳️ {hasVoted && isEditMode ? '투표 수정하기' : '투표하기'}
            </h3>

            {hasVoted && isEditMode && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '2px solid var(--gold)',
                borderRadius: '15px',
                padding: '15px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ color: 'var(--gold)', fontSize: '16px', fontWeight: '600' }}>
                  ✏️ 수정 모드
                </div>
                <div style={{ color: 'var(--lavender)', fontSize: '14px', marginTop: '5px' }}>
                  원하는 항목을 다시 선택해주세요
                </div>
              </div>
            )}

            {options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);

              return (
                <div
                  key={option.id}
                  onClick={() => handleOptionToggle(option.id)}
                  style={{
                    background: isSelected 
                      ? 'rgba(255, 215, 0, 0.15)' 
                      : 'rgba(138, 43, 226, 0.2)',
                    border: isSelected 
                      ? '3px solid var(--gold)' 
                      : '2px solid var(--purple-light)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: selectedVote.allow_multiple ? '6px' : '50%',
                    border: `3px solid ${isSelected ? 'var(--gold)' : 'var(--purple-light)'}`,
                    background: isSelected ? 'var(--gold)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s'
                  }}>
                    {isSelected && (
                      <span style={{ color: 'var(--purple-dark)', fontSize: '14px', fontWeight: '700' }}>
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: isSelected ? 'var(--gold)' : 'white',
                    fontSize: '16px',
                    fontWeight: isSelected ? '700' : '600'
                  }}>
                    {option.text}
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmitVote}
                disabled={submitting || selectedOptions.length === 0}
                style={{ 
                  flex: 1,
                  padding: '18px'
                }}
              >
                {submitting ? '처리 중...' : hasVoted && isEditMode ? '✏️ 투표 수정 완료' : '✓ 투표하기'}
              </button>

              {hasVoted && isEditMode && (
                <button
                  className="btn-back"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  style={{ 
                    flex: 1,
                    padding: '18px'
                  }}
                >
                  취소
                </button>
              )}
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="vote-view">
      <div className="vote-header">
        <button className="btn-back" onClick={onBack}>
          ← 돌아가기
        </button>
        <h1>🗳️ 투표</h1>
        <p className="subtitle">고객님의 소중한 의견을 들려주세요</p>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : selectedVote ? (
        renderVoteDetail()
      ) : (
        renderVoteList()
      )}
    </div>
  );
}

export default Vote;