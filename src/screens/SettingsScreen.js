import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, Keyboard } from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { customerService } from '../services/customerService';
import { noticeService } from '../services/noticeService';
import { supabase } from '../services/supabase';
import { Colors } from '../constants/Colors';
import { 
  handleApiCall, 
  createValidationError,
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';

const SettingsScreen = () => {
  const { customer, logout } = useAuth();
  
  const [activeSection, setActiveSection] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [reportData, setReportData] = useState({ 
    title: '', 
    description: '', 
    report_type: '어플 버그', 
    category: 'app' 
  });
  const [processing, setProcessing] = useState(false);

  const loadMyReports = async () => {
    if (customer) {
      console.log('📋 [SettingsScreen] 내 접수 내역 로드');
      
      const { data, error } = await handleApiCall(
        'SettingsScreen.loadMyReports',
        () => noticeService.getMyReports(customer.id),
        {
          showAlert: false,
          additionalInfo: { customerId: customer.id },
        }
      );
      
      if (!error && data) {
        console.log('✅ [SettingsScreen] 접수 내역 로드 성공:', data.length, '건');
        setMyReports(data);
      }
    }
  };

  useEffect(() => {
    if (activeSection === 'report') {
      loadMyReports();
    }
  }, [activeSection]);

  const toggleSection = (sectionName) => {
    setActiveSection(activeSection === sectionName ? null : sectionName);
    Keyboard.dismiss();
  };

  const handleCategoryChange = (category) => {
    setReportData({ 
      ...reportData, 
      category, 
      report_type: category === 'app' ? '어플 버그' : '가게 불편사항' 
    });
  };

  const handleSubmitReport = async () => {
    const { title, description, report_type } = reportData;
    
    if (!title.trim() || !description.trim()) {
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '제목과 상세 내용을 모두 입력해주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }

    console.log('📝 [SettingsScreen] 버그 리포트 제출');
    setProcessing(true);
    
    const { error } = await handleApiCall(
      'SettingsScreen.handleSubmitReport',
      () => noticeService.submitReport({
        customer_id: customer.id,
        title,
        description,
        report_type
      }),
      {
        showAlert: true,
        additionalInfo: { reportType: report_type },
      }
    );

    if (!error) {
      console.log('✅ [SettingsScreen] 리포트 제출 성공');
      Alert.alert('완료', '✅ 소중한 의견이 접수되었습니다.');
      setReportData({ title: '', description: '', report_type: '어플 버그', category: 'app' });
      loadMyReports();
    }
    
    setProcessing(false);
  };

  const handlePasswordReset = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '모든 필드를 채워주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      const errorInfo = createValidationError('PASSWORD_EMPTY');
      errorInfo.title = '비밀번호 불일치';
      errorInfo.message = '새 비밀번호가 일치하지 않습니다.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    console.log('🔑 [SettingsScreen] 비밀번호 재설정 시작');
    setProcessing(true);
    
    try {
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
        customer_uuid: customer.id,
        input_password: currentPassword
      });

      if (verifyError) throw verifyError;

      if (!isValid) {
        console.log('❌ [SettingsScreen] 현재 비밀번호 불일치');
        Alert.alert('오류', '현재 비밀번호가 올바르지 않습니다.');
        setProcessing(false);
        return;
      }

      const { error: updateError } = await supabase.rpc('update_customer_password', {
        customer_uuid: customer.id,
        new_password: newPassword
      });

      if (updateError) throw updateError;

      console.log('✅ [SettingsScreen] 비밀번호 변경 성공');
      showSuccessAlert('UPDATE', Alert, '비밀번호가 변경되었습니다.');
      setActiveSection(null);
      setCurrentPassword(''); 
      setNewPassword(''); 
      setConfirmPassword('');
    } catch (error) {
      console.error('❌ [SettingsScreen] 비밀번호 변경 오류:', error);
      Alert.alert('오류', '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      const errorInfo = createValidationError('PASSWORD_EMPTY');
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    console.log('🗑️ [SettingsScreen] 회원 탈퇴 시작');
    setProcessing(true);
    
    try {
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_password', {
        customer_uuid: customer.id,
        input_password: deleteConfirmPassword
      });

      if (verifyError) throw verifyError;

      if (!isValid) {
        console.log('❌ [SettingsScreen] 비밀번호 불일치');
        Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
        setProcessing(false);
        return;
      }

      Alert.alert('회원 탈퇴', '정말 탈퇴하시겠습니까? 모든 정보가 사라집니다.', [
        { text: '취소', onPress: () => setProcessing(false) },
        { text: '탈퇴', style: 'destructive', onPress: async () => {
          console.log('🗑️ [SettingsScreen] 탈퇴 진행');
          
          const { error } = await handleApiCall(
            'SettingsScreen.handleDeleteAccount',
            () => customerService.deleteCustomer(customer.id),
            {
              showAlert: true,
              additionalInfo: { customerId: customer.id },
            }
          );
          
          if (!error) {
            console.log('✅ [SettingsScreen] 탈퇴 성공');
            await logout();
          }
        }}
      ]);
    } catch (error) {
      console.error('❌ [SettingsScreen] 탈퇴 오류:', error);
      setProcessing(false);
    }
  };

  const getStatusColor = (s) => ({ 접수: '#ffa500', 확인중: '#2196f3', 완료: '#4caf50' }[s] || Colors.lavender);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.icon}>⚙️</Text>
          <Text style={styles.title}>설정</Text>
          <Text style={styles.subtitle}>{customer.nickname}님 계정</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 내 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>닉네임</Text><Text style={styles.infoValue}>{customer.nickname}</Text></View>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>연락처</Text><Text style={styles.infoValue}>{customer.phone_number}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuButton} onPress={() => toggleSection('password')}>
            <Text style={styles.menuButtonText}>🔐 비밀번호 재설정 {activeSection === 'password' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activeSection === 'password' && (
            <View style={styles.formCard}>
              <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="현재 비밀번호" placeholderTextColor={Colors.purpleLight} />
              <TextInput style={[styles.input, {marginTop: 10}]} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="새 비밀번호" placeholderTextColor={Colors.purpleLight} />
              <TextInput style={[styles.input, {marginTop: 10}]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="새 비밀번호 확인" placeholderTextColor={Colors.purpleLight} />
              <CustomButton title="비밀번호 변경" onPress={handlePasswordReset} loading={processing} style={{marginTop: 15}} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuButton, { borderColor: Colors.gold }]} 
            onPress={() => toggleSection('report')}
          >
            <Text style={styles.menuButtonText}>🛠️ 버그 및 불편사항 관리 {activeSection === 'report' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activeSection === 'report' && (
            <View style={styles.formCard}>
              <Text style={styles.innerTitle}>📝 새로운 문의 접수</Text>
              <View style={styles.categoryRow}>
                {['app', 'store'].map(cat => (
                  <TouchableOpacity key={cat} style={[styles.categoryButton, reportData.category === cat && styles.categoryButtonActive]} onPress={() => handleCategoryChange(cat)}>
                    <Text style={styles.categoryButtonText}>{cat === 'app' ? '📱 어플 버그' : '🏪 가게 불편'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} value={reportData.title} onChangeText={(t) => setReportData({...reportData, title: t})} placeholder="제목" placeholderTextColor={Colors.purpleLight} />
              <TextInput style={[styles.input, {minHeight: 80, marginTop: 10}]} value={reportData.description} onChangeText={(t) => setReportData({...reportData, description: t})} placeholder="내용을 입력하세요" placeholderTextColor={Colors.purpleLight} multiline />
              <CustomButton title="접수하기" onPress={handleSubmitReport} loading={processing} style={{marginTop: 10}} />

              <View style={styles.divider} />

              <Text style={styles.innerTitle}>📋 내 접수 내역 ({myReports.length})</Text>
              {myReports.length === 0 ? (
                <Text style={styles.emptyText}>접수 내역이 없습니다.</Text>
              ) : (
                myReports.map(item => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyType}>{item.report_type}</Text>
                      <View style={[styles.statusBadge, {borderColor: getStatusColor(item.status)}]}>
                        <Text style={[styles.statusText, {color: getStatusColor(item.status)}]}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuButtonDanger} onPress={() => toggleSection('delete')}>
            <Text style={styles.menuButtonTextDanger}>🗑️ 회원 탈퇴 {activeSection === 'delete' ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {activeSection === 'delete' && (
            <View style={styles.formCardDanger}>
              <Text style={styles.dangerText}>탈퇴 시 모든 데이터(스탬프/쿠폰)가 복구 불가능하게 삭제됩니다.</Text>
              <TextInput style={styles.inputDanger} value={deleteConfirmPassword} onChangeText={setDeleteConfirmPassword} secureTextEntry placeholder="비밀번호를 입력하세요" placeholderTextColor={Colors.purpleLight} />
              <CustomButton title="회원 탈퇴" onPress={handleDeleteAccount} variant="danger" loading={processing} style={{marginTop: 10}} />
            </View>
          )}
        </View>

        <CustomButton title="로그아웃" onPress={() => Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [{text:'취소'}, {text:'로그아웃', onPress: logout}])} variant="secondary" />
        
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Tarot Stamp v1.0.0</Text>
        </View>

      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 100 },
  header: { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 30, marginBottom: 25, borderWidth: 3, borderColor: Colors.gold, alignItems: 'center' },
  icon: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.gold },
  subtitle: { fontSize: 14, color: Colors.lavender, marginTop: 5 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gold, marginBottom: 10, marginLeft: 5 },
  infoCard: { backgroundColor: Colors.purpleMid, borderRadius: 15, padding: 20, borderWidth: 1, borderColor: Colors.purpleLight },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  infoLabel: { color: Colors.lavender, fontSize: 14 },
  infoValue: { color: 'white', fontWeight: '600', fontSize: 14 },
  menuButton: { backgroundColor: Colors.purpleMid, borderRadius: 15, padding: 18, borderWidth: 2, borderColor: Colors.purpleLight },
  menuButtonText: { color: Colors.gold, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  menuButtonDanger: { backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: 15, padding: 18, borderWidth: 2, borderColor: Colors.redSoft },
  menuButtonTextDanger: { color: Colors.redSoft, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  formCard: { backgroundColor: Colors.purpleMid, borderRadius: 15, padding: 15, marginTop: 10, borderWidth: 1, borderColor: Colors.purpleLight },
  formCardDanger: { backgroundColor: 'rgba(255, 107, 107, 0.05)', borderRadius: 15, padding: 15, marginTop: 10, borderWidth: 1, borderColor: Colors.redSoft },
  innerTitle: { color: Colors.gold, fontSize: 14, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, color: 'white', borderWidth: 1, borderColor: Colors.purpleLight },
  inputDanger: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, color: 'white', borderWidth: 1, borderColor: Colors.redSoft },
  dangerText: { color: Colors.redSoft, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  categoryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  categoryButton: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.purpleLight, alignItems: 'center' },
  categoryButtonActive: { borderColor: Colors.gold, backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  categoryButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,215,0,0.1)', marginVertical: 15 },
  historyCard: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyType: { fontSize: 10, color: Colors.lavender },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  statusText: { fontSize: 9, fontWeight: '700' },
  historyTitle: { color: 'white', fontSize: 13, fontWeight: '600' },
  historyDate: { fontSize: 10, color: Colors.lavender, marginTop: 4 },
  emptyText: { color: Colors.lavender, textAlign: 'center', fontSize: 12, paddingVertical: 10 },
  appInfo: { marginTop: 30, alignItems: 'center' },
  appInfoText: { color: Colors.lavender, fontSize: 12, opacity: 0.5 }
});

export default SettingsScreen;