import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl, Platform, StatusBar, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CouponCard, CustomButton } from '../components';
import { useAuth } from '../hooks/useAuth';
import { couponService } from '../services/couponService';
import { AdminPassword } from '../services/supabase';
import { Colors } from '../constants/Colors';
import { 
  handleApiCall, 
  createValidationError,
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';

const CouponScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showUseForm, setShowUseForm] = useState(false);
  const passwordInputRef = useRef(null);

  const getCouponType = (code) => (code?.startsWith('BIRTHDAY') || code?.startsWith('BIRTH') ? 'birthday' : 'stamp');

  const loadCoupons = async () => {
    console.log('🎟️ [CouponScreen] 쿠폰 로드 시작');
    
    const { data, error } = await handleApiCall(
      'CouponScreen.loadCoupons',
      () => couponService.getCoupons(customer.id),
      {
        showAlert: true,
        additionalInfo: { customerId: customer.id },
      }
    );
    
    if (!error && data) {
      console.log('✅ [CouponScreen] 쿠폰 로드 성공:', data.length, '개');
      setCoupons(data);
    }
    
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { 
    console.log('👀 [CouponScreen] 화면 포커스');
    loadCoupons(); 
  }, []));

  const handleRefresh = async () => {
    console.log('🔄 [CouponScreen] 새로고침');
    setRefreshing(true);
    await Promise.all([loadCoupons(), refreshCustomer()]);
    setRefreshing(false);
  };

  const handleSelectCoupon = (coupon) => {
    console.log('🎟️ [CouponScreen] 쿠폰 선택:', coupon.id);
    setSelectedCoupon(coupon);
    setShowUseForm(true);
    setPassword('');
    setTimeout(() => passwordInputRef.current?.focus(), 100);
  };

  const handleCancelUse = () => {
    console.log('❌ [CouponScreen] 쿠폰 사용 취소');
    Keyboard.dismiss();
    setSelectedCoupon(null);
    setShowUseForm(false);
    setPassword('');
  };

  const handleUseCoupon = async () => {
    if (!selectedCoupon) {
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '사용할 쿠폰을 선택해주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    if (password !== AdminPassword) {
      console.log('❌ [CouponScreen] 비밀번호 불일치');
      const errorInfo = createValidationError('PASSWORD_EMPTY');
      errorInfo.title = '비밀번호 오류';
      errorInfo.message = '비밀번호가 올바르지 않습니다.';
      showErrorAlert(errorInfo, Alert);
      return;
    }
    
    Keyboard.dismiss();
    const typeNm = getCouponType(selectedCoupon.coupon_code) === 'birthday' ? '생일 쿠폰' : '스탬프 쿠폰';

    Alert.alert('쿠폰 사용', `${typeNm}을 사용하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '사용', onPress: async () => {
        console.log('🎟️ [CouponScreen] 쿠폰 사용 진행:', selectedCoupon.id);
        setProcessing(true);
        
        const { error } = await handleApiCall(
          'CouponScreen.handleUseCoupon',
          () => couponService.useCoupon(selectedCoupon.id),
          {
            showAlert: true,
            additionalInfo: { couponId: selectedCoupon.id },
          }
        );
        
        if (!error) {
          console.log('✅ [CouponScreen] 쿠폰 사용 성공');
          showSuccessAlert('COUPON_USED', Alert, `✅ ${typeNm}이 사용되었습니다!`);
          handleCancelUse();
          await Promise.all([loadCoupons(), refreshCustomer()]);
        }
        
        setProcessing(false);
      }}
    ]);
  };

  const stampCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'stamp');
  const birthdayCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'birthday');

  const renderSection = (title, items, type) => items.length > 0 && (
    <>
      <Text style={styles.sectionTitle}>{title} ({items.length})</Text>
      {items.map(coupon => (
        <CouponCard key={coupon.id} coupon={coupon} type={type} onPress={handleSelectCoupon} />
      ))}
    </>
  );

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner message="쿠폰 로딩 중..." />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.gold} colors={[Colors.gold]} />}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.icon}>🎟️</Text>
            <View style={styles.headerTextContainer}><Text style={styles.title}>내 쿠폰</Text><Text style={styles.subtitle}>{customer.nickname}</Text></View>
          </View>
          <View style={styles.statsRow}>
            {[[coupons.length, '전체'], [stampCoupons.length, '⭐ 스탬프'], [birthdayCoupons.length, '🎂 생일']].map(([val, lab], i) => (
              <View key={i} style={styles.statBox}><Text style={styles.statValue}>{val}</Text><Text style={styles.statLabel}>{lab}</Text></View>
            ))}
          </View>
        </View>

        {showUseForm && selectedCoupon && (
          <View style={styles.useForm}>
            <View style={styles.useFormHeader}>
              <Text style={styles.useFormTitle}>🔐 쿠폰 사용</Text>
              <TouchableOpacity onPress={handleCancelUse}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.selectedCouponInfo}>
              <Text style={styles.selectedCouponEmoji}>{getCouponType(selectedCoupon.coupon_code) === 'birthday' ? '🎂' : '⭐'}</Text>
              <View><Text style={styles.selectedCouponLabel}>선택한 쿠폰</Text><Text style={styles.selectedCouponCode}>{selectedCoupon.coupon_code}</Text></View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>관리자 비밀번호</Text>
              <TextInput ref={passwordInputRef} style={styles.input} value={password} onChangeText={setPassword} placeholder="비밀번호 입력" placeholderTextColor={Colors.purpleLight} secureTextEntry editable={!processing} autoCapitalize="none" onSubmitEditing={handleUseCoupon} />
            </View>
            <View style={styles.buttonRow}>
              <CustomButton title={processing ? '처리 중...' : '✓ 사용'} onPress={handleUseCoupon} disabled={processing} loading={processing} style={styles.useButton} />
              <CustomButton title="✕ 취소" onPress={handleCancelUse} disabled={processing} variant="danger" style={styles.cancelButton} />
            </View>
          </View>
        )}

        {renderSection('⭐ 스탬프 쿠폰', stampCoupons, 'stamp')}
        {renderSection('🎂 생일 쿠폰', birthdayCoupons, 'birthday')}

        {coupons.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyTitle}>보유한 쿠폰이 없습니다</Text>
            <Text style={styles.emptyText}>스탬프 10개를 모아서{'\n'}쿠폰을 받아보세요!</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 사용 안내</Text>
          <Text style={styles.infoText}>• 쿠폰을 탭하면 사용 화면이 나타납니다{'\n'}• 관리자에게 화면을 보여주세요{'\n'}• 스탬프 쿠폰: 무제한 사용 가능{'\n'}• 생일 쿠폰: 유효기간 내 사용 가능</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 140 },
  header: { backgroundColor: Colors.purpleMid, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 3, borderColor: Colors.gold, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  icon: { fontSize: 32, marginRight: 12 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.gold, textShadowColor: 'rgba(255, 215, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { fontSize: 13, color: Colors.lavender },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: 'rgba(255, 215, 0, 0.15)', borderWidth: 2, borderColor: Colors.gold, borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  statLabel: { fontSize: 11, color: Colors.lavender, fontWeight: '600' },
  useForm: { backgroundColor: Colors.purpleMid, borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 3, borderColor: Colors.gold, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  useFormHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  useFormTitle: { fontSize: 18, fontWeight: '700', color: Colors.gold },
  closeButton: { fontSize: 24, color: Colors.redSoft, fontWeight: '700' },
  selectedCouponInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(138, 43, 226, 0.3)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 12, padding: 15, marginBottom: 15 },
  selectedCouponEmoji: { fontSize: 32 },
  selectedCouponLabel: { fontSize: 11, color: Colors.lavender, marginBottom: 4 },
  selectedCouponCode: { fontSize: 16, fontWeight: '700', color: Colors.gold, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.gold, marginBottom: 8 },
  input: { backgroundColor: 'rgba(138, 43, 226, 0.15)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 12, padding: 15, fontSize: 16, color: 'white', textAlign: 'center', fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  useButton: { flex: 1 },
  cancelButton: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.gold, marginBottom: 12, marginTop: 20 },
  infoBox: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 15, padding: 20, marginTop: 20 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: Colors.gold, marginBottom: 10 },
  infoText: { fontSize: 13, color: Colors.lavender, lineHeight: 20 },
  emptyContainer: { alignItems: 'center', padding: 60, backgroundColor: Colors.purpleMid, borderRadius: 20, borderWidth: 3, borderColor: Colors.purpleLight, marginTop: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.gold, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.lavender, textAlign: 'center', lineHeight: 22 },
});

export default CouponScreen;