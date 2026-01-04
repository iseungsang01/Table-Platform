import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NoticeCard } from '../components/NoticeCard';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { noticeService } from '../services/noticeService';
import { Colors } from '../constants/Colors';

const NoticeScreen = () => {
  const { customer } = useAuth();
  const [notices, setNotices] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportData, setReportData] = useState({ title: '', description: '', report_type: '어플 버그', category: 'app' });

  const loadData = async () => {
    const [nRes, rRes] = await Promise.all([noticeService.getNotices(), customer ? noticeService.getMyReports(customer.id) : { data: [] }]);
    if (!nRes.error) setNotices(nRes.data);
    if (!rRes.error) setMyReports(rRes.data);
    if (customer) await noticeService.markAllNoticesAsRead();
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [customer]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategoryChange = (category) => setReportData({ ...reportData, category, report_type: category === 'app' ? '어플 버그' : '가게 불편사항' });

  const handleSubmitReport = async () => {
    const { title, description, report_type } = reportData;
    if (!title.trim() || !description.trim()) return Alert.alert('알림', '제목과 내용을 모두 입력해주세요.');
    setSubmitting(true);
    const { error } = await noticeService.submitReport({ customer_id: customer?.id || null, title, description, report_type });
    if (!error) {
      Alert.alert('완료', '✅ 접수되었습니다.');
      setReportData({ title: '', description: '', report_type: '어플 버그', category: 'app' });
      await loadData();
      setShowReportForm(false);
    } else Alert.alert('오류', '접수 중 오류가 발생했습니다.');
    setSubmitting(false);
  };

  const getStatusColor = (s) => ({ 접수: '#ffa500', 확인중: '#2196f3', 완료: '#4caf50', 보류: '#9e9e9e' }[s] || Colors.lavender);
  const formatDate = (d) => new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📢 공지사항</Text>
      <Text style={styles.subtitle}>매장의 새로운 소식을 확인하세요</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <View style={styles.buttonRow}>
        <CustomButton title={showReportForm ? '✖ 닫기' : '🛠 버그/불편사항 접수'} onPress={() => { setShowReportForm(!showReportForm); setShowMyReports(false); }} variant={showReportForm ? 'secondary' : 'danger'} style={styles.actionButton} />
        <CustomButton title={showMyReports ? '✖ 닫기' : `📋 내 내역 (${myReports.length})`} onPress={() => { setShowMyReports(!showMyReports); setShowReportForm(false); }} variant="secondary" style={styles.actionButton} />
      </View>

      {showReportForm && (
        <ScrollView style={styles.reportForm} nestedScrollEnabled>
          <Text style={styles.formTitle}>🛠 버그 및 불편사항 접수</Text>
          <View style={styles.categoryRow}>
            {['app', 'store'].map(cat => (
              <TouchableOpacity key={cat} style={[styles.categoryButton, reportData.category === cat && styles.categoryButtonActive]} onPress={() => handleCategoryChange(cat)}>
                <Text style={styles.categoryButtonText}>{cat === 'app' ? '📱 어플' : '🏪 가게'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pickerContainer}>
            {(reportData.category === 'app' ? ['어플 버그', '어플 불편사항', '어플 개선 건의'] : ['가게 불편사항', '서비스 개선 요청', '기타 문의']).map(opt => (
              <TouchableOpacity key={opt} style={styles.pickerOption} onPress={() => setReportData({ ...reportData, report_type: opt })}>
                <Text style={styles.pickerOptionText}>{reportData.report_type === opt && '✓ '}{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={reportData.title} onChangeText={(t) => setReportData({ ...reportData, title: t })} placeholder="제목" placeholderTextColor={Colors.purpleLight} />
          <TextInput style={styles.textarea} value={reportData.description} onChangeText={(t) => setReportData({ ...reportData, description: t })} placeholder="상세 내용" placeholderTextColor={Colors.purpleLight} multiline numberOfLines={5} />
          <CustomButton title={submitting ? '접수 중...' : '접수하기'} onPress={handleSubmitReport} disabled={submitting} loading={submitting} />
        </ScrollView>
      )}

      {showMyReports && (
        <View style={styles.myReportsContainer}>
          <Text style={styles.myReportsTitle}>📋 내 접수 내역</Text>
          {myReports.length === 0 ? <Text style={styles.emptyText}>접수된 내역이 없습니다.</Text> : myReports.map(r => (
            <View key={r.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportType}>{r.report_type}</Text>
                <View style={[styles.statusBadge, { borderColor: getStatusColor(r.status) }]}><Text style={[styles.statusText, { color: getStatusColor(r.status) }]}>{r.status}</Text></View>
              </View>
              <Text style={styles.reportTitle}>{r.title}</Text>
              <Text style={styles.reportDate}>{formatDate(r.created_at)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  return (
    <GradientBackground>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <NoticeCard notice={item} />}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyIcon}>🔭</Text><Text style={styles.emptyTitle}>공지사항이 없습니다.</Text></View>}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 100 },
  header: { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 3, borderColor: Colors.gold, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.gold, marginBottom: 5 },
  subtitle: { fontSize: 14, color: Colors.lavender, textAlign: 'center' },
  footerContainer: { marginTop: 10 },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionButton: { flex: 1 },
  reportForm: { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: Colors.redSoft },
  formTitle: { fontSize: 20, fontWeight: '700', color: Colors.redSoft, textAlign: 'center', marginBottom: 15 },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  categoryButton: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.purpleLight, alignItems: 'center' },
  categoryButtonActive: { borderColor: Colors.gold, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  categoryButtonText: { color: 'white', fontWeight: '600' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: 'white', marginBottom: 10, borderWidth: 1, borderColor: Colors.purpleLight },
  textarea: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: 'white', minHeight: 100, textAlignVertical: 'top', marginBottom: 15, borderWidth: 1, borderColor: Colors.purpleLight },
  pickerContainer: { marginBottom: 15, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, overflow: 'hidden' },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  pickerOptionText: { color: 'white', fontSize: 14 },
  myReportsContainer: { padding: 10 },
  myReportsTitle: { fontSize: 22, fontWeight: '700', color: '#2196f3', marginBottom: 15 },
  reportCard: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: Colors.purpleLight },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reportType: { fontSize: 12, color: Colors.lavender },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  reportTitle: { fontSize: 15, fontWeight: '700', color: Colors.gold, marginBottom: 5 },
  reportDate: { fontSize: 11, color: Colors.lavender, opacity: 0.6 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyTitle: { fontSize: 18, color: Colors.lavender },
  emptyText: { color: Colors.lavender, textAlign: 'center', marginTop: 20 }
});

export default NoticeScreen;