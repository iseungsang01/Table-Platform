import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerTheme } from '../constants/DrawerTheme';

export const DrawerChest = ({ children }) => {
  return (
    <View style={styles.chestContainer}>
      {/* 가구 상판 몰딩 */}
      <View style={[styles.topMolding, { backgroundColor: DrawerTheme.woodFrame }]} />
      <View style={[styles.topSubMolding, { backgroundColor: DrawerTheme.woodDark }]} />

      <View style={[styles.mainBody, { borderColor: DrawerTheme.woodFrame, backgroundColor: DrawerTheme.woodDark }]}>
        {/* 서랍들이 쌓이는 중심부 */}
        <View style={styles.drawerContent}>
          {children}
        </View>
      </View>

      {/* 가구 하단 받침 */}
      <View style={[styles.bottomMolding, { backgroundColor: DrawerTheme.woodFrame }]} />
      <View style={styles.legsRow}>
        <View style={[styles.leg, { backgroundColor: DrawerTheme.woodFrame }]} />
        <View style={[styles.leg, { backgroundColor: DrawerTheme.woodFrame }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chestContainer: { width: '96%', alignSelf: 'center', marginVertical: 10 },
  topMolding: { width: '106%', height: 10, alignSelf: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  topSubMolding: { width: '102%', height: 8, alignSelf: 'center' },
  mainBody: { borderLeftWidth: 10, borderRightWidth: 10 },
  drawerContent: { backgroundColor: DrawerTheme.woodDark },
  bottomMolding: { width: '104%', height: 12, alignSelf: 'center', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  legsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: -2 },
  leg: { width: 22, height: 20, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }
});