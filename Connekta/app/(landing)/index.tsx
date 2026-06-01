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
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Slide content definitions ────────────────────────────────────────────────
const SLIDES = [
  { id: 0 },  // Live Map
  { id: 1 },  // Friends List
  { id: 2 },  // Device Auth
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Tiny pulsing "LIVE" badge */
function LiveBadge() {
  const { colors, accent } = useAppTheme();
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
    <View style={[styles.liveBadge, { backgroundColor: colors.liveGreenBg }]}>
      <Animated.View style={[styles.liveDot, { opacity: pulse, backgroundColor: accent.green }]} />
      <Text style={[styles.liveText, { color: accent.green }]}>LIVE</Text>
    </View>
  );
}

/** Circle preview — no map imagery (real map is home tab only) */
function CirclePreview() {
  const { colors, accent } = useAppTheme();
  const pins = [
    { label: 'Alex', color: accent.cyan, top: SH * 0.28, left: SW * 0.15 },
    { label: 'You', color: accent.teal, top: SH * 0.35, left: SW * 0.25 },
    { label: 'Sam', color: accent.cyanDeep, top: SH * 0.45, left: SW * 0.3 },
  ];
  return (
    <View
      style={[
        styles.mapContainer,
        {
          backgroundColor: colors.glassBgMedium,
          borderColor: colors.glassBorderMedium,
          borderWidth: 1,
        },
      ]}
    >
      <View style={[styles.circleGlow, { backgroundColor: colors.tealGlow }]} />
      {pins.map((p) => (
        <View key={p.label} style={[styles.pinWrap, { top: p.top, left: p.left }]}>
          <View style={[styles.pinBubble, { backgroundColor: p.color }]}>
            <Text style={styles.pinLabel}>{p.label}</Text>
          </View>
          <View style={[styles.pinDot, { backgroundColor: p.color === accent.teal ? '#ffffff' : p.color }]} />
        </View>
      ))}
    </View>
  );
}

