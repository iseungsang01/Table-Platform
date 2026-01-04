import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Keyboard, Image } from 'react-native';
import { CustomButton } from './CustomButton';
import { visitService } from '../services/visitService';
import { formatDate } from '../utils/formatters';
import { Colors } from '../constants/Colors';
import { REVIEW_CONFIG } from '../constants/Config';

export const VisitCard = ({ visit, onSelectCard, onDelete, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editReview, setEditReview] = useState(visit.card_review || '');
  const [saving, setSaving] = useState(false);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditReview(visit.card_review || '');
  };

  const handleEditSave = async () => {
    const trimmedReview = editReview.trim();
    if (trimmedReview.length > REVIEW_CONFIG.maxLength) {
      return Alert.alert('알림', `리뷰는 ${REVIEW_CONFIG.maxLength}자 이내로 작성해주세요.`);
    }

    Keyboard.dismiss();
    setSaving(true);

    try {
      const { error } = await visitService.updateVisit(visit.id, {
        card_review: trimmedReview === '' ? null : trimmedReview,
      });

      if (error) throw error;

      Alert.alert('완료', '✨ 리뷰가 저장되었습니다!');
      setIsEditing(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      Alert.alert('오류', '수정 중 오류가 발생했습니다.');
    } finally {
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

      {visit.card_image || visit.card_review ? (
        <View style={styles.cardDisplay}>
          {visit.card_image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: visit.card_image }} style={styles.cardImage} resizeMode="cover" />
            </View>
          )}

          <View style={styles.cardInfo}>
            {isEditing ? (
              <View style={styles.editSection}>
                <TextInput
                  style={styles.editTextarea}
                  value={editReview}
                  onChangeText={setEditReview}
                  placeholder="리뷰를 입력하세요"
                  placeholderTextColor={Colors.purpleLight}
                  maxLength={REVIEW_CONFIG.maxLength}
                  multiline
                  numberOfLines={3}
                  editable={!saving}
                  autoFocus
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{editReview.length}/{REVIEW_CONFIG.maxLength}</Text>
                <View style={styles.editButtons}>
                  <TouchableOpacity style={styles.editSaveButton} onPress={handleEditSave} disabled={saving}>
                    <Text style={styles.editSaveButtonText}>{saving ? '...' : '✓'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editCancelButton} onPress={handleEditCancel} disabled={saving}>
                    <Text style={styles.editCancelButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              visit.card_review ? (
                <View style={styles.reviewBox}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewLabel}>📝 기록</Text>
                    <TouchableOpacity onPress={handleEditStart}><Text style={styles.editIcon}>✏️</Text></TouchableOpacity>
                  </View>
                  <Text style={styles.reviewText}>{visit.card_review}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.addReviewButton} onPress={handleEditStart}>
                  <Text style={styles.addReviewButtonText}>+ 리뷰 추가하기</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      ) : (
        <View style={styles.noCard}>
          <Text style={styles.noCardIcon}>📝</Text>
          <Text style={styles.noCardText}>아직 사진이나 리뷰를 추가하지 않았습니다</Text>
          <CustomButton title="추가하기" onPress={() => onSelectCard(visit.id)} style={styles.selectButton} />
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
  date: { fontSize: 16, fontWeight: '700', color: Colors.gold },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stampsBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  stampsBadgeText: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: { fontSize: 18 },
  cardDisplay: { gap: 15 },
  imageContainer: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 250 },
  cardInfo: { flex: 1 },
  reviewBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewLabel: { fontSize: 13, fontWeight: '700', color: Colors.lavender },
  editIcon: { fontSize: 20 },
  reviewText: { fontSize: 15, color: 'white', lineHeight: 22 },
  addReviewButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  addReviewButtonText: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  editSection: { marginTop: 5 },
  editTextarea: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    color: 'white',
    minHeight: 100,
  },
  charCount: { fontSize: 12, color: Colors.lavender, textAlign: 'right', marginTop: 5 },
  editButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editSaveButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    borderWidth: 2,
    borderColor: Colors.green,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  editSaveButtonText: { fontSize: 18, fontWeight: '700', color: Colors.green },
  editCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.25)',
    borderWidth: 2,
    borderColor: Colors.errorRed,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  editCancelButtonText: { fontSize: 18, fontWeight: '700', color: Colors.errorRed },
  noCard: { alignItems: 'center', padding: 30 },
  noCardIcon: { fontSize: 56, marginBottom: 15, opacity: 0.7 },
  noCardText: { fontSize: 15, color: Colors.lavender, marginBottom: 20, textAlign: 'center' },
  selectButton: { paddingHorizontal: 30 },
});