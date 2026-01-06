import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CustomButton } from '../components'; 
import { useAuth } from '../hooks/useAuth';
import { voteService } from '../services/voteService';
import { Colors } from '../constants/Colors';
import { 
  handleApiCall, 
  createValidationError,
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';

const formatDate = (s) => s ? new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '제한 없음';
const normalizeOptions = (opts) => Array.isArray(opts) ? opts.map((t, i) => ({ id: i, text: typeof t === 'string' ? t : t.text || t })) : (opts ? Object.entries(opts).map(([k, v]) => ({ id: parseInt(k), text: v })) : []);

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

  const loadVotes = async () => {
    console.log('🗳️ [VoteScreen] 투표 목록 로드');
    
    const { data, error } = await handleApiCall(
      'VoteScreen.loadVotes',
      () => voteService.getVotes(),
      {
        showAlert: true,
      }
    );
    
    if (!error && data) {
      console.log('✅ [VoteScreen] 투표 로드 성공:', data.length, '개');
      setVotes(data);
    }
    
    setLoading(false);
  };

  const loadVoteData = async (vId) => {
    console.log('🗳️ [VoteScreen] 투표 데이터 로드:', vId);
    
    const [myVoteResult, resultsResult] = await Promise.all([
      handleApiCall(
        'VoteScreen.loadMyVote',
        () => voteService.getMyVote(vId, customer.id),
        { showAlert: false }
      ),
      handleApiCall(
        'VoteScreen.loadVoteResults',
        () => voteService.getVoteResults(vId),
        { showAlert: false }
      )
    ]);

    const myVoteData = myVoteResult.data;
    const resultsData = resultsResult.data?.results || {};

    console.log('✅ [VoteScreen] 투표 데이터 로드 완료');
    console.log('  - 내 투표:', myVoteData ? '있음' : '없음');
    console.log('  - 결과:', Object.keys(resultsData).length, '개 옵션');

    setMyVote(myVoteData);
    setVoteResults(resultsData);
    setSelectedOptions(myVoteData?.selected_options || []);
    setShowResults(!!myVoteData);
  };

  useFocusEffect(useCallback(() => { 
    console.log('👀 [VoteScreen] 화면 포커스');
    loadVotes(); 
  }, [customer]));

  const handleBackToList = () => { 
    console.log('⬅️ [VoteScreen] 목록으로 돌아가기');
    setSelectedVote(null); 
    setSelectedOptions([]); 
    setMyVote(null); 
    setShowResults(false); 
    setIsEditMode(false); 
  };

  const handleOptionToggle = (id) => {
    if (selectedOptions.includes(id)) {
      console.log('➖ [VoteScreen] 옵션 선택 해제:', id);
      return setSelectedOptions(selectedOptions.filter(i => i !== id));
    }
    
    if (!selectedVote.allow_multiple) {
      console.log('✅ [VoteScreen] 단일 선택:', id);
      return setSelectedOptions([id]);
    }
    
    if (selectedOptions.length < (selectedVote.max_selections || 1)) {
      console.log('✅ [VoteScreen] 복수 선택 추가:', id);
      setSelectedOptions([...selectedOptions, id]);
    } else {
      console.log('⚠️ [VoteScreen] 최대 선택 개수 초과');
      Alert.alert('알림', `최대 ${selectedVote.max_selections}개까지 선택 가능합니다.`);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOptions.length) {
      console.log('❌ [VoteScreen] 선택된 옵션 없음');
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '항목을 선택해주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    console.log('🗳️ [VoteScreen] 투표 제출:', {
      voteId: selectedVote.id,
      options: selectedOptions,
      isEdit: !!myVote
    });
    
    setSubmitting(true);
    
    const { error } = await handleApiCall(
      'VoteScreen.handleSubmitVote',
      () => voteService.submitVote(selectedVote.id, customer.id, selectedOptions, myVote?.id),
      {
        showAlert: true,
        additionalInfo: {
          voteId: selectedVote.id,
          optionCount: selectedOptions.length,
        },
      }
    );
    
    if (!error) {
      console.log('✅ [VoteScreen] 투표 제출 성공');
      showSuccessAlert('VOTE', Alert, myVote ? '✅ 수정되었습니다!' : '✅ 완료되었습니다!');
      await loadVoteData(selectedVote.id);
      setIsEditMode(false);
    }
    
    setSubmitting(false);
  };

  const Badge = ({ v }) => (
    <View style={styles.voteBadges}>
      <Text style={styles.voteBadge}>{v.allow_multiple ? `복수(최대 ${v.max_selections}개)` : '단일선택'}</Text>
      {v.is_anonymous && <Text style={styles.voteBadgeAnonymous}>익명</Text>}
    </View>
  );

  const renderContent = () => {
    if (!selectedVote) return (
      <View>
        <View style={styles.header}><Text style={styles.title}>🗳️ 투표</Text><Text style={styles.subtitle}>의견을 들려주세요</Text></View>
        {votes.length === 0 ? <View style={styles.emptyContainer}><Text style={styles.emptyIcon}>🗳️</Text><Text style={styles.emptyTitle}>진행 중인 투표가 없습니다</Text></View> : 
          votes.map(v => (
            <TouchableOpacity key={v.id} style={styles.voteCard} onPress={async () => { setSelectedVote(v); await loadVoteData(v.id); }}>
              <Badge v={v} /><Text style={styles.voteTitle}>{v.title}</Text>
              <View style={styles.voteFooter}><Text style={styles.voteDate}>📅 마감: {formatDate(v.ends_at)}</Text></View>
            </TouchableOpacity>
          ))
        }
      </View>
    );

    const options = normalizeOptions(selectedVote.options);
    const total = Object.values(voteResults).reduce((a, b) => a + b, 0);
    const isResultView = showResults && !isEditMode;

    return (
      <View>
        <CustomButton title="← 목록으로" onPress={handleBackToList} variant="secondary" style={styles.backButton} />
        <View style={styles.voteDetailCard}>
          <Badge v={selectedVote} /><Text style={styles.voteDetailTitle}>{selectedVote.title}</Text>
          <View style={styles.voteStats}>
            <View style={styles.statBox}><Text style={styles.statLabel}>📅 마감</Text><Text style={styles.statValue}>{formatDate(selectedVote.ends_at)}</Text></View>
            <View style={styles.statBox}><Text style={styles.statLabel}>🗳️ 총 투표</Text><Text style={styles.statValue}>{total}표</Text></View>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.optionsHeader}>
            <Text style={styles.optionsTitle}>{isResultView ? '📊 결과' : '🗳️ 투표하기'}</Text>
            {isResultView && <TouchableOpacity style={styles.editButton} onPress={() => { setShowResults(false); setIsEditMode(true); }}><Text style={styles.editButtonText}>✏️ 수정</Text></TouchableOpacity>}
          </View>
          {options.map(opt => {
            const count = voteResults[opt.id] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            const isMy = myVote?.selected_options?.includes(opt.id);
            const isSel = selectedOptions.includes(opt.id);

            return isResultView ? (
              <View key={opt.id} style={[styles.optionCard, isMy && styles.optionCardMy]}>
                <View style={[styles.optionProgress, { width: `${pct}%` }]} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, isMy && styles.optionTextMy]}>{isMy && '✓ '}{opt.text} ({pct}%)</Text>
                  <Text style={styles.optionVotes}>{count}표</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity key={opt.id} style={[styles.optionCard, isSel && styles.optionCardSelected]} onPress={() => handleOptionToggle(opt.id)}>
                <View style={styles.optionRow}>
                  <View style={[styles.optionCheckbox, selectedVote.allow_multiple && styles.optionCheckboxSquare, isSel && styles.optionCheckboxSelected]}>{isSel && <Text style={styles.optionCheckmark}>✓</Text>}</View>
                  <Text style={[styles.optionText, isSel && styles.optionTextSelected]}>{opt.text}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {(!showResults || isEditMode) && (
            <View style={styles.submitRow}>
              <CustomButton title={submitting ? '...' : '✓ 투표하기'} onPress={handleSubmitVote} disabled={submitting || !selectedOptions.length} loading={submitting} style={{flex:1}} />
              {isEditMode && <CustomButton title="취소" onPress={() => { setShowResults(true); setIsEditMode(false); setSelectedOptions(myVote?.selected_options || []); }} variant="secondary" style={{flex:1}} />}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner message="투표 로딩 중..." />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <FlatList data={[{id:1}]} renderItem={renderContent} contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadVotes(); if (selectedVote) await loadVoteData(selectedVote.id); setRefreshing(false); }} tintColor={Colors.gold} />}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 140 },
  header: { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 30, marginBottom: 20, borderWidth: 3, borderColor: Colors.gold, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: Colors.gold, marginBottom: 10 },
  subtitle: { fontSize: 16, color: Colors.lavender },
  backButton: { marginBottom: 20 },
  voteCard: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderWidth: 3, borderColor: Colors.purpleLight, borderRadius: 15, padding: 20, marginBottom: 15 },
  voteBadges: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  voteBadge: { backgroundColor: 'rgba(138, 43, 226, 0.3)', color: Colors.gold, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, fontSize: 13, fontWeight: '600' },
  voteBadgeAnonymous: { backgroundColor: 'rgba(76, 175, 80, 0.3)', color: Colors.green, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, fontSize: 13, fontWeight: '600' },
  voteTitle: { fontSize: 20, fontWeight: '700', color: Colors.gold, marginBottom: 8 },
  voteFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  voteDate: { fontSize: 13, color: Colors.lavender, opacity: 0.8 },
  voteDetailCard: { backgroundColor: Colors.purpleMid, borderWidth: 3, borderColor: Colors.gold, borderRadius: 20, padding: 30, marginBottom: 20 },
  voteDetailTitle: { fontSize: 26, fontWeight: '700', color: Colors.gold, marginBottom: 15, textAlign: 'center' },
  voteStats: { flexDirection: 'row', gap: 15 },
  statBox: { flex: 1, backgroundColor: 'rgba(138, 43, 226, 0.2)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 10, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 13, color: Colors.lavender, marginBottom: 5 },
  statValue: { fontSize: 15, fontWeight: '600', color: 'white' },
  optionsContainer: { marginBottom: 20 },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  optionsTitle: { fontSize: 24, fontWeight: '700', color: Colors.gold },
  editButton: { backgroundColor: 'rgba(138, 43, 226, 0.3)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  editButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
  optionCard: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 15, padding: 20, marginBottom: 15, position: 'relative', overflow: 'hidden' },
  optionCardSelected: { borderColor: Colors.gold, borderWidth: 3, backgroundColor: 'rgba(255, 215, 0, 0.15)' },
  optionCardMy: { borderColor: Colors.gold, borderWidth: 3, backgroundColor: 'rgba(255, 215, 0, 0.15)' },
  optionProgress: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(138, 43, 226, 0.4)' },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  optionText: { flex: 1, fontSize: 16, fontWeight: '600', color: 'white' },
  optionTextMy: { color: Colors.gold },
  optionTextSelected: { color: Colors.gold },
  optionVotes: { fontSize: 14, color: Colors.lavender },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  optionCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: Colors.purpleLight, justifyContent: 'center', alignItems: 'center' },
  optionCheckboxSquare: { borderRadius: 6 },
  optionCheckboxSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  optionCheckmark: { color: Colors.purpleDark, fontSize: 14, fontWeight: '700' },
  submitRow: { flexDirection: 'row', gap: 10 },
  emptyContainer: { alignItems: 'center', padding: 60, backgroundColor: Colors.purpleMid, borderRadius: 20, borderWidth: 3, borderColor: Colors.purpleLight },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: Colors.gold },
});

export default VoteScreen;