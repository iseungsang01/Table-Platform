import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CustomButton } from '../components'; 
import { useAuth } from '../hooks/useAuth';
import { voteService } from '../services/voteService';
import { DrawerTheme } from '../constants/DrawerTheme';
import { 
  handleApiCall, 
  createValidationError,
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';

const formatDate = (s) => s ? new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '제한 없음';
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
    const { data, error } = await handleApiCall('VoteScreen.loadVotes', () => voteService.getVotes());
    if (!error && data) setVotes(data);
    setLoading(false);
  };

  const loadVoteData = async (vId) => {
    const [myVoteResult, resultsResult] = await Promise.all([
      handleApiCall('VoteScreen.loadMyVote', () => voteService.getMyVote(vId, customer.id), { showAlert: false }),
      handleApiCall('VoteScreen.loadVoteResults', () => voteService.getVoteResults(vId), { showAlert: false })
    ]);

    const myVoteData = myVoteResult.data;
    const resultsData = resultsResult.data?.results || {};

    setMyVote(myVoteData);
    setVoteResults(resultsData);
    setSelectedOptions(myVoteData?.selected_options || []);
    setShowResults(!!myVoteData);
  };

  useFocusEffect(useCallback(() => { loadVotes(); }, [customer]));

  const handleBackToList = () => { 
    setSelectedVote(null); 
    setSelectedOptions([]); 
    setMyVote(null); 
    setShowResults(false); 
    setIsEditMode(false); 
  };

  const handleOptionToggle = (id) => {
    if (selectedOptions.includes(id)) {
      return setSelectedOptions(selectedOptions.filter(i => i !== id));
    }
    if (!selectedVote.allow_multiple) {
      return setSelectedOptions([id]);
    }
    if (selectedOptions.length < (selectedVote.max_selections || 1)) {
      setSelectedOptions([...selectedOptions, id]);
    } else {
      Alert.alert('알림', `최대 ${selectedVote.max_selections}개까지 선택 가능합니다.`);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOptions.length) {
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '항목을 선택해주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    setSubmitting(true);
    const { error } = await handleApiCall(
      'VoteScreen.handleSubmitVote',
      () => voteService.submitVote(selectedVote.id, customer.id, selectedOptions, myVote?.id)
    );
    
    if (!error) {
      showSuccessAlert('VOTE', Alert, myVote ? '✅ 투표가 수정되었습니다!' : '✅ 투표가 완료되었습니다!');
      await loadVoteData(selectedVote.id);
      setIsEditMode(false);
    }
    setSubmitting(false);
  };

  const Badge = ({ v }) => (
    <View style={styles.voteBadges}>
      <Text style={styles.voteBadge}>{v.allow_multiple ? `복수선택` : '단일선택'}</Text>
      {v.is_anonymous && <Text style={styles.voteBadgeAnonymous}>익명</Text>}
    </View>
  );

  const renderContent = () => {
    if (!selectedVote) return (
      <View>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>VOTE BOX</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSubtitle}>여러분의 소중한 의견을 들려주세요</Text>
        </View>

        {votes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>진행 중인 투표가 없습니다.</Text>
          </View>
        ) : (
          votes.map(v => (
            <TouchableOpacity key={v.id} style={styles.voteCard} onPress={async () => { setSelectedVote(v); await loadVoteData(v.id); }}>
              <View style={styles.cardHeader}>
                <Badge v={v} />
                <Text style={styles.voteDate}>{formatDate(v.ends_at)} 마감</Text>
              </View>
              <Text style={styles.voteTitle}>{v.title}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.enterText}>참여하기 →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );

    const options = normalizeOptions(selectedVote.options);
    const total = Object.values(voteResults).reduce((a, b) => a + b, 0);
    const isResultView = showResults && !isEditMode;

    return (
      <View>
        <TouchableOpacity style={styles.backLink} onPress={handleBackToList}>
          <Text style={styles.backLinkText}>← 목록으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.voteDetailCard}>
          <Badge v={selectedVote} />
          <Text style={styles.voteDetailTitle}>{selectedVote.title}</Text>
          <View style={styles.voteStats}>
            <Text style={styles.statInfo}>📅 마감: {formatDate(selectedVote.ends_at)}</Text>
            <Text style={styles.statInfo}>🗳️ 현재 {total}명 참여 중</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <View style={styles.optionsHeader}>
            <Text style={styles.optionsTitle}>{isResultView ? '📊 실시간 현황' : '🗳️ 항목 선택'}</Text>
            {isResultView && (
              <TouchableOpacity onPress={() => { setShowResults(false); setIsEditMode(true); }}>
                <Text style={styles.editActionText}>다시 투표하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {options.map(opt => {
            const count = voteResults[opt.id] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            const isMy = myVote?.selected_options?.includes(opt.id);
            const isSel = selectedOptions.includes(opt.id);

            return isResultView ? (
              <View key={opt.id} style={[styles.resultCard, isMy && styles.resultCardMy]}>
                <View style={[styles.progressBar, { width: `${pct}%` }]} />
                <View style={styles.resultContent}>
                  <Text style={[styles.resultText, isMy && styles.resultTextMy]}>
                    {isMy && '✓ '}{opt.text}
                  </Text>
                  <Text style={styles.resultCount}>{pct}% ({count}표)</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.optionCard, isSel && styles.optionCardSelected]} 
                onPress={() => handleOptionToggle(opt.id)}
              >
                <View style={[styles.checkbox, isSel && styles.checkboxSelected]}>
                  {isSel && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.optionText, isSel && styles.optionTextSelected]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}

          {(!showResults || isEditMode) && (
            <View style={styles.submitRow}>
              <CustomButton 
                title={submitting ? '처리 중...' : '투표 제출하기'} 
                onPress={handleSubmitVote} 
                disabled={submitting || !selectedOptions.length} 
                style={{flex: 1}} 
              />
              {isEditMode && (
                <CustomButton 
                  title="취소" 
                  onPress={() => { setShowResults(true); setIsEditMode(false); setSelectedOptions(myVote?.selected_options || []); }} 
                  variant="danger" 
                  style={{flex: 0.4}} 
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList 
        data={[{id:1}]} 
        renderItem={renderContent} 
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadVotes(); if (selectedVote) await loadVoteData(selectedVote.id); setRefreshing(false); }} tintColor={DrawerTheme.goldBrass} />}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
  
  // 메인 헤더 (쿠폰함과 통일)
  header: { 
    backgroundColor: DrawerTheme.woodDark, borderRadius: 8, padding: 25, marginBottom: 25, 
    borderWidth: 1.5, borderColor: DrawerTheme.woodFrame, alignItems: 'center'
  },
  headerTitle: { fontSize: 22, color: DrawerTheme.goldBrass, fontWeight: 'bold', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif' },
  headerDivider: { width: 40, height: 2, backgroundColor: DrawerTheme.goldBrass, marginVertical: 12 },
  headerSubtitle: { fontSize: 13, color: DrawerTheme.woodLight },

  // 투표 리스트 카드
  voteCard: { 
    backgroundColor: 'rgba(28, 25, 23, 0.6)', borderRadius: 12, padding: 20, marginBottom: 15,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  voteTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  voteDate: { fontSize: 11, color: '#666' },
  cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12, alignItems: 'flex-end' },
  enterText: { color: DrawerTheme.goldBrass, fontSize: 12, fontWeight: 'bold' },

  // 상세 보기
  backLink: { marginBottom: 20, paddingLeft: 5 },
  backLinkText: { color: DrawerTheme.woodLight, fontSize: 13 },
  voteDetailCard: { 
    backgroundColor: DrawerTheme.woodDark, borderRadius: 12, padding: 25, marginBottom: 25,
    borderWidth: 1, borderColor: DrawerTheme.goldBrass
  },
  voteDetailTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginVertical: 15 },
  voteStats: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  statInfo: { fontSize: 12, color: DrawerTheme.woodLight },

  // 옵션 리스트
  optionsContainer: { marginBottom: 30 },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  optionsTitle: { fontSize: 16, fontWeight: 'bold', color: DrawerTheme.goldBrass },
  editActionText: { color: '#666', fontSize: 12, textDecorationLine: 'underline' },

  // 투표하기 모드
  optionCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 8, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  optionCardSelected: { borderColor: DrawerTheme.goldBrass, backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#444', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: DrawerTheme.goldBrass, borderColor: DrawerTheme.goldBrass },
  checkmark: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  optionText: { color: '#AAA', fontSize: 15 },
  optionTextSelected: { color: '#FFF', fontWeight: 'bold' },

  // 결과 보기 모드
  resultCard: { 
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, height: 56, 
    marginBottom: 10, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  resultCardMy: { borderColor: 'rgba(212, 175, 55, 0.3)' },
  progressBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  resultContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, alignItems: 'center' },
  resultText: { color: '#999', fontSize: 14 },
  resultTextMy: { color: DrawerTheme.goldBright, fontWeight: 'bold' },
  resultCount: { color: '#666', fontSize: 12 },

  // 버튼 및 기타
  voteBadges: { flexDirection: 'row', gap: 6 },
  voteBadge: { backgroundColor: 'rgba(212,175,55,0.1)', color: DrawerTheme.goldBrass, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, fontSize: 10, fontWeight: 'bold', borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.3)' },
  voteBadgeAnonymous: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#888', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, fontSize: 10 },
  submitRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { color: DrawerTheme.woodLight, fontSize: 14, fontStyle: 'italic' }
});

export default VoteScreen;