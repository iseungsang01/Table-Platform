import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerTheme } from '../constants/DrawerTheme';

/**
 * 서랍장 틀 컴포넌트
 * @param {boolean} isManualMode - 현재 개인 메모(OFF) 모드인지 여부
 * @param {boolean} selectionMode - 다중 선택 모드 여부
 */
export const DrawerChest = ({ children, isManualMode, selectionMode }) => {
  // 모드에 따른 색상 결정
  const frameColor = isManualMode ? DrawerTheme.navyLight : DrawerTheme.woodFrame;
  const bodyColor = isManualMode ? '#10171E' : DrawerTheme.woodDark; // OFF일 때 더 깊은 네이비

  // ✅ 선택 모드일 때 프레임 강조
  const finalFrameColor = selectionMode ? DrawerTheme.selectionBorder : frameColor;

  return (
    <View style={styles.chestContainer}>
      {/* 가구 상판 몰딩 */}
      <View style={[
        styles.topMolding, 
        { backgroundColor: finalFrameColor },
        selectionMode && styles.selectionGlow
      ]} />
      <View style={[styles.topSubMolding, { backgroundColor: bodyColor }]} />

      <View style={[
        styles.mainBody, 
        { borderColor: finalFrameColor, backgroundColor: bodyColor },
        selectionMode && { borderWidth: 12 }
      ]}>
        {/* 서랍들이 쌓이는 중심부 */}
        <View style={[styles.drawerContent, { backgroundColor: bodyColor }]}>
          {children}
        </View>
      </View>

      {/* 가구 하단 받침 */}
      <View style={[styles.bottomMolding, { backgroundColor: finalFrameColor }]} />
      <View style={styles.legsRow}>
        <View style={[styles.leg, { backgroundColor: finalFrameColor }]} />
        <View style={[styles.leg, { backgroundColor: finalFrameColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chestContainer: { 
    width: '96%', 
    alignSelf: 'center', 
    marginVertical: 10 
  },
  topMolding: { 
    width: '106%', 
    height: 10, 
    alignSelf: 'center', 
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8,
    // 금속 느낌 혹은 나무 광택 느낌을 위한 미세한 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  topSubMolding: { 
    width: '102%', 
    height: 8, 
    alignSelf: 'center' 
  },
  mainBody: { 
    borderLeftWidth: 10, 
    borderRightWidth: 10,
  },
  drawerContent: { 
    paddingTop: 5,
    paddingBottom: 10
  },
  bottomMolding: { 
    width: '104%', 
    height: 12, 
    alignSelf: 'center', 
    borderBottomLeftRadius: 6, 
    borderBottomRightRadius: 6 
  },
  legsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 40, 
    marginTop: -2 
  },
  leg: { 
    width: 22, 
    height: 20, 
    borderBottomLeftRadius: 10, 
    borderBottomRightRadius: 10 
  },

  // ✅ 선택 모드 효과
  selectionGlow: {
    shadowColor: DrawerTheme.goldBright,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 8,
  },
});