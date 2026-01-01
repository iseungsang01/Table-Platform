import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { Colors } from '../constants/Colors';

const CardSelectionScreen = ({ route, navigation }) => {
  const { visitId } = route.params;
  const { customer } = useAuth();
  const [imageUri, setImageUri] = useState(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /**
   * 카메라로 사진 촬영
   */
  const handleTakePhoto = async () => {
    try {
      // 카메라 권한 요청
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
        return;
      }

      // 카메라 실행
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // 이미지 크기 최적화
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setMessage({ text: '', type: '' });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  /**
   * 갤러리에서 사진 선택
   */
  const handlePickImage = async () => {
    try {
      // 갤러리 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 갤러리 열기
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // 이미지 크기 최적화
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setMessage({ text: '', type: '' });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
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
   * 저장하기
   */
  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('알림', '사진을 선택해주세요.');
      return;
    }

    if (review.length > 100) {
      Alert.alert('알림', '리뷰는 100자 이내로 작성해주세요.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // 이미지를 Base64로 변환
      const base64Image = await convertImageToBase64(imageUri);

      // 방문 기록 업데이트 (로컬 스토리지에 이미지 저장)
      const { error } = await visitService.updateVisit(visitId, {
        card_image: base64Image,
        card_review: review || null,
      });

      if (error) {
        Alert.alert('오류', '저장 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setMessage({ text: '✨ 사진이 저장되었습니다!', type: 'success' });

      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  /**
   * 뒤로 가기
   */
  const handleBack = () => {
    if (imageUri || review) {
      Alert.alert(
        '확인',
        '작성 중인 내용이 있습니다. 돌아가시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '돌아가기', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <GradientBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <CustomButton
                title="← 돌아가기"
                onPress={handleBack}
                variant="secondary"
                style={styles.backButton}
              />
              <Text style={styles.title}>📸 사진 업로드</Text>
              <Text style={styles.subtitle}>오늘의 방문을 기억할 사진을 업로드하세요</Text>
            </View>

            {/* 사진 미리보기 */}
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeImageText}>✕ 사진 제거</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
                <Text style={styles.placeholderText}>사진을 선택해주세요</Text>
              </View>
            )}

            {/* 사진 선택 버튼 */}
            <View style={styles.buttonGroup}>
              <CustomButton
                title="📷 카메라"
                onPress={handleTakePhoto}
                style={styles.imageButton}
                disabled={loading}
              />
              <CustomButton
                title="🖼️ 갤러리"
                onPress={handlePickImage}
                variant="secondary"
                style={styles.imageButton}
                disabled={loading}
              />
            </View>

            {/* 리뷰 입력 */}
            <View style={styles.reviewSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>오늘의 기록 (선택, 최대 100자)</Text>
                <TextInput
                  style={styles.textarea}
                  value={review}
                  onChangeText={setReview}
                  placeholder="오늘의 방문은 어떠셨나요?"
                  placeholderTextColor={Colors.purpleLight}
                  maxLength={100}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.charCount}>{review.length}/100</Text>
              </View>

              <CustomButton
                title={loading ? '저장 중...' : '저장하기'}
                onPress={handleSubmit}
                disabled={loading || !imageUri}
                loading={loading}
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
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
    alignItems: 'center',
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
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
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
});

export default CardSelectionScreen;