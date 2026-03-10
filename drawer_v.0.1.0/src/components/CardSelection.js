import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';

const tarotCards = [
  { id: 1, emoji: '🃏', name: 'The Fool', meaning: '새로운 시작' },
  { id: 2, emoji: '🎩', name: 'The Magician', meaning: '창조와 의지' },
  { id: 3, emoji: '👸', name: 'The Empress', meaning: '풍요와 사랑' },
  { id: 4, emoji: '🤴', name: 'The Emperor', meaning: '권위와 안정' },
  { id: 5, emoji: '⚖️', name: 'Justice', meaning: '정의와 균형' },
  { id: 6, emoji: '🌙', name: 'The Moon', meaning: '직관과 꿈' },
  { id: 7, emoji: '☀️', name: 'The Sun', meaning: '성공과 기쁨' },
  { id: 8, emoji: '⭐', name: 'The Star', meaning: '희망과 영감' },
  { id: 9, emoji: '🎭', name: 'The Lovers', meaning: '선택과 사랑' },
  { id: 10, emoji: '🔱', name: 'The Devil', meaning: '유혹과 집착' }
];

function CardSelection({ customer, visitId, onComplete }) {
  const [selectedCard, setSelectedCard] = useState(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const messageRef = useRef(null);

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handleSubmit = async () => {
    if (!selectedCard) {
      setMessage({ text: '카드를 선택해주세요.', type: 'error' });
      setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }

    if (review.length > 5000) {
      setMessage({ text: '리뷰는 5000자 이내로 작성해주세요.', type: 'error' });
      setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }

    setLoading(true);

    try {
      // 1. DB에 선택한 카드만 저장 (리뷰는 저장 안 함)
      const { error } = await supabase
        .from('visit_history')
        .update({
          selected_card: selectedCard.name
          // card_review는 저장하지 않음!
        })
        .eq('id', visitId);

      if (error) throw error;

      // 2. 리뷰는 로컬 스토리지에 저장
      if (review && review.trim()) {
        const reviewsKey = `tarot_reviews_${customer.phone_number}`;
        const savedReviews = localStorage.getItem(reviewsKey);
        const reviews = savedReviews ? JSON.parse(savedReviews) : {};
        
        reviews[visitId] = review.trim();
        localStorage.setItem(reviewsKey, JSON.stringify(reviews));
      }

      setMessage({ text: '✨ 카드가 저장되었습니다!', type: 'success' });
      setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ text: '저장 중 오류가 발생했습니다: ' + error.message, type: 'error' });
      setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (window.confirm('카드 선택을 취소하고 돌아가시겠습니까?')) {
      onComplete();
    }
  };

  return (
    <div className="card-selection">
      <div className="selection-header">
        <button className="btn-back" onClick={handleBack}>
          ← 돌아가기
        </button>
        <h1>🔮 타로 카드 선택</h1>
        <p className="subtitle">오늘의 방문을 기억할 카드를 선택하세요</p>
      </div>

      <div className="card-grid">
        {tarotCards.map((card) => (
          <div
            key={card.id}
            className={`tarot-card ${selectedCard?.id === card.id ? 'selected' : ''}`}
            onClick={() => handleCardSelect(card)}
          >
            <div className="card-emoji">{card.emoji}</div>
            <div className="card-name">{card.name}</div>
            <div className="card-meaning">{card.meaning}</div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div className="review-section">
          <h3>선택한 카드: {selectedCard.emoji} {selectedCard.name}</h3>
          <p className="card-description">{selectedCard.meaning}</p>
          
          <div className="input-group">
            <label>오늘의 기록 (선택, 최대 5000자)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="오늘의 방문은 어떠셨나요? (5000자 이내)"
              maxLength="5000"
              rows="10"
            />
            <div className="char-count">{review.length}/5000</div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '저장 중...' : '저장하기'}
          </button>
        </div>
      )}

      {message.text && (
        <div ref={messageRef} className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default CardSelection;