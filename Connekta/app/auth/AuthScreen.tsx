
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { IconSymbol } from '@/components/ui/icon-symbol';
import FloatingWords from '@/components/background/FloatingWords';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const { width: SW, height: SH } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { register, verifyOTP, login, isLoading, error, clearError } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // ── Entrance animations ──────────────────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslate, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Error alert ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Validation', 'Please enter your username');
      return;
    }

    try {
      await login(username.trim());
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Validation', 'Please fill in all fields');
      return;
    }

    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation', 'Please enter a valid email');
      return;
    }

    try {
      await register(email.trim(), username.trim());
      setTempEmail(email);
      setIsVerifyingOTP(true);
      Alert.alert('Success', 'OTP sent to your email. Please check your inbox.');
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Validation', 'Please enter the OTP');
      return;
    }

    try {
      await verifyOTP(tempEmail, otp.trim());
      setIsVerifyingOTP(false);
      setOTP('');
      setEmail('');
      setUsername('');
      Alert.alert('Success', 'Email verified! You can now login.');
    } catch (err) {
      console.error('OTP verification error:', err);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  const handleBack = () => {
    if (isVerifyingOTP) {
      setIsVerifyingOTP(false);
      setOTP('');
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ── Background layers ── */}
      <View style={[styles.bgBase, { backgroundColor: colors.bg }]} />
      <FloatingWords />

      {/* ── Glow circles ── */}
      <View style={[styles.glowTop, { backgroundColor: colors.tealGlow }]} />
      <View style={[styles.glowBottom, { backgroundColor: colors.purpleGlow }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back button ── */}
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.glassBorderLight }]}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.backArrow, { color: accent.teal }]}>←</Text>
            <Text style={[styles.backText, { color: colors.textPrimary }]}>Back</Text>
          </TouchableOpacity>

          {/* ── Logo / Brand ── */}
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={[styles.logoRing, { backgroundColor: colors.tealGlow, borderColor: accent.teal }]}>
              <View style={[styles.logoDot, { backgroundColor: accent.teal }]} />
            </View>
            <Text style={[styles.brandName, { color: colors.textPrimary }]}>Connekta</Text>
            <Text style={[styles.brandSub, { color: colors.textSecondary }]}>
              {isLogin ? 'Welcome back' : 'Create your account'}
            </Text>
          </Animated.View>

          {/* ── Auth Card ── */}
          <Animated.View
            style={{
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            }}
          >
            <GlassCard
              intensity="medium"
              glowAccent
              borderRadius={24}
              style={styles.authCard}
            >
              {/* Card header - Hide during OTP verification */}
              {!isVerifyingOTP && (
                <View style={[styles.cardHeader, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity
                    onPress={() => setIsLogin(true)}
                    style={[
                      styles.modeTab,
                      isLogin && [styles.modeTabActive, { backgroundColor: colors.tealGlass, borderColor: colors.tealBorder }],
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        { color: colors.textTertiary },
                        isLogin && { color: accent.teal },
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsLogin(false)}
                    style={[
                      styles.modeTab,
                      !isLogin && [styles.modeTabActive, { backgroundColor: colors.tealGlass, borderColor: colors.tealBorder }],
                    ]}
                    activeOpacity={0.7}
                  >
                  <Text
                    style={[
                      styles.modeTabText,
                      { color: colors.textTertiary },
                      !isLogin && { color: accent.teal },
                    ]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
              )}

              {/* Username field */}
              <GlassInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon={<Text style={[styles.inputIcon, { color: colors.textSecondary }]}>@</Text>}
              />

              {/* Biometric login option (login only) */}
              {isLogin && (
                <TouchableOpacity
                  style={[styles.biometricIconBtn, { borderColor: accent.teal, backgroundColor: colors.surface }]}
                  onPress={() => {}}
                  activeOpacity={0.6}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <IconSymbol name="fingerprint.fill" size={32} color={accent.teal} />
                </TouchableOpacity>
              )}

              {/* Email field (sign-up only) */}
              {!isLogin && !isVerifyingOTP && (
                <GlassInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  icon={<Text style={[styles.inputIcon, { color: colors.textSecondary }]}>✉</Text>}
                />
              )}

              {/* OTP verification (after signup) */}
              {isVerifyingOTP && (
                <>
                  <Text style={[styles.otpLabel, { color: colors.textSecondary }]}>
                    Enter the OTP sent to {tempEmail}
                  </Text>
                  <GlassInput
                    label="One-Time Password"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOTP}
                    keyboardType="number-pad"
                    maxLength={6}
                    icon={<Text style={[styles.inputIcon, { color: colors.textSecondary }]}>🔐</Text>}
                  />
                  <GlassButton
                    title="Verify OTP"
                    onPress={handleVerifyOTP}
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={isLoading}
                    disabled={isLoading}
                    style={{ marginTop: 16 }}
                  />
                </>
              )}

              {/* Submit button */}
              {!isVerifyingOTP && (
                <GlassButton
                  title={isLogin ? 'Sign In' : 'Create Account'}
                  onPress={isLogin ? handleLogin : handleRegister}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                  style={{ marginTop: 8 }}
                />
              )}

              {/* Divider - Hide during OTP verification */}
              {!isVerifyingOTP && (
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                  <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* ── Footer toggle - Hide during OTP verification ── */}
          {!isVerifyingOTP && (
            <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
                <Text style={[styles.footerLink, { color: accent.teal }]}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Terms ── */}
          <Animated.View style={{ opacity: footerOpacity }}>
            <Text style={[styles.termsText, { color: colors.textTertiary }]}>
              By continuing, you agree to our{' '}
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[styles.termsLink, { color: colors.textSecondary }]}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Glow effects ───────────────────────────────────────────────────────────
  glowTop: {
    position: 'absolute',
    top: -80,
    left: SW / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
  },

  // ── Layout ─────────────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },

  // ── Back button ────────────────────────────────────────────────────────────
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  backArrow: {
    fontSize: 18,
    marginRight: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Logo ───────────────────────────────────────────────────────────────────
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2dd4bf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.7,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 14,
    marginTop: 6,
  },

  // ── Auth card ──────────────────────────────────────────────────────────────
  authCard: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // ── Mode tabs ──────────────────────────────────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeTabActive: {
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Input icon ─────────────────────────────────────────────────────────────
  inputIcon: {
    fontSize: 16,
  },
  // ── OTP label ──────────────────────────────────────────────────────────────
  otpLabel: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  // ── Biometric icon button ─────────────────────────────────────────────────
  biometricIconBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: 12,
    fontWeight: '500',
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Terms ──────────────────────────────────────────────────────────────────
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});