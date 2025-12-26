import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GradientBackground } from '../components/GradientBackground';
import { CustomButton } from '../components/CustomButton';
import { useAuth } from '../hooks/useAuth';
import { formatPhoneNumber, validatePhoneNumber } from '../utils/validators';
import { storage } from '../utils/storage';
import { Colors } from '../constants/Colors';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    loadSavedPhone();
  }, []);

  const loadSavedPhone = async () => {
    const savedPhone = await storage.get('saved_phone');
    const savedRemember = await storage.get('remember_me');
    
    if (savedRemember && savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const handleLogin = async () => {
    if (!validatePhoneNumber(phone)) {
      setMessage({ text: '올바른 전화번호를 입력해주세요.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const result = await login(phone);

    if (result.success) {
      if (rememberMe) {
        await storage.save('saved_phone', phone);
        await storage.save('remember_me', true);
      } else {
        await storage.remove('saved_phone');
        await storage.remove('remember_me');
      }
    } else {
      setMessage({ 
        text: result.message || '로그인 중 오류가 발생했습니다.', 
        type: 'error' 
      });
    }

    setLoading(false);
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
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
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>로그인 정보 저장</Text>
            </TouchableOpacity>

            <CustomButton
              title={loading ? '로그인 중...' : '로그인'}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={styles.button}
            />

            {message.text && (
              <View style={[
                styles.message,
                message.type === 'error' ? styles.messageError : styles.messageSuccess
              ]}>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            )}

            <Text style={styles.helpText}>
              * 매장 방문 시 등록한 전화번호를 입력해주세요
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.purpleMid,
    borderRadius: 20,
    padding: 40,
    width: '100%',
    maxWidth: 450,
    borderWidth: 3,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 20,
  },
  logo: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lavender,
    textAlign: 'center',
    marginBottom: 30,
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
  input: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.purpleLight,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  checkmark: {
    color: Colors.purpleDark,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.lavender,
  },
  button: {
    marginBottom: 20,
  },
  message: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  messageError: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 2,
    borderColor: Colors.errorRed,
  },
  messageSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: Colors.green,
  },
  messageText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  helpText: {
    fontSize: 13,
    color: Colors.lavender,
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default LoginScreen;