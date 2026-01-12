import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl, Platform, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground, LoadingSpinner, CouponCard } from '../components';
import { useAuth } from '../hooks/useAuth';
import { couponService } from '../services/couponService';
import { AdminPassword } from '../services/supabase';
import { DrawerTheme } from '../constants/DrawerTheme';
import { handleApiCall, createValidationError, showErrorAlert, showSuccessAlert } from '../utils/errorHandler';

const CouponScreen = ({ navigation }) => {
  const { customer, refreshCustomer } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const passwordInputRef = useRef(null);

  const getCouponType = (code) => (code?.startsWith('BIRTHDAY') || code?.startsWith('BIRTH') ? 'birthday' : 'stamp');

  const loadCoupons = async () => {
    const { data, error } = await handleApiCall('CouponScreen.loadCoupons', () => couponService.getCoupons(customer.id));
    if (!error && data) setCoupons(data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadCoupons(); }, []));

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCoupons(), refreshCustomer()]);
    setRefreshing(false);
  };

  const handleSelectCoupon = (coupon) => {
    if (selectedCouponId === coupon.id) {
      handleCancelUse();
    } else {
      setSelectedCouponId(coupon.id);
      setPassword('');
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  };

  const handleCancelUse = () => {
    Keyboard.dismiss();
    setSelectedCouponId(null);
    setPassword('');
  };

  const handleUseCoupon = async (coupon) => {
    // 1. 비밀번호 공백 체크
    if (!password.trim()) {
      showErrorAlert(createValidationError('PASSWORD_EMPTY'), Alert);
      return;
    }
    
    // 2. 비밀번호 일치 여부 체크 (메시지 수정)
    if (password !== AdminPassword) {
      Alert.alert('인증 실패', '관리자 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    Keyboard.dismiss();
    const typeNm = getCouponType(coupon.coupon_code) === 'birthday' ? '생일 쿠폰' : '스탬프 쿠폰';

    Alert.alert('쿠폰 사용', `${typeNm}을 사용하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '사용 확정', onPress: async () => {
        setProcessing(true);
        const { error } = await handleApiCall('CouponScreen.handleUseCoupon', () => couponService.useCoupon(coupon.id));
        if (!error) {
          showSuccessAlert('COUPON_USED', Alert, `✅ ${typeNm}이 사용되었습니다!`);
          handleCancelUse();
          await Promise.all([loadCoupons(), refreshCustomer()]);
        }
        setProcessing(false);
      }}
    ]);
  };

  const renderCouponItem = (coupon) => {
    const isSelected = selectedCouponId === coupon.id;
    const type = getCouponType(coupon.coupon_code);
    const couponTitle = type === 'birthday' ? '🎂 생일 축하 쿠폰' : '⭐ 스탬프 완성 쿠폰';

    return (
      <View key={coupon.id} style={styles.couponWrapper}>
        <CouponCard 
          coupon={coupon} 
          type={type} 
          onPress={() => handleSelectCoupon(coupon)} 
          containerStyle={isSelected ? styles.selectedCard : null}
        />
        
        {isSelected && (
          <View style={styles.inlineForm}>
            <View style={styles.formHeader}>
              <Text style={styles.selectedCouponTitle}>{couponTitle}</Text>
              <Text style={styles.formLabel}>관리자 인증이 필요합니다</Text>
            </View>

            <TextInput 
              ref={passwordInputRef} 
              style={styles.inlineInput} 
              value={password} 
              onChangeText={setPassword} 
              placeholder="관리자 비밀번호" 
              placeholderTextColor="rgba(255,255,255,0.15)" 
              secureTextEntry 
              autoCapitalize="none"
              onSubmitEditing={() => handleUseCoupon(coupon)}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]} 
                onPress={() => handleUseCoupon(coupon)}
                disabled={processing}
              >
                <Text style={styles.submitBtnText}>{processing ? '처리 중' : '사용 확정'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleCancelUse}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  const stampCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'stamp');
  const birthdayCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'birthday');

  return (
    <GradientBackground>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={DrawerTheme.goldBrass} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COUPON BOX</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSubtitle}>{customer.nickname}님의 소장함</Text>
          <View style={styles.statsRow}>
            {[[coupons.length, '보유중'], [stampCoupons.length, '스탬프'], [birthdayCoupons.length, '생일']].map(([val, lab], i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statValue}>{val}</Text>
                <Text style={styles.statLabel}>{lab}</Text>
              </View>
            ))}
          </View>
        </View>

        {stampCoupons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 스탬프 쿠폰</Text>
            {stampCoupons.map(renderCouponItem)}
          </View>
        )}

        {birthdayCoupons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎁 생일 쿠폰</Text>
            {birthdayCoupons.map(renderCouponItem)}
          </View>
        )}

        {coupons.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>보유하신 쿠폰이 없습니다.</Text>
          </View>
        )}

        {/* 안내 사항 다시 복구 및 스타일 개선 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 사용 안내</Text>
          <Text style={styles.infoText}>
            • 쿠폰을 탭하면 인증 화면이 나타납니다{'\n'}
            • 관리자에게 화면을 보여주세요{'\n'}
            • 스탬프 쿠폰: 스탬프 10개 모으면 쿠폰 1개 지급{'\n'}
            • 생일 쿠폰: 유효기간 내 1회 사용 가능
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100 },
  header: { 
    backgroundColor: DrawerTheme.woodDark, borderRadius: 8, padding: 20, marginBottom: 25, 
    borderWidth: 1.5, borderColor: DrawerTheme.woodFrame, alignItems: 'center'
  },
  headerTitle: { fontSize: 20, color: DrawerTheme.goldBrass, fontWeight: 'bold', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Cochin' : 'serif' },
  headerDivider: { width: 30, height: 2, backgroundColor: DrawerTheme.goldBrass, marginVertical: 10 },
  headerSubtitle: { fontSize: 12, color: DrawerTheme.woodLight, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 10, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(212,175,55,0.2)' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 10, color: DrawerTheme.woodLight, marginTop: 2 },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: DrawerTheme.goldBrass, marginBottom: 15, marginLeft: 5 },
  
  couponWrapper: { marginBottom: 12 },
  selectedCard: { borderColor: DrawerTheme.goldBrass, borderWidth: 1.5 },
  
  inlineForm: { 
    backgroundColor: 'rgba(24, 22, 20, 0.98)', 
    marginTop: -4, marginHorizontal: 4,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    padding: 18, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', borderTopWidth: 0,
    elevation: 8
  },
  formHeader: { alignItems: 'center', marginBottom: 15 },
  selectedCouponTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  formLabel: { color: '#666', fontSize: 10 },
  
  inlineInput: { 
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 14, 
    color: DrawerTheme.goldBright, fontSize: 15, textAlign: 'center', marginBottom: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  formButtons: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  submitBtn: { backgroundColor: DrawerTheme.goldBrass },
  submitBtnText: { color: '#1A1A1A', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cancelBtnText: { color: '#777', fontSize: 14 },

  // 안내 상자 스타일
  infoBox: { marginTop: 10, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(212,175,55,0.1)' },
  infoTitle: { color: DrawerTheme.woodLight, fontSize: 13, fontWeight: 'bold', marginBottom: 12 },
  infoText: { color: '#888', fontSize: 12, lineHeight: 20 },
  
  emptyContainer: { padding: 80, alignItems: 'center' },
  emptyText: { color: DrawerTheme.woodLight, fontSize: 14, fontStyle: 'italic' }
});

export default CouponScreen;