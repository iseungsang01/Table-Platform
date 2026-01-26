import React, { useState } from 'react';
import { processVisit } from '../services/supabase';

const VisitForm = ({ onSuccess, onError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * 전화번호 포맷팅 (010-1234-5678)
   */
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  /**
   * 전화번호 유효성 검사
   */
  const validatePhoneNumber = (phone) => {
    return /^010-\d{4}-\d{4}$/.test(phone);
  };

  /**
   * 입력 핸들러
   */
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  /**
   * 제출 핸들러
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      onError('올바른 전화번호 형식이 아닙니다. (010-1234-5678)');
      return;
    }

    setLoading(true);

    try {
      const result = await processVisit(phoneNumber);

      if (result.success) {
        onSuccess(result.message);
        setPhoneNumber(''); // 입력 필드 초기화
      } else {
        onError(result.message);
      }
    } catch (error) {
      onError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="visit-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2 className="form-title">방문 체크인</h2>
          <p className="form-description">등록된 전화번호를 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="visit-form">
          <div className="input-group">
            <label htmlFor="phone" className="input-label">
              📱 전화번호
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              maxLength={13}
              disabled={loading}
              className="phone-input"
              autoComplete="tel"
            />
            <span className="input-hint">하이픈(-)을 포함한 형식으로 입력해주세요</span>
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className={`submit-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                처리 중...
              </>
            ) : (
              <>
                ✅ 체크인하기
              </>
            )}
          </button>
        </form>

        <div className="form-footer">
          <p className="info-text">
            💡 등록되지 않은 번호는 매장에 문의해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitForm;