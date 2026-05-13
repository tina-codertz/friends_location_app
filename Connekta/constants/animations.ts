/**
 * Animation and Content Constants - Modern Design
 */

import { FloatingWord, AnimationConfig, BackgroundGradient } from '@/types/animations';

// Animation Configurations
export const ANIMATION_CONFIG = {
  fast: {
    duration: 300,
    delay: 0,
    tension: 40,
    friction: 7,
  } as AnimationConfig,
  normal: {
    duration: 500,
    delay: 0,
    tension: 50,
    friction: 8,
  } as AnimationConfig,
  slow: {
    duration: 1000,
    delay: 0,
    tension: 30,
    friction: 6,
  } as AnimationConfig,
  verySlow: {
    duration: 2000,
    delay: 0,
    tension: 20,
    friction: 5,
  } as AnimationConfig,
};

// Background Gradient Configuration - Modern Dark Theme
export const BACKGROUND_GRADIENTS = {
  landing: {
    colors: ['#0F172A', '#1E293B', '#334155', '#475569'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  } as BackgroundGradient,
  auth: {
    colors: ['#0F172A', '#1E293B', '#334155'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  } as BackgroundGradient,
};

// Floating Words for Landing Page (Fallback)
export const FLOATING_WORDS: FloatingWord[] = [
  {
    id: '1',
    text: 'Connect',
    initialX: 10,
    initialY: 15,
    duration: 8000,
    delay: 0,
    size: 24,
    opacity: 0.8,
  },
  {
    id: '2',
    text: 'Share',
    initialX: 75,
    initialY: 20,
    duration: 10000,
    delay: 200,
    size: 20,
    opacity: 0.7,
  },
  {
    id: '3',
    text: 'Discover',
    initialX: 20,
    initialY: 70,
    duration: 9000,
    delay: 400,
    size: 22,
    opacity: 0.75,
  },
  {
    id: '4',
    text: 'Friends',
    initialX: 80,
    initialY: 75,
    duration: 11000,
    delay: 600,
    size: 18,
    opacity: 0.65,
  },
];

// Landing Page Content
export const LANDING_PAGE_CONTENT = {
  title: 'Connekta',
  subtitle: 'Stay Connected with Your Friends',
  description: 'Share your location, discover nearby friends, and create meaningful connections in real-time.',
  ctaButton: 'Get Started',
  secondaryButton: 'Learn More',
};

// Auth Screen Content
export const AUTH_SCREEN_CONTENT = {
  title: 'Welcome to Connekta',
  loginTitle: 'Sign In',
  signupTitle: 'Create Account',
  emailPlaceholder: 'Enter your email',
  passwordPlaceholder: 'Enter your password',
  loginButton: 'Sign In',
  signupButton: 'Sign Up',
  togglePrompt: "Don't have an account?",
  togglePromptSignup: 'Already have an account?',
  forgotPassword: 'Forgot Password?',
};

// Modern Color Palette
export const LANDING_PAGE_COLORS = {
  text: '#FFFFFF',
  textSecondary: '#E0E7FF',
  textTertiary: '#B0BCC4',
  overlay: 'rgba(0, 0, 0, 0.3)',
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#8B5CF6',
  background: '#0F172A',
  surface: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.1)',
};
