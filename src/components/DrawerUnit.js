import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { DrawerTheme } from '../constants/theme';

export const DrawerUnit = ({ visit, onSelectCard }) => {
  const displayDate = visit.visit_date ? 
    visit.visit_date.split('T')[0].split('-').map(Number).join('.') : '';

  return (
    <View style={[styles.drawerWrapper, { borderBottomColor: DrawerTheme.woodDark }]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => onSelectCard(visit)} 
        style={[styles.drawerFront, { backgroundColor: DrawerTheme.woodMid, borderTopColor: DrawerTheme.woodLight }]}
      >
        <View style={styles.bezel}>
          {/* 요청하신 날짜: 2026.1.11 (골드 브라이트) */}
          <Text style={[styles.dateText, { color: DrawerTheme.goldBright }]}>{displayDate}</Text>

          {/* 세련된 작은 손잡이 시스템 */}
          <View style={styles.knobSystem}>
            <View style={[styles.knobPlate, { backgroundColor: DrawerTheme.woodDark, opacity: 0.4 }]} />
            <View style={[styles.knobHandle, { backgroundColor: DrawerTheme.goldBrass, borderColor: DrawerTheme.goldDark }]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerWrapper: { borderBottomWidth: 3 },
  drawerFront: { 
    height: 100, padding: 8, borderTopWidth: 1.5, 
    borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.3)' 
  },
  bezel: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2, justifyContent: 'center', alignItems: 'center' },
  dateText: { 
    position: 'absolute', top: 8, right: 12, fontSize: 18, fontWeight: '900', letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 
  },
  knobSystem: { alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  knobPlate: { width: 34, height: 6, borderRadius: 1, position: 'absolute' },
  knobHandle: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2 }
});