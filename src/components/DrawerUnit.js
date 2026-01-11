import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export const DrawerUnit = ({ visit, onSelectCard }) => {
  // 날짜 형식 변환: 2026-01-11 -> 2026.1.11 (요청하신 형식)
  const displayDate = visit.visit_date ? 
    visit.visit_date.split('T')[0].split('-').map(Number).join('.') : '';

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity 
        activeOpacity={0.85} 
        onPress={() => onSelectCard(visit)}
        style={styles.drawerFront}
      >
        {/* 서랍 전면 몰딩 프레임 (가구 테두리) */}
        <View style={styles.bezel}>
          
          {/* 우상단 날짜: 2026.1.11 (고급스러운 세리프체) */}
          <Text style={styles.dateText}>{displayDate}</Text>

          {/* 중앙 황동 손잡이부: 크기를 줄여 세련되게 변경 */}
          <View style={styles.knobSystem}>
            {/* 손잡이 뒤 장식판 (Plate) */}
            <View style={styles.knobPlate} />
            {/* 메인 손잡이 (Knob): 작고 입체적으로 변경 */}
            <View style={styles.knobHandle}>
              <View style={styles.knobShine} />
            </View>
          </View>
          
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    // 서랍 사이의 깊은 틈새 (가로 선)
    borderBottomWidth: 3,
    borderBottomColor: '#1A0F0A',
  },
  drawerFront: {
    height: 105, // 살짝 슬림하게 조정
    backgroundColor: '#8B5A2B', // 월넛 원목 베이스
    padding: 6,
    // 서랍 자체의 입체감 (위는 밝게, 아래는 어둡게)
    borderTopWidth: 1.5,
    borderTopColor: '#B08968',
    borderBottomWidth: 5,
    borderBottomColor: '#3E2723',
  },
  bezel: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)', // 원목 내부 홈 몰딩
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    position: 'absolute',
    top: 8,
    right: 15,
    fontSize: 18,
    color: '#FFD700', // 황금색 날짜
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Times New Roman',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  knobSystem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  knobPlate: {
    width: 32, // 장식판 크기도 축소
    height: 6,
    backgroundColor: '#4E342E',
    borderRadius: 1,
    opacity: 0.5,
    position: 'absolute',
  },
  knobHandle: {
    width: 16, // 손잡이 크기를 16으로 줄임 (세련된 비율)
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D4AF37', // 황동 골드
    borderWidth: 1.5,
    borderColor: '#B8860B',
    // 그림자 강화 (작지만 튀어나와 보이게)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
    elevation: 5,
    overflow: 'hidden',
  },
  knobShine: {
    // 손잡이 상단 광택 효과
    width: '100%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    position: 'absolute',
    top: 0,
  }
});