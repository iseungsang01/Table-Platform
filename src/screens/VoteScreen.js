import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { voteService } from '../services/voteService';
import { Colors } from '../constants/Colors';

const VoteScreen = () => {
  const { customer } = useAuth();
  const [votes, setVotes] = useState([]);
  const [selectedVote, setSelectedVote] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [voteResults, setVoteResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadVotes();
    }, [customer])
  );

  const loadVotes = async () => {
    const { data, error } = await voteService.getVotes();
    if (!error && data) {
      setVotes(data);
    }
    setLoading(false);
  };

  const loadMyVote = async (voteId) => {
    const { data, error } = await voteService.getMyVote(voteId, customer.id);
    setMyVote(data);

    if (data) {
      setSelectedOptions(data.selected_options || []);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const loadVoteResults = async (voteId) => {
    const { results } = await voteService.getVoteResults(voteId);
    setVoteResults(results);
  };

  const handleVoteSelect = async (vote) => {
    setSelectedVote(vote);
    setSelectedOptions([]);
    setShowResults(false);
    setIsEditMode(false);
    await loadMyVote(vote.id);
    await loadVoteResults(vote.id);
  };

  const handleBackToList = () => {
    setSelectedVote(null);
    setSelectedOptions([]);
    setMyVote(null);
    setShowResults(false);
    setIsEditMode(false);
  };

  const handleOptionToggle = (optionId) => {
    if (!selectedVote) return;

    const isMultiple = selectedVote.allow_multiple;
    const maxSelections = selectedVote.max_selections || 1;

    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
    } else {
      if (isMultiple) {
        if (selectedOptions.length < maxSelections) {
          setSelectedOptions([...selectedOptions, optionId]);
        } else {
          Alert.alert('알림', `최대 ${maxSelections}개까지만 선택 가능합니다.`);
        }
      } else {
        setSelectedOptions([optionId]);
      }
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVote) return;

    if (selectedOptions.length === 0) {
      Alert.alert('알림', '투표할 항목을 선택해주세요.');
      return;
    }

    setSubmitting(true);

    const { error } = await voteService.submitVote(
      selectedVote.id,
      customer.id,
      selectedOptions,
      myVote?.id
    );

    if (error) {
      Alert.alert('오류', '투표 중 오류가 발생했습니다.');
      setSubmitting(false);
      return;
    }

    Alert.alert('완료', myVote ? '✅ 투표가 수정되었습니다!' : '✅ 투표가 완료되었습니다!');

    await loadMyVote(selectedVote.id);
    await loadVoteResults(selectedVote.id);
    setShowResults(true);
    setIsEditMode(false);
    setSubmitting(false);
  };

  const handleEditVote = () => {
    setShowResults(false);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setShowResults(true);
    setIsEditMode(false);
    if (myVote) {
      setSelectedOptions(myVote.selected_options || []);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVotes();
    if (selectedVote) {
      await loadMyVote(selectedVote.id);
      await loadVoteResults(selectedVote.id);
    }
    setRefreshing(false);
  };

  const getTotalVotes = () => {
    return Object.values(voteResults).reduce((sum, count) => sum + count, 0);
  };

  const getOptionPercentage = (optionId) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round(((voteResults[optionId] || 0) / total) * 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '제한 없음';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderVoteList = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>🗳️ 투표</Text>
        <Text style={styles.subtitle}>고객님의 소중한 의견을 들려주세요</Text>
      </View>

      {votes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗳️</Text>
          <Text style={styles.emptyTitle}>진행 중인 투표가 없습니다</Text>
        </View>
      ) : (
        votes.map((vote) => (
          <TouchableOpacity
            key={vote.id}
            style={styles.voteCard}
            onPress={() => handleVoteSelect(vote)}
            activeOpacity={0.7}
          >
            <View style={styles.voteCardHeader}>
              <View style={styles.voteBadges}>
                <Text style={styles.voteBadge}>
                  {vote.allow_multiple ? `복수선택 (최대 ${vote.max_selections}개)` : '단일선택'}
                </Text>
                {vote.is_anonymous && <Text style={styles.voteBadgeAnonymous}>익명투표</Text>}
              </View>
            </View>

            <Text style={styles.voteTitle}>{vote.title}</Text>

            {vote.description && (
              <Text style={styles.voteDescription}>{vote.description}</Text>
            )}

            <View style={styles.voteFooter}>
              <Text style={styles.voteDate}>📅 마감: {formatDate(vote.ends_at)}</Text>
              <Text style={styles.voteOptionsCount}>{vote.options?.length || 0}개 항목</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderVoteDetail = () => {
    if (!selectedVote) return null;

    const options = selectedVote.options || [];
    const totalVotes = getTotalVotes();
    const hasVoted = myVote !== null;

    return (
      <View>
        <CustomButton
          title="← 목록으로"
          onPress={handleBackToList}
          variant="secondary"
          style={styles.backButton}
        />

        <View style={styles.voteDetailCard}>
          <View style={styles.voteBadges}>
            <Text style={styles.voteBadge}>
              {selectedVote.allow_multiple
                ? `복수선택 (최대 ${selectedVote.max_selections}개)`
                : '단일선택'}
            </Text>
            {selectedVote.is_anonymous && (
              <Text style={styles.voteBadgeAnonymous}>익명투표</Text>
            )}
          </View>

          <Text style={styles.voteDetailTitle}>{selectedVote.title}</Text>

          {selectedVote.description && (
            <Text style={styles.voteDetailDescription}>{selectedVote.description}</Text>
          )}

          <View style={styles.voteStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>📅 마감일</Text>
              <Text style={styles.statValue}>{formatDate(selectedVote.ends_at)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>🗳️ 총 투표 수</Text>
              <Text style={styles.statValue}>{totalVotes}표</Text>
            </View>
          </View>
        </View>

        {hasVoted && showResults && !isEditMode && (
          <View style={styles.votedBadge}>
            <Text style={styles.votedBadgeText}>✓ 투표 완료</Text>
            <Text style={styles.votedBadgeSubtext}>
              투표 결과를 확인하거나 수정할 수 있습니다
            </Text>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <View style={styles.optionsHeader}>
            <Text style={styles.optionsTitle}>
              {showResults && !isEditMode ? '📊 투표 결과' : '🗳️ 투표하기'}
            </Text>
            {hasVoted && showResults && !isEditMode && (
              <TouchableOpacity style={styles.editButton} onPress={handleEditVote}>
                <Text style={styles.editButtonText}>✏️ 투표 수정</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* KEY PROP 수정: option.id 사용 */}
          {options.map((option) => {
            const votes = voteResults[option.id] || 0;
            const percentage = getOptionPercentage(option.id);
            const isMyChoice = myVote && myVote.selected_options?.includes(option.id);
            const isSelected = selectedOptions.includes(option.id);

            if (showResults && !isEditMode) {
              return (
                <View
                  key={`result-${option.id}`}
                  style={[styles.optionCard, isMyChoice && styles.optionCardMy]}
                >
                  <View style={[styles.optionProgress, { width: `${percentage}%` }]} />
                  <View style={styles.optionContent}>
                    <View style={styles.optionTextRow}>
                      <Text style={[styles.optionText, isMyChoice && styles.optionTextMy]}>
                        {isMyChoice && '✓ '}
                        {option.text}
                      </Text>
                      <Text style={styles.optionPercentage}>{percentage}%</Text>
                    </View>
                    <Text style={styles.optionVotes}>{votes}표</Text>
                  </View>
                </View>
              );
            } else {
              return (
                <TouchableOpacity
                  key={`vote-${option.id}`}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleOptionToggle(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionRow}>
                    <View
                      style={[
                        styles.optionCheckbox,
                        selectedVote.allow_multiple && styles.optionCheckboxSquare,
                        isSelected && styles.optionCheckboxSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.optionCheckmark}>✓</Text>}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          })}

          {!showResults || isEditMode ? (
            <View style={styles.submitRow}>
              <CustomButton
                title={submitting ? '처리 중...' : hasVoted && isEditMode ? '✏️ 투표 수정 완료' : '✓ 투표하기'}
                onPress={handleSubmitVote}
                disabled={submitting || selectedOptions.length === 0}
                loading={submitting}
                style={styles.submitButton}
              />
              {hasVoted && isEditMode && (
                <CustomButton
                  title="취소"
                  onPress={handleCancelEdit}
                  disabled={submitting}
                  variant="secondary"
                  style={styles.cancelButton}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (selectedVote ? renderVoteDetail() : renderVoteList())}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
  },
  backButton: {
    marginBottom: 20,
  },
  voteCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  voteCardHeader: {
    marginBottom: 10,
  },
  voteBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 15,
  },
  voteBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    color: Colors.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: '600',
  },
  voteBadgeAnonymous: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    color: Colors.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    fontSize: 13,
    fontWeight: '600',
  },
  voteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 8,
  },
  voteDescription: {
    fontSize: 14,
    color: Colors.lavender,
    marginBottom: 12,
    lineHeight: 20,
  },
  voteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  voteDate: {
    fontSize: 13,
    color: Colors.lavender,
    opacity: 0.8,
  },
  voteOptionsCount: {
    fontSize: 12,
    color: Colors.lavender,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  voteDetailCard: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.gold,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
  },
  voteDetailTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 15,
    textAlign: 'center',
  },
  voteDetailDescription: {
    fontSize: 16,
    color: Colors.lavender,
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  voteStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: Colors.lavender,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  votedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  votedBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.green,
  },
  votedBadgeSubtext: {
    fontSize: 14,
    color: Colors.lavender,
    marginTop: 5,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
  },
  editButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  optionCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  optionCardMy: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  optionProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 43, 226, 0.4)',
    borderRadius: 12,
  },
  optionContent: {
    position: 'relative',
    zIndex: 1,
  },
  optionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  optionTextMy: {
    color: Colors.gold,
  },
  optionTextSelected: {
    color: Colors.gold,
  },
  optionPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  optionVotes: {
    fontSize: 14,
    color: Colors.lavender,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCheckboxSquare: {
    borderRadius: 6,
  },
  optionCheckboxSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  optionCheckmark: {
    color: Colors.purpleDark,
    fontSize: 14,
    fontWeight: '700',
  },
  submitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
  },
});

export default VoteScreen;