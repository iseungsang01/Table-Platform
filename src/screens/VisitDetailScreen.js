import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GradientBackground, CustomButton, LoadingSpinner } from '../components';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { compressImage, formatFileSize } from '../utils/imageOptimizer';
import { Colors } from '../constants/Colors';
import { DrawerTheme } from '../constants/DrawerTheme';
import { handleApiCall, showErrorAlert, showSuccessAlert, createValidationError, createPermissionError, createStorageError } from '../utils/errorHandler';

const VisitDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { visitId, mode } = route.params || {};
  const isManualMode = mode === 'manual';
  const { customer } = useAuth();

  // 상태 관리
  const [state, setState] = useState({
    imageUri: null, review: '', loading: !isManualMode, saving: false,
    compressing: false, isEditMode: false, originalData: { image: null, review: null },
    imageInfo: null, message: { text: '', type: '' }
  });

  const updateState = (next) => setState(prev => ({ ...prev, ...next }));

  useEffect(() => {
    if (!isManualMode && visitId) loadVisitData();
  }, [visitId]);

  const loadVisitData = async () => {
    const { data, error } = await handleApiCall('VisitDetail.load', () => visitService.getVisit(visitId));
    if (data && !error) {
      updateState({
        isEditMode: true, imageUri: data.card_image, review: data.card_review || '',
        originalData: { image: data.card_image, review: data.card_review },
        loading: false, imageInfo: data.card_image ? { sizeFormatted: formatFileSize(data.card_image.length) } : null
      });
    } else updateState({ loading: false });
  };

  const handlePickImage = async (type) => {
    const perm = type === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return showErrorAlert(createPermissionError(type.toUpperCase()), Alert);

    const result = type === 'camera' ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 }) 
                                     : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 1 });

    if (!result.canceled && result.assets[0]) {
      updateState({ compressing: true, message: { text: '압축 중...', type: 'info' } });
      try {
        const comp = await compressImage(result.assets[0].uri, { maxWidth: 1200, quality: 0.7 });
        updateState({ imageUri: comp.base64, imageInfo: comp, message: { text: '✅ 압축 완료', type: 'success' } });
        setTimeout(() => updateState({ message: { text: '', type: '' } }), 2000);
      } catch { updateState({ message: { text: '압축 실패', type: 'error' } }); }
      finally { updateState({ compressing: false }); }
    }
  };

  const handleSubmit = async () => {
    if (!state.imageUri && !state.review.trim()) return Alert.alert("알림", "내용을 입력해주세요.");
    updateState({ saving: true });

    const payload = { card_review: state.review.trim(), card_image: state.imageUri, customer_id: customer.id, visit_date: new Date().toISOString(), is_manual: isManualMode };
    const apiAction = state.isEditMode ? () => visitService.updateVisit(visitId, payload) : () => visitService.createVisit(payload);

    const { error } = await handleApiCall('VisitDetail.save', apiAction);
    if (!error) {
      showSuccessAlert(state.isEditMode ? 'UPDATE' : 'SAVE', Alert);
      setTimeout(() => navigation.goBack(), 1000);
    } else updateState({ saving: false });
  };

  if (state.loading) return <GradientBackground><LoadingSpinner /></GradientBackground>;

  const theme = state.isEditMode ? { color: DrawerTheme.goldBrass, bg: DrawerTheme.woodMid } : { color: Colors.lavender, bg: Colors.purpleMid };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
            
            <View style={[styles.header, { backgroundColor: theme.bg, borderColor: theme.color }]}>
              <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{color: '#FFF'}}>← 돌아가기</Text></TouchableOpacity>
              <Text style={[styles.title, { color: theme.color }]}>{state.isEditMode ? '✏️ 수정' : '📝 새 메모'}</Text>
            </View>

            <View style={[styles.imageBox, { borderColor: theme.color }]}>
              {state.imageUri ? (
                <>
                  <Image source={{ uri: state.imageUri.startsWith('data') ? state.imageUri : `data:image/jpeg;base64,${state.imageUri}` }} style={styles.preview} />
                  <TouchableOpacity onPress={() => updateState({ imageUri: null })}><Text style={{color: Colors.redSoft, marginTop: 10}}>✕ 삭제</Text></TouchableOpacity>
                </>
              ) : <Text style={styles.placeholder}>📷 사진 없음</Text>}
            </View>

            <View style={styles.row}>
              <CustomButton title="카메라" onPress={() => handlePickImage('camera')} style={{flex:1}} />
              <CustomButton title="갤러리" onPress={() => handlePickImage('library')} variant="secondary" style={{flex:1}} />
            </View>

            <View style={styles.inputSection}>
              <TextInput 
                style={styles.input} multiline value={state.review} onChangeText={v => updateState({ review: v })}
                placeholder="내용을 입력하세요..." placeholderTextColor="#666" 
              />
              <CustomButton title={state.saving ? "저장 중..." : "서랍에 넣기"} onPress={handleSubmit} loading={state.saving} />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  header: { padding: 20, borderRadius: 15, borderWidth: 2, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  imageBox: { height: 250, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  placeholder: { color: '#666' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  inputSection: { gap: 15 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 15, color: '#FFF', minHeight: 120, textAlignVertical: 'top' }
});

export default VisitDetailScreen;