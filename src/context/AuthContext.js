import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * 인증 Context
 * 전역 인증 상태 관리
 */
export const AuthContext = createContext();

/**
 * 인증 Provider
 * 앱 전체에 인증 상태 제공
 */
export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시
   */
  useEffect(() => {
    console.log('========================================');
    console.log('🚀 [AuthContext] AuthProvider 마운트');
    console.log('========================================');
    
    // 앱 시작 시 초기 설정
    initializeAuth();
  }, []);

  /**
   * customer 변경 감지
   */
  useEffect(() => {
    console.log('🔄 [AuthContext] Customer 변경 감지:', customer ? {
      id: customer.id,
      nickname: customer.nickname,
      phone: customer.phone_number
    } : 'null');
  }, [customer]);

  /**
   * 초기 인증 상태 확인
   */
  const initializeAuth = async () => {
    console.log('🔍 [AuthContext] 초기 인증 상태 확인 중...');
    
    try {
      const storedCustomer = await authService.getStoredCustomer();
      
      if (storedCustomer) {
        console.log('✅ [AuthContext] 저장된 고객 정보 발견:', storedCustomer.nickname);
        setCustomer(storedCustomer);
      } else {
        console.log('ℹ️ [AuthContext] 저장된 고객 정보 없음 (로그인 필요)');
      }
    } catch (error) {
      console.error('❌ [AuthContext] 초기화 오류:', error);
    } finally {
      setLoading(false);
      console.log('✅ [AuthContext] 초기화 완료');
    }
  };

  /**
   * 로그인
   * @param {string} phoneNumber - 전화번호
   * @param {string} password - 비밀번호
   * @returns {object} { success, message?, customer? }
   */
  const login = async (phoneNumber, password) => {
    console.log('========================================');
    console.log('🔐 [AuthContext] 로그인 시도');
    console.log('========================================');
    console.log('📞 [AuthContext] 전화번호:', phoneNumber);
    console.log('🔑 [AuthContext] 비밀번호:', password ? '입력됨' : '입력 안됨');
    
    const result = await authService.login(phoneNumber, password);
    
    if (result.success) {
      console.log('✅ [AuthContext] 로그인 성공');
      console.log('👤 [AuthContext] 고객 정보:', {
        id: result.customer.id,
        nickname: result.customer.nickname,
        phone: result.customer.phone_number
      });
      
      setCustomer(result.customer);
      
      console.log('✅ [AuthContext] Context에 고객 정보 저장 완료');
    } else {
      console.log('❌ [AuthContext] 로그인 실패:', result.message);
    }
    
    console.log('========================================');
    
    return result;
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      console.log('========================================');
      console.log('🚪 [AuthContext] 로그아웃 시작');
      console.log('========================================');
      
      await authService.logout();
      setCustomer(null);
      
      console.log('✅ [AuthContext] 로그아웃 완료');
      console.log('========================================');
    } catch (error) {
      console.error('========================================');
      console.error('❌ [AuthContext] 로그아웃 오류:', error);
      console.error('========================================');
    }
  };

  /**
   * 고객 정보 새로고침
   */
  const refreshCustomer = async () => {
    if (!customer) {
      console.log('⚠️ [AuthContext] refreshCustomer: customer 없음');
      return;
    }
    
    try {
      console.log('========================================');
      console.log('🔄 [AuthContext] 고객 정보 새로고침 시작');
      console.log('========================================');
      console.log('👤 [AuthContext] Customer ID:', customer.id);
      
      const refreshed = await authService.refreshCustomer(customer.id);
      
      if (refreshed) {
        console.log('✅ [AuthContext] 정보 갱신 성공:', {
          nickname: refreshed.nickname,
          current_stamps: refreshed.current_stamps,
          visit_count: refreshed.visit_count
        });
        
        setCustomer(refreshed);
      } else {
        console.log('❌ [AuthContext] 정보 갱신 실패');
      }
      
      console.log('========================================');
    } catch (error) {
      console.error('========================================');
      console.error('❌ [AuthContext] 정보 갱신 오류:', error);
      console.error('========================================');
    }
  };

  const value = {
    customer,          // 현재 로그인한 고객 정보
    loading,           // 초기 로딩 상태
    login,             // 로그인 함수
    logout,            // 로그아웃 함수
    refreshCustomer,   // 고객 정보 새로고침 함수
  };

  // 🔍 렌더링 로깅
  console.log('🎨 [AuthContext] 렌더링:', {
    loading,
    customer: customer ? customer.nickname : 'null'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};