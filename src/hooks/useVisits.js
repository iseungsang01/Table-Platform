import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { storage } from '../utils/storage';

const VISITS_KEY = ['visits'];

export const useVisits = (customerId) => {
    const queryClient = useQueryClient();

    // 1. 읽기 (Read)
    const query = useQuery({
        queryKey: [...VISITS_KEY, customerId],
        queryFn: async () => {
            if (!customerId) return [];

            const { data, error } = await supabase
                .from('visit_history')
                .select('id, customer_id, visit_date')
                .eq('customer_id', customerId)
                .eq('is_deleted', false)
                .order('visit_date', { ascending: false });

            if (error) throw error;

            // 이미지 캐시와 병합 (UI 표시용)
            const allImages = await storage.getAllCardImages();
            const allReviews = await storage.getAllCardReviews();

            return data.map(visit => ({
                ...visit,
                card_image: allImages[visit.id] || null,
                card_review: allReviews[visit.id] || null,
            }));
        },
        enabled: !!customerId,
        staleTime: 1000 * 60 * 5, // 5분간 Fresh 유지
    });

    // 2. 삭제 (Mutation)
    const deleteMutation = useMutation({
        mutationFn: async (visitId) => {
            const { error } = await supabase
                .from('visit_history')
                .update({ is_deleted: true })
                .eq('id', visitId);

            if (error) throw error;

            // 로컬 데이터도 정리
            await storage.deleteCardImage(visitId);
            await storage.deleteCardReview(visitId);
            return visitId;
        },
        onSuccess: () => {
            // 목록 새로고침
            queryClient.invalidateQueries([...VISITS_KEY, customerId]);
        }
    });

    return {
        visits: query.data || [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        deleteVisit: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending
    };
};
