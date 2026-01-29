import { useQuery } from '@tanstack/react-query';
import { couponService } from '../services/couponService';

export const useCouponCount = (customerId) => {
    return useQuery({
        queryKey: ['couponCount', customerId],
        queryFn: async () => {
            if (!customerId) return 0;
            const { count, error } = await couponService.getValidCouponCount(customerId);
            if (error) throw error;
            return count;
        },
        enabled: !!customerId,
        initialData: 0,
    });
};
