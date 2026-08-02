---
name: YakinLulus
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
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
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
  danger: '#EF4444'
  warning: '#F97316'
  info: '#0EA5E9'
  bg-subtle: '#F8FAFC'
  border-light: '#E2E8F0'
  text-primary: '#1E293B'
  text-secondary: '#64748B'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
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
  '4': 4px
  '8': 8px
  '12': 12px
  '16': 16px
  '24': 24px
  '32': 32px
  '40': 40px
  '48': 48px
  '64': 64px
  '80': 80px
  '96': 96px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

# YakinLulus.id Design System v1.0

## Design Philosophy
Modern Educational Interface: Clean, friendly, professional, and academic. Focus on high readability and low eye strain for students and educators.

## Visual Identity
- **Style**: Modern Flat Design
- **Elements**: Rounded corners (8-24px), soft shadows, glass effects on specific cards, minimal borders.
- **Constraints**: No skeuomorphism. Avoid neon purple, neon pink, neon red, and neon green as primary brand colors.

## Color Palette
### Brand Colors
- **Primary (Blue)**: `#2563EB` (Buttons, Links, Active States, Progress)
- **Secondary (Emerald Green)**: `#10B981` (Success, Achievements, Scores)
- **Accent (Gold)**: `#F59E0B` (Badges, Premium, Rewards, Highlights)

### Semantic Colors
- **Danger**: `#EF4444`
- **Warning**: `#F97316`
- **Information**: `#0EA5E9`

### Neutral Colors
- **Background**: `#F8FAFC`
- **Surface**: `#FFFFFF`
- **Border**: `#E2E8F0`
- **Text Primary**: `#1E293B`
- **Text Secondary**: `#64748B`

### Dark Mode (Reference Only)
- **Background**: `#0F172A`
- **Surface**: `#1E293B`
- **Border**: `#334155`
- **Text Primary**: `#F8FAFC`
- **Text Secondary**: `#CBD5E1`

## Typography
- **Headings**: Inter or Poppins
- **Body**: Inter
- **Code**: JetBrains Mono

## Spacing & Radius
- **Spacing Scale**: 8-point system (4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96)
- **Border Radius**: 
  - Small: 8px
  - Medium: 12px
  - Large: 16px
  - Extra: 24px

## Elevation (Shadows)
- **Soft**: `0 2px 8px rgba(0,0,0,0.05)`
- **Medium**: `0 8px 24px rgba(0,0,0,0.08)`
- **Hover**: `0 12px 32px rgba(0,0,0,0.12)`

## Components
- **Buttons**: Primary (Blue Filled), Secondary (White Outline), Success (Green Filled), Danger (Red Filled), Ghost, Text.
- **Cards**: Header/Body/Footer structure, rounded corners, soft shadows, hover effects.
- **Tables**: Sticky headers/actions, pagination, sortable/filterable, responsive.
- **Forms**: Modern inputs, dropdowns, date pickers, toggles, multi-select.
- **Icons**: Lucide or Heroicons (Outline style).

## Motion
- **Fast**: 150ms
- **Normal**: 250ms
- **Slow**: 400ms
- **Effects**: Fade, Slide, Scale, Smooth Expand, Loading Skeletons.
