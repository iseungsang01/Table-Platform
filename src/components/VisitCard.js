import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CustomButton } from './CustomButton';
import { visitService } from '../services/visitService';
import { storage } from '../utils/storage';
import { getTarotEmoji } from '../constants/TarotCards';
import { formatDate } from '../utils/formatters';
import { Colors } from '../constants/Colors';

/**
 * 방문 기록 카드 컴포넌트
 * card_review는 로컬 스토리지에서 관리
 */
export const VisitCard = ({ visit, onSelectCard, onDelete, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editReview, setEditReview] = useState(visit.card_review || '');
  const [saving, setSaving] = useState(false);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditReview(visit.card_review || '');
  };

  const handleEditSave = async () => {
    if (editReview.length > 100) {
      Alert.alert('알림', '리뷰는 100자 이내로 작성해주세요.');
      return;
    }

    setSaving(true);

    try {
      // 로컬 스토리지에만 저장 (서버 요청 없음)
      if (editReview.trim()) {
        await storage.saveCardReview(visit.id, editReview.trim());
      } else {
        await storage.deleteCardReview(visit.id);
      }

      Alert.alert('완료', '✨ 리뷰가 저장되었습니다!');
      setIsEditing(false);
      
      // 부모 컴포넌트 새로고침 (로컬 데이터 반영)
      onRefresh();
    } catch (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      console.error('Save review error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditReview(visit.card_review || '');
  };

  const handleDelete = async () => {
    // 삭제 시 로컬 리뷰도 함께 삭제됨 (visitService에서 처리)
    onDelete(visit.id, !!visit.selected_card);
  };

  return (
    <View style={styles.card}>
      {/* 카드 헤더 */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(visit.visit_date)}</Text>
        <View style={styles.actions}>
          {visit.stamps_added > 0 && (
            <View style={styles.stampsBadge}>
              <Text style={styles.stampsBadgeText}>+{visit.stamps_added} 스탬프</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 카드 선택된 경우 */}
      {visit.selected_card ? (
        <View style={styles.cardDisplay}>
          <Text style={styles.cardEmoji}>{getTarotEmoji(visit.selected_card)}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{visit.selected_card}</Text>

            {/* 리뷰 수정 모드 */}
            {isEditing ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.editTextarea}
                  value={editReview}
                  onChangeText={setEditReview}
                  placeholder="리뷰를 입력하세요 (로컬 저장)"
                  placeholderTextColor={Colors.purpleLight}
                  maxLength={100}
                  multiline
                  numberOfLines={3}
                  editable={!saving}
                />
                <Text style={styles.charCount}>{editReview.length}/100</Text>
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.editSaveButton}
                    onPress={handleEditSave}
                    disabled={saving}
                  >
                    <Text style={styles.editSaveButtonText}>✓ 저장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editCancelButton}
                    onPress={handleEditCancel}
                    disabled={saving}
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
                      <Text style={styles.reviewLabel}>📝 기록 (로컬)</Text>
                      <TouchableOpacity onPress={handleEditStart}>
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.reviewText}>{visit.card_review}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addReviewButton} onPress={handleEditStart}>
                    <Text style={styles.addReviewButtonText}>+ 리뷰 추가하기 (로컬 저장)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      ) : (
        /* 카드 미선택 */
        <View style={styles.noCard}>
          <Text style={styles.noCardIcon}>🃏</Text>
          <Text style={styles.noCardText}>아직 카드를 선택하지 않았습니다</Text>
          <CustomButton
            title="카드 선택하기"
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
    padding: 25,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stampsBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  stampsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    borderWidth: 2,
    borderColor: Colors.red,
    borderRadius: 8,
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  cardDisplay: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  cardEmoji: {
    fontSize: 80,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  reviewBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.lavender,
  },
  editIcon: {
    fontSize: 18,
  },
  reviewText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  addReviewButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  editSection: {
    marginTop: 10,
  },
  editTextarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: 'white',
    minHeight: 80,
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
    marginTop: 10,
  },
  editSaveButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green,
  },
  editCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderWidth: 2,
    borderColor: Colors.errorRed,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.errorRed,
  },
  noCard: {
    alignItems: 'center',
    padding: 30,
  },
  noCardIcon: {
    fontSize: 60,
    marginBottom: 15,
    opacity: 0.5,
  },
  noCardText: {
    fontSize: 16,
    color: Colors.lavender,
    marginBottom: 15,
  },
  selectButton: {
    paddingHorizontal: 25,
  },
});