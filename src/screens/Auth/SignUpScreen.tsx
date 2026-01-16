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
import { authService, SignUpData } from '../../services/auth/authService';

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền email và mật khẩu');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const data: SignUpData = { email, password, username: username || undefined };
      await authService.signUp(data);
      Alert.alert('Thành công', 'Tạo tài khoản thành công! Vui lòng kiểm tra email để xác nhận.');
    } catch (error: any) {
      let errorMessage = error.message || 'An error occurred';
      
      // Better error messages
      if (errorMessage.includes('Too many requests') || error.status === 429) {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng đợi 2-5 phút rồi thử lại.';
      } else if (errorMessage.includes('already registered') || errorMessage.includes('User already registered')) {
        errorMessage = 'Email này đã được đăng ký. Vui lòng đăng nhập.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'Vui lòng nhập địa chỉ email hợp lệ.';
      } else if (errorMessage.includes('Password')) {
        errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else if (errorMessage.includes('Database not set up') || errorMessage.includes('does not exist')) {
        errorMessage = 'Cơ sở dữ liệu chưa được thiết lập. Vui lòng chạy supabase-schema.sql.';
      } else if (error.status === 400) {
        // Keep the specific error message from authService if available
        if (!errorMessage.includes('already registered') && 
            !errorMessage.includes('Password') && 
            !errorMessage.includes('Invalid email') &&
            !errorMessage.includes('Database not set up')) {
          errorMessage = 'Đăng ký thất bại. Vui lòng kiểm tra định dạng email và mật khẩu.';
        }
      }
      
      // Log full error for debugging
      console.error('Sign up error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
        fullError: error
      });
      
      Alert.alert('Đăng ký thất bại', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <Text style={styles.subtitle}>Tham gia LVket ngay hôm nay</Text>

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
          placeholder="Tên người dùng (tùy chọn)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Đã có tài khoản? Đăng nhập
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
    fontSize: 32,
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

