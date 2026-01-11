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
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TarotCardModal = ({ isVisible, visit, onClose, onEdit, onDelete }) => {
  if (!visit) return null;

  // 날짜 형식 변환: 2026.1.11
  const displayDate = visit.visit_date ? 
    visit.visit_date.split('T')[0].split('-').map(Number).join('.') : '';

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
            onClose(); 
            setTimeout(() => { onDelete(visit.id); }, 300);
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
              <Text style={styles.dateTitle}>{displayDate}의 기록</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* --- 사진이 있을 때만 렌더링 --- */}
            {visit.card_image && (
              <View style={styles.cardContainer}>
                <View style={styles.goldFrame}>
                  <Image 
                    source={{ uri: visit.card_image }} 
                    style={styles.tarotImage} 
                    resizeMode="contain" 
                  />
                </View>
              </View>
            )}

            {/* --- 메모 섹션: 사진이 없으면 자동으로 가장 상단에 배치됨 --- */}
            <View style={styles.reviewSection}>
              <Text style={styles.sectionLabel}>📜 그날의 메모</Text>
              <View style={[styles.reviewContent, !visit.card_image && styles.fullHeightReview]}>
                <Text style={styles.reviewText}>
                  {visit.card_review || "기록된 메모가 없습니다."}
                </Text>
              </View>
            </View>

            <View style={styles.actionArea}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => { onEdit(visit.id); onClose(); }}>
                <Text style={styles.primaryButtonText}>기록 수정하기</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleDeletePress}>
                <Text style={styles.secondaryButtonText}>🗑️ 이 서랍 비우기(삭제)</Text>
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 2,
    borderColor: '#5D4037',
    paddingHorizontal: 25,
    paddingTop: 15,
  },
  modalHandle: { width: 45, height: 5, backgroundColor: '#3E2723', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  scrollContent: { paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  dateTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#FFD700', 
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' 
  },
  closeIcon: { fontSize: 24, color: '#D4AF37' },
  closeBtn: { padding: 5 },
  cardContainer: { alignItems: 'center', marginBottom: 30 },
  goldFrame: {
    padding: 8, backgroundColor: '#000', borderRadius: 10,
    borderWidth: 2, borderColor: '#D4AF37',
    shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 15, elevation: 10,
  },
  tarotImage: { width: SCREEN_HEIGHT * 0.28, height: SCREEN_HEIGHT * 0.45, borderRadius: 5 },
  reviewSection: { marginBottom: 35 },
  sectionLabel: { fontSize: 16, color: '#D4AF37', marginBottom: 12, fontWeight: 'bold' },
  reviewContent: { 
    backgroundColor: 'rgba(93, 64, 55, 0.15)', 
    padding: 20, 
    borderRadius: 15, 
    borderLeftWidth: 4, 
    borderLeftColor: '#D4AF37' 
  },
  fullHeightReview: {
    minHeight: 150, // 사진이 없을 때 메모 영역을 조금 더 넉넉하게
  },
  reviewText: { fontSize: 16, color: '#E0E0E0', lineHeight: 26 },
  actionArea: { gap: 15 },
  primaryButton: { 
    backgroundColor: '#D4AF37', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  primaryButtonText: { color: '#1A0F0A', fontSize: 17, fontWeight: 'bold' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: '#8B4513', fontSize: 14, textDecorationLine: 'underline' },
});