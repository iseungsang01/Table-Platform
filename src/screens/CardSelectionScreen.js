import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { TarotCard } from '../components/TarotCard';
import { useAuth } from '../hooks/useAuth';
import { visitService } from '../services/visitService';
import { TAROT_CARDS } from '../constants/TarotCards';
import { Colors } from '../constants/Colors';

const CardSelectionScreen = ({ route, navigation }) => {
  const { visitId } = route.params;
  const { customer } = useAuth();
  const [selectedCard, setSelectedCard] = useState(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handleSubmit = async () => {
    if (!selectedCard) {
      Alert.alert('알림', '카드를 선택해주세요.');
      return;
    }

    if (review.length > 100) {
      Alert.alert('알림', '리뷰는 100자 이내로 작성해주세요.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    // 로컬 스토리지에만 저장 (visitService가 자동으로 처리)
    const { error } = await visitService.updateVisit(visitId, {
      selected_card: selectedCard.name,
      card_review: review || null,
    });

    if (error) {
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    setMessage({ text: '✨ 카드가 저장되었습니다!', type: 'success' });

    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const handleBack = () => {
    Alert.alert(
      '확인',
      '카드 선택을 취소하고 돌아가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '돌아가기', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <GradientBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.header}>
            <CustomButton
              title="← 돌아가기"
              onPress={handleBack}
              variant="secondary"
              style={styles.backButton}
            />
            <Text style={styles.title}>🔮 타로 카드 선택</Text>
            <Text style={styles.subtitle}>오늘의 방문을 기억할 카드를 선택하세요</Text>
          </View>

          <FlatList
            data={TAROT_CARDS}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <TarotCard
                card={item}
                selected={selectedCard?.id === item.id}
                onPress={handleCardSelect}
              />
            )}
            columnWrapperStyle={styles.cardRow}
            contentContainerStyle={styles.cardGrid}
            keyboardShouldPersistTaps="handled"
          />

          {selectedCard && (
            <View style={styles.reviewSection}>
              <Text style={styles.selectedCardTitle}>
                선택한 카드: {selectedCard.emoji} {selectedCard.name}
              </Text>
              <Text style={styles.cardDescription}>{selectedCard.meaning}</Text>

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
                disabled={loading}
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
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    margin: 20,
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
  cardGrid: {
    padding: 20,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  reviewSection: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 30,
    margin: 20,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  selectedCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
    marginBottom: 25,
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