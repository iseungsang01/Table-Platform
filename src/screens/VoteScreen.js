import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CustomButton, VoteCard } from '../components'; 
import { useAuth } from '../hooks/useAuth';
import { voteService } from '../services/voteService';
import { DrawerTheme } from '../constants/DrawerTheme';
import { handleApiCall, showSuccessAlert } from '../utils/errorHandler';

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
    const [myVoteRes, resRes] = await Promise.all([
      handleApiCall('VoteScreen.loadMyVote', () => voteService.getMyVote(vId, customer.id), { showAlert: false }),
      handleApiCall('VoteScreen.loadVoteResults', () => voteService.getVoteResults(vId), { showAlert: false })
    ]);
    setMyVote(myVoteRes.data);
    setVoteResults(resRes.data?.results || {});
    setSelectedOptions(myVoteRes.data?.selected_options || []);
    setShowResults(!!myVoteRes.data);
  };

  useFocusEffect(useCallback(() => { loadVotes(); }, [customer]));

  const handleSubmitVote = async () => {
    if (!selectedOptions.length) return Alert.alert('알림', '항목을 선택해주세요.');
    setSubmitting(true);
    const { error } = await handleApiCall('VoteScreen.submit', () => 
      voteService.submitVote(selectedVote.id, customer.id, selectedOptions, myVote?.id)
    );
    if (!error) {
      showSuccessAlert('VOTE', Alert, '참여가 완료되었습니다.');
      await loadVoteData(selectedVote.id);
      setIsEditMode(false);
    }
    setSubmitting(false);
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

    return (
      <View>
        <TouchableOpacity style={styles.backLink} onPress={() => setSelectedVote(null)}>
          <Text style={styles.backLinkText}>❮ 목록으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{selectedVote.title}</Text>
          <View style={styles.detailMeta}>
            <Text style={styles.metaText}>🗳️ 현재 {total}명 참여 중</Text>
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
          <View style={styles.btnRow}>
            <CustomButton 
              title={submitting ? '제출 중...' : '투표하기'} 
              onPress={handleSubmitVote} 
              disabled={submitting || !selectedOptions.length} 
              style={{flex: 1}} 
            />
            {isEditMode && (
              <CustomButton 
                title="취소" 
                variant="danger" 
                onPress={() => { setIsEditMode(false); setShowResults(true); }} 
                style={{flex: 0.4}} 
              />
            )}
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
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  emptyBox: { alignItems: 'center', paddingTop: 100, paddingBottom: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 20, opacity: 0.3 },
  emptyText: { fontSize: 15, color: DrawerTheme.woodLight, fontStyle: 'italic', opacity: 0.7 }
});

export default VoteScreen;