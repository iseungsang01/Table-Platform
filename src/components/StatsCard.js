import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * 통계 카드 컴포넌트
 * 스탬프, 방문 횟수, 쿠폰 등의 통계 정보 표시
 * 
 * @param {string} label - 라벨 텍스트
 * @param {string|number} value - 표시할 값
 * @param {string} icon - 아이콘 이모지
 * @param {function} onPress - 클릭 핸들러 (선택적)
 */
export const StatsCard = ({ label, value, icon, onPress }) => {
  const CardContent = (
    <View style={[styles.card, onPress && styles.cardClickable]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  cardClickable: {
    borderColor: Colors.gold,
  },
  icon: {
    fontSize: 24,
    marginBottom: 5,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 5,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  label: {
    fontSize: 14,
    color: Colors.lavender,
    textAlign: 'center',
  },
});