/** Slide 0 — Live Map phone mockup */
function Slide0() {
  const { colors, accent } = useAppTheme();
  return (
    <View style={[styles.phoneShell, { backgroundColor: colors.bgCard, borderColor: colors.bgCardBorder }]}>
      <View style={styles.phoneStatusBar}>
        <Text style={[styles.phoneTime, { color: colors.textPrimary }]}>9:41</Text>
        <LiveBadge />
      </View>
      <CirclePreview />
      <View style={[styles.phoneTabBar, { backgroundColor: colors.phoneTabBg, borderTopColor: colors.divider }]}>
        {['map-pin', 'users', 'bell', 'shield'].map((_icon, i) => (
          <View key={i} style={styles.tabItem}>
            <View style={[styles.tabIcon, { backgroundColor: colors.pill }, i === 0 && { backgroundColor: accent.teal }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Slide 1 — Friends list mockup */
function Slide1() {
  const { colors, accent } = useAppTheme();
  const friends = [
    { initials: 'A', name: 'Alex K.',    sub: 'Sharing loc…', color: accent.cyan, sharing: true },
    { initials: 'S', name: 'Sam T.',     sub: 'Sharing loc…', color: accent.green,  sharing: true },
    { initials: 'J', name: 'Jordan R.',  sub: 'Location off', color: accent.orange, sharing: false },
  ];
  return (
    <View style={[styles.phoneShell, { backgroundColor: colors.bgCard, borderColor: colors.bgCardBorder }]}>
      <View style={styles.friendsHeader}>
        <Text style={[styles.friendsLabel, { color: colors.textTertiary }]}>FRIENDS</Text>
        <Text style={[styles.friendsCount, { color: colors.textPrimary }]}>3 Active</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}>
        {friends.map((f, i) => (
          <View key={i} style={[styles.friendRow, { borderBottomColor: colors.divider }]}>
            <View style={[styles.friendAvatar, { backgroundColor: f.color }]}>
              <Text style={styles.friendInitial}>{f.initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.friendName, { color: colors.textPrimary }]}>{f.name}</Text>
              <Text style={[styles.friendSub, { color: f.sharing ? accent.teal : colors.textTertiary }]}>{f.sub}</Text>
            </View>
            <View style={[styles.sharingDot, { backgroundColor: f.sharing ? accent.teal : 'transparent', borderColor: f.sharing ? accent.teal : colors.textTertiary }]} />
          </View>
        ))}
      </View>
      <View style={[styles.phoneTabBar, { backgroundColor: colors.phoneTabBg, borderTopColor: colors.divider }]}>
        {[0,1,2,3].map((i) => (
          <View key={i} style={styles.tabItem}>
            <View style={[styles.tabIcon, { backgroundColor: colors.pill }, i === 1 && { backgroundColor: accent.teal }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Slide 2 — Device auth mockup */
function Slide2() {
  const { colors, accent } = useAppTheme();
  return (
    <View style={[styles.phoneShell, { backgroundColor: colors.bgCard, borderColor: colors.bgCardBorder }]}>
      <View style={styles.authIconWrap}>
        <View style={[styles.authIcon, { backgroundColor: colors.tealGlow, borderColor: accent.teal }]}>
          <View style={[styles.authIconInner, { backgroundColor: accent.teal }]} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, flex: 1 }}>
        <Text style={[styles.authTitle, { color: colors.textPrimary }]}>Device Auth</Text>
        <Text style={[styles.authSub, { color: colors.textSecondary }]}>No password needed</Text>
        <View style={styles.inputField}>
          <Text style={[styles.inputLabel, { color: colors.textTertiary }]}>Username</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Text style={[styles.inputValue, { color: colors.textPrimary }]}>@jackson</Text>
            <View style={[styles.cursor, { backgroundColor: accent.teal }]} />
          </View>
        </View>
        <View style={[styles.biometricRow, { backgroundColor: colors.tealGlass, borderColor: colors.tealBorder }]}>
          <View style={styles.biometricIcon}>
            <View style={[styles.biometricRing, { borderColor: accent.teal }]} />
            <View style={[styles.biometricCenter, { backgroundColor: accent.teal }]} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.bioTitle, { color: colors.textPrimary }]}>Biometric Unlock</Text>
            <Text style={[styles.bioSub, { color: colors.textSecondary }]}>Face ID · Touch ID</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: accent.teal }]}>
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
  const { colors, accent } = useAppTheme();
  const [slide, setSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  /** Animate transition to any slide (forward or backward) */
  const goToSlide = useCallback((targetSlide: number) => {
    if (targetSlide === slide || targetSlide < 0 || targetSlide >= SLIDES.length) return;

    const direction = targetSlide > slide ? -1 : 1;

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

  const slideComponents = [<Slide0 key="0" />, <Slide1 key="1" />, <Slide2 key="2" />];

  const headings = [
    { title: 'See your friends,\nright now.',    sub: 'Live location on a shared map. Always opt-in, always private.' },
    { title: 'Your circle,\nyour rules.',        sub: 'Accept or reject requests. Only accepted friends see where you are.' },
    { title: 'No password.\nJust you.',          sub: 'Register with a username. Unlock with your face or fingerprint.' },
  ];

  return (
    <TouchableWithoutFeedback onPress={!isLast ? advance : undefined}>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>

        {/* ── Background ── */}
        <View style={[styles.bgBase, { backgroundColor: colors.bg }]} />

        {/* ── Floating words ── */}
        <FloatingWords />

        {/* ── Subtle radial glow ── */}
        <View style={[styles.glow, { backgroundColor: colors.tealGlow }]} />

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
                    { backgroundColor: colors.pill },
                    slide === s.id && [styles.pillActive, { backgroundColor: accent.teal }],
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Heading */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>{headings[slide].title}</Text>
            <Text style={[styles.subheading, { color: colors.textSecondary }]}>{headings[slide].sub}</Text>
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
                  style={[
                    styles.tabLabel,
                    { color: colors.textTertiary },
                    slide === i && [styles.tabLabelActive, { color: colors.textPrimary, borderBottomColor: accent.teal }],
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <GlassButton
            title={isLast ? 'Get Started' : 'Next'}
            onPress={isLast ? handleJoin : advance}
            variant={isLast ? 'primary' : 'tonal'}
            size="large"
            fullWidth
          />

          {/* Tap hint */}
          {!isLast && (
            <View style={styles.tapHint}>
              <Text style={[styles.tapHintText, { color: colors.textTertiary }]}>or tap anywhere to continue</Text>
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
  root: { flex: 1 },
  bgBase: { ...StyleSheet.absoluteFillObject },
  glow: {
    position: 'absolute',
    top: SH * 0.1,
    left: SW / 2 - 140,
    width: 280,
    height: 280,
    borderRadius: 140,
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
    borderWidth: 1.5,
    overflow: 'hidden',
  },

  // ── Status bar ──────────────────────────────────────────────────────────────
  phoneStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 3,
  },
  phoneTime: { fontSize: 13, fontWeight: '600' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Circle preview (no map tiles) ───────────────────────────────────────────
  mapContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  circleGlow: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: 999,
    top: '15%',
    left: '15%',
    opacity: 0.6,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
  },

  // ── Friends list ────────────────────────────────────────────────────────────
  friendsHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  friendsLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  friendsCount: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendInitial: { color: '#fff', fontWeight: '700', fontSize: 14 },
  friendName: { fontSize: 13, fontWeight: '600' },
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authIconInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.6,
  },
  authTitle: { fontSize: 18, fontWeight: '700' },
  authSub: { fontSize: 12, marginTop: 3, marginBottom: 16 },
  inputField: { marginBottom: 16 },
  inputLabel: { fontSize: 11, marginBottom: 6 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputValue: { fontSize: 14 },
  cursor: { width: 1.5, height: 16, marginLeft: 2 },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
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
  },
  biometricCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.5,
  },
  bioTitle: { fontSize: 13, fontWeight: '600' },
  bioSub: { fontSize: 11, marginTop: 2 },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
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
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
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
  },
  pillActive: { width: 40 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 10,
  },
  subheading: {
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
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingBottom: 3,
  },
  tabLabelActive: {
    borderBottomWidth: 1.5,
  },
  joinBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tapHint: { alignItems: 'center', paddingVertical: 8 },
  tapHintText: { fontSize: 12, letterSpacing: 0.5 },
});