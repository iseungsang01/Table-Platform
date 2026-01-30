import { useState, useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { voteService } from '../services/voteService';
import { handleApiCall } from '../utils/errorHandler';

export const useVoteLogic = () => {
    const { customer } = useAuth();

    // State
    const [votes, setVotes] = useState([]);
    const [selectedVote, setSelectedVote] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [myVote, setMyVote] = useState(null);
    const [voteResults, setVoteResults] = useState({});
    const [participantCount, setParticipantCount] = useState(0);

    // UI State
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Load list of votes
    const loadVotes = useCallback(async () => {
        const { data, error } = await handleApiCall('VoteScreen.loadVotes', () => voteService.getVotes());
        if (!error && data) setVotes(data);
        setLoading(false);
    }, []);

    // Initial load
    useFocusEffect(useCallback(() => { loadVotes(); }, [loadVotes]));

    // Load specific vote data
    const loadVoteData = useCallback(async (vId) => {
        try {
            const [myVoteRes, resRes, countRes] = await Promise.all([
                handleApiCall('VoteScreen.loadMyVote', () => voteService.getMyVote(vId, customer.id), { showAlert: false }),
                handleApiCall('VoteScreen.loadVoteResults', () => voteService.getVoteResults(vId), { showAlert: false }),
                handleApiCall('VoteScreen.loadCount', () => voteService.getVoteParticipants(vId), { showAlert: false })
            ]);

            setMyVote(myVoteRes.data);

            const finalResults = resRes.data?.results || {};
            setVoteResults(finalResults);
            setParticipantCount(countRes.data?.count || 0);
            setSelectedOptions(myVoteRes.data?.selected_options || []);
            setShowResults(!!myVoteRes.data);
        } catch (e) {
            console.error(e);
        }
    }, [customer.id]);

    // Back Handler for returning to list
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedVote) {
                    setSelectedVote(null);
                    setIsEditMode(false);
                    return true;
                }
                return false;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [selectedVote])
    );

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadVotes();
        setRefreshing(false);
    };

    const onSelectVote = async (vote) => {
        setSelectedVote(vote);
        await loadVoteData(vote.id);
    };

    const handleOptionToggle = (optionId) => {
        if (!selectedVote.allow_multiple) {
            setSelectedOptions(prev => prev.includes(optionId) ? [] : [optionId]);
        } else {
            setSelectedOptions(prev =>
                prev.includes(optionId)
                    ? prev.filter(i => i !== optionId)
                    : [...prev, optionId]
            );
        }
    };

    const handleSubmitVote = async () => {
        if (submitting) return;

        // Validation
        if (selectedVote.allow_multiple && selectedVote.max_selections) {
            if (selectedOptions.length > selectedVote.max_selections) {
                Alert.alert('선택 초과', `최대 ${selectedVote.max_selections}개까지만 선택 가능합니다.`, [{ text: '확인' }]);
                return;
            }
        }

        // Cancel checks
        const isSingleCancel = !selectedVote.allow_multiple && selectedOptions.length === 0 && myVote;
        const isMultiCancel = selectedVote.allow_multiple && selectedOptions.length === 0 && myVote;

        if (isSingleCancel || isMultiCancel) {
            setSubmitting(true);
            const { error } = await handleApiCall(
                'VoteScreen.cancelVote',
                () => voteService.cancelVote(selectedVote.id, customer.id)
            );

            if (!error) {
                await loadVoteData(selectedVote.id);
                setIsEditMode(false);
                setShowResults(false);
            }
            setSubmitting(false);
            return;
        }

        // New vote Validation
        if (selectedOptions.length === 0 && !myVote) {
            Alert.alert('알림', '최소 1개 이상 선택해주세요.', [{ text: '확인' }]);
            return;
        }

        // Submit
        setSubmitting(true);
        const res = await handleApiCall(
            'VoteScreen.submitVote',
            () => voteService.submitVote(selectedVote.id, customer.id, selectedOptions, myVote?.id),
            { successMessage: isEditMode ? '투표가 수정되었습니다.' : '투표가 완료되었습니다.' }
        );

        if (res.data) {
            await loadVoteData(selectedVote.id);
            setIsEditMode(false);
            setShowResults(true);
        }
        setSubmitting(false);
    };

    // Helper logic for rendering
    const normalizeOptions = (opts) => {
        if (Array.isArray(opts)) return opts.map((t, i) => ({ id: i, text: typeof t === 'string' ? t : t.text || t }));
        if (opts) return Object.entries(opts).map(([k, v]) => ({ id: parseInt(k), text: v }));
        return [];
    };

    return {
        state: {
            votes,
            selectedVote,
            selectedOptions,
            myVote,
            voteResults,
            participantCount,
            loading,
            refreshing,
            submitting,
            showResults,
            isEditMode,
            customer, // exposing customer for guest check logic in UI
        },
        actions: {
            setSelectedVote,
            setIsEditMode,
            setShowResults,
            handleRefresh,
            onSelectVote,
            handleOptionToggle,
            handleSubmitVote
        },
        helpers: {
            normalizeOptions
        }
    };
};
