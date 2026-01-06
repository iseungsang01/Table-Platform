import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GradientBackground, CustomButton } from '../components';
import { useAuth } from '../hooks/useAuth';
import { formatPhoneNumber } from '../utils/formatters';
import { validatePhoneNumber } from '../utils/validators';
import { Colors } from '../constants/Colors';
import { 
  createValidationError, 
  showErrorAlert,
  showSuccessAlert 
} from '../utils/errorHandler';
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
    console.log('========================================');
    console.log('🔐 [LoginScreen] 로그인 시도');
    console.log('========================================');

    // 1. 전화번호 유효성 검사
    if (!validatePhoneNumber(phone)) {
      console.log('❌ [LoginScreen] 전화번호 형식 오류');
      const errorInfo = createValidationError('PHONE_INVALID');
      setMessage({ text: errorInfo.message, type: 'error' });
      return;
    }

    // 2. 비밀번호 검사
    if (!password.trim()) {
      console.log('❌ [LoginScreen] 비밀번호 미입력');
      const errorInfo = createValidationError('PASSWORD_EMPTY');
      setMessage({ text: errorInfo.message, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '로그인 중...', type: 'info' });

    try {
      const result = await login(phone, password);

      if (result.success) {
        console.log('✅ [LoginScreen] 로그인 성공');
        setMessage({ 
          text: ERROR_MESSAGES.AUTH.LOGIN_FAILED.icon + ' ' + '로그인 성공!', 
          type: 'success' 
        });
      } else {
        console.log('❌ [LoginScreen] 로그인 실패:', result.message);
        
        // 에러 메시지 매핑
        let errorMessage = result.message;
        
        if (result.message.includes('등록되지 않은')) {
          errorMessage = ERROR_MESSAGES.AUTH.NOT_REGISTERED.message;
        } else if (result.message.includes('비밀번호')) {
          errorMessage = ERROR_MESSAGES.AUTH.WRONG_PASSWORD.message;
        }
        
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('❌ [LoginScreen] 로그인 예외:', error);
      setMessage({ 
        text: '로그인 중 오류가 발생했습니다.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      console.log('========================================');
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.logo}>🔮</Text>
            <Text style={styles.title}>타로 카드 선택</Text>
            <Text style={styles.subtitle}>방문 기록과 나만의 카드를 확인하세요</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>전화번호</Text>
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={handlePhoneChange} 
                placeholder="010-1234-5678" 
                placeholderTextColor={Colors.purpleLight} 
                keyboardType="phone-pad" 
                maxLength={13} 
                editable={!loading} 
                autoCapitalize="none" 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput 
                style={styles.input} 
                value={password} 
                onChangeText={handlePasswordChange} 
                placeholder="비밀번호 입력" 
                placeholderTextColor={Colors.purpleLight} 
                secureTextEntry 
                editable={!loading} 
                autoCapitalize="none" 
                returnKeyType="done" 
                onSubmitEditing={handleLogin} 
              />
            </View>

            <CustomButton 
              title={loading ? '로그인 중...' : '로그인'} 
              onPress={handleLogin} 
              disabled={loading} 
              loading={loading} 
              style={styles.button} 
            />

            {message.text && (
              <View style={[styles.message, styles[`message${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`]]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

            <Text style={styles.helpText}>* 매장 방문 시 등록한 전화번호와 비밀번호를 입력해주세요</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: Colors.purpleMid, borderRadius: 20, padding: 40, width: '100%', maxWidth: 450, borderWidth: 3, borderColor: Colors.gold, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 60, elevation: 20 },
  logo: { fontSize: 80, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.gold, textAlign: 'center', marginBottom: 10, textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  subtitle: { fontSize: 16, color: Colors.lavender, textAlign: 'center', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.gold, marginBottom: 8 },
  input: { backgroundColor: 'rgba(138, 43, 226, 0.1)', borderWidth: 2, borderColor: Colors.purpleLight, borderRadius: 10, padding: 15, fontSize: 16, color: 'white', textAlign: 'center', fontWeight: '600' },
  button: { marginBottom: 20 },
  message: { padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 2 },
  messageError: { backgroundColor: 'rgba(244, 67, 54, 0.2)', borderColor: Colors.errorRed },
  messageSuccess: { backgroundColor: 'rgba(76, 175, 80, 0.2)', borderColor: Colors.green },
  messageInfo: { backgroundColor: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196f3' },
  messageText: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: 'white' },
  helpText: { fontSize: 13, color: Colors.lavender, textAlign: 'center', opacity: 0.8, lineHeight: 20 },
});

export default LoginScreen;