import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { DrawerTheme } from '../constants/theme';
import { formatDateOnly } from '../utils/formatters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TarotCardModal = ({ isVisible, visit, onClose, onEdit, onDelete }) => {
  if (!visit) return null;

  // 삭제 확인 알림창
  const handleDeletePress = () => {
    Alert.alert(
      "기록 삭제",
      "이 서랍 속의 소중한 기록을 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: () => {
            onDelete(visit.id);
            onClose();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.touchableOutside} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.dateText}>
                {visit.visit_date.split('T')[0].split('-').map(Number).join('.')} 의 서랍
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 카드 이미지 영역 */}
            <View style={styles.cardContainer}>
              <View style={styles.goldFrame}>
                {visit.card_image ? (
                  <Image source={{ uri: visit.card_image }} style={styles.tarotImage} resizeMode="contain" />
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>비어있는 카드함</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 리뷰 영역 */}
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>📜 그날의 메모</Text>
              <View style={styles.reviewBox}>
                <Text style={styles.reviewText}>
                  {visit.card_review || "기록된 내용이 없습니다."}
                </Text>
              </View>
            </View>

            {/* 버튼 그룹 */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => { onEdit(visit.id); onClose(); }}
              >
                <Text style={styles.editButtonText}>기록 수정하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                <Text style={styles.deleteButtonText}>🗑️ 이 서랍 비우기(삭제)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  touchableOutside: { flex: 1 },
  modalContent: {
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#1A0F0A',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 2,
    borderColor: '#5D4037',
    padding: 20,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#5D4037', borderRadius: 2,
    alignSelf: 'center', marginBottom: 15,
  },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateText: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', fontFamily: 'serif' },
  closeIcon: { fontSize: 22, color: '#D4AF37' },
  cardContainer: { alignItems: 'center', marginVertical: 10 },
  goldFrame: {
    padding: 8, backgroundColor: '#000', borderRadius: 10,
    borderWidth: 2, borderColor: '#D4AF37',
    shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },
  tarotImage: { width: SCREEN_HEIGHT * 0.3, height: SCREEN_HEIGHT * 0.45, borderRadius: 5 },
  emptyCard: { width: SCREEN_HEIGHT * 0.3, height: SCREEN_HEIGHT * 0.45, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#5D4037', fontSize: 16 },
  reviewSection: { marginTop: 25 },
  sectionTitle: { fontSize: 16, color: '#D4AF37', marginBottom: 10, fontWeight: 'bold' },
  reviewBox: { backgroundColor: 'rgba(93, 64, 55, 0.2)', padding: 15, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#D4AF37' },
  reviewText: { fontSize: 15, color: '#F5F5F5', lineHeight: 24 },
  buttonGroup: { marginTop: 30, gap: 15 },
  editButton: { backgroundColor: '#D4AF37', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  editButtonText: { color: '#1A0F0A', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { paddingVertical: 10, alignItems: 'center' },
  deleteButtonText: { color: '#8B4513', fontSize: 14, textDecorationLine: 'underline' },
});