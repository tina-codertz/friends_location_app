/**
 * AuthScreen — Premium glassmorphism authentication screen
 *
 * Features:
 *  - Auto-adapts to device light/dark mode via useAppTheme()
 *  - GlassCard container with frosted effect
 *  - GlassInput fields with focus animations
 *  - GlassButton for submit + toggle
 *  - Animated glow + entrance animations
 *  - Sign In / Sign Up mode toggle
 */

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
} from 'react-native';
import { useRouter } from 'expo-router';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import FloatingWords from '@/components/background/FloatingWords';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // ── Entrance animations ──────────────────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      // Logo
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
      // Card
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
      // Footer
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAuth = () => {
    if (isLogin) {
      // LOGIN → username only
      if (username.trim()) {
        router.push('/(tabs)');
      }
    } else {
      // SIGNUP → username + email
      if (username.trim() && email.trim()) {
        router.push('/(tabs)');
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  const handleBack = () => {
    router.back();
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
              {/* Card header */}
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

              {/* Username field */}
              <GlassInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon={<Text style={[styles.inputIcon, { color: colors.textSecondary }]}>@</Text>}
              />
               {/* Biometric login option */}
              <GlassButton
                title="Continue with Biometrics"
                onPress={() => {}}
                variant="ghost"
                size="medium"
                fullWidth
                icon={<Text style={{ fontSize: 18 }}>🔐</Text>}
              />

              {/* Email field (sign-up only) */}
              {!isLogin && (
                <GlassInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  icon={<Text style={[styles.inputIcon, { color: colors.textSecondary }]}>✉</Text>}
                />
              )}

              {/* Submit button */}
              <GlassButton
                title={isLogin ? 'Sign In' : 'Create Account'}
                onPress={handleAuth}
                variant="primary"
                size="large"
                fullWidth
                style={{ marginTop: 8 }}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              </View>

             
            </GlassCard>
          </Animated.View>

          {/* ── Footer toggle ── */}
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