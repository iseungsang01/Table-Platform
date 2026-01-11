import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export const DrawerUnit = ({ visit, onSelectCard }) => {
  // 날짜 형식 변환: 2026-01-11 -> 2026.1.11
  const displayDate = visit.visit_date ? 
    visit.visit_date.split('T')[0].split('-').map(Number).join('.') : '';

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => onSelectCard(visit)} // 클릭 시 바로 모달 오픈
        style={styles.drawerFront}
      >
        <View style={styles.bezel}>
          <Text style={styles.dateText}>{displayDate}</Text>

          <View style={styles.knobArea}>
            <View style={styles.knobBase} />
            <View style={styles.knobMain} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A0F0A',
  },
  drawerFront: {
    height: 110, // 약간 더 컴팩트하게 조절 가능
    backgroundColor: '#8B5A2B',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#B08968',
    borderBottomWidth: 5,
    borderBottomColor: '#3E2723',
  },
  bezel: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    position: 'absolute',
    top: 10,
    right: 15,
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Times New Roman',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  knobArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  knobBase: {
    width: 42,
    height: 14,
    backgroundColor: '#4E342E',
    borderRadius: 2,
    opacity: 0.4,
    position: 'absolute',
  },
  knobMain: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    borderWidth: 2,
    borderColor: '#B8860B',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  }
});