import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { handleApiCall, logError } from '../utils/errorHandler';

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
      logError('AuthContext.initializeAuth', error);
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
    
    try {
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
    } catch (error) {
      console.error('========================================');
      console.error('❌ [AuthContext] 로그인 예외:', error);
      console.error('========================================');
      
      logError('AuthContext.login', error, { phoneNumber });
      
      return { 
        success: false, 
        message: '로그인 중 오류가 발생했습니다.' 
      };
    }
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
      
      logError('AuthContext.logout', error);
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
      
      logError('AuthContext.refreshCustomer', error, { customerId: customer?.id });
    }
  };

  const value = {
    customer,
    loading,
    login,
    logout,
    refreshCustomer,
  };

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