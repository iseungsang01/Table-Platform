import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { GradientBackground, CustomButton } from '../components';
import { useAuth } from '../hooks/useAuth';
import { formatPhoneNumber } from '../utils/formatters';
import { validatePhoneNumber } from '../utils/validators';
import { DrawerTheme } from '../constants/DrawerTheme';
import { createValidationError } from '../utils/errorHandler';
import { ERROR_MESSAGES } from '../constants/ErrorMessages';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const resetMsg = () => message.text && setMessage({ text: '', type: '' });

  const handlePhoneChange = (text) => {
    setPhone(formatPhoneNumber(text));
    resetMsg();
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    resetMsg();
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(phone)) {
      const errorInfo = createValidationError('PHONE_INVALID');
      setMessage({ text: errorInfo.message, type: 'error' });
      return;
    }

    if (!password.trim()) {
      const errorInfo = createValidationError('PASSWORD_EMPTY');
      setMessage({ text: errorInfo.message, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '정보를 확인하고 있습니다...', type: 'info' });

    try {
      const result = await login(phone, password);
      if (result.success) {
        setMessage({ text: '환영합니다!', type: 'success' });
      } else {
        let errorMessage = result.message;
        if (result.message.includes('등록되지 않은')) {
          errorMessage = ERROR_MESSAGES.AUTH.NOT_REGISTERED.message;
        } else if (result.message.includes('비밀번호')) {
          errorMessage = ERROR_MESSAGES.AUTH.WRONG_PASSWORD.message;
        }
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: '오류가 발생했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          <View style={styles.mainCard}>
            {/* 상단 안내 영역 */}
            <View style={styles.headerArea}>
              <Text style={styles.mainIcon}>🪵</Text>
              <Text style={styles.mainTitle}>회원 로그인</Text>
              <View style={styles.titleLine} />
              <Text style={styles.mainSubtitle}>서랍장 속 소중한 기록을 확인하세요</Text>
            </View>

            {/* 입력 영역 */}
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <TextInput 
                  style={styles.textInput} 
                  value={phone} 
                  onChangeText={handlePhoneChange} 
                  placeholder="010-0000-0000" 
                  placeholderTextColor="#7D5A44" 
                  keyboardType="phone-pad" 
                  maxLength={13} 
                  editable={!loading} 
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <TextInput 
                  style={styles.textInput} 
                  value={password} 
                  onChangeText={handlePasswordChange} 
                  placeholder="비밀번호를 입력하세요" 
                  placeholderTextColor="#7D5A44" 
                  secureTextEntry 
                  editable={!loading} 
                  onSubmitEditing={handleLogin} 
                />
              </View>
            </View>

            <CustomButton 
              title={loading ? '확인 중...' : '입장하기'} 
              onPress={handleLogin} 
              disabled={loading} 
              style={styles.loginButton} 
            />

            {/* 알림 메시지 */}
            {message.text && (
              <View style={[styles.statusMsg, styles[`status${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`]]}>
                <Text style={styles.statusText}>{message.text}</Text>
              </View>
            )}

            <Text style={styles.footerHelp}>
              매장에 등록하신 번호로 이용 가능합니다.{"\n"}정보가 기억나지 않으시면 직원을 불러주세요.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  
  // 🪵 메인 카드 (테두리 제거, 깊이감 강조)
  mainCard: { 
    backgroundColor: '#3D2B1F', 
    borderRadius: 24, 
    padding: 35, 
    width: '100%', 
    // border 삭제
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 20 }, 
    shadowOpacity: 0.6, 
    shadowRadius: 30, 
    elevation: 20 
  },
  
  headerArea: { alignItems: 'center', marginBottom: 40 },
  mainIcon: { fontSize: 50, marginBottom: 10 },
  mainTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: DrawerTheme.goldBrass, 
    letterSpacing: 1.5 
  },
  titleLine: { width: 25, height: 2, backgroundColor: DrawerTheme.goldBrass, marginVertical: 15, opacity: 0.6 },
  mainSubtitle: { fontSize: 14, color: '#A68966', textAlign: 'center' },

  inputSection: { marginBottom: 25 },
  inputWrapper: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: DrawerTheme.goldBrass, marginBottom: 10, paddingLeft: 4 },
  
  // ⌨️ 입력창 (테두리 없이 면 분할)
  textInput: { 
    backgroundColor: '#2D1E17', // 카드보다 더 깊은 색으로 음영 표현
    borderRadius: 12, 
    padding: 18, 
    fontSize: 16, 
    color: '#FFFFFF', 
    textAlign: 'center',
    fontWeight: '500',
    // 테두리 없음
  },

  loginButton: { marginTop: 10, height: 58, borderRadius: 12 },

  // 알림 메시지 디자인
  statusMsg: { padding: 16, borderRadius: 12, marginTop: 20 },
  statusError: { backgroundColor: 'rgba(255, 82, 82, 0.15)' },
  statusSuccess: { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
  statusInfo: { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  statusText: { textAlign: 'center', fontSize: 13, color: '#DDD', fontWeight: '500' },

  footerHelp: { 
    fontSize: 12, 
    color: '#7D5A44', 
    textAlign: 'center', 
    marginTop: 30, 
    lineHeight: 20 
  },
});

export default LoginScreen;