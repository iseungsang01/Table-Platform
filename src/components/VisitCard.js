import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CustomButton } from './CustomButton';
import { visitService } from '../services/visitService';
import { formatDate } from '../utils/formatters';
import { Colors } from '../constants/Colors';

export const VisitCard = ({ visit, onSelectCard, onDelete, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editReview, setEditReview] = useState(visit.card_review || '');
  const [saving, setSaving] = useState(false);

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
   * 사진 변경 - 갤러리에서 선택
   */
  const handleChangePhoto = async () => {
    try {
      // 갤러리 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 갤러리 열기 - ✅ mediaTypes 업데이트
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // ✅ 배열 형태로 변경
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setSaving(true);
        
        try {
          // Base64로 변환
          const base64Image = await convertImageToBase64(result.assets[0].uri);
          
          // 방문 기록 업데이트
          const { error } = await visitService.updateVisit(visit.id, {
            card_image: base64Image,
          });

          if (error) {
            Alert.alert('오류', '사진 변경 중 오류가 발생했습니다.');
            setSaving(false);
            return;
          }

          Alert.alert('완료', '✨ 사진이 변경되었습니다!');
          setSaving(false);
          
          if (onRefresh) {
            await onRefresh();
          }
        } catch (err) {
          console.error('Photo change error:', err);
          Alert.alert('오류', '사진 변경 중 오류가 발생했습니다.');
          setSaving(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  /**
   * 사진 삭제
   */
  const handleDeletePhoto = () => {
    Alert.alert(
      '사진 삭제',
      '사진을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            
            const { error } = await visitService.updateVisit(visit.id, {
              card_image: null,
            });

            if (error) {
              Alert.alert('오류', '사진 삭제 중 오류가 발생했습니다.');
              setSaving(false);
              return;
            }

            Alert.alert('완료', '🗑️ 사진이 삭제되었습니다!');
            setSaving(false);
            
            if (onRefresh) {
              await onRefresh();
            }
          },
        },
      ]
    );
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setEditReview(visit.card_review || '');
  };

  const handleEditSave = async () => {
    if (editReview.trim().length > 100) {
      Alert.alert('알림', '리뷰는 100자 이내로 작성해주세요.');
      return;
    }

    Keyboard.dismiss();
    setSaving(true);

    try {
      const reviewValue = editReview.trim() === '' ? null : editReview.trim();
      
      const { data, error } = await visitService.updateVisit(visit.id, {
        card_review: reviewValue,
      });

      if (error) {
        console.error('Update error:', error);
        Alert.alert('오류', '수정 중 오류가 발생했습니다.');
        setSaving(false);
        return;
      }

      Alert.alert('완료', '✨ 리뷰가 저장되었습니다!');
      setIsEditing(false);
      setSaving(false);
      
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('오류', '예상치 못한 오류가 발생했습니다.');
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    Keyboard.dismiss();
    setIsEditing(false);
    setEditReview(visit.card_review || '');
  };

  return (
    <View style={styles.card}>
      {/* 카드 헤더 */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(visit.visit_date)}</Text>
        <View style={styles.actions}>
          {visit.stamps_added > 0 && (
            <View style={styles.stampsBadge}>
              <Text style={styles.stampsBadgeText}>+{visit.stamps_added}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(visit.id, !!(visit.card_image || visit.card_review))}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ 사진 또는 리뷰가 있는 경우 */}
      {visit.card_image || visit.card_review ? (
        <View style={styles.cardDisplay}>
          {/* 사진이 있는 경우 표시 */}
          {visit.card_image && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: visit.card_image }} 
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.imageActions}>
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handleChangePhoto}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changePhotoButtonText}>📷 변경</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={handleDeletePhoto}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deletePhotoButtonText}>🗑️ 삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.cardInfo}>
            {/* 리뷰 수정 모드 */}
            {isEditing ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.editTextarea}
                  value={editReview}
                  onChangeText={setEditReview}
                  placeholder="리뷰를 입력하세요"
                  placeholderTextColor={Colors.purpleLight}
                  maxLength={100}
                  multiline
                  numberOfLines={3}
                  editable={!saving}
                  autoFocus
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
                <Text style={styles.charCount}>{editReview.length}/100</Text>
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.editSaveButton}
                    onPress={handleEditSave}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editSaveButtonText}>✓ 저장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editCancelButton}
                    onPress={handleEditCancel}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editCancelButtonText}>✕ 취소</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* 리뷰 표시 */}
                {visit.card_review ? (
                  <View style={styles.reviewBox}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewLabel}>📝 기록</Text>
                      <TouchableOpacity onPress={handleEditStart} activeOpacity={0.7}>
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.reviewText}>{visit.card_review}</Text>
                  </View>
                ) : (
                  // ✅ 사진만 있고 리뷰가 없는 경우
                  <TouchableOpacity 
                    style={styles.addReviewButton} 
                    onPress={handleEditStart}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addReviewButtonText}>+ 리뷰 추가하기</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        /* ✅ 사진과 리뷰가 모두 없는 경우 */
        <View style={styles.noCard}>
          <Text style={styles.noCardIcon}>📝</Text>
          <Text style={styles.noCardText}>아직 사진이나 리뷰를 추가하지 않았습니다</Text>
          <CustomButton
            title="추가하기"
            onPress={() => onSelectCard(visit.id)}
            style={styles.selectButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(138, 43, 226, 0.4)',
  },
  date: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stampsBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  stampsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  cardDisplay: {
    gap: 15,
  },
  imageContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 250,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  changePhotoButton: {
    flex: 1,
    backgroundColor: 'rgba(138, 43, 226, 0.5)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  changePhotoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
  },
  deletePhotoButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deletePhotoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.redSoft,
  },
  cardInfo: {
    flex: 1,
  },
  reviewBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lavender,
  },
  editIcon: {
    fontSize: 20,
  },
  reviewText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  addReviewButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
  },
  editSection: {
    marginTop: 5,
  },
  editTextarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
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
  editButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  editSaveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.green,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.25)',
    borderWidth: 2,
    borderColor: Colors.errorRed,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.errorRed,
  },
  noCard: {
    alignItems: 'center',
    padding: 30,
  },
  noCardIcon: {
    fontSize: 56,
    marginBottom: 15,
    opacity: 0.7,
  },
  noCardText: {
    fontSize: 15,
    color: Colors.lavender,
    marginBottom: 20,
    textAlign: 'center',
  },
  selectButton: {
    paddingHorizontal: 30,
  },
});