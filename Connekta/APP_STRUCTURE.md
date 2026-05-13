/**
 * STRUCTURE DOCUMENTATION
 * 
 * App Navigation Flow:
 * 1. Landing Page (/) - First time users see animated landing page
 * 2. Auth Routes (/(auth)/) - Login/Signup screens
 * 3. Main Tabs (/(tabs)/) - Authenticated user's main app
 * 
 * Directory Structure:
 * 
 * app/
 * ├── _layout.tsx              # Root layout with main navigation stack
 * ├── modal.tsx                # Modal screen
 * ├── (landing)/               # Landing page group
 * │   ├── _layout.tsx
 * │   └── index.tsx            # Landing page with animated background
 * ├── (auth)/                  # Authentication group
 * │   ├── _layout.tsx
 * │   ├── login.tsx            # Login screen
 * │   └── signup.tsx           # Sign up screen
 * └── (tabs)/                  # Main app tabs
 *     ├── _layout.tsx          # Tab navigation setup
 *     ├── index.tsx            # Home tab
 *     └── explore.tsx          # Explore tab
 * 
 * components/
 * ├── animated/                # Animation-related components
 * │   └── AnimatedBackground.tsx
 * ├── ui/                      # Generic UI components
 * │   ├── Button.tsx
 * │   ├── FormInput.tsx
 * │   ├── icon-symbol.tsx
 * │   └── haptic-tab.tsx
 * ├── friends/                 # Friends feature components
 * └── map/                     # Map feature components
 * 
 * hooks/
 * ├── useAuth.tsx              # Authentication hook
 * ├── useAnimations.ts         # Custom animation hooks
 * ├── useFriends.tsx
 * ├── useLocation.tsx
 * ├── useSockets.tsx
 * ├── use-color-scheme.ts
 * ├── use-color-scheme.web.ts
 * └── use-theme-color.ts
 * 
 * constants/
 * ├── theme.ts                 # Colors and fonts
 * └── animations.ts            # Animation configs, gradients, content
 * 
 * types/
 * └── animations.ts            # Animation type definitions
 * 
 * context/
 * └── AuthContext.tsx          # Authentication state management
 * 
 * utils/
 * └── animations.ts            # Animation, validation, and format utilities
 * 
 * REUSABILITY GUIDELINES:
 * 
 * 1. AnimatedBackground Component
 *    - Used in: LandingPage, LoginScreen, SignUpScreen
 *    - Accepts gradient config and floating words array
 *    - Can be extended with custom children
 * 
 * 2. Button Component
 *    - Used in: LandingPage, LoginScreen, SignUpScreen
 *    - Variants: primary, secondary, outline
 *    - Sizes: small, medium, large
 * 
 * 3. FormInput Component
 *    - Used in: LoginScreen, SignUpScreen
 *    - Includes error handling and validation UI
 * 
 * 4. Animation Hooks
 *    - useAnimation: Generic fade/slide animations
 *    - useFloatingAnimation: Floating text animations
 *    - usePulseAnimation: Pulse/scale animations
 *    - useSlideInAnimation: Slide in with fade
 * 
 * 5. Constants
 *    - ANIMATION_CONFIG: Pre-defined animation timings
 *    - BACKGROUND_GRADIENTS: Pre-defined gradients
 *    - FLOATING_WORDS: Landing page words
 *    - LANDING_PAGE_CONTENT: Landing page text
 *    - AUTH_SCREEN_CONTENT: Auth screen text
 *    - LANDING_PAGE_COLORS: Color palette
 * 
 * AUTHENTICATION FLOW:
 * 
 * 1. User launches app
 * 2. Shows LandingPage with animated background
 * 3. User clicks "Get Started"
 * 4. Navigate to LoginScreen
 * 5. User can switch to SignUpScreen
 * 6. After login/signup, navigate to (tabs) main app
 * 7. AuthContext manages login state
 * 
 * TODO ITEMS:
 * - Implement actual authentication logic in login/signup
 * - Add token persistence (AsyncStorage)
 * - Implement forgot password flow
 * - Add splash screen
 * - Add onboarding screens
 * - Connect to backend API
 * - Add push notifications setup
 */

export const DOCUMENTATION = {
  navigationFlow: 'Landing -> Auth -> Tabs',
  version: '1.0.0',
  lastUpdated: '2026-05-13',
};
