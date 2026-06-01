---
name: PulseMap Core
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#d4c0d7'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#9d8ba0'
  outline-variant: '#514255'
  surface-tint: '#ecb2ff'
  primary: '#ecb2ff'
  on-primary: '#520071'
  primary-container: '#bd00ff'
  on-primary-container: '#ffffff'
  inverse-primary: '#9900cf'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#94db00'
  on-tertiary: '#223600'
  tertiary-container: '#568200'
  on-tertiary-container: '#fffeff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f8d8ff'
  primary-fixed-dim: '#ecb2ff'
  on-primary-fixed: '#320047'
  on-primary-fixed-variant: '#74009f'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#a9f900'
  tertiary-fixed-dim: '#94db00'
  on-tertiary-fixed: '#121f00'
  on-tertiary-fixed-variant: '#334f00'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  edge-margin: 16px
  stack-gap: 12px
---

## Brand & Style
The design system is engineered for a Gen Z audience that values hyper-local connectivity and expressive digital identity. The brand personality is high-energy, social, and unapologetically digital. It balances the utility of a map with the emotional resonance of a social network.

The visual style is **Premium Glassmorphism**. It utilizes deep midnight foundations to allow neon accents to vibrate. The UI evokes a sense of "digital nightlife"—dark, immersive, and layered. We use frosted glass effects to maintain context while focusing on foreground interactions, creating a sense of physical depth in a 2D space. The aesthetic is sophisticated yet playful, ensuring the app feels like a high-end social tool rather than a utility map.

## Colors
This design system defaults to a **Dark Mode** experience to maximize the "glow" effect of neon tokens.

- **Primary (Electric Purple):** Used for core "Pulse" actions, active states, and primary brand moments.
- **Secondary (Cyber Cyan):** Used for location markers, friend status indicators, and connectivity cues.
- **Tertiary (Lime Green):** Reserved for "Live Now" states, positive confirmations, and online availability.
- **Neutral (Midnight):** A range of deep blacks and charcoals that prevent pure-black crushing and provide a canvas for light-leak effects.
- **Glass Surfaces:** A combination of a semi-transparent dark fill and a subtle white inner stroke to define edges without heavy borders.

## Typography
The typography strategy pairs the geometric confidence of **Montserrat** for headlines with the supreme legibility of **Inter** for UI and body text. 

Headlines use heavy weights (700-800) and tight letter-spacing to create a "bold" social presence. Display sizes are used for friend names and location titles on the map. Labels utilize uppercase styling with increased letter spacing to provide a technical, "radar-like" feel for metadata. On mobile devices, headline sizes scale down slightly to ensure high-impact text remains readable without excessive wrapping.

## Layout & Spacing
The layout relies on a **Fluid Grid** with generous safe-area margins to accommodate floating UI elements over a full-screen map.

- **Grid:** 12-column on desktop, 4-column on mobile.
- **Margins:** 16px standard mobile edge margin.
- **Floating Logic:** Core UI elements (search, profile, navigation) are detached from the screen edges, floating with "glass" backgrounds to show the map underneath.
- **Vertical Rhythm:** Elements are stacked using a 4px/8px base unit. Larger 32px gaps are used to separate logical sections within floating cards.

## Elevation & Depth
Depth is created through **Backdrop Blurs** rather than traditional shadows. 

1. **The Map Layer:** The base level of the application.
2. **The Glass Layer:** Floating panels use a 20px - 32px backdrop blur. This allows the colors of the map to bleed through without distracting from the text.
3. **The Glow Layer:** Interactive elements like active avatars or primary buttons emit a "neon glow"—a drop shadow with 0px offset, high blur (16px+), and 40-60% opacity using the element's own color (e.g., a purple button has a purple glow).
4. **Z-Index:** Navigation and critical alerts sit at the highest level with a 1px solid white (10% opacity) border to "cut" through the blur.

## Shapes
This design system utilizes **Rounded** geometry to maintain a friendly, approachable social vibe. 

- **Standard Elements:** 0.5rem (8px) radius for buttons and input fields.
- **Floating Cards:** 1rem (16px) radius to create a "bubble" feel that mimics modern smartphone hardware corners.
- **Avatars & Markers:** Circular (pill-shaped) to distinguish human-centered elements from the structured UI.

## Components
Consistent styling across the system is achieved through the following component guidelines:

- **Buttons:** Primary buttons are solid neon gradients (Electric Purple to Cyber Cyan) with white text. Secondary buttons are "Glass" (blurred background, 1px border).
- **Interactive Map Markers:** Circular avatars with a 2px neon ring indicating status (Green = Live, Cyan = Just left). Markers should have a subtle pulsing animation.
- **Floating Cards:** Use the `glass_fill` and `glass_stroke`. They should appear to hover 12px above the map.
- **Input Fields:** Semi-transparent dark fills with a Cyan bottom-border that glows when focused.
- **Chips:** Small, pill-shaped glass containers with `label-sm` typography, used for "Hanging out" or "Traveling" tags.
- **Bottom Sheets:** Use 1.5rem top-rounded corners and a heavy 40px backdrop blur for the map area behind them.