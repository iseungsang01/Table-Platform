import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LoginScreen from './components/LoginScreen';
import CardSelection from './components/CardSelection';
import History from './components/History';
import Notice from './components/Notice';
import CouponView from './components/CouponView';
import Vote from './components/Vote';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('login'); // login, select, history, notice, coupon, vote
  const [customer, setCustomer] = useState(null);
  const [currentVisitId, setCurrentVisitId] = useState(null);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0);

  useEffect(() => {
    // 로컬 스토리지에서 고객 정보 확인
    const savedCustomer = localStorage.getItem('tarot_customer');
    
    if (savedCustomer) {
      const customerData = JSON.parse(savedCustomer);
      setCustomer(customerData);
      setCurrentView('history');
      // 등록된 회원만 최신 고객 정보 로드
      if (!customerData.is_guest && customerData.id) {
        refreshCustomerData(customerData.id);
      }
    }
  }, []);

  // 고객 정보가 변경될 때마다 안 읽은 공지사항 개수 확인 (등록된 회원만)
  useEffect(() => {
    if (customer && !customer.is_guest && customer.id) {
      checkUnreadNotices();
    }
  }, [customer]);

  const refreshCustomerData = async (customerId) => {
    if (!customerId) return; // 미등록 회원인 경우 스킵
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      
      if (data) {
        setCustomer(data);
        localStorage.setItem('tarot_customer', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Refresh customer data error:', error);
    }
  };

  const checkUnreadNotices = async () => {
    if (!customer || customer.is_guest || !customer.id) return;
    
    try {
      // 전체 공지사항 개수
      const { count: totalCount, error: totalError } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (totalError) throw totalError;

      // 읽은 공지사항 개수
      const { count: readCount, error: readError } = await supabase
        .from('notice_reads')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id);

      if (readError) throw readError;

      setUnreadNoticeCount((totalCount || 0) - (readCount || 0));
    } catch (error) {
      console.error('Check unread notices error:', error);
    }
  };

  const handleLogin = (customerData) => {
    setCustomer(customerData);
    localStorage.setItem('tarot_customer', JSON.stringify(customerData));
    setCurrentView('history');
  };

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem('tarot_customer');
    setCurrentView('login');
  };

  const handleStartSelection = (visitId) => {
    setCurrentVisitId(visitId);
    setCurrentView('select');
  };

  const handleCompleteSelection = () => {
    setCurrentVisitId(null);
    if (customer && !customer.is_guest && customer.id) {
      refreshCustomerData(customer.id);
    }
    setCurrentView('history');
  };

  const handleShowNotice = () => {
    setCurrentView('notice');
  };

  const handleShowCoupon = () => {
    setCurrentView('coupon');
  };

  const handleShowVote = () => {
    setCurrentView('vote');
  };

  const handleBackToHistory = () => {
    if (customer && !customer.is_guest && customer.id) {
      refreshCustomerData(customer.id);
    }
    setCurrentView('history');
  };

  const handleCouponUsed = () => {
    if (customer && !customer.is_guest && customer.id) {
      refreshCustomerData(customer.id);
    }
  };

  const handleNoticeRead = () => {
    // 공지사항을 읽은 후 안 읽은 개수 업데이트 (등록된 회원만)
    if (customer && !customer.is_guest && customer.id) {
      checkUnreadNotices();
    }
  };

  return (
    <div className="App">
      {currentView === 'login' && (
        <LoginScreen onLogin={handleLogin} />
      )}
      
      {currentView === 'select' && (
        <CardSelection 
          customer={customer}
          visitId={currentVisitId}
          onComplete={handleCompleteSelection}
        />
      )}
      
      {currentView === 'history' && customer && (
        <>
          <History 
            customer={customer}
            onLogout={handleLogout}
            onStartSelection={handleStartSelection}
            onShowCoupon={handleShowCoupon}
          />
          <div className="bottom-nav">
            <button className="nav-btn active" onClick={handleBackToHistory}>
              <div className="nav-icon">🏠</div>
              <div className="nav-label">홈</div>
            </button>
            <button className="nav-btn" onClick={handleShowCoupon}>
              <div className="nav-icon">🎟️</div>
              <div className="nav-label">쿠폰</div>
            </button>
            <button className="nav-btn" onClick={handleShowVote}>
              <div className="nav-icon">🗳️</div>
              <div className="nav-label">투표</div>
            </button>
            <button className="nav-btn" onClick={handleShowNotice}>
              <div className="nav-icon">
                📢
                {!customer.is_guest && customer.id && unreadNoticeCount > 0 && (
                  <span className="notification-badge">{unreadNoticeCount}</span>
                )}
              </div>
              <div className="nav-label">공지</div>
            </button>
          </div>
        </>
      )}

      {currentView === 'coupon' && customer && (
        <>
          <CouponView 
            customer={customer}
            onBack={handleBackToHistory}
            onCouponUsed={handleCouponUsed}
          />
          <div className="bottom-nav">
            <button className="nav-btn" onClick={handleBackToHistory}>
              <div className="nav-icon">🏠</div>
              <div className="nav-label">홈</div>
            </button>
            <button className="nav-btn active">
              <div className="nav-icon">🎟️</div>
              <div className="nav-label">쿠폰</div>
            </button>
            <button className="nav-btn" onClick={handleShowVote}>
              <div className="nav-icon">🗳️</div>
              <div className="nav-label">투표</div>
            </button>
            <button className="nav-btn" onClick={handleShowNotice}>
              <div className="nav-icon">
                📢
                {!customer.is_guest && customer.id && unreadNoticeCount > 0 && (
                  <span className="notification-badge">{unreadNoticeCount}</span>
                )}
              </div>
              <div className="nav-label">공지</div>
            </button>
          </div>
        </>
      )}

      {currentView === 'vote' && customer && (
        <>
          <Vote 
            customer={customer}
            onBack={handleBackToHistory}
          />
          <div className="bottom-nav">
            <button className="nav-btn" onClick={handleBackToHistory}>
              <div className="nav-icon">🏠</div>
              <div className="nav-label">홈</div>
            </button>
            <button className="nav-btn" onClick={handleShowCoupon}>
              <div className="nav-icon">🎟️</div>
              <div className="nav-label">쿠폰</div>
            </button>
            <button className="nav-btn active">
              <div className="nav-icon">🗳️</div>
              <div className="nav-label">투표</div>
            </button>
            <button className="nav-btn" onClick={handleShowNotice}>
              <div className="nav-icon">
                📢
                {!customer.is_guest && customer.id && unreadNoticeCount > 0 && (
                  <span className="notification-badge">{unreadNoticeCount}</span>
                )}
              </div>
              <div className="nav-label">공지</div>
            </button>
          </div>
        </>
      )}

      {currentView === 'notice' && customer && (
        <>
          <Notice 
            customer={customer}
            onBack={handleBackToHistory}
            onNoticeRead={handleNoticeRead}
          />
          <div className="bottom-nav">
            <button className="nav-btn" onClick={handleBackToHistory}>
              <div className="nav-icon">🏠</div>
              <div className="nav-label">홈</div>
            </button>
            <button className="nav-btn" onClick={handleShowCoupon}>
              <div className="nav-icon">🎟️</div>
              <div className="nav-label">쿠폰</div>
            </button>
            <button className="nav-btn" onClick={handleShowVote}>
              <div className="nav-icon">🗳️</div>
              <div className="nav-label">투표</div>
            </button>
            <button className="nav-btn active">
              <div className="nav-icon">📢</div>
              <div className="nav-label">공지</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;