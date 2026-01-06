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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { compressImage, formatFileSize } from '../utils/imageOptimizer';
import { Colors } from '../constants/Colors';
import { 
  handleApiCall, 
  createValidationError, 
  createPermissionError,
  createStorageError,
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';

const VisitDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { visitId } = route.params;
  const { customer } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false); // ✅ 압축 중 상태
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalData, setOriginalData] = useState({ image: null, review: null });
  const [imageInfo, setImageInfo] = useState(null); // ✅ 이미지 정보

  /**
   * 기존 데이터 로드
   */
  useEffect(() => {
    loadVisitData();
  }, [visitId]);

  const loadVisitData = async () => {
    setLoading(true);
    
    const { data, error, errorInfo } = await handleApiCall(
      'VisitDetailScreen.loadVisitData',
      () => visitService.getVisit(visitId),
      {
        showAlert: true,
        additionalInfo: { visitId },
      }
    );

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      if (data.card_image || data.card_review) {
        setIsEditMode(true);
        setImageUri(data.card_image);
        setReview(data.card_review || '');
        setOriginalData({
          image: data.card_image,
          review: data.card_review,
        });
        
        // ✅ 이미지 정보 표시
        if (data.card_image) {
          const size = data.card_image.length;
          setImageInfo({
            size,
            sizeFormatted: formatFileSize(size),
          });
        }
      }
    }
    
    setLoading(false);
  };

  /**
   * ✅ 이미지 선택 및 압축
   */
  const openImagePicker = async (type) => {
    try {
      const permission = type === 'camera' 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        const errorInfo = createPermissionError(type === 'camera' ? 'CAMERA' : 'GALLERY');
        showErrorAlert(errorInfo, Alert);
        return;
      }

      StatusBar.setHidden(true, 'fade');

      const options = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // ✅ 최고 품질로 가져온 후 직접 압축
      };

      const result = type === 'camera' 
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        
        // ✅ 이미지 압축
        setCompressing(true);
        setMessage({ text: '이미지 압축 중...', type: 'info' });
        
        try {
          const compressed = await compressImage(selectedUri, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.7,
          });
          
          setImageUri(compressed.base64);
          setImageInfo({
            size: compressed.size,
            sizeFormatted: compressed.sizeFormatted,
            originalSize: compressed.originalSize,
            compressionRatio: compressed.compressionRatio,
          });
          
          setMessage({ 
            text: `✅ 압축 완료 (${compressed.compressionRatio}% 감소)`, 
            type: 'success' 
          });
          
          setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (compressionError) {
          console.error('❌ [VisitDetail] 압축 오류:', compressionError);
          setMessage({ text: '압축에 실패했습니다. 다시 시도해주세요.', type: 'error' });
        } finally {
          setCompressing(false);
        }
      }
    } catch (error) {
      const errorInfo = createStorageError('LOAD_FAILED');
      showErrorAlert(errorInfo, Alert);
    } finally {
      StatusBar.setHidden(false, 'fade');
      StatusBar.setBarStyle('light-content');
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
          { 
            text: '삭제', 
            style: 'destructive', 
            onPress: () => {
              setImageUri(null);
              setImageInfo(null);
            }
          },
        ]
      );
    } else {
      setImageUri(null);
      setImageInfo(null);
    }
  };

  /**
   * 저장하기
   */
  const handleSubmit = async () => {
    // 유효성 검사
    if (!imageUri && !review.trim()) {
      const errorInfo = createValidationError('REQUIRED_FIELD');
      errorInfo.message = '사진 또는 리뷰 중 하나는 입력해주세요.';
      showErrorAlert(errorInfo, Alert);
      return;
    }

    if (review.length > 5000) {
      const errorInfo = createValidationError('REVIEW_TOO_LONG');
      showErrorAlert(errorInfo, Alert);
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        card_review: review.trim() || null,
        card_image: imageUri || null,
      };

      const { error, errorInfo } = await handleApiCall(
        'VisitDetailScreen.handleSubmit',
        () => visitService.updateVisit(visitId, updateData),
        {
          showAlert: true,
          additionalInfo: { visitId, hasImage: !!imageUri, hasReview: !!review },
        }
      );

      if (error) {
        setSaving(false);
        return;
      }

      showSuccessAlert(isEditMode ? 'UPDATE' : 'SAVE', Alert);

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      const errorInfo = createStorageError('SAVE_FAILED');
      showErrorAlert(errorInfo, Alert);
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

            {/* ✅ 압축 중 표시 */}
            {compressing && (
              <View style={styles.compressingContainer}>
                <ActivityIndicator size="large" color={Colors.gold} />
                <Text style={styles.compressingText}>이미지 압축 중...</Text>
              </View>
            )}

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                
                {/* ✅ 이미지 정보 표시 */}
                {imageInfo && (
                  <View style={styles.imageInfoBox}>
                    <Text style={styles.imageInfoText}>
                      📊 크기: {imageInfo.sizeFormatted}
                    </Text>
                    {imageInfo.compressionRatio && (
                      <Text style={styles.imageInfoText}>
                        💾 압축률: {imageInfo.compressionRatio}%
                      </Text>
                    )}
                  </View>
                )}
                
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  activeOpacity={0.7}
                  disabled={compressing}
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

            <View style={styles.buttonGroup}>
              <CustomButton
                title="📷 카메라"
                onPress={() => openImagePicker('camera')}
                style={styles.imageButton}
                disabled={saving || compressing}
              />
              <CustomButton
                title="🖼️ 갤러리"
                onPress={() => openImagePicker('library')}
                variant="secondary"
                style={styles.imageButton}
                disabled={saving || compressing}
              />
            </View>

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
                  editable={!saving && !compressing}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.charCount}>{review.length}/5000</Text>
              </View>

              <CustomButton
                title={saving ? '저장 중...' : isEditMode ? '✓ 수정 완료' : '저장하기'}
                onPress={handleSubmit}
                disabled={saving || compressing || (!imageUri && !review.trim())}
                loading={saving}
                style={styles.submitButton}
              />

              {message.text && (
                <View
                  style={[
                    styles.message,
                    message.type === 'error' ? styles.messageError : 
                    message.type === 'success' ? styles.messageSuccess : 
                    styles.messageInfo,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              )}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 {isEditMode 
                    ? '사진과 리뷰를 자유롭게 수정하거나 삭제할 수 있어요!'
                    : '사진은 자동으로 압축되어 저장됩니다.\n사진과 리뷰는 선택 사항입니다.'}
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
  compressingContainer: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 40,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
  },
  compressingText: {
    fontSize: 16,
    color: Colors.gold,
    marginTop: 15,
    fontWeight: '600',
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
  imageInfoBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageInfoText: {
    fontSize: 13,
    color: Colors.lavender,
    fontWeight: '600',
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
  messageInfo: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196f3',
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

export default VisitDetailScreen; 