import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { DrawerTheme } from '../constants/DrawerTheme'; 

export const DrawerUnit = ({ visit, onSelectCard }) => {
  // 1. ON(DB)은 Wood, OFF(수동)은 Navy
  const isOnMode = visit.isDbRecord === true;
  
  // 2. 작성 여부 판단 (글이 있거나 카드가 있으면 작성된 것으로 간주)
  const isWritten = !!(visit.card_review && visit.card_review.trim()) || !!visit.card_image;

  const theme = {
    mid: isOnMode ? DrawerTheme.woodMid : DrawerTheme.navyMid,
    light: isOnMode ? DrawerTheme.woodLight : DrawerTheme.navyLight,
    dark: isOnMode ? DrawerTheme.woodDark : DrawerTheme.navyDark,
  };

  const displayDate = visit.visit_date ? 
    visit.visit_date.split('T')[0].split('-').map(Number).join('.') : '';

  return (
    <View style={[styles.drawerWrapper, { borderBottomColor: DrawerTheme.woodDark }]}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => onSelectCard(visit)} 
        style={[
          styles.drawerFront, 
          { backgroundColor: theme.mid, borderTopColor: theme.light },
          // 미작성된 Wood 서랍일 경우 약간 불투명하게 처리하여 구분
          (isOnMode && !isWritten) && { opacity: 0.7 }
        ]}
      >
        <View style={styles.bezel}>
          {/* 날짜 표시 */}
          <Text style={[styles.dateText, { color: DrawerTheme.goldBright }]}>{displayDate}</Text>

          {/* 작성 여부 인디케이터 (Wood 서랍이면서 미작성일 때만 '미작성' 표시) */}
          {isOnMode && !isWritten && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>EMPTY</Text>
            </View>
          )}

          {/* 공통 황동 손잡이 */}
          <View style={styles.knobSystem}>
            <View style={[styles.knobPlate, { backgroundColor: theme.dark, opacity: 0.5 }]} />
            <View style={[styles.knobHandle, { backgroundColor: DrawerTheme.goldBrass, borderColor: DrawerTheme.goldDark }]} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerWrapper: { borderBottomWidth: 3 },
  drawerFront: { height: 100, padding: 8, borderTopWidth: 1.5, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.3)' },
  bezel: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2, justifyContent: 'center', alignItems: 'center' },
  dateText: { 
    position: 'absolute', top: 8, right: 12, fontSize: 18, fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 
  },
  statusBadge: {
    position: 'absolute', top: 10, left: 12,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)'
  },
  statusText: { color: '#AAA', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  knobSystem: { alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  knobPlate: { width: 34, height: 6, borderRadius: 1, position: 'absolute' },
  knobHandle: { 
    width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, 
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2 
  }
});