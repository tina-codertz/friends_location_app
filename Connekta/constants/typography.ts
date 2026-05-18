/**
 * Inter font family names (must match useFonts keys from @expo-google-fonts/inter).
 */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Type = {
  /** Large airy headings */
  hero: { fontFamily: Font.bold, fontSize: 34, letterSpacing: 0.6, lineHeight: 40 },
  title: { fontFamily: Font.bold, fontSize: 28, letterSpacing: 0.4, lineHeight: 34 },
  section: { fontFamily: Font.semibold, fontSize: 20, letterSpacing: 0.25, lineHeight: 26 },
  body: { fontFamily: Font.regular, fontSize: 17, lineHeight: 24, color: '#B0B0B0' },
  bodyMedium: { fontFamily: Font.medium, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: Font.medium, fontSize: 13, lineHeight: 18 },
} as const;
