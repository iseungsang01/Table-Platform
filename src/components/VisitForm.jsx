import React, { useState } from 'react';
import { findCustomerByPhone, confirmVisit } from '../services/supabase';

const VisitForm = ({ onSuccess, onError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 전화번호 입력, 2: 고객 정보 확인

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
   * 1단계: 고객 조회
   */
  const handleSearchCustomer = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!validatePhoneNumber(phoneNumber)) {
      onError('올바른 전화번호 형식이 아닙니다. (010-1234-5678)');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await findCustomerByPhone(phoneNumber);

      if (error) {
        onError('고객 조회 중 오류가 발생했습니다.');
        return;
      }

      if (!data) {
        onError('등록되지 않은 전화번호입니다.');
        return;
      }

      // 고객 정보 저장 및 2단계로 이동
      setCustomer(data);
      setStep(2);
    } catch (error) {
      onError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2단계: 방문 확인
   */
  const handleConfirmVisit = async () => {
    setLoading(true);

    try {
      const { success } = await confirmVisit(customer.id);

      if (success) {
        onSuccess(`${customer.nickname}님, 방문해주셔서 감사합니다! 🎉`);
        // 폼 초기화
        setPhoneNumber('');
        setCustomer(null);
        setStep(1);
      } else {
        onError('방문 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      onError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 취소 버튼 (1단계로 돌아가기)
   */
  const handleCancel = () => {
    setCustomer(null);
    setStep(1);
  };

  /**
   * 생일 포맷팅 (YYYY-MM-DD → YYYY년 MM월 DD일)
   */
  const formatBirthday = (birthday) => {
    if (!birthday) return '미등록';
    const date = new Date(birthday);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="visit-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2 className="form-title">방문 체크인</h2>
          <p className="form-description">
            {step === 1 ? '등록된 전화번호를 입력해주세요' : '고객 정보를 확인해주세요'}
          </p>
        </div>

        {/* 1단계: 전화번호 입력 */}
        {step === 1 && (
          <form onSubmit={handleSearchCustomer} className="visit-form">
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
                  조회 중...
                </>
              ) : (
                <>
                  🔍 고객 조회
                </>
              )}
            </button>
          </form>
        )}

        {/* 2단계: 고객 정보 확인 */}
        {step === 2 && customer && (
          <div className="customer-info">
            <div className="info-header">
              <h3 className="info-title">👤 고객 정보</h3>
            </div>

            <div className="info-content">
              <div className="info-row">
                <span className="info-label">닉네임</span>
                <span className="info-value highlight">{customer.nickname || '미등록'}</span>
              </div>

              <div className="info-row">
                <span className="info-label">생일</span>
                <span className="info-value">{formatBirthday(customer.birthday)}</span>
              </div>

              <div className="info-row">
                <span className="info-label">전화번호</span>
                <span className="info-value">{customer.phone_number}</span>
              </div>

              <div className="info-row">
                <span className="info-label">총 방문 횟수</span>
                <span className="info-value highlight">{customer.visit_count}회</span>
              </div>
            </div>

            <div className="action-buttons">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="cancel-button"
              >
                ❌ 취소
              </button>

              <button
                onClick={handleConfirmVisit}
                disabled={loading}
                className={`confirm-button ${loading ? 'loading' : ''}`}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    처리 중...
                  </>
                ) : (
                  <>
                    ✅ 방문 확인
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="form-footer">
            <p className="info-text">💡 등록되지 않은 번호는 매장에 문의해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitForm;