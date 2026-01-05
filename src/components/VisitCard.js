import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { CustomButton } from './CustomButton';
import { visitService } from '../services/visitService';
import { formatDateOnly } from '../utils/formatters';
import { Colors } from '../constants/Colors';

export const VisitCard = ({ visit, onSelectCard, onDelete, onRefresh }) => {
  return (
    <View style={styles.card}>
      {/* 카드 헤더 */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDateOnly(visit.visit_date)}</Text>
        <View style={styles.actions}>
          {/* 사진 또는 리뷰가 있으면 수정 버튼, 없으면 추가 버튼 */}
          {visit.card_image || visit.card_review ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onSelectCard(visit.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.editButtonText}>✏️ 수정</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => onSelectCard(visit.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>+ 추가</Text>
            </TouchableOpacity>
          )}
          
          {/* 삭제 버튼 */}
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
            </View>
          )}

          {/* 리뷰 표시 */}
          {visit.card_review && (
            <View style={styles.reviewBox}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewLabel}>📝 기록</Text>
              </View>
              <Text style={styles.reviewText}>{visit.card_review}</Text>
            </View>
          )}

          {/* 사진만 있고 리뷰가 없는 경우 */}
          {visit.card_image && !visit.card_review && (
            <TouchableOpacity 
              style={styles.addReviewHint} 
              onPress={() => onSelectCard(visit.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.addReviewHintText}>+ 리뷰를 추가하려면 수정 버튼을 눌러주세요</Text>
            </TouchableOpacity>
          )}

          {/* 리뷰만 있고 사진이 없는 경우 */}
          {visit.card_review && !visit.card_image && (
            <TouchableOpacity 
              style={styles.addPhotoHint} 
              onPress={() => onSelectCard(visit.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.addPhotoHintText}>+ 사진을 추가하려면 수정 버튼을 눌러주세요</Text>
            </TouchableOpacity>
          )}
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
  addButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
  },
  editButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 13,
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
  reviewBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.25)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lavender,
  },
  reviewText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  addPhotoHint: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
  },
  addPhotoHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.lavender,
    opacity: 0.8,
  },
  addReviewHint: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
  },
  addReviewHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.lavender,
    opacity: 0.8,
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