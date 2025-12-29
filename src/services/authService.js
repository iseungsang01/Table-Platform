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
      // 1. 모든 인증 관련 데이터 삭제 (확실하게)
      await Promise.all([
        storage.remove(CUSTOMER_KEY),
        storage.remove('remember_me'),
        storage.remove('saved_phone'), // 자동 로그인을 유발할 수 있는 번호도 일단 삭제 테스트
      ]);
      
      console.log('Logout: All storage cleared');
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