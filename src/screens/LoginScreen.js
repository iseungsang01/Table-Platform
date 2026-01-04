import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { GradientBackground, CustomButton } from '../components'; // 경로에 맞춰 조정
import { useAuth } from '../hooks/useAuth';
import { formatPhoneNumber } from '../utils/formatters';
import { validatePhoneNumber } from '../utils/validators';
import { Colors } from '../constants/Colors';

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
    if (!validatePhoneNumber(phone)) return setMessage({ text: '올바른 전화번호를 입력해주세요. (010-1234-5678)', type: 'error' });
    if (!password.trim()) return setMessage({ text: '비밀번호를 입력해주세요.', type: 'error' });

    setLoading(true);
    setMessage({ text: '로그인 중...', type: 'info' });

    const result = await login(phone, password);
    setMessage(result.success ? { text: '✅ 로그인 성공!', type: 'success' } : { text: result.message || '로그인 중 오류가 발생했습니다.', type: 'error' });
    setLoading(false);
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
              <TextInput style={styles.input} value={phone} onChangeText={handlePhoneChange} placeholder="010-1234-5678" placeholderTextColor={Colors.purpleLight} keyboardType="phone-pad" maxLength={13} editable={!loading} autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <TextInput style={styles.input} value={password} onChangeText={handlePasswordChange} placeholder="비밀번호 입력" placeholderTextColor={Colors.purpleLight} secureTextEntry editable={!loading} autoCapitalize="none" returnKeyType="done" onSubmitEditing={handleLogin} />
            </View>

            <CustomButton title={loading ? '로그인 중...' : '로그인'} onPress={handleLogin} disabled={loading} loading={loading} style={styles.button} />

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