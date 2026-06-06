/**
 * Inter font family names (must match useFonts keys from @expo-google-fonts/inter).
 */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Montserrat — brand headlines (load in app/_layout.tsx) */
export const FontBrand = {
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;

export const Type = {
  /** Large airy headings */
  hero: { fontFamily: Font.bold, fontSize: 30, letterSpacing: 0, lineHeight: 36 },
  title: { fontFamily: Font.bold, fontSize: 26, letterSpacing: 0, lineHeight: 32 },
  section: { fontFamily: Font.semibold, fontSize: 18, letterSpacing: 0, lineHeight: 24 },
  body: { fontFamily: Font.regular, fontSize: 16, letterSpacing: 0, lineHeight: 23, color: '#B0B0B0' },
  bodyMedium: { fontFamily: Font.medium, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: Font.medium, fontSize: 13, letterSpacing: 0, lineHeight: 18 },
} as const;
