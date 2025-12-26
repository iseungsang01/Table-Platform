import { useState, useEffect } from 'react';
import { customerService } from '../services/customerService';
import { useAuth } from './useAuth';

/**
 * 고객 정보 관리 Hook
 * 고객 데이터 조회 및 업데이트
 * 
 * @returns {object} { customer, loading, error, updateCustomer, refreshCustomer }
 * 
 * @example
 * const { customer, loading, updateCustomer } = useCustomer();
 * 
 * // 고객 정보 수정
 * await updateCustomer({ nickname: '새 닉네임' });
 * 
 * // 고객 정보 새로고침
 * await refreshCustomer();
 */
export const useCustomer = () => {
  const { customer: authCustomer, refreshCustomer: authRefresh } = useAuth();
  const [customer, setCustomer] = useState(authCustomer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCustomer(authCustomer);
  }, [authCustomer]);

  /**
   * 고객 정보 업데이트
   * @param {object} updates - 수정할 필드들
   */
  const updateCustomer = async (updates) => {
    if (!customer) return { success: false, message: '로그인이 필요합니다.' };

    setLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await customerService.updateCustomer(
        customer.id,
        updates
      );

      if (updateError) throw updateError;

      setCustomer(data);
      await authRefresh(); // Auth Context도 업데이트

      setLoading(false);
      return { success: true, data };
    } catch (err) {
      console.error('Update customer error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  /**
   * 고객 정보 새로고침
   */
  const refreshCustomer = async () => {
    if (!customer) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await customerService.getCustomer(customer.id);

      if (fetchError) throw fetchError;

      setCustomer(data);
      await authRefresh(); // Auth Context도 업데이트

      setLoading(false);
    } catch (err) {
      console.error('Refresh customer error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return {
    customer,
    loading,
    error,
    updateCustomer,
    refreshCustomer,
  };
};