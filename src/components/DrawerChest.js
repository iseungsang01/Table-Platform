import React from 'react';
import { View, StyleSheet } from 'react-native';

export const DrawerChest = ({ children }) => {
  return (
    <View style={styles.chestWrapper}>
      {/* 가구 상판: 실제 가구처럼 3단 레이어 구성 */}
      <View style={styles.topMoldingContainer}>
        <View style={styles.topPlate} />
        <View style={styles.middleMolding} />
        <View style={styles.bottomShadow} />
      </View>

      <View style={styles.mainBody}>
        {/* 좌우 기둥 프레임 */}
        <View style={styles.sidePillarLeft} />
        <View style={styles.innerContent}>
          {children}
        </View>
        <View style={styles.sidePillarRight} />
      </View>

      {/* 가구 하단 및 다리 */}
      <View style={styles.bottomMolding} />
      <View style={styles.legsContainer}>
        <View style={styles.antiqueLeg} />
        <View style={styles.antiqueLeg} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chestWrapper: {
    width: '96%',
    alignSelf: 'center',
    marginVertical: 15,
  },
  topMoldingContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  topPlate: {
    width: '106%',
    height: 10,
    backgroundColor: '#5D4037', // 진한 월넛 색상
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: '#3E2723',
  },
  middleMolding: {
    width: '102%',
    height: 12,
    backgroundColor: '#4E342E',
    borderBottomWidth: 1,
    borderColor: '#2A1B12',
  },
  bottomShadow: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  mainBody: {
    flexDirection: 'row',
    backgroundColor: '#2A1B12',
    // 기둥 두께 강화
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderColor: '#4E342E',
  },
  innerContent: {
    flex: 1,
    backgroundColor: '#1A0F0A',
  },
  sidePillarLeft: {
    position: 'absolute',
    left: -10, top: 0, bottom: 0, width: 2,
    backgroundColor: 'rgba(255,255,255,0.05)', // 미세한 광택
  },
  sidePillarRight: {
    position: 'absolute',
    right: -10, top: 0, bottom: 0, width: 2,
    backgroundColor: 'rgba(0,0,0,0.2)', // 미세한 음영
  },
  bottomMolding: {
    width: '104%',
    alignSelf: 'center',
    height: 10,
    backgroundColor: '#3E2723',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  legsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: -2,
  },
  antiqueLeg: {
    width: 24,
    height: 30,
    backgroundColor: '#3E2723',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#2A1B12',
  },
});