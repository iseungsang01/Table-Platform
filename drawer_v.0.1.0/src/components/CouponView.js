import React, { useState, useEffect } from 'react';
import { supabase, AdminPassWord } from '../supabaseClient';

function CouponView({ customer, onBack, onCouponUsed }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showUseForm, setShowUseForm] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, [customer.id]);

  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupon_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Load coupons error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCouponType = (couponCode) => {
    if (couponCode.startsWith('COUPON') || couponCode.startsWith('STAMP')) return 'stamp';
    if (couponCode.startsWith('BIRTHDAY') || couponCode.startsWith('BIRTH')) return 'birthday';
    return 'unknown';
  };

  const stampCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'stamp');
  const birthdayCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'birthday');

  const handleSelectCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowUseForm(true);
    setMessage({ text: '', type: '' });
    setPassword('');
    // 폼이 보이도록 스크롤
    setTimeout(() => {
      document.querySelector('.use-form-container')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleCancelUse = () => {
    setSelectedCoupon(null);
    setShowUseForm(false);
    setPassword('');
    setMessage({ text: '', type: '' });
  };

  const handleUseCoupon = async () => {
    if (!selectedCoupon) {
      setMessage({ text: '사용할 쿠폰을 선택해주세요.', type: 'error' });
      return;
    }

    if (password !== AdminPassWord) {
      setMessage({ text: '비밀번호가 올바르지 않습니다.', type: 'error' });
      return;
    }

    const couponType = getCouponType(selectedCoupon.coupon_code);
    const couponTypeName = couponType === 'birthday' ? '생일 쿠폰' : '스탬프 쿠폰';
    
    if (!window.confirm(`${couponTypeName}을 사용하시겠습니까?`)) {
      return;
    }

    setProcessing(true);

    try {
      const { error: deleteError } = await supabase
        .from('coupon_history')
        .delete()
        .eq('id', selectedCoupon.id);

      if (deleteError) throw deleteError;

      await loadCoupons();

      const { count: couponCount } = await supabase
        .from('coupon_history')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customer.id);

      const { error: updateError } = await supabase
        .from('customers')
        .update({ coupons: couponCount || 0 })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      setMessage({ text: `✅ ${couponTypeName}이 사용되었습니다!`, type: 'success' });
      setPassword('');
      setSelectedCoupon(null);
      setShowUseForm(false);
      
      if (onCouponUsed) {
        onCouponUsed();
      }

      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error) {
      console.error('Use coupon error:', error);
      setMessage({ text: '쿠폰 사용 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월${day}일`;
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const renderCouponCard = (coupon, type) => {
    const expired = isExpired(coupon.valid_until);
    const isStamp = type === 'stamp';
    const color = isStamp ? '#ffd700' : '#ffb6c1';
    const icon = isStamp ? '⭐' : '🎂';

    return (
      <div
        key={coupon.id}
        onClick={() => !expired && handleSelectCoupon(coupon)}
        style={{
          background: expired ? 'rgba(100, 100, 100, 0.3)' : 'rgba(138, 43, 226, 0.2)',
          border: `2px solid ${expired ? '#666' : color}`,
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '10px',
          opacity: expired ? 0.5 : 1,
          cursor: expired ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <div style={{ 
            fontSize: '32px',
            filter: expired ? 'grayscale(100%)' : 'none',
            lineHeight: '1'
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <div style={{ 
                color: expired ? '#999' : color,
                fontSize: '13px',
                fontWeight: '700'
              }}>
                {isStamp ? '⭐ 스탬프 쿠폰' : '🎂 생일 쿠폰'}
              </div>
              {expired && (
                <div style={{
                  background: '#ff4444',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  whiteSpace: 'nowrap'
                }}>
                  만료
                </div>
              )}
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              fontSize: '11px',
              color: '#e0b0ff'
            }}>
              <div>
                <div style={{ opacity: 0.7, marginBottom: '2px' }}>발급</div>
                <div style={{ fontWeight: '600' }}>
                  {formatDate(coupon.issued_at).replace(/\s/g, '')}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.7, marginBottom: '2px' }}>만료</div>
                <div style={{ 
                  fontWeight: '600',
                  color: coupon.valid_until 
                    ? (expired ? '#ff6b6b' : '#4caf50')
                    : '#4caf50'
                }}>
                  {coupon.valid_until 
                    ? formatDate(coupon.valid_until).replace(/\s/g, '')
                    : '무제한'}
                </div>
              </div>
            </div>

            {!expired && (
              <div style={{
                marginTop: '8px',
                padding: '6px',
                background: `${color}22`,
                borderRadius: '6px',
                textAlign: 'center',
                color: color,
                fontSize: '11px',
                fontWeight: '600'
              }}>
                👆 탭하여 사용
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="coupon-view" style={{ paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0033 0%, #2d004d 100%)',
        border: '2px solid #ffd700',
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '12px',
        boxShadow: '0 10px 30px rgba(255, 215, 0, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <button 
            className="btn-back" 
            onClick={onBack}
            style={{
              padding: '8px 15px',
              fontSize: '13px'
            }}
          >
            ← 돌아가기
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎟️</span>
            <div>
              <div style={{ 
                color: '#ffd700', 
                fontSize: '16px',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>
                내 쿠폰
              </div>
              <div style={{ 
                color: '#e0b0ff', 
                fontSize: '11px'
              }}>
                {customer.nickname}
              </div>
            </div>
          </div>
        </div>

        {/* 요약 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          <div style={{
            background: 'rgba(255, 215, 0, 0.15)',
            border: '2px solid #ffd700',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              color: '#ffd700',
              fontWeight: '700',
              marginBottom: '2px'
            }}>
              {coupons.length}
            </div>
            <div style={{ color: '#e0b0ff', fontSize: '11px' }}>
              전체
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid #ffd700',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              color: '#ffd700',
              fontWeight: '700',
              marginBottom: '2px'
            }}>
              {stampCoupons.length}
            </div>
            <div style={{ color: '#e0b0ff', fontSize: '11px' }}>
              ⭐ 스탬프
            </div>
          </div>
          <div style={{
            background: 'rgba(255, 182, 193, 0.1)',
            border: '1px solid #ffb6c1',
            borderRadius: '8px',
            padding: '10px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '20px',
              color: '#ffb6c1',
              fontWeight: '700',
              marginBottom: '2px'
            }}>
              {birthdayCoupons.length}
            </div>
            <div style={{ color: '#e0b0ff', fontSize: '11px' }}>
              🎂 생일
            </div>
          </div>
        </div>
      </div>

      {/* 쿠폰 사용 폼 */}
      {showUseForm && selectedCoupon && (
        <div 
          className="use-form-container"
          style={{
            background: 'linear-gradient(135deg, #2d004d 0%, #1a0033 100%)',
            border: '2px solid #ffd700',
            borderRadius: '12px',
            padding: '15px',
            marginBottom: '12px',
            boxShadow: '0 10px 30px rgba(255, 215, 0, 0.3)',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              color: '#ffd700',
              fontSize: '15px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🔐</span>
              쿠폰 사용
            </h3>
            <button
              onClick={handleCancelUse}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            background: 'rgba(138, 43, 226, 0.3)',
            border: '1px solid #8a2be2',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ fontSize: '28px' }}>
              {getCouponType(selectedCoupon.coupon_code) === 'birthday' ? '🎂' : '⭐'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#e0b0ff',
                fontSize: '10px',
                marginBottom: '2px'
              }}>
                선택한 쿠폰
              </div>
              <div style={{
                color: '#ffd700',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'monospace'
              }}>
                {selectedCoupon.coupon_code}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              color: '#ffd700',
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '6px'
            }}>
              관리자 비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              disabled={processing}
              onKeyPress={(e) => e.key === 'Enter' && handleUseCoupon()}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: '2px solid #8a2be2',
                borderRadius: '8px',
                background: 'rgba(138, 43, 226, 0.1)',
                color: 'white',
                textAlign: 'center',
                fontWeight: '600'
              }}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '8px'
          }}>
            <button 
              onClick={handleUseCoupon}
              disabled={processing}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: '700',
                border: '2px solid #4caf50',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: 'white',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {processing ? '처리 중...' : '✓ 사용'}
            </button>
            <button 
              onClick={handleCancelUse}
              disabled={processing}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: '700',
                border: '2px solid #ff4444',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                color: 'white',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              ✕ 취소
            </button>
          </div>

          {message.text && (
            <div 
              className={`message ${message.type}`}
              style={{ 
                marginTop: '10px',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'center'
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      )}

      {/* 로딩 */}
      {loading ? (
        <div style={{ 
          textAlign: 'center',
          padding: '30px',
          fontSize: '14px',
          color: '#e0b0ff'
        }}>
          로딩 중...
        </div>
      ) : coupons.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #1a0033 0%, #2d004d 100%)',
          border: '2px solid #8a2be2',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '50px', marginBottom: '12px' }}>🎟️</div>
          <h3 style={{ 
            color: '#ffd700', 
            fontSize: '16px',
            marginBottom: '6px'
          }}>
            보유한 쿠폰이 없습니다
          </h3>
          <p style={{ 
            color: '#e0b0ff',
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
            스탬프 10개를 모아서<br />쿠폰을 받아보세요!
          </p>
        </div>
      ) : (
        <>
          {/* 스탬프 쿠폰 섹션 */}
          {stampCoupons.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                color: '#ffd700',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 4px'
              }}>
                <span style={{ fontSize: '16px' }}>⭐</span>
                스탬프 쿠폰 ({stampCoupons.length})
              </div>
              {stampCoupons.map(coupon => renderCouponCard(coupon, 'stamp'))}
            </div>
          )}

          {/* 생일 쿠폰 섹션 */}
          {birthdayCoupons.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                color: '#ffb6c1',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 4px'
              }}>
                <span style={{ fontSize: '16px' }}>🎂</span>
                생일 쿠폰 ({birthdayCoupons.length})
              </div>
              {birthdayCoupons.map(coupon => renderCouponCard(coupon, 'birthday'))}
            </div>
          )}

          {/* 안내 문구 */}
          <div style={{
            background: 'rgba(138, 43, 226, 0.15)',
            border: '1px solid #8a2be2',
            borderRadius: '10px',
            padding: '12px',
            marginTop: '15px'
          }}>
            <div style={{
              color: '#ffd700',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>💡</span>
              사용 안내
            </div>
            <div style={{
              color: '#e0b0ff',
              fontSize: '11px',
              lineHeight: '1.6'
            }}>
              • 쿠폰을 탭하면 사용 화면이 나타납니다<br />
              • 관리자에게 화면을 보여주세요<br />
              • 스탬프 쿠폰: 무제한 사용 가능<br />
              • 생일 쿠폰: 생일 전후 15일간 사용 가능
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CouponView;