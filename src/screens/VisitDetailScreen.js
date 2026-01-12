import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 개별 임포트
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { compressImage } from '../utils/imageOptimizer';
import { Colors } from '../constants/Colors';
import { DrawerTheme } from '../constants/DrawerTheme';
import { handleApiCall, showErrorAlert, showSuccessAlert, createPermissionError } from '../utils/errorHandler';

const LOCAL_STORAGE_KEY = 'offline_visit_history';

const VisitDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { visitId, mode } = route.params || {};
  const isOffMode = mode === 'manual'; // OFF 모드 (로컬 저장)
  const { customer } = useAuth();

  // 통합 상태 관리
  const [s, setS] = useState({
    uri: null, review: '', loading: !isOffMode, saving: false,
    isEdit: false
  });
  const up = (next) => setS(p => ({ ...p, ...next }));

  useEffect(() => {
    loadData();
  }, [visitId]);

  // 데이터 로드: ON 모드는 서버에서, OFF 모드는 로컬에서
  const loadData = async () => {
    if (isOffMode) {
      if (visitId) { // 로컬 데이터 수정 시
        const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        const list = stored ? JSON.parse(stored) : [];
        const item = list.find(v => v.id === visitId);
        if (item) up({ isEdit: true, uri: item.card_image, review: item.card_review, loading: false });
      }
      return;
    }

    // ON 모드: 서버 데이터 로드
    const { data } = await handleApiCall('VisitDetail.load', () => visitService.getVisit(visitId));
    if (data) up({ isEdit: true, uri: data.card_image, review: data.card_review || '', loading: false });
    else up({ loading: false });
  };

  // 이미지 선택 및 압축
  const onPick = async (type) => {
    const perm = type === 'cam' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return showErrorAlert(createPermissionError(type.toUpperCase()), Alert);

    const res = await (type === 'cam' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({
      allowsEditing: true, aspect: [4, 3], quality: 0.7
    });
    
    if (!res.canceled && res.assets[0]) {
      try {
        const comp = await compressImage(res.assets[0].uri, { maxWidth: 800, quality: 0.6 });
        up({ uri: comp.base64 });
      } catch { Alert.alert("오류", "이미지 처리에 실패했습니다."); }
    }
  };

  // 저장 로직 (분기 처리)
  const onSave = async () => {
    if (!s.uri && !s.review.trim()) return Alert.alert("알림", "기록할 내용을 입력해주세요.");
    up({ saving: true });

    const payload = {
      card_review: s.review.trim(),
      card_image: s.uri,
      visit_date: new Date().toISOString(),
      customer_id: customer?.id,
      is_manual: isOffMode
    };

    try {
      if (isOffMode) {
        // --- [OFF 모드] 로컬 저장 ---
        const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        let list = stored ? JSON.parse(stored) : [];
        
        if (s.isEdit) {
          list = list.map(v => v.id === visitId ? { ...v, ...payload } : v);
        } else {
          list = [{ ...payload, id: `local_${Date.now()}` }, ...list];
        }
        
        await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        showSuccessAlert(s.isEdit ? 'UPDATE' : 'SAVE', Alert);
      } else {
        // --- [ON 모드] 서버 저장 ---
        const { error } = await handleApiCall('Visit.save', () => 
          s.isEdit ? visitService.updateVisit(visitId, payload) : visitService.createVisit(payload)
        );
        if (error) throw error;
        showSuccessAlert(s.isEdit ? 'UPDATE' : 'SAVE', Alert);
      }
      setTimeout(() => navigation.goBack(), 1000);
    } catch (err) {
      up({ saving: false });
    }
  };

  if (s.loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  const theme = isOffMode ? { c: Colors.lavender, bg: Colors.purpleMid } : { c: DrawerTheme.goldBrass, bg: DrawerTheme.woodMid };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 50 }}>
            
            <View style={[styles.header, { backgroundColor: theme.bg, borderColor: theme.c }]}>
              <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.whiteText}>← 뒤로</Text></TouchableOpacity>
              <Text style={[styles.title, { color: theme.c }]}>{isOffMode ? '🔐 개인 메모' : '🏛️ 방문 기록'}</Text>
            </View>

            <View style={[styles.imgBox, { borderColor: theme.c }]}>
              {s.uri ? (
                <>
                  <Image source={{ uri: s.uri.startsWith('data') ? s.uri : `data:image/jpeg;base64,${s.uri}` }} style={styles.fullImg} />
                  <TouchableOpacity onPress={() => up({ uri: null })} style={styles.delBtn}><Text style={styles.whiteText}>✕</Text></TouchableOpacity>
                </>
              ) : <Text style={styles.placeholderText}>📷 사진을 추가하세요</Text>}
            </View>

            <View style={styles.btnRow}>
              <CustomButton title="촬영" onPress={() => onPick('cam')} style={{flex:1}} />
              <CustomButton title="앨범" onPress={() => onPick('lib')} variant="secondary" style={{flex:1}} />
            </View>

            <TextInput 
              style={styles.input} multiline value={s.review} onChangeText={v => up({ review: v })}
              placeholder="오늘의 기록을 남겨보세요..." placeholderTextColor="#888" 
            />
            
            <CustomButton 
              title={s.saving ? "저장 중..." : (isOffMode ? "비밀 서랍에 저장" : "서버에 저장")} 
              onPress={onSave} loading={s.saving} style={{marginTop: 20}} 
            />

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  header: { padding: 15, borderRadius: 12, borderWidth: 1.5, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  imgBox: { height: 260, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden' },
  fullImg: { width: '100%', height: '100%' },
  delBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,0,0,0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 18, color: '#FFF', minHeight: 160, textAlignVertical: 'top', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  whiteText: { color: '#FFF', fontWeight: 'bold' },
  placeholderText: { color: '#666', fontSize: 14 }
});

export default VisitDetailScreen;