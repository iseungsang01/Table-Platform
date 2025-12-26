import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * 타로 카드 컴포넌트
 * 카드 선택 화면에서 개별 카드 표시
 * 
 * @param {object} card - 타로 카드 데이터 { id, emoji, name, meaning }
 * @param {boolean} selected - 선택 상태
 * @param {function} onPress - 클릭 핸들러
 */
export const TarotCard = ({ card, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={() => onPress(card)}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{card.emoji}</Text>
      <Text style={styles.name}>{card.name}</Text>
      <Text style={styles.meaning}>{card.meaning}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    margin: 5,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  cardSelected: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    transform: [{ scale: 1.05 }],
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 5,
    textAlign: 'center',
  },
  meaning: {
    fontSize: 14,
    color: Colors.lavender,
    textAlign: 'center',
  },
});