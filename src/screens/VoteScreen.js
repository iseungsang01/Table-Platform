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
  BackHandler // 👈 BackHandler가 반드시 있어야 합니다.
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CustomButton, VoteCard } from '../components'; 
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

  // 👇 [수정됨] 뒤로가기 버튼 핸들링 (에러 해결 버전)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 1. 투표 상세 화면(selectedVote 존재)인 경우 -> 목록으로 돌아감
        if (selectedVote) {
          setSelectedVote(null);
          setIsEditMode(false); // 수정 모드도 해제
          return true; // 뒤로가기 기본 동작(홈으로 튕김) 방지
        }
        
        // 2. 투표 목록 화면인 경우 -> 기본 동작(홈으로 이동) 허용
        return false;
      };

      // 이벤트 리스너 등록 (subscription 객체 반환)
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // 리스너 제거 (subscription.remove() 사용)
      return () => subscription.remove();
      
    }, [selectedVote]) // selectedVote 상태가 바뀔 때마다 로직 갱신
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
      // Promise.all에 참여자 수 조회(getVoteParticipants) 추가
      const [myVoteRes, resRes, countRes] = await Promise.all([
        handleApiCall('VoteScreen.loadMyVote', () => voteService.getMyVote(vId, customer.id), { showAlert: false }),
        handleApiCall('VoteScreen.loadVoteResults', () => voteService.getVoteResults(vId), { showAlert: false }),
        handleApiCall('VoteScreen.loadCount', () => voteService.getVoteParticipants(vId), { showAlert: false }) // 👈 추가된 부분
      ]);

      setMyVote(myVoteRes.data);
      
      // 결과 데이터 처리 (이전 답변의 수정 사항 적용)
      const finalResults = resRes.data?.results || {}; 
      setVoteResults(finalResults);

      // 🚨 참여자 수 업데이트
      // service가 { count: 10 } 형태로 리턴하므로 구조에 맞게 가져옵니다.
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
    setSubmitting(true);

    try {
      // 🚨 [핵심 변경] 선택된 옵션이 하나도 없다면 -> 투표 삭제(Cancel)로 처리
      if (selectedOptions.length === 0) {
        // (선택 사항) 사용자에게 한 번 더 물어보고 싶다면 Alert 사용
        /*
        Alert.alert("투표 취소", "모든 선택을 해제하여 투표를 취소하시겠습니까?", [
          { text: "아니오", onPress: () => setSubmitting(false) },
          { text: "네", onPress: async () => { ...삭제로직... } }
        ]);
        */
        
        // 바로 삭제 진행
        await handleApiCall(
          'VoteScreen.cancelVote',
          () => voteService.cancelVote(selectedVote.id, customer.id),
          { successMessage: '투표가 취소되었습니다.' }
        );

        // 삭제 후 데이터 갱신
        await loadVoteData(selectedVote.id);
        setIsEditMode(false); // 수정 모드 종료
        setShowResults(true); // 결과 화면(또는 투표전 화면)으로 이동

      } else {
        // 🚨 기존 로직: 1개 이상 선택했으므로 정상 투표/수정 진행
        const res = await handleApiCall(
          'VoteScreen.submitVote',
          () => voteService.submitVote(
            selectedVote.id,
            customer.id,
            selectedOptions,
            myVote?.id // 수정 시 기존 ID 전달
          ),
          { successMessage: isEditMode ? '투표가 수정되었습니다.' : '투표가 완료되었습니다.' }
        );

        if (res.data) {
          await loadVoteData(selectedVote.id);
          setIsEditMode(false);
          setShowResults(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (!selectedVote) {
      return (
        <View>
          {/* 🪵 NoticeScreen 구조와 100% 동일하게 구성 */}
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
    const totalVotes = Object.values(voteResults).reduce((a, b) => a + b, 0);
    
    return (
      <View>
        <TouchableOpacity style={styles.backLink} onPress={() => setSelectedVote(null)}>
          <Text style={styles.backLinkText}>❮ 목록으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedVote.title}</Text>
          <View style={styles.detailMeta}>
            <Text style={styles.metaText}>🗳️ 현재 {participantCount}명 참여 중</Text>
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
                onPress={() => {
                  if (!selectedVote.allow_multiple) setSelectedOptions([opt.id]);
                  else setSelectedOptions(prev => prev.includes(opt.id) ? prev.filter(i => i !== opt.id) : [...prev, opt.id]);
                }}
              >
                <View style={[styles.dot, isSel && styles.dotActive]} />
                <Text style={[styles.optText, isSel && styles.optTextActive]}>{opt.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {(!showResults || isEditMode) && (
          <View style={styles.actionContainer}>
            {/* 취소(뒤로가기) 버튼 */}
            {isEditMode && (
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setIsEditMode(false); setShowResults(true); }}
              >
                <Text style={styles.cancelButtonText}>돌아가기</Text>
              </TouchableOpacity>
            )}

            {/* 메인 버튼 */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                // 🚨 수정: (새 투표이고 선택없음) 또는 (처리중) 일 때만 비활성화
                // 즉, '수정 모드'일 때는 선택된 게 없어도 버튼이 활성화됩니다.
                (!isEditMode && !selectedOptions.length) || submitting 
                  ? styles.submitButtonDisabled 
                  : null
              ]}
              // 🚨 수정: 위 조건과 동일하게 적용
              disabled={((!isEditMode && !selectedOptions.length) || submitting)}
              onPress={handleSubmitVote}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? '처리 중...' : (
                  // 선택된 게 없으면 '투표 취소하기'라고 텍스트를 바꿔주면 더 친절합니다
                  // selectedOptions.length === 0 && isEditMode ? '투표 취소하기' : 
                  (isEditMode ? '수정 완료' : '투표하기')
                )}
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
  // 🪵 NoticeScreen의 listArea 명칭 및 수치 그대로 이식
  listArea: { 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 100 
  },
  
  // 🪵 NoticeScreen 헤더 스타일 완벽 복제
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

  // 상세 페이지 및 나머지 디자인 (Notice 규격과 조화되도록 유지)
  backLink: { marginBottom: 15, paddingLeft: 5 },
  backLinkText: { color: '#A68966', fontSize: 13 },
  detailHeader: { backgroundColor: '#4A3728', borderRadius: 16, padding: 22, marginBottom: 20 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  detailMeta: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 15 },
  metaText: { fontSize: 12, color: '#A68966' },
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
    gap: 12, // 버튼 사이 간격
  },
  submitButton: {
    flex: 1, // 남은 공간 모두 차지
    backgroundColor: DrawerTheme.goldBrass, // 메인 골드 색상
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
    backgroundColor: '#3D2B1F', // 비활성화 시 어두운 색
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#3D2B1F', // 글자색은 어두운 브라운 (가독성 UP)
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 0.4, // 작게 차지
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // 옅은 테두리
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