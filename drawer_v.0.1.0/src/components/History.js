import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const tarotEmojis = {
  'The Fool': '🃏',
  'The Magician': '🎩',
  'The Empress': '👸',
  'The Emperor': '🤴',
  'Justice': '⚖️',
  'The Moon': '🌙',
  'The Sun': '☀️',
  'The Star': '⭐',
  'The Lovers': '🎭',
  'The Devil': '🔱'
};

function History({ customer, onLogout, onStartSelection, onShowCoupon }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editReview, setEditReview] = useState('');
  const [actualCouponCount, setActualCouponCount] = useState(0);

  useEffect(() => {
    // 등록된 회원만 데이터 로드
    if (customer.id && !customer.is_guest) {
      loadVisits();
      loadActualCouponCount();
    } else {
      setLoading(false);
    }
  }, [customer.id]);

  const loadVisits = async () => {
    try {
      const { data, error } = await supabase
        .from('visit_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Load visits error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActualCouponCount = async () => {
    try {
      const { count, error } = await supabase
        .from('coupon_history')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id);

      if (error) throw error;
      setActualCouponCount(count || 0);
    } catch (error) {
      console.error('Load coupon count error:', error);
      setActualCouponCount(0);
    }
  };

  const handleSelectCard = (visitId) => {
    onStartSelection(visitId);
  };

  const handleEditStart = (visit) => {
    setEditingVisit(visit.id);
    setEditReview(visit.card_review || '');
  };

  const handleEditSave = async (visitId) => {
    if (editReview.length > 100) {
      alert('리뷰는 100자 이내로 작성해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_history')
        .update({ card_review: editReview || null })
        .eq('id', visitId);

      if (error) throw error;

      setEditingVisit(null);
      setEditReview('');
      loadVisits();
      alert('✨ 리뷰가 수정되었습니다!');
    } catch (error) {
      console.error('Edit error:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditCancel = () => {
    setEditingVisit(null);
    setEditReview('');
  };

  const handleDelete = async (visitId, hasCard) => {
    const confirmMessage = hasCard 
      ? '이 방문 기록을 삭제하시겠습니까?\n선택한 카드와 리뷰가 모두 삭제됩니다.\n삭제 시 복구는 불가능합니다.'
      : '이 방문 기록을 삭제하시겠습니까?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('visit_history')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      loadVisits();
      alert('🗑️ 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="history-view">
      <div className="history-header">
        <div>
          <h1>🔮 나의 타로 기록</h1>
          <p className="customer-name">
            {customer.nickname}님의 방문 기록
            {customer.is_guest && <span style={{ color: '#ffa726', marginLeft: '8px' }}>(미등록)</span>}
          </p>
        </div>
        <button className="btn btn-logout" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      {/* 미등록 회원 안내 */}
      {customer.is_guest && (
        <div style={{
          background: 'rgba(255, 152, 0, 0.15)',
          border: '2px solid #ff9800',
          borderRadius: '15px',
          padding: '15px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '28px' }}>ℹ️</div>
          <div style={{ flex: 1 }}>
            <div style={{
              color: '#ffa726',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '5px'
            }}>
              미등록 회원입니다
            </div>
            <div style={{
              color: '#e0b0ff',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              현재 전화번호로 등록된 회원 정보가 없습니다.<br />
              회원 가입은 매장에서 진행하실 수 있습니다.
            </div>
          </div>
        </div>
      )}

      <div className="stats-card">
        <div className="stat-item">
          <div className="stat-number">{customer.current_stamps}/10</div>
          <div className="stat-label">현재 스탬프</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{customer.visit_count}</div>
          <div className="stat-label">총 방문</div>
        </div>
        <div 
          className="stat-item" 
          onClick={onShowCoupon}
          style={{ cursor: 'pointer', transition: 'all 0.3s' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(138, 43, 226, 0.2)';
          }}
        >
          <div className="stat-number">{actualCouponCount}</div>
          <div className="stat-label">보유 쿠폰 👆</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : visits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <h3>아직 방문 기록이 없습니다</h3>
          <p>매장을 방문하고 첫 타로 카드를 선택해보세요!</p>
        </div>
      ) : (
        <div className="visit-list">
          {visits.map((visit) => (
            <div key={visit.id} className="visit-card">
              <div className="visit-header">
                <div className="visit-date">{formatDate(visit.visit_date)}</div>
                <div className="visit-actions">
                  {visit.stamps_added && (
                    <div className="stamps-badge">+{visit.stamps_added} 스탬프</div>
                  )}
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(visit.id, visit.selected_card)}
                    title="삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {visit.selected_card ? (
                <div className="card-display">
                  <div className="card-emoji-large">
                    {tarotEmojis[visit.selected_card] || '🃏'}
                  </div>
                  <div className="card-info">
                    <div className="card-name-large">{visit.selected_card}</div>
                    
                    {editingVisit === visit.id ? (
                      <div className="edit-review-section">
                        <textarea
                          value={editReview}
                          onChange={(e) => setEditReview(e.target.value)}
                          maxLength="100"
                          rows="3"
                          className="edit-textarea"
                          placeholder="리뷰를 입력하세요 (100자 이내)"
                        />
                        <div className="char-count">{editReview.length}/100</div>
                        <div className="edit-buttons">
                          <button 
                            className="btn-edit-save"
                            onClick={() => handleEditSave(visit.id)}
                          >
                            ✓ 저장
                          </button>
                          <button 
                            className="btn-edit-cancel"
                            onClick={handleEditCancel}
                          >
                            ✕ 취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {visit.card_review ? (
                          <div className="card-review">
                            <div className="review-header">
                              <div className="review-label">📝 기록</div>
                              <button 
                                className="btn-edit-small"
                                onClick={() => handleEditStart(visit)}
                                title="수정"
                              >
                                ✏️
                              </button>
                            </div>
                            <p>{visit.card_review}</p>
                          </div>
                        ) : (
                          <button 
                            className="btn-add-review"
                            onClick={() => handleEditStart(visit)}
                          >
                            + 리뷰 추가하기
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-card">
                  <div className="no-card-icon">🃏</div>
                  <p>아직 카드를 선택하지 않았습니다</p>
                  <button 
                    className="btn btn-select"
                    onClick={() => handleSelectCard(visit.id)}
                  >
                    카드 선택하기
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;