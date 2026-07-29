---
name: Aurelian Academy
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Quicksand
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  caption:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1200px
---

## Brand & Style
The design system is a vibrant, high-energy framework tailored for K-12 educational software. It blends **Corporate Modern** structure with **Playful Minimalism**, ensuring the interface is both dependable for educators and engaging for students. The aesthetic prioritizes clarity and tactile feedback to foster a sense of discovery and accomplishment. 

The emotional response should be one of optimistic curiosity. By utilizing wide tracking, generous whitespace, and saturated accent colors, the interface feels less like a traditional database and more like an interactive learning laboratory. The style avoids visual clutter, focusing the student’s attention on one primary action at a time.

## Colors
The palette is rooted in a "Deep Blue" primary to maintain institutional trust, but it is energized by "Hyper-Green" and "Solar Gold" for interactive elements. 

- **Primary (Electric Blue):** Used for main navigation, primary actions, and progress indicators.
- **Secondary (Vibrant Green):** Reserved for "Success" states, completion badges, and "Correct Answer" feedback.
- **Tertiary (Marigold):** Used for highlights, streaks, and gamified rewards to create visual warmth.
- **Neutral (Slate):** A soft, blue-tinted gray scale used for text and borders to keep the UI feeling cohesive rather than stark black-and-white.

Backgrounds should remain primarily white or very light gray (`#F8FAFC`) to maximize readability and allow the vibrant accents to pop.

## Typography
This design system utilizes **Quicksand** for all levels of the hierarchy. Its rounded terminals and open apertures provide a friendly, accessible reading experience for children and young adults.

Headlines should use **Bold (700)** weights to create a strong visual anchor. Body text uses **Medium (500)** rather than Regular to ensure high legibility on lower-resolution tablets. All caps should be avoided for general body text, reserved only for short, rhythmic labels or badges to maintain an approachable tone.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a focus on "Chunky" hit targets. A 12-column system is used for desktop, collapsing to 4 columns for mobile devices. 

- **Vertical Rhythm:** Built on an 8px scale. Padding inside interactive cards should be generous (min 24px) to ensure the interface feels airy.
- **Touch Targets:** Minimum height for any interactive element is 48px to accommodate younger users with developing fine motor skills.
- **Reflow:** On tablets, the sidebar navigation should transform into a bottom bar or a simplified "Hub" menu to maximize vertical space for content.

## Elevation & Depth
Elevation in this design system is achieved through **Tonal Layers** and **Soft Ambient Shadows**. We avoid harsh, high-contrast shadows in favor of subtle, colored diffusions.

- **Surface Levels:** The main background is the base. Content lives on white cards with a very soft, large-radius shadow (`box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1)`).
- **Interactive Depth:** Buttons use a "pseudo-3D" effect—a solid 4px bottom border (offset) in a slightly darker shade of the button's color—to make them look pressable and tactile.
- **Overlays:** Modals use a soft background blur (12px) to keep the context of the lesson visible while focusing on the task at hand.

## Shapes
The shape language is defined by **Maximum Roundness (Pill-shaped)**. This eliminates "sharpness" from the UI, making the digital environment feel safe and inviting.

Standard components like buttons, input fields, and tags use a fully rounded (pill) style. Larger containers like lesson cards or video players use the `rounded-xl` (3rem) radius to maintain the soft aesthetic without wasting excessive internal space.

## Components
- **Buttons:** High-contrast, pill-shaped, and tactile. Primary buttons use the Electric Blue with a darker blue "depth" shadow. Hover states should slightly lift the button (transform: translateY(-2px)).
- **Chips & Badges:** Used for subject tags (Math, Science). These use light tinted backgrounds of the primary/secondary colors with bold text.
- **Input Fields:** Thick 2px borders in Slate-200, turning Electric Blue on focus. Floating labels are used to keep the interface clean.
- **Cards:** White backgrounds, soft blue shadows, and 48px padding. Cards should always have a "Header" section with a distinctive icon or color strip.
- **Progress Bars:** Thick (12px+) tracks with rounded ends. The progress fill should use a gradient from Secondary Green to Tertiary Gold to signal "growth."
- **Checkboxes:** Oversized (24px x 24px) with a heavy stroke. When checked, they should perform a subtle "pop" scale animation.