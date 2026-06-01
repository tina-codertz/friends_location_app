import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { isUsernameAvailable } from '@/services/firebase-auth';
import { validateUsername } from '@/utils/username';
import { Font, FontBrand } from '@/constants/typography';

const { width: SW } = Dimensions.get('window');

function FieldIcon({ name, color }: { name: keyof typeof Ionicons.glyphMap; color: string }) {
  return <Ionicons name={name} size={20} color={color} />;
}

export default function AuthScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { register, login, isLoading, error, clearError } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(heroOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.spring(cardTranslate, { toValue: 0, tension: 52, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  }, [heroOpacity, cardOpacity, cardTranslate]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validatePassword = (value: string) => {
    if (value.length < 6) {
      return { ok: false as const, message: 'Password must be at least 6 characters' };
    }
    return { ok: true as const };
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email');
      return;
    }
    const pw = validatePassword(password);
    if (!pw.ok) {
      Alert.alert('Validation', pw.message);
      return;
    }

    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)/map');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.ok) {
      Alert.alert('Username', usernameCheck.message);
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email');
      return;
    }

    const pw = validatePassword(password);
    if (!pw.ok) {
      Alert.alert('Validation', pw.message);
      return;
    }

    try {
      const available = await isUsernameAvailable(usernameCheck.value);
      if (!available) {
        Alert.alert('Username taken', 'This username is already taken');
        return;
      }

      await register(email.trim().toLowerCase(), password, usernameCheck.value);
      setEmail('');
      setUsername('');
      setPassword('');
      router.replace('/(tabs)/map');
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setPassword('');
  };

  const iconMuted = colors.textMuted;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.glowTop, { backgroundColor: colors.tealGlow }]} />
      <View style={[styles.glowBottom, { backgroundColor: colors.tealGlow }]} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassIconButton name="chevron-back" onPress={() => router.back()} style={styles.backBtn} />

          <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
            <LinearGradient
              colors={[`${accent.cyan}33`, `${accent.cyanDeep}11`]}
              style={[styles.logoRing, { borderColor: colors.tealBorder }]}
            >
              <View style={[styles.logoInner, { backgroundColor: accent.cyan }]}>
                <Ionicons name="radio-outline" size={28} color={colors.bg} />
              </View>
            </LinearGradient>
            <Text style={[styles.brandName, { color: accent.cyan, fontFamily: FontBrand.extrabold }]}>
              Connekta
            </Text>
            <Text style={[styles.brandSub, { color: colors.textSecondary, fontFamily: Font.regular }]}>
              {isLogin ? 'Sign in to see your circle on the map' : 'Create your account'}
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            }}
          >
            <GlassCard intensity="medium" glowAccent borderRadius={24} style={styles.authCard}>
              <View style={styles.modeRow}>
                <GlassButton
                  title="Sign In"
                  onPress={() => setIsLogin(true)}
                  variant={isLogin ? 'chipActive' : 'chip'}
                  size="small"
                  style={styles.modeBtn}
                />
                <GlassButton
                  title="Sign Up"
                  onPress={() => setIsLogin(false)}
                  variant={!isLogin ? 'chipActive' : 'chip'}
                  size="small"
                  style={styles.modeBtn}
                />
              </View>

              {!isLogin && (
                <GlassInput
                  layout="stacked"
                  label="Username"
                  placeholder="yourname"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon={<FieldIcon name="at" color={iconMuted} />}
                />
              )}

              <GlassInput
                layout="stacked"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                icon={<FieldIcon name="mail-outline" color={iconMuted} />}
              />

              <GlassInput
                layout="stacked"
                label="Password"
                placeholder={isLogin ? 'Your password' : 'Min. 6 characters'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showSecureToggle
                icon={<FieldIcon name="lock-closed-outline" color={iconMuted} />}
              />

              <GlassButton
                title={isLogin ? 'Sign In' : 'Create Account'}
                onPress={isLogin ? handleLogin : handleRegister}
                variant="primary"
                size="large"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitBtn}
              />
            </GlassCard>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontFamily: Font.regular }]}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: accent.cyan, fontFamily: Font.semibold }]}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.termsText, { color: colors.textTertiary, fontFamily: Font.regular }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: SW / 2 - 180,
    width: 360,
    height: 360,
    borderRadius: 180,
    opacity: 0.9,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
  hero: { alignItems: 'center', marginBottom: 28 },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 30,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  authCard: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  modeBtn: { flex: 1 },
  submitBtn: { marginTop: 4 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 14,
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14 },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  termsLink: { textDecorationLine: 'underline' },
});
