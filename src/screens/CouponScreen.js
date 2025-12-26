import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Platform,
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

  useFocusEffect(
    useCallback(() => {
      loadCoupons();
    }, [customer])
  );

  const loadCoupons = async () => {
    const { data, error } = await couponService.getCoupons(customer.id);
    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCoupons();
    setRefreshing(false);
  };

  const handleSelectCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowUseForm(true);
    setPassword('');
  };

  const handleCancelUse = () => {
    setSelectedCoupon(null);
    setShowUseForm(false);
    setPassword('');
  };

  const handleUseCoupon = async () => {
    if (!selectedCoupon) {
      Alert.alert('알림', '사용할 쿠폰을 선택해주세요.');
      return;
    }

    if (password !== AdminPassword) {
      Alert.alert('오류', '비밀번호가 올바르지 않습니다.');
      return;
    }

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

            const { error } = await couponService.useCoupon(selectedCoupon.id, customer.id);

            if (error) {
              Alert.alert('오류', '쿠폰 사용 중 오류가 발생했습니다.');
              setProcessing(false);
              return;
            }

            Alert.alert('완료', `✅ ${couponType}이 사용되었습니다!`);
            await loadCoupons();
            await refreshCustomer();
            handleCancelUse();
            setProcessing(false);
          },
        },
      ]
    );
  };

  const getCouponType = (code) => {
    if (code.startsWith('BIRTHDAY') || code.startsWith('BIRTH')) return 'birthday';
    return 'stamp';
  };

  const stampCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'stamp');
  const birthdayCoupons = coupons.filter(c => getCouponType(c.coupon_code) === 'birthday');

  const renderHeader = () => (
    <View>
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
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 입력"
              placeholderTextColor={Colors.purpleLight}
              secureTextEntry
              editable={!processing}
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

      {stampCoupons.length > 0 && (
        <Text style={styles.sectionTitle}>⭐ 스탬프 쿠폰 ({stampCoupons.length})</Text>
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      {birthdayCoupons.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>🎂 생일 쿠폰 ({birthdayCoupons.length})</Text>
          {birthdayCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              type="birthday"
              onPress={handleSelectCoupon}
            />
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 사용 안내</Text>
        <Text style={styles.infoText}>
          • 쿠폰을 탭하면 사용 화면이 나타납니다{'\n'}
          • 관리자에게 화면을 보여주세요{'\n'}
          • 스탬프 쿠폰: 무제한 사용 가능{'\n'}
          • 생일 쿠폰: 생일 전후 15일간 사용 가능
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎟️</Text>
      <Text style={styles.emptyTitle}>보유한 쿠폰이 없습니다</Text>
      <Text style={styles.emptyText}>스탬프 10개를 모아서{'\n'}쿠폰을 받아보세요!</Text>
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
      <FlatList
        data={stampCoupons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CouponCard coupon={item} type="stamp" onPress={handleSelectCoupon} />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={coupons.length === 0 ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      />
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
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.lavender,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.lavender,
  },
  useForm: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  useFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  useFormTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.redSoft,
  },
  selectedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 1,
    borderColor: Colors.purpleLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  selectedCouponEmoji: {
    fontSize: 28,
  },
  selectedCouponLabel: {
    fontSize: 10,
    color: Colors.lavender,
    marginBottom: 2,
  },
  selectedCouponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  useButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 8,
    marginTop: 15,
  },
  infoBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 1,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 15,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: Colors.lavender,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.purpleMid,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.lavender,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default CouponScreen;