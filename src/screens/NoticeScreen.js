import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NoticeCard } from '../components/NoticeCard';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { noticeService } from '../services/noticeService';
import { Colors } from '../constants/Colors';

const NoticeScreen = () => {
  const { customer, refreshCustomer } = useAuth();
  const [notices, setNotices] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showMyReports, setShowMyReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 마운트 상태 추적
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    report_type: '어플 버그',
    category: 'app',
  });

  // 화면 포커스 시 한 번만 로드
  useFocusEffect(
    React.useCallback(() => {
      isMountedRef.current = true;

      // 이미 로드했으면 스킵
      if (!hasLoadedRef.current) {
        loadInitialData();
        hasLoadedRef.current = true;
      }

      return () => {
        isMountedRef.current = false;
      };
    }, [])
  );

  const loadInitialData = async () => {
    if (!isMountedRef.current) return;

    try {
      await Promise.all([
        loadNotices(),
        loadMyReports(),
      ]);
      
      if (customer && isMountedRef.current) {
        await noticeService.markNoticesAsRead(customer.id);
        await refreshCustomer();
      }
    } catch (error) {
      console.error('Load initial data error:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const loadNotices = async () => {
    if (!isMountedRef.current) return;
    
    const { data, error } = await noticeService.getNotices();
    if (!error && data && isMountedRef.current) {
      setNotices(data);
    }
  };

  const loadMyReports = async () => {
    if (!customer || !isMountedRef.current) return;
    
    const { data, error } = await noticeService.getMyReports(customer.id);
    if (!error && data && isMountedRef.current) {
      setMyReports(data);
    }
  };

  const handleRefresh = async () => {
    if (!isMountedRef.current) return;
    
    setRefreshing(true);
    await Promise.all([
      loadNotices(),
      loadMyReports(),
    ]);
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  };

  const handleToggleReportForm = () => {
    Keyboard.dismiss();
    setShowReportForm(!showReportForm);
    setShowMyReports(false);
  };

  const handleToggleMyReports = async () => {
    Keyboard.dismiss();
    const newState = !showMyReports;
    setShowMyReports(newState);
    setShowReportForm(false);
    
    if (newState && customer) {
      // 내 접수 내역 열 때만 읽음 처리
      await noticeService.markReportsAsRead(customer.id, myReports);
      await loadMyReports();
    }
  };

  const handleCategoryChange = (category) => {
    setReportData({
      ...reportData,
      category,
      report_type: category === 'app' ? '어플 버그' : '가게 불편사항',
    });
  };

  const handleSubmitReport = async () => {
    if (!reportData.title.trim()) {
      Alert.alert('알림', '제목을 입력해주세요.');
      return;
    }

    if (!reportData.description.trim()) {
      Alert.alert('알림', '내용을 입력해주세요.');
      return;
    }

    if (reportData.description.length > 500) {
      Alert.alert('알림', '내용은 500자 이내로 작성해주세요.');
      return;
    }

    Keyboard.dismiss();
    setSubmitting(true);

    const { error } = await noticeService.submitReport({
      customer_id: customer?.id || null,
      customer_phone: customer?.phone_number || null,
      ...reportData,
    });

    if (error) {
      Alert.alert('오류', '접수 중 오류가 발생했습니다.');
      setSubmitting(false);
      return;
    }

    Alert.alert('완료', '✅ 접수되었습니다. 빠른 시일 내에 확인하겠습니다.');

    setReportData({
      title: '',
      description: '',
      report_type: '어플 버그',
      category: 'app',
    });

    await loadMyReports();
    setShowReportForm(false);
    setSubmitting(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      접수: '#ffa500',
      처리중: '#2196f3',
      완료: '#4caf50',
      보류: '#9e9e9e',
    };
    return colors[status] || Colors.lavender;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>📢 공지사항</Text>
        <Text style={styles.subtitle}>매장의 새로운 소식을 확인하세요</Text>

        <View style={styles.buttonRow}>
          <CustomButton
            title={showReportForm ? '✖ 닫기' : '🛠 버그/불편사항 접수'}
            onPress={handleToggleReportForm}
            variant={showReportForm ? 'secondary' : 'danger'}
            style={styles.actionButton}
          />
          <CustomButton
            title={showMyReports ? '✖ 닫기' : `📋 내 접수 내역 (${myReports.length})`}
            onPress={handleToggleMyReports}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </View>

      {showReportForm && (
        <View style={styles.reportForm}>
          <Text style={styles.formTitle}>🛠 버그 및 불편사항 접수</Text>
          <Text style={styles.formDescription}>
            앱 사용 중 불편하신 점이나 버그를 발견하셨다면 알려주세요.{'\n'}
            소중한 의견을 반영하여 더 나은 서비스를 제공하겠습니다.
          </Text>

          <View style={styles.categoryRow}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                reportData.category === 'app' && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryChange('app')}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryButtonText}>📱 어플 불편사항</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                reportData.category === 'store' && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryChange('store')}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryButtonText}>🏪 가게 불편사항</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>세부 유형</Text>
            <View style={styles.pickerContainer}>
              {reportData.category === 'app' ? (
                <View>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '어플 버그' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '어플 버그' && '✓ '}🐛 어플 버그
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '어플 불편사항' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '어플 불편사항' && '✓ '}😕 어플 불편사항
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '어플 개선 건의' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '어플 개선 건의' && '✓ '}💡 어플 개선 건의
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '가게 불편사항' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '가게 불편사항' && '✓ '}😔 가게 불편사항
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '서비스 개선 요청' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '서비스 개선 요청' && '✓ '}✨ 서비스 개선 요청
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => setReportData({ ...reportData, report_type: '기타 문의' })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pickerOptionText}>
                      {reportData.report_type === '기타 문의' && '✓ '}❓ 기타 문의
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              value={reportData.title}
              onChangeText={(text) => setReportData({ ...reportData, title: text })}
              placeholder="간단한 제목을 입력하세요"
              placeholderTextColor={Colors.purpleLight}
              maxLength={100}
              editable={!submitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>상세 내용</Text>
            <TextInput
              style={styles.textarea}
              value={reportData.description}
              onChangeText={(text) => setReportData({ ...reportData, description: text })}
              placeholder={
                reportData.category === 'app'
                  ? '발생한 문제나 불편한 점을 자세히 설명해주세요'
                  : '매장 이용 중 불편했던 점이나 개선 사항을 자세히 알려주세요'
              }
              placeholderTextColor={Colors.purpleLight}
              maxLength={500}
              multiline
              numberOfLines={6}
              editable={!submitting}
            />
            <Text style={styles.charCount}>{reportData.description.length}/500</Text>
          </View>

          <CustomButton
            title={submitting ? '접수 중...' : '접수하기'}
            onPress={handleSubmitReport}
            disabled={submitting}
            loading={submitting}
          />
        </View>
      )}

      {showMyReports && (
        <View style={styles.myReportsContainer}>
          <Text style={styles.myReportsTitle}>📋 내 접수 내역</Text>
          <Text style={styles.myReportsDescription}>
            접수하신 버그 및 불편사항의 처리 상태를 확인할 수 있습니다.
          </Text>

          {myReports.length === 0 ? (
            <View style={styles.emptyReports}>
              <Text style={styles.emptyIcon}>🔭</Text>
              <Text style={styles.emptyTitle}>접수된 내역이 없습니다</Text>
              <Text style={styles.emptyText}>불편사항이 있으시면 언제든 접수해주세요</Text>
            </View>
          ) : (
            myReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportBadges}>
                    <Text style={styles.reportCategory}>
                      {report.category === 'app' ? '📱 어플' : '🏪 가게'}
                    </Text>
                    <Text style={styles.reportType}>{report.report_type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { borderColor: getStatusColor(report.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>

                {report.admin_response && (
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>💬 관리자 답변</Text>
                    <Text style={styles.responseText}>{report.admin_response}</Text>
                  </View>
                )}

                <Text style={styles.reportDate}>접수일: {formatDate(report.created_at)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔭</Text>
      <Text style={styles.emptyTitle}>등록된 공지사항이 없습니다</Text>
    </View>
  );

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={showReportForm || showMyReports ? [] : notices}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <NoticeCard notice={item} />}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!showReportForm && !showMyReports ? renderEmpty : null}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.gold}
              colors={[Colors.gold]}
            />
          }
        />
      </KeyboardAvoidingView>
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
    marginBottom: 15,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
  reportForm: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.redSoft,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.redSoft,
    textAlign: 'center',
    marginBottom: 10,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.lavender,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  categoryButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  textarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.purpleLight,
  },
  pickerOptionText: {
    fontSize: 16,
    color: 'white',
  },
  charCount: {
    fontSize: 12,
    color: Colors.lavender,
    textAlign: 'right',
    marginTop: 5,
  },
  myReportsContainer: {
    marginBottom: 20,
  },
  myReportsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196f3',
    marginBottom: 10,
  },
  myReportsDescription: {
    fontSize: 14,
    color: Colors.lavender,
    marginBottom: 20,
  },
  emptyReports: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
  },
  reportCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  reportCategory: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '600',
  },
  reportType: {
    fontSize: 12,
    color: Colors.lavender,
  },
  statusBadge: {
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 10,
  },
  responseBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.green,
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  reportDate: {
    fontSize: 12,
    color: Colors.lavender,
    opacity: 0.8,
    marginTop: 10,
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
  emptyText: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
  },
});

export default NoticeScreen;