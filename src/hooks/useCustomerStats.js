import { useQuery } from '@tanstack/react-query';
import { visitService } from '../services/visitService';

export const useCustomerStats = (customerId) => {
  return useQuery({
    queryKey: ['customerStats', customerId],
    queryFn: async () => {
      if (!customerId) return { current_stamps: 0, visit_count: 0 };
      const { data, error } = await visitService.getCustomerStats(customerId);
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
    initialData: { current_stamps: 0, visit_count: 0 },
  });
};
