/**
 * AuthScreen — Premium glassmorphism authentication screen
 *
 * Features:
 *  - Deep navy background with floating words
 *  - GlassCard container with frosted effect
 *  - GlassInput fields with focus animations
 *  - GlassButton for submit + toggle
 *  - Animated teal glow + entrance animations
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

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Theme tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#07111f',
  accent: '#2dd4bf',
  accentDark: '#07111f',
  whiteHigh: 'rgba(255,255,255,0.92)',
  whiteMid: 'rgba(255,255,255,0.55)',
  whiteLow: 'rgba(255,255,255,0.25)',
  errorText: '#f87171',
};

export default function AuthScreen() {
  const router = useRouter();
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
    <View style={styles.root}>
      {/* ── Background layers ── */}
      <View style={styles.bgBase} />
      <FloatingWords />

      {/* ── Teal glow circles ── */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

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
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Back</Text>
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
            <View style={styles.logoRing}>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.brandName}>Connekta</Text>
            <Text style={styles.brandSub}>
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
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  onPress={() => setIsLogin(true)}
                  style={[
                    styles.modeTab,
                    isLogin && styles.modeTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      isLogin && styles.modeTabTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsLogin(false)}
                  style={[
                    styles.modeTab,
                    !isLogin && styles.modeTabActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      !isLogin && styles.modeTabTextActive,
                    ]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

             


                  {/* Email field */}
              <GlassInput
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon={<Text style={styles.inputIcon}>✉</Text>}
              />

              {!isLogin && (
                <GlassInput
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  icon={<Text style={styles.inputIcon}>✉</Text>}
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
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Biometric login option */}
              <GlassButton
                title="Continue with Biometrics"
                onPress={() => {}}
                variant="ghost"
                size="medium"
                fullWidth
                icon={<Text style={{ fontSize: 18 }}>🔐</Text>}
              />
            </GlassCard>
          </Animated.View>

          {/* ── Footer toggle ── */}
          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={toggleMode} activeOpacity={0.7}>
              <Text style={styles.footerLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Terms ── */}
          <Animated.View style={{ opacity: footerOpacity }}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
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
    backgroundColor: C.bg,
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
  },

  // ── Glow effects ───────────────────────────────────────────────────────────
  glowTop: {
    position: 'absolute',
    top: -80,
    left: SW / 2 - 160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(45,212,191,0.08)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(167,139,250,0.06)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backArrow: {
    color: C.accent,
    fontSize: 18,
    marginRight: 6,
  },
  backText: {
    color: C.whiteHigh,
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
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    // Glow
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    opacity: 0.7,
  },
  brandName: {
    color: C.whiteHigh,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSub: {
    color: C.whiteMid,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
  },
  modeTabText: {
    color: C.whiteLow,
    fontSize: 14,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: C.accent,
  },

  // ── Input icon ─────────────────────────────────────────────────────────────
  inputIcon: {
    fontSize: 16,
    color: C.whiteMid,
  },

  // ── Forgot password ────────────────────────────────────────────────────────
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -8,
  },
  forgotText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: C.whiteLow,
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
    color: C.whiteMid,
    fontSize: 14,
  },
  footerLink: {
    color: C.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Terms ──────────────────────────────────────────────────────────────────
  termsText: {
    color: C.whiteLow,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
  },
  termsLink: {
    color: C.whiteMid,
    textDecorationLine: 'underline',
  },
});