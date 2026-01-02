import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Keyboard,
} from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { customerService } from '../services/customerService';
import { AdminPassword } from '../services/supabase';
import { Colors } from '../constants/Colors';

const SettingsScreen = () => {
  const { customer, logout } = useAuth();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  /**
   * 비밀번호 재설정
   */
  const handlePasswordReset = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (currentPassword !== AdminPassword) {
      Alert.alert('오류', '현재 비밀번호가 올바르지 않습니다.');
      return;
    }

    if (newPassword.length < 4) {
      Alert.alert('알림', '새 비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      '비밀번호 재설정',
      '비밀번호를 재설정하시겠습니까?\n\n⚠️ 이 기능은 관리자에게 문의하여 수동으로 변경해야 합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            Alert.alert(
              '안내',
              `새 비밀번호: ${newPassword}\n\n관리자에게 위 비밀번호로 변경을 요청해주세요.`
            );
            setShowPasswordReset(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          },
        },
      ]
    );
  };

  /**
   * 회원 탈퇴
   */
  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    if (deleteConfirmPassword !== AdminPassword) {
      Alert.alert('오류', '비밀번호가 올바르지 않습니다.');
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?\n\n모든 데이터가 삭제되며 복구할 수 없습니다.\n(스탬프, 쿠폰, 방문 기록 등)',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);

            const { error } = await customerService.deleteCustomer(customer.id);

            if (error) {
              Alert.alert('오류', '탈퇴 처리 중 오류가 발생했습니다.');
              setProcessing(false);
              return;
            }

            Alert.alert('완료', '회원 탈퇴가 완료되었습니다.', [
              {
                text: '확인',
                onPress: async () => {
                  await logout();
                },
              },
            ]);

            setProcessing(false);
          },
        },
      ]
    );
  };

  /**
   * 로그아웃
   */
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.icon}>⚙️</Text>
          <Text style={styles.title}>설정</Text>
          <Text style={styles.subtitle}>{customer.nickname}님</Text>
        </View>

        {/* 계정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 계정 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>닉네임</Text>
              <Text style={styles.infoValue}>{customer.nickname}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>전화번호</Text>
              <Text style={styles.infoValue}>{customer.phone_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>가입일</Text>
              <Text style={styles.infoValue}>
                {new Date(customer.created_at).toLocaleDateString('ko-KR')}
              </Text>
            </View>
          </View>
        </View>

        {/* 비밀번호 재설정 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowPasswordReset(!showPasswordReset)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonText}>
              🔐 비밀번호 재설정 {showPasswordReset ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showPasswordReset && (
            <View style={styles.formCard}>
              <Text style={styles.formDescription}>
                관리자 비밀번호 변경을 요청할 수 있습니다.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>현재 비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="현재 비밀번호 입력"
                  placeholderTextColor={Colors.purpleLight}
                  secureTextEntry
                  editable={!processing}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>새 비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="새 비밀번호 입력 (최소 4자)"
                  placeholderTextColor={Colors.purpleLight}
                  secureTextEntry
                  editable={!processing}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>새 비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="새 비밀번호 다시 입력"
                  placeholderTextColor={Colors.purpleLight}
                  secureTextEntry
                  editable={!processing}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <CustomButton
                title="비밀번호 재설정 요청"
                onPress={handlePasswordReset}
                disabled={processing}
                style={styles.submitButton}
              />
            </View>
          )}
        </View>

        {/* 회원 탈퇴 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.menuButtonDanger}
            onPress={() => setShowDeleteAccount(!showDeleteAccount)}
            activeOpacity={0.7}
          >
            <Text style={styles.menuButtonTextDanger}>
              🗑️ 회원 탈퇴 {showDeleteAccount ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {showDeleteAccount && (
            <View style={styles.formCardDanger}>
              <Text style={styles.formDescriptionDanger}>
                ⚠️ 탈퇴 시 모든 데이터가 영구 삭제되며 복구할 수 없습니다.{'\n'}
                (스탬프, 쿠폰, 방문 기록, 리뷰 등)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.labelDanger}>관리자 비밀번호 확인</Text>
                <TextInput
                  style={styles.inputDanger}
                  value={deleteConfirmPassword}
                  onChangeText={setDeleteConfirmPassword}
                  placeholder="비밀번호 입력"
                  placeholderTextColor={Colors.purpleLight}
                  secureTextEntry
                  editable={!processing}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <CustomButton
                title={processing ? '처리 중...' : '회원 탈퇴'}
                onPress={handleDeleteAccount}
                disabled={processing}
                loading={processing}
                variant="danger"
                style={styles.submitButton}
              />
            </View>
          )}
        </View>

        {/* 로그아웃 */}
        <View style={styles.section}>
          <CustomButton
            title="로그아웃"
            onPress={handleLogout}
            variant="secondary"
            style={styles.logoutButton}
          />
        </View>

        {/* 앱 정보 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>ℹ️ 앱 정보</Text>
          <Text style={styles.infoBoxText}>
            버전: 1.0.0{'\n'}
            개발: Tarot Stamp Team{'\n'}
            문의: 매장에 방문하여 문의해주세요
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 120,
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
  icon: {
    fontSize: 64,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 43, 226, 0.3)',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.lavender,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  menuButton: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
  },
  menuButtonDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
  },
  menuButtonTextDanger: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.redSoft,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: Colors.purpleMid,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
  },
  formCardDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 15,
    padding: 20,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.lavender,
    marginBottom: 20,
    lineHeight: 20,
  },
  formDescriptionDanger: {
    fontSize: 14,
    color: Colors.redSoft,
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
    marginBottom: 8,
  },
  labelDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.redSoft,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  inputDanger: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 2,
    borderColor: Colors.redSoft,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
  },
  submitButton: {
    marginTop: 10,
  },
  logoutButton: {
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
    marginBottom: 10,
  },
  infoBoxText: {
    fontSize: 13,
    color: Colors.lavender,
    lineHeight: 20,
  },
});

export default SettingsScreen;