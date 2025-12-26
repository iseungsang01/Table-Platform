import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * 투표 옵션 컴포넌트
 * 개별 투표 선택지 표시
 * 
 * @param {object} option - 옵션 데이터 { id, text }
 * @param {boolean} selected - 선택 상태
 * @param {boolean} isMultiple - 복수 선택 가능 여부
 * @param {function} onPress - 클릭 핸들러
 * @param {boolean} showResults - 결과 보기 모드
 * @param {number} percentage - 득표율
 * @param {number} votes - 투표 수
 * @param {boolean} isMyChoice - 내가 선택한 옵션
 */
export const VoteOption = ({
  option,
  selected,
  isMultiple,
  onPress,
  showResults = false,
  percentage = 0,
  votes = 0,
  isMyChoice = false,
}) => {
  if (showResults) {
    // 결과 보기 모드
    return (
      <View style={[styles.resultCard, isMyChoice && styles.resultCardMy]}>
        {/* 진행바 배경 */}
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />

        {/* 옵션 내용 */}
        <View style={styles.resultContent}>
          <View style={styles.resultTextRow}>
            <Text style={[styles.resultText, isMyChoice && styles.resultTextMy]}>
              {isMyChoice && '✓ '}
              {option.text}
            </Text>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
          <Text style={styles.votesText}>{votes}표</Text>
        </View>
      </View>
    );
  }

  // 투표하기 모드
  return (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={() => onPress(option.id)}
      activeOpacity={0.7}
    >
      <View style={styles.optionRow}>
        {/* 체크박스 */}
        <View
          style={[
            styles.checkbox,
            isMultiple && styles.checkboxSquare,
            selected && styles.checkboxSelected,
          ]}
        >
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* 옵션 텍스트 */}
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {option.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 투표하기 모드 스타일
  optionCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  optionCardSelected: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquare: {
    borderRadius: 6,
  },
  checkboxSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  checkmark: {
    color: Colors.purpleDark,
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  optionTextSelected: {
    color: Colors.gold,
  },

  // 결과 보기 모드 스타일
  resultCard: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  resultCardMy: {
    borderColor: Colors.gold,
    borderWidth: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(138, 43, 226, 0.4)',
    borderRadius: 12,
  },
  resultContent: {
    position: 'relative',
    zIndex: 1,
  },
  resultTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  resultTextMy: {
    color: Colors.gold,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  votesText: {
    fontSize: 14,
    color: Colors.lavender,
  },
});