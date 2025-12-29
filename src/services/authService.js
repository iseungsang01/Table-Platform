import { supabase } from './supabase';
import { storage } from '../utils/storage';

const CUSTOMER_KEY = 'tarot_customer';

export const authService = {
  async login(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: '등록되지 않은 전화번호입니다. 매장에 문의해주세요.',
        };
      }

      await storage.save(CUSTOMER_KEY, data);

      return { success: true, customer: data };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '로그인 중 오류가 발생했습니다.',
      };
    }
  },

  async logout() {
    try {
      // 1. 현재 고객 정보 삭제
      await storage.remove(CUSTOMER_KEY);
      
      // 2. 만약 자동 로그인이 의도치 않게 발생한다면 아래 세션 정보도 선택적으로 삭제
      // await storage.remove('remember_me'); // 완전히 깨끗한 상태를 원하면 주석 해제
      
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Logout storage error:', error);
    }
  },

  async getStoredCustomer() {
    return await storage.get(CUSTOMER_KEY);
  },

  async refreshCustomer(customerId) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;

      if (data) {
        await storage.save(CUSTOMER_KEY, data);
      }

      return data;
    } catch (error) {
      console.error('Refresh customer error:', error);
      return null;
    }
  },
};