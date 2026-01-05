import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { Colors } from '../constants/Colors';

const CardSelectionScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets(); // ✅ 기기별 안전 영역 감지
  const { visitId } = route.params;
  const { customer } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalData, setOriginalData] = useState({ image: null, review: null });

  /**
   * 기존 데이터 로드
   */
  useEffect(() => {
    loadVisitData();
  }, [visitId]);

  const loadVisitData = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await visitService.getVisit(visitId);
      
      if (error) {
        console.error('Load visit error:', error);
        Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (data) {
        // 기존 데이터가 있으면 수정 모드
        if (data.card_image || data.card_review) {
          setIsEditMode(true);
          setImageUri(data.card_image);
          setReview(data.card_review || '');
          setOriginalData({
            image: data.card_image,
            review: data.card_review,
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Load visit error:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /**
   * ✅ 이미지 선택 공통 함수
   * - 상태바 숨김으로 편집 UI 버튼 시인성 확보
   */
  const openImagePicker = async (type) => {
    try {
      // 권한 확인
      const permission = type === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert('권한 필요', `${type === 'camera' ? '카메라' : '갤러리'} 권한이 필요합니다.`);
        return;
      }

      // ✅ 편집 화면 열기 전 상태바 숨김 (완료/취소 버튼 가독성 향상)
      StatusBar.setHidden(true, 'fade');

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      };

      const result = type === 'camera' 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setMessage({ text: '', type: '' });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '사진 처리 중 오류가 발생했습니다.');
    } finally {
      // ✅ 편집 화면 닫힌 후 상태바 다시 표시
      StatusBar.setHidden(false, 'fade');
      StatusBar.setBarStyle('light-content');
    }
  };

  /**
   * 이미지를 Base64로 변환
   */
  const convertImageToBase64 = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Image conversion error:', error);
      throw error;
    }
  };

  /**
   * 사진 제거
   */
  const handleRemoveImage = () => {
    if (isEditMode && originalData.image) {
      Alert.alert(
        '사진 삭제',
        '사진을 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => setImageUri(null) },
        ]
      );
    } else {
      setImageUri(null);
    }
  };

  /**
   * 저장하기
   */
  const handleSubmit = async () => {
    if (!imageUri && !review.trim()) {
      Alert.alert('알림', '사진 또는 리뷰 중 하나는 입력해주세요.');
      return;
    }

    if (review.length > 5000) {
      Alert.alert('알림', '리뷰는 5000자 이내로 작성해주세요.');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        card_review: review.trim() || null,
      };

      // 이미지 처리
      if (imageUri) {
        // 새로운 이미지인 경우 (로컬 URI)
        if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
          const base64Image = await convertImageToBase64(imageUri);
          updateData.card_image = base64Image;
        } 
        // 기존 이미지인 경우 (Base64)
        else {
          updateData.card_image = imageUri;
        }
      } else {
        // 이미지를 제거한 경우
        updateData.card_image = null;
      }

      const { error } = await visitService.updateVisit(visitId, updateData);

      if (error) {
        Alert.alert('오류', '저장 중 오류가 발생했습니다.');
        setSaving(false);
        return;
      }

      const successMsg = isEditMode ? '✨ 수정되었습니다!' : '✨ 저장되었습니다!';
      setMessage({ text: successMsg, type: 'success' });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  /**
   * 뒤로 가기
   */
  const handleBack = () => {
    const hasChanges = 
      (imageUri !== originalData.image) || 
      (review !== (originalData.review || ''));

    if (hasChanges) {
      Alert.alert(
        '확인',
        '변경 사항이 있습니다. 돌아가시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '돌아가기', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <LoadingSpinner message="데이터 로딩 중..." />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* ✅ SafeAreaView로 상단/하단 안전 영역 확보 */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="transparent"
          translucent={true}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              // ✅ 동적 하단 여백: 기기별 홈버튼 영역 + 추가 여백
              { paddingBottom: Math.max(insets.bottom, 20) + 80 }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
            removeClippedSubviews={false}
            scrollEventThrottle={16}
          >
            <View style={styles.header}>
              <CustomButton
                title="← 돌아가기"
                onPress={handleBack}
                variant="secondary"
                style={styles.backButton}
              />
              <Text style={styles.title}>
                {isEditMode ? '✏️ 방문 기록 수정' : '📸 방문 기록 추가'}
              </Text>
              <Text style={styles.subtitle}>
                {isEditMode 
                  ? '사진과 리뷰를 수정하거나 삭제할 수 있습니다' 
                  : '사진 또는 리뷰를 남겨보세요 (선택 사항)'}
              </Text>
            </View>

            {/* 사진 미리보기 */}
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeImageText}>✕ 사진 제거</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>
                  {isEditMode ? '사진을 추가하거나 변경하세요' : '사진을 선택해주세요 (선택 사항)'}
                </Text>
              </View>
            )}

            {/* 사진 선택 버튼 */}
            <View style={styles.buttonGroup}>
              <CustomButton
                title="📷 카메라"
                onPress={() => openImagePicker('camera')}
                style={styles.imageButton}
                disabled={saving}
              />
              <CustomButton
                title="🖼️ 갤러리"
                onPress={() => openImagePicker('library')}
                variant="secondary"
                style={styles.imageButton}
                disabled={saving}
              />
            </View>

            {/* 리뷰 입력 */}
            <View style={styles.reviewSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>오늘의 기록 (선택 사항, 최대 5000자)</Text>
                <TextInput
                  style={styles.textarea}
                  value={review}
                  onChangeText={setReview}
                  placeholder="오늘의 방문은 어떠셨나요?"
                  placeholderTextColor={Colors.purpleLight}
                  maxLength={5000}
                  multiline
                  numberOfLines={4}
                  editable={!saving}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.charCount}>{review.length}/5000</Text>
              </View>

              <CustomButton
                title={saving ? '저장 중...' : isEditMode ? '✓ 수정 완료' : '저장하기'}
                onPress={handleSubmit}
                disabled={saving || (!imageUri && !review.trim())}
                loading={saving}
                style={styles.submitButton}
              />

              {message.text && (
                <View
                  style={[
                    styles.message,
                    message.type === 'error' ? styles.messageError : styles.messageSuccess,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 {isEditMode 
                    ? '사진과 리뷰를 자유롭게 수정하거나 삭제할 수 있어요!'
                    : '사진과 리뷰는 선택 사항입니다.\n하나만 입력해도 저장할 수 있어요!'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0, // SafeAreaView가 상단 처리
    // paddingBottom은 ScrollView에서 동적으로 설정됨
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
    opacity: 0.9,
  },
  imagePlaceholder: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 20,
    opacity: 0.5,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.lavender,
    opacity: 0.7,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    marginBottom: 15,
  },
  removeImageButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  removeImageText: {
    color: Colors.redSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  imageButton: {
    flex: 1,
  },
  reviewSection: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.lavender,
    textAlign: 'right',
    marginTop: 5,
  },
  submitButton: {
    marginBottom: 20,
  },
  message: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  messageSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: Colors.green,
  },
  messageError: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 2,
    borderColor: Colors.errorRed,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  infoBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
  },
  infoText: {
    fontSize: 13,
    color: Colors.lavender,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CardSelectionScreen;