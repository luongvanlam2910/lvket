import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService, SignInData } from '../../services/auth/authService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const data: SignInData = { email, password };
      await authService.signIn(data);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      let errorMessage = error.message || 'An error occurred';
      
      // Better error messages
      if (errorMessage.includes('Too many requests') || error.status === 429) {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng đợi 2-5 phút rồi thử lại.';
      } else if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid email or password')) {
        errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.';
      } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('verify your email')) {
        errorMessage = 'Vui lòng xác nhận email trước khi đăng nhập. Kiểm tra hộp thư đến của bạn.';
      } else if (error.status === 400) {
        errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      }
      
      // Log error for debugging
      console.error('Login error details:', error);
      
      Alert.alert('Đăng nhập thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LV</Text>
      <Text style={styles.subtitle}>Chia sẻ khoảnh khắc với bạn bè thân</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Chưa có tài khoản? Đăng ký
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

