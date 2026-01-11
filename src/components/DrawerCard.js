import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Animated,
} from 'react-native';
import { CustomButton } from './CustomButton';
import { visitService } from '../services/visitService';
import { formatDateOnly } from '../utils/formatters';
import { Colors } from '../constants/Colors';

/**
 * 서랍장 카드 컴포넌트
 * 방문 기록을 서랍처럼 열고 닫을 수 있는 UI
 * 
 * @param {object} visit - 방문 기록 데이터
 * @param {number} index - 서랍 순서 (위에서부터 0, 1, 2...)
 * @param {boolean} isOpen - 서랍이 열려있는지 여부
 * @param {function} onToggle - 서랍 열기/닫기 토글
 * @param {function} onSelectCard - 카드 선택 핸들러
 * @param {function} onDelete - 삭제 핸들러
 */
export const DrawerCard = ({ visit, index, isOpen, onToggle, onSelectCard, onDelete }) => {
  const [animatedHeight] = useState(new Animated.Value(isOpen ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const contentHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // 닫혔을 때 0, 열렸을 때 최대 500
  });

  return (
    <View style={[styles.drawerContainer, { zIndex: 100 - index }]}>
      {/* 서랍 손잡이 (항상 보임) */}
      <TouchableOpacity
        style={[
          styles.drawerHandle,
          isOpen && styles.drawerHandleOpen,
        ]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.handleContent}>
          <View style={styles.handleLeft}>
            <Text style={styles.handleIcon}>🗂️</Text>
            <Text style={styles.handleDate}>{formatDateOnly(visit.visit_date)}</Text>
          </View>
          <View style={styles.handleRight}>
            {visit.card_image && <Text style={styles.handleBadge}>📸</Text>}
            {visit.card_review && <Text style={styles.handleBadge}>📝</Text>}
            <Text style={styles.handleArrow}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </View>

        {/* 서랍 손잡이 장식 */}
        <View style={styles.handleDecoration}>
          <View style={styles.handleKnob} />
          <View style={styles.handleKnob} />
        </View>
      </TouchableOpacity>

      {/* 서랍 내용물 (열렸을 때만 보임) */}
      <Animated.View
        style={[
          styles.drawerContent,
          {
            maxHeight: contentHeight,
            opacity: animatedHeight,
          },
        ]}
      >
        <View style={styles.contentInner}>
          {/* 액션 버튼 */}
          <View style={styles.actions}>
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
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(visit.id, !!(visit.card_image || visit.card_review))}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {/* 사진 또는 리뷰가 있는 경우 */}
          {visit.card_image || visit.card_review ? (
            <View style={styles.cardDisplay}>
              {visit.card_image && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: visit.card_image }} 
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {visit.card_review && (
                <View style={styles.reviewBox}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewLabel}>📝 기록</Text>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={4}>
                    {visit.card_review}
                  </Text>
                </View>
              )}

              {visit.card_image && !visit.card_review && (
                <TouchableOpacity 
                  style={styles.addReviewHint} 
                  onPress={() => onSelectCard(visit.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addReviewHintText}>+ 리뷰 추가하기</Text>
                </TouchableOpacity>
              )}

              {visit.card_review && !visit.card_image && (
                <TouchableOpacity 
                  style={styles.addPhotoHint} 
                  onPress={() => onSelectCard(visit.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addPhotoHintText}>+ 사진 추가하기</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* 사진과 리뷰가 모두 없는 경우 */
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  
  // 서랍 손잡이
  drawerHandle: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 15,
    shadowColor: Colors.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerHandleOpen: {
    borderColor: Colors.gold,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: Colors.gold,
  },
  handleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  handleIcon: {
    fontSize: 28,
  },
  handleDate: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
  },
  handleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handleBadge: {
    fontSize: 18,
  },
  handleArrow: {
    fontSize: 16,
    color: Colors.lavender,
    fontWeight: '700',
  },
  handleDecoration: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 10,
  },
  handleKnob: {
    width: 30,
    height: 6,
    backgroundColor: Colors.purpleLight,
    borderRadius: 3,
  },

  // 서랍 내용물
  drawerContent: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 3,
    borderColor: Colors.gold,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  contentInner: {
    padding: 20,
  },

  // 액션 버튼
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(138, 43, 226, 0.4)',
  },
  addButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.3)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
  },
  editButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gold,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.25)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    padding: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
  },

  // 카드 표시
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
    height: 220,
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
    fontSize: 13,
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
    fontSize: 13,
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