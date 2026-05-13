import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import FloatingWords from '@/components/background/FloatingWords';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Colour tokens (match your screenshot palette) ───────────────────────────
const C = {
  bg: '#07111f',           // deep navy
  bgCard: '#0d1f35',       // slightly lighter card
  bgCardBorder: '#1a3152',
  accent: '#2dd4bf',       // teal / cyan
  accentPurple: '#a78bfa', // purple dots
  accentOrange: '#fb923c', // orange dot
  white: '#ffffff',
  whiteHigh: 'rgba(255,255,255,0.92)',
  whiteMid: 'rgba(255,255,255,0.55)',
  whiteLow: 'rgba(255,255,255,0.25)',
  liveGreen: '#22c55e',
  pillBg: 'rgba(255,255,255,0.06)',
  pillBorder: 'rgba(255,255,255,0.12)',
  tealGlow: 'rgba(45,212,191,0.15)',
};

// ─── Slide content definitions ────────────────────────────────────────────────
const SLIDES = [
  { id: 0 },  // Live Map
  { id: 1 },  // Friends List
  { id: 2 },  // Device Auth
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Tiny pulsing "LIVE" badge */
function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

/** Fake map with coloured avatar pins */
function MockMap() {
  const pins = [
    { label: 'Alex', color: C.accentPurple, top: SH * 0.28, left: SW * 0.15 },
    { label: 'You',  color: C.accent,       top: SH * 0.35, left: SW * 0.25 },
    { label: 'Sam',  color: C.accentOrange, top: SH * 0.45, left: SW * 0.30 },
  ];
  return (
    <View style={styles.mapContainer}>
      {/* pins */}
      {pins.map((p) => (
        <View key={p.label} style={[styles.pinWrap, { top: p.top, left: p.left }]}>
          <View style={[styles.pinBubble, { backgroundColor: p.color }]}>
            <Text style={styles.pinLabel}>{p.label}</Text>
          </View>
          <View style={[styles.pinDot, { backgroundColor: p.color === C.accent ? '#ffffff' : p.color }]} />
        </View>
      ))}
    </View>
  );
}

/** Slide 0 — Live Map phone mockup */
function Slide0() {
  return (
    <View style={styles.phoneShell}>
      <View style={styles.phoneStatusBar}>
        <Text style={styles.phoneTime}>9:41</Text>
        <LiveBadge />
      </View>
      <MockMap />
      <View style={styles.phoneTabBar}>
        {['map-pin', 'users', 'bell', 'shield'].map((icon, i) => (
          <View key={i} style={styles.tabItem}>
            <View style={[styles.tabIcon, i === 0 && styles.tabIconActive]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Slide 1 — Friends list mockup */
function Slide1() {
  const friends = [
    { initials: 'A', name: 'Alex K.',    sub: 'Sharing loc…', color: C.accentPurple, sharing: true },
    { initials: 'S', name: 'Sam T.',     sub: 'Sharing loc…', color: '#22c55e',      sharing: true },
    { initials: 'J', name: 'Jordan R.',  sub: 'Location off', color: C.accentOrange, sharing: false },
  ];
  return (
    <View style={styles.phoneShell}>
      <View style={styles.friendsHeader}>
        <Text style={styles.friendsLabel}>FRIENDS</Text>
        <Text style={styles.friendsCount}>3 Active</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        {friends.map((f, i) => (
          <View key={i} style={styles.friendRow}>
            <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
              <Text style={styles.friendInitial}>{f.initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.friendName}>{f.name}</Text>
              <Text style={[styles.friendSub, { color: f.sharing ? C.accent : C.whiteLow }]}>{f.sub}</Text>
            </View>
            <View style={[styles.sharingDot, { backgroundColor: f.sharing ? C.accent : 'transparent', borderColor: f.sharing ? C.accent : C.whiteLow }]} />
          </View>
        ))}
      </View>
      <View style={styles.phoneTabBar}>
        {[0,1,2,3].map((i) => (
          <View key={i} style={styles.tabItem}>
            <View style={[styles.tabIcon, i === 1 && styles.tabIconActive]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Slide 2 — Device auth mockup */
function Slide2() {
  return (
    <View style={styles.phoneShell}>
      <View style={styles.authIconWrap}>
        <View style={styles.authIcon}>
          <View style={styles.authIconInner} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={styles.authTitle}>Device Auth</Text>
        <Text style={styles.authSub}>No password needed</Text>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={styles.inputBox}>
            <Text style={styles.inputValue}>@jackson</Text>
            <View style={styles.cursor} />
          </View>
        </View>
        <View style={styles.biometricRow}>
          <View style={styles.biometricIcon}>
            <View style={styles.biometricRing} />
            <View style={styles.biometricCenter} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bioTitle}>Biometric Unlock</Text>
            <Text style={styles.bioSub}>Face ID · Touch ID</Text>
          </View>
          <View style={styles.toggle}>
            <View style={styles.toggleThumb} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  /** Animate transition to any slide (forward or backward) */
  const goToSlide = useCallback((targetSlide: number) => {
    if (targetSlide === slide || targetSlide < 0 || targetSlide >= SLIDES.length) return;

    const direction = targetSlide > slide ? -1 : 1; // slide out left vs right

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * 30, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setSlide(targetSlide);
      slideAnim.setValue(-direction * 30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    });
  }, [slide, fadeAnim, slideAnim]);

  /** Tap-anywhere advances forward only when not on last slide */
  const advance = useCallback(() => {
    if (slide < SLIDES.length - 1) {
      goToSlide(slide + 1);
    }
  }, [slide, goToSlide]);

  const handleJoin = () => {
    router.push('/auth/AuthScreen');
  };

  const isLast = slide === SLIDES.length - 1;

  const slideComponents = [<Slide0 />, <Slide1 />, <Slide2 />];

  const headings = [
    { title: 'See your friends,\nright now.',    sub: 'Live location on a shared map. Always opt-in, always private.' },
    { title: 'Your circle,\nyour rules.',        sub: 'Accept or reject requests. Only accepted friends see where you are.' },
    { title: 'No password.\nJust you.',          sub: 'Register with a username. Unlock with your face or fingerprint.' },
  ];

  return (
    <TouchableWithoutFeedback onPress={!isLast ? advance : undefined}>
      <View style={styles.root}>

        {/* ── Dark gradient background ── */}
        <View style={styles.bgBase} />

        {/* ── Floating words background ── */}
        <FloatingWords />

        {/* ── Subtle radial glow behind phone ── */}
        <View style={styles.glow} />

        {/* ── Phone mockup (animated) ── */}
        <Animated.View
          style={[
            styles.phoneWrap,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {slideComponents[slide]}
        </Animated.View>

        {/* ── Bottom content ── */}
        <View style={styles.bottomContent}>

          {/* Pill indicators (tappable) */}
          <View style={styles.pillRow}>
            {SLIDES.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => goToSlide(s.id)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.pill,
                    slide === s.id && styles.pillActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Heading */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.heading}>{headings[slide].title}</Text>
            <Text style={styles.subheading}>{headings[slide].sub}</Text>
          </Animated.View>

          {/* Tab labels — TAPPABLE for back-and-forth navigation */}
          <View style={styles.tabLabels}>
            {['LIVE MAP', 'FRIENDS LIST', 'DEVICE AUTH'].map((label, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goToSlide(i)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[styles.tabLabel, slide === i && styles.tabLabelActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA — always visible, with contextual text */}
          <TouchableOpacity
            style={[
              styles.joinBtn,
              !isLast && styles.joinBtnSecondary,
            ]}
            onPress={isLast ? handleJoin : advance}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.joinBtnText,
                !isLast && styles.joinBtnTextSecondary,
              ]}
            >
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Tap-anywhere hint on non-last slides */}
          {!isLast && (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>or tap anywhere to continue</Text>
            </View>
          )}
        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const PHONE_W = SW * 0.62;
const PHONE_H = PHONE_W * 1.9;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bgBase: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg },
  glow: {
    position: 'absolute',
    top: SH * 0.1,
    left: SW / 2 - 140,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(45,212,191,0.07)',
  },

  // ── Phone shell ────────────────────────────────────────────────────────────
  phoneWrap: {
    position: 'absolute',
    top: SH * 0.07,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  phoneShell: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 36,
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.bgCardBorder,
    overflow: 'hidden',
  },

  // ── Status bar ──────────────────────────────────────────────────────────────
  phoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  phoneTime: { color: C.whiteHigh, fontSize: 13, fontWeight: '600' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.liveGreen },
  liveText: { color: C.liveGreen, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Mock map ────────────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
    backgroundColor: '#0a1929',
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  gridLine: { position: 'absolute' as const, backgroundColor: 'rgba(255,255,255,0.04)' },
  road: {
    position: 'absolute' as const,
    top: SH * 0.15,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    transform: [{ rotate: '-12deg' }, { scaleX: 1.5 }],
  },
  pinWrap: { position: 'absolute' as const, alignItems: 'center' },
  pinBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 3,
  },
  pinLabel: { color: '#fff', fontSize: 10, fontWeight: '700' },
  pinDot: { width: 10, height: 10, borderRadius: 5 },

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  phoneTabBar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    backgroundColor: 'rgba(10,20,40,0.6)',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabIconActive: { backgroundColor: C.accent },

  // ── Friends list ────────────────────────────────────────────────────────────
  friendsHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  friendsLabel: { color: C.whiteLow, fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  friendsCount: { color: C.whiteHigh, fontSize: 20, fontWeight: '700', marginTop: 2 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInitial: { color: '#fff', fontWeight: '700', fontSize: 14 },
  friendName: { color: C.whiteHigh, fontSize: 13, fontWeight: '600' },
  friendSub: { fontSize: 11, marginTop: 1 },
  sharingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    marginRight: 4,
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  authIconWrap: { alignItems: 'center', paddingTop: 28, paddingBottom: 16 },
  authIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIconInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    opacity: 0.6,
  },
  authTitle: { color: C.whiteHigh, fontSize: 18, fontWeight: '700' },
  authSub: { color: C.whiteMid, fontSize: 12, marginTop: 3, marginBottom: 16 },
  inputField: { marginBottom: 16 },
  inputLabel: { color: C.whiteLow, fontSize: 11, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputValue: { color: C.whiteHigh, fontSize: 14 },
  cursor: { width: 1.5, height: 16, backgroundColor: C.accent, marginLeft: 2 },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45,212,191,0.07)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.2)',
  },
  biometricIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  biometricCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.accent,
    opacity: 0.5,
  },
  bioTitle: { color: C.whiteHigh, fontSize: 13, fontWeight: '600' },
  bioSub: { color: C.whiteMid, fontSize: 11, marginTop: 2 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },

  // ── Bottom content ──────────────────────────────────────────────────────────
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    justifyContent: 'center',
  },
  pill: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  pillActive: { width: 40, backgroundColor: C.accent },
  heading: {
    color: C.whiteHigh,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 10,
  },
  subheading: {
    color: C.whiteMid,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  tabLabels: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 22,
  },
  tabLabel: {
    color: C.whiteLow,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingBottom: 3,
  },
  tabLabelActive: {
    color: C.whiteHigh,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
  },
  joinBtn: {
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnSecondary: {
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.35)',
  },
  joinBtnText: {
    color: '#07111f',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  joinBtnTextSecondary: {
    color: C.accent,
  },
  tapHint: { alignItems: 'center', paddingVertical: 8 },
  tapHintText: { color: C.whiteLow, fontSize: 12, letterSpacing: 0.5 },
});