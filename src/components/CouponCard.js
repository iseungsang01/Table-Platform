import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { formatDateShort } from '../utils/formatters';
import { Colors } from '../constants/Colors';

/**
 * 쿠폰 카드 컴포넌트
 * 개별 쿠폰 정보를 표시하고 사용 가능
 * 
 * @param {object} coupon - 쿠폰 데이터
 * @param {string} type - 쿠폰 타입 ('stamp' | 'birthday')
 * @param {function} onPress - 클릭 핸들러
 */
export const CouponCard = ({ coupon, type, onPress }) => {
  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
  const color = type === 'stamp' ? Colors.gold : '#ffb6c1';
  const icon = type === 'stamp' ? '⭐' : '🎂';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: isExpired ? '#666' : color },
        isExpired && styles.cardExpired,
      ]}
      onPress={() => !isExpired && onPress(coupon)}
      disabled={isExpired}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, isExpired && styles.iconExpired]}>{icon}</Text>
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={[styles.category, { color: isExpired ? '#999' : color }]}>
              {type === 'stamp' ? '⭐ 스탬프 쿠폰' : '🎂 생일 쿠폰'}
            </Text>
            {isExpired && (
              <View style={styles.expiredBadge}>
                <Text style={styles.expiredBadgeText}>만료</Text>
              </View>
            )}
          </View>

          <View style={styles.dates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>발급</Text>
              <Text style={styles.dateValue}>{formatDateShort(coupon.issued_at)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>만료</Text>
              <Text
                style={[
                  styles.dateValue,
                  {
                    color: coupon.valid_until
                      ? isExpired
                        ? Colors.redSoft
                        : Colors.green
                      : Colors.green,
                  },
                ]}
              >
                {coupon.valid_until ? formatDateShort(coupon.valid_until) : '무제한'}
              </Text>
            </View>
          </View>

          {!isExpired && (
            <View style={[styles.tapHint, { backgroundColor: `${color}22` }]}>
              <Text style={[styles.tapHintText, { color }]}>👆 탭하여 사용</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardExpired: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    fontSize: 32,
    lineHeight: 32,
  },
  iconExpired: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 13,
    fontWeight: '700',
  },
  expiredBadge: {
    backgroundColor: '#ff4444',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  expiredBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  dates: {
    flexDirection: 'row',
    gap: 6,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.lavender,
    opacity: 0.7,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.lavender,
  },
  tapHint: {
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
});