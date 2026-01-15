import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  Platform, 
  BackHandler 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, VoteCard } from '../components'; 
import { useAuth } from '../hooks/useAuth';
import { voteService } from '../services/voteService';
import { DrawerTheme } from '../constants/DrawerTheme';
import { handleApiCall, showSuccessAlert } from '../utils/errorHandler';

const VoteScreen = ({ navigation }) => {
  const { customer } = useAuth();
  const [participantCount, setParticipantCount] = useState(0);
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

  // 뒤로가기 버튼 핸들링
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

  const normalizeOptions = (opts) => {
    if (Array.isArray(opts)) return opts.map((t, i) => ({ id: i, text: typeof t === 'string' ? t : t.text || t }));
    if (opts) return Object.entries(opts).map(([k, v]) => ({ id: parseInt(k), text: v }));
    return [];
  };

  const loadVotes = async () => {
    const { data, error } = await handleApiCall('VoteScreen.loadVotes', () => voteService.getVotes());
    if (!error && data) setVotes(data);
    setLoading(false);
  };

  const loadVoteData = async (vId) => {
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
  };

  useFocusEffect(useCallback(() => { loadVotes(); }, [customer]));

  const handleSubmitVote = async () => {
    if (submitting) return;

    // ✅ 복수 투표에서 max_selections 검증
    if (selectedVote.allow_multiple && selectedVote.max_selections) {
      if (selectedOptions.length > selectedVote.max_selections) {
        Alert.alert(
          '선택 초과',
          `최대 ${selectedVote.max_selections}개까지만 선택 가능합니다.`,
          [{ text: '확인' }]
        );
        return;
      }
    }

    // ✅ 단일 투표에서 선택 안 하고 제출 시도 → 즉시 취소 처리
    if (!selectedVote.allow_multiple && selectedOptions.length === 0 && myVote) {
      const cancelVoteImmediately = async () => {
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
      };

      cancelVoteImmediately();
      return;
    }

    // ✅ 복수 투표에서 모든 선택 해제 → 취소로 간주
    if (selectedVote.allow_multiple && selectedOptions.length === 0 && myVote) {
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

    // ✅ 신규 투표 시 선택 안 함 → 경고
    if (selectedOptions.length === 0 && !myVote) {
      Alert.alert('알림', '최소 1개 이상 선택해주세요.', [{ text: '확인' }]);
      return;
    }

    // ✅ 정상 투표/수정 진행
    setSubmitting(true);
    const res = await handleApiCall(
      'VoteScreen.submitVote',
      () => voteService.submitVote(
        selectedVote.id,
        customer.id,
        selectedOptions,
        myVote?.id
      ),
      { successMessage: isEditMode ? '투표가 수정되었습니다.' : '투표가 완료되었습니다.' }
    );

    if (res.data) {
      await loadVoteData(selectedVote.id);
      setIsEditMode(false);
      setShowResults(true);
    }
    setSubmitting(false);
  };

  const handleOptionToggle = (optionId) => {
    if (!selectedVote.allow_multiple) {
      // 단일 투표: 이미 선택된 것을 다시 누르면 선택 해제
      setSelectedOptions(prev => 
        prev.includes(optionId) ? [] : [optionId]
      );
    } else {
      // 복수 투표: 토글 방식
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(i => i !== optionId) 
          : [...prev, optionId]
      );
    }
  };

  const renderContent = () => {
    if (!selectedVote) {
      return (
        <View>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>VOTE BOX</Text>
            </View>
            <View style={styles.headerDivider} />
            <Text style={styles.subtitle}>여러분의 소중한 의견을 들려주세요</Text>
          </View>

          {votes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🗳️</Text>
              <Text style={styles.emptyText}>진행 중인 투표가 없습니다.</Text>
            </View>
          ) : (
            votes.map(v => (
              <VoteCard 
                key={v.id} 
                vote={v} 
                onPress={async (v) => { setSelectedVote(v); await loadVoteData(v.id); }} 
              />
            ))
          )}
        </View>
      );
    }

    const options = normalizeOptions(selectedVote.options);
    const total = Object.values(voteResults).reduce((a, b) => a + b, 0);
    const isResultView = showResults && !isEditMode;
    
    return (
      <View>
        <TouchableOpacity style={styles.backLink} onPress={() => setSelectedVote(null)}>
          <Text style={styles.backLinkText}>⬅ 목록으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedVote.title}</Text>
          <View style={styles.detailMeta}>
            <Text style={styles.metaText}>🗳️ 현재 {participantCount}명 참여 중</Text>
            {selectedVote.allow_multiple && selectedVote.max_selections && (
              <Text style={styles.metaText}>• 최대 {selectedVote.max_selections}개 선택 가능</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isResultView ? '📊 결과 현황' : '🗳️ 항목 선택'}</Text>
            {isResultView && (
              <TouchableOpacity onPress={() => { setShowResults(false); setIsEditMode(true); }}>
                <Text style={styles.editLink}>다시 투표하기</Text>
              </TouchableOpacity>
            )}
          </View>

          {options.map(opt => {
            const count = voteResults[opt.id] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            const isMy = myVote?.selected_options?.includes(opt.id);
            const isSel = selectedOptions.includes(opt.id);

            return isResultView ? (
              <View key={opt.id} style={[styles.resBar, isMy && styles.resMy]}>
                <View style={[styles.progress, { width: `${pct}%` }]} />
                <View style={styles.resContent}>
                  <Text style={[styles.resText, isMy && styles.resTextMy]}>{isMy && '✓ '}{opt.text}</Text>
                  <Text style={styles.resPct}>{pct}%</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                key={opt.id} 
                style={[styles.optBtn, isSel && styles.optSel]}
                onPress={() => handleOptionToggle(opt.id)}
              >
                <View style={[styles.dot, isSel && styles.dotActive]} />
                <Text style={[styles.optText, isSel && styles.optTextActive]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(!showResults || isEditMode) && (
          <View style={styles.actionContainer}>
            {isEditMode && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setIsEditMode(false); setShowResults(true); }}
              >
                <Text style={styles.cancelButtonText}>돌아가기</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled
              ]}
              disabled={submitting}
              onPress={handleSubmitVote}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? '처리 중...' : (isEditMode ? '수정 완료' : '투표하기')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList 
        data={[{id: 1}]} 
        renderItem={renderContent}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listArea}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => { setRefreshing(true); await loadVotes(); setRefreshing(false); }} 
            tintColor={DrawerTheme.goldBrass} 
          />
        }
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listArea: { 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 100 
  },
  
  header: { 
    backgroundColor: DrawerTheme.woodDark, 
    borderRadius: 12, 
    paddingVertical: 25, 
    paddingHorizontal: 20,
    marginBottom: 25, 
    borderWidth: 1.5,
    borderColor: DrawerTheme.woodFrame,
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 8 
  },
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 8
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif'
  },
  headerDivider: { 
    width: 50, 
    height: 2, 
    backgroundColor: DrawerTheme.goldBrass, 
    marginVertical: 10,
    opacity: 0.7
  },
  subtitle: { 
    fontSize: 12, 
    color: DrawerTheme.woodLight, 
    opacity: 0.9
  },

  backLink: { marginBottom: 15, paddingLeft: 5 },
  backLinkText: { color: '#A68966', fontSize: 13 },
  detailHeader: { backgroundColor: '#4A3728', borderRadius: 16, padding: 22, marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  detailMeta: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 15 },
  metaText: { fontSize: 12, color: '#A68966', marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  sectionTitle: { color: DrawerTheme.goldBrass, fontSize: 15, fontWeight: 'bold' },
  editLink: { color: '#888', fontSize: 12, textDecorationLine: 'underline' },
  optBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 10, 
    padding: 18, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  optSel: { borderColor: DrawerTheme.goldBrass, backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
  dotActive: { backgroundColor: DrawerTheme.goldBrass },
  optText: { color: '#AAA', fontSize: 15 },
  optTextActive: { color: '#FFF', fontWeight: 'bold' },
  resBar: { 
    height: 52, 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    borderRadius: 10, 
    marginBottom: 10, 
    justifyContent: 'center', 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  resMy: { borderColor: 'rgba(212, 175, 55, 0.3)' },
  progress: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(212, 175, 55, 0.15)' },
  resContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15 },
  resText: { color: '#999', fontSize: 14 },
  resTextMy: { color: DrawerTheme.goldBright, fontWeight: 'bold' },
  resPct: { color: '#666', fontSize: 12 },
  actionContainer: {
    flexDirection: 'row',
    marginTop: 25,
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: DrawerTheme.goldBrass,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#3D2B1F',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#3D2B1F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 0.4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#AAA',
    fontSize: 16,
  },
  emptyBox: { alignItems: 'center', paddingTop: 100, paddingBottom: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 20, opacity: 0.3 },
  emptyText: { fontSize: 15, color: DrawerTheme.woodLight, fontStyle: 'italic', opacity: 0.7 }
});

export default VoteScreen;