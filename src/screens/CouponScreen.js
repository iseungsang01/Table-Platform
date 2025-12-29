import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { CouponCard } from '../components/CouponCard';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { couponService } from '../services/couponService';
import { AdminPassword } from '../services/supabase';
import { Colors } from '../constants/Colors';

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

  useFocusEffect(
    useCallback(() => {
      loadCoupons();
    }, [])
  );

  /**
   * 쿠폰 목록 조회
   */
  const loadCoupons = async () => {
    const { data, error } = await couponService.getCoupons(customer.id);
    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  /**
   * 새로고침
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCoupons();
    setRefreshing(false);
  };

  /**
   * 쿠폰 선택
   */
  const handleSelectCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowUseForm(true);
    setPassword('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  /**
   * 쿠폰 사용 취소
   */
  const handleCancelUse = () => {
    Keyboard.dismiss();
    setSelectedCoupon(null);
    setShowUseForm(false);
    setPassword('');
  };

  /**
   * 쿠폰 사용
   */
  const handleUseCoupon = async () => {
    if (!selectedCoupon) {
      Alert.alert('알림', '사용할 쿠폰을 선택해주세요.');
      return;
    }

    if (password !== AdminPassword) {
      Alert.alert('오류', '비밀번호가 올바르지 않습니다.');
      return;
    }

    Keyboard.dismiss();

    const couponType = selectedCoupon.coupon_code.startsWith('BIRTHDAY') ? '생일 쿠폰' : '스탬프 쿠폰';

    Alert.alert(
      '쿠폰 사용',
      `${couponType}을 사용하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '사용',
          onPress: async () => {
            setProcessing(true);

            // 쿠폰 삭제만 수행 (customers.coupons 업데이트 안 함)
            const { error } = await couponService.useCoupon(selectedCoupon.id);

            if (error) {
              Alert.alert('오류', '쿠폰 사용 중 오류가 발생했습니다.');
              setProcessing(false);
              return;
            }

            Alert.alert('완료', `✅ ${couponType}이 사용되었습니다!`);
            handleCancelUse();
            await loadCoupons();
            
            // 고객 정보 새로고침 (스탬프 정보 업데이트)
            await refreshCustomer();
            
            setProcessing(false);
          },
        },
      ]
    );
  };

  /**
   * 쿠폰 타입 판별
   */
  const getCouponType = (code) => {
    if (code.startsWith('BIRTHDAY') || code.startsWith('BIRTH')) return 'birthday';
    return 'stamp';
  };

  const stampCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'stamp');
  const birthdayCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'birthday');

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.icon}>🎟️</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>내 쿠폰</Text>
              <Text style={styles.subtitle}>{customer.nickname}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{coupons.length}</Text>
              <Text style={styles.statLabel}>전체</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{stampCoupons.length}</Text>
              <Text style={styles.statLabel}>⭐ 스탬프</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{birthdayCoupons.length}</Text>
              <Text style={styles.statLabel}>🎂 생일</Text>
            </View>
          </View>
        </View>

        {/* 쿠폰 사용 폼 */}
        {showUseForm && selectedCoupon && (
          <View style={styles.useForm}>
            <View style={styles.useFormHeader}>
              <Text style={styles.useFormTitle}>🔐 쿠폰 사용</Text>
              <TouchableOpacity onPress={handleCancelUse}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedCouponInfo}>
              <Text style={styles.selectedCouponEmoji}>
                {getCouponType(selectedCoupon.coupon_code) === 'birthday' ? '🎂' : '⭐'}
              </Text>
              <View>
                <Text style={styles.selectedCouponLabel}>선택한 쿠폰</Text>
                <Text style={styles.selectedCouponCode}>{selectedCoupon.coupon_code}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>관리자 비밀번호</Text>
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호 입력"
                placeholderTextColor={Colors.purpleLight}
                secureTextEntry
                editable={!processing}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleUseCoupon}
              />
            </View>

            <View style={styles.buttonRow}>
              <CustomButton
                title={processing ? '처리 중...' : '✓ 사용'}
                onPress={handleUseCoupon}
                disabled={processing}
                loading={processing}
                style={styles.useButton}
              />
              <CustomButton
                title="✕ 취소"
                onPress={handleCancelUse}
                disabled={processing}
                variant="danger"
                style={styles.cancelButton}
              />
            </View>
          </View>
        )}

        {/* 스탬프 쿠폰 */}
        {stampCoupons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⭐ 스탬프 쿠폰 ({stampCoupons.length})</Text>
            {stampCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                type="stamp"
                onPress={handleSelectCoupon}
              />
            ))}
          </>
        )}

        {/* 생일 쿠폰 */}
        {birthdayCoupons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🎂 생일 쿠폰 ({birthdayCoupons.length})</Text>
            {birthdayCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                type="birthday"
                onPress={handleSelectCoupon}
              />
            ))}
          </>
        )}

        {/* 빈 상태 */}
        {coupons.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎟️</Text>
            <Text style={styles.emptyTitle}>보유한 쿠폰이 없습니다</Text>
            <Text style={styles.emptyText}>스탬프 10개를 모아서{'\n'}쿠폰을 받아보세요!</Text>
          </View>
        )}

        {/* 안내 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 사용 안내</Text>
          <Text style={styles.infoText}>
            • 쿠폰을 탭하면 사용 화면이 나타납니다{'\n'}
            • 관리자에게 화면을 보여주세요{'\n'}
            • 스탬프 쿠폰: 무제한 사용 가능{'\n'}
            • 생일 쿠폰: 생일 전후 15일간 사용 가능
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.lavender,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.lavender,
    fontWeight: '600',
  },
  useForm: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  useFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  useFormTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.redSoft,
    fontWeight: '700',
  },
  selectedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  selectedCouponEmoji: {
    fontSize: 32,
  },
  selectedCouponLabel: {
    fontSize: 11,
    color: Colors.lavender,
    marginBottom: 4,
  },
  selectedCouponCode: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  useButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 12,
    marginTop: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: Colors.lavender,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.lavender,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CouponScreen;