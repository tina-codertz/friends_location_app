import { useState, useEffect } from 'react';
import { Alert, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Host, Column, Text, TextInput, Button } from '@expo/ui';
import { useAuth } from '@/context/AuthContext';
import { validateUsername } from '@/utils/username';

export default function AuthScreen() {
  const { login, register, isLoading, isLoggedIn, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  if (isLoggedIn) return <Redirect href="/(tabs)/map" />;

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    if (!isLogin) {
      const check = validateUsername(username);
      if (!check.ok) {
        Alert.alert('Username', check.message);
        return;
      }
      await register(email.trim(), password, check.value);
    } else {
      await login(email.trim(), password);
    }
  };

  return (
    <View style={styles.shell}>
      <Host style={{ flex: 1 }}>
        <Column spacing={16} style={{ padding: 24, paddingTop: 80 }}>
          <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>

          {!isLogin && (
            <TextInput
              placeholder="Username"
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}
          <TextInput
            placeholder="Email"
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            onChangeText={setPassword}
            secureTextEntry
          />

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : (
            <Button
              variant="filled"
              label={isLogin ? 'Sign In' : 'Create Account'}
              onPress={() => void onSubmit()}
            />
          )}

          <Button
            variant="text"
            label={isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            onPress={() => setIsLogin((v) => !v)}
          />
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
});