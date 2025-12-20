# BotCafé Fantasy Theme Style Guide

## Overview
BotCafé features a **dark fantasy aesthetic** with magical elements, designed to create an immersive and enchanting user experience. This style guide documents the complete design system for maintaining consistency across all components and pages.

## 🎨 Color Palette

### Primary Colors
```css
/* Ultra-dark background - Main site background */
--color-fantasy-bg: hsl(2, 4%, 1%) /* #020402 */

/* Forest Green - Primary brand color */
--color-forest: hsl(84, 80%, 27%) /* #4d7c0f */

/* Deep Forest - Header/footer backgrounds */
--color-forest-deep: hsl(120, 29%, 14%) /* #1a2f1a */

/* Header/footer specific backgrounds */
--navbar-bg: #0a140a
--footer-bg: #050a05
```

### Accent Colors
```css
/* Gold Rich - Primary accent color */
--color-gold-rich: hsl(46, 65%, 52%) /* #d4af37 */

/* Gold Ancient - Secondary accent */
--color-gold-ancient: hsl(42, 43%, 39%) /* #8f7636 */

/* Magic Glow - Interactive elements */
--color-magic-glow: hsl(142, 69%, 58%) /* #4ade80 */

/* Magic Teal - Special highlights */
--color-magic-teal: hsl(174, 72%, 50%) /* #2dd4bf */
```

### Text Colors
```css
/* Parchment - Primary text */
--color-parchment: hsl(38, 47%, 81%) /* #e6d5b8 */

/* Parchment Dim - Secondary text */
--color-parchment-dim: hsl(31, 30%, 66%) /* #bfa88f */

/* Wood Dark - Dark text on light backgrounds */
--color-wood-dark: hsl(21, 42%, 12%) /* #2c1b12 */
```

## 🔤 Typography

### Font Families
```css
/* Display Font - Headers and titles */
font-display: ["Cinzel Decorative", "cursive"]

/* Lore Font - Body text and descriptions */
font-lore: ["Crimson Text", "serif"]

/* Body Font - Interface elements */
font-body: ["Inter", "sans-serif"]
```

### Font Weights & Sizes
```css
/* Main title - Hero section */
font-display font-bold text-5xl sm:text-7xl md:text-8xl lg:text-9xl

/* Subtitle */
font-display font-bold text-2xl

/* Navigation */
text-base font-lore italic

/* Body text */
text-lg sm:text-xl md:text-2xl font-lore italic

/* Footer text */
text-sm font-lore italic

/* Small labels */
text-xs uppercase tracking-widest font-display
```

### Text Effects
```css
/* Gold glow effect */
.text-glow-gold {
  text-shadow: 0 0 15px hsla(46, 65%, 52%, 0.4), 
               0 0 30px hsla(46, 65%, 52%, 0.2);
}

/* Magic glow effect */
.text-glow-magic {
  text-shadow: 0 0 10px hsla(142, 69%, 58%, 0.3);
}
```

## 🧩 Component Styles

### Glass Rune Effect
```css
.glass-rune {
  background: linear-gradient(135deg, 
    hsla(120, 29%, 14%, 0.8), 
    hsla(120, 40%, 6%, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid hsla(42, 43%, 39%, 0.3);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), 
              inset 0 0 0 1px hsla(46, 65%, 52%, 0.1);
}
```

### Ornate Border Effect
```css
.ornate-border {
  position: relative;
}

.ornate-border::before,
.ornate-border::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid hsl(42, 43%, 39%);
  transition: all 0.3s ease;
}

.ornate-border::before {
  top: -2px;
  left: -2px;
  border-right: 0;
  border-bottom: 0;
}

.ornate-border::after {
  bottom: -2px;
  right: -2px;
  border-left: 0;
  border-top: 0;
}

.ornate-border:hover::before,
.ornate-border:hover::after {
  width: 100%;
  height: 100%;
  border-color: hsl(46, 65%, 52%);
}
```

## 🎭 Animations

### Keyframe Animations
```css
/* Floating animation for icons */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* Twinkling effect for decorative elements */
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Firefly movement animation */
@keyframes fly {
  0% { transform: translate(0, 0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translate(100px, -100px); opacity: 0; }
}

/* Slow pulse for background orbs */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Animation Classes
```css
.animate-float {
  animation: float 8s ease-in-out infinite;
}

.animate-twinkle {
  animation: twinkle 4s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## 🧱 Component Specifications

### Navbar
- **Background**: `bg-[#0a140a]/80` with `backdrop-blur-md`
- **Height**: `h-24` (96px)
- **Border**: `border-b border-gold-ancient/30`
- **Logo**: Animated rotating coffee icon with gold glow
- **Navigation**: Subtle underline hover effects, no background squares
- **Container**: Rounded background with `border border-gold-ancient/20`

### Hero Section
- **Background**: Ultra-dark `#020402`
- **Icon**: Glass-rune container with floating animation
- **Title**: Large gradient text (gold-rich → parchment → gold-ancient)
- **Description**: Centered with decorative quote marks
- **Buttons**: Ornate-border styling with hover effects
- **Stats**: Three-column layout with hover scale effects

### Footer
- **Background**: `bg-[#050a05]`
- **Border**: `border-t border-gold-ancient/20`
- **Icon**: Overlapping Menu and BookOpen icons with pulse animation
- **Text**: Copyright 2025 with fantasy-themed messaging

### Magical Background
- **Base**: Ultra-dark `#020402` with texture overlay
- **Effects**: Glowing orbs, fireflies, decorative SVG elements
- **Fireflies**: Multiple animated elements with staggered timing
- **Vignette**: Radial gradient for depth effect

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
```

### Key Responsive Classes
```css
/* Text sizing */
text-xs sm:text-lg font-lore /* Mobile to desktop scaling */
text-5xl sm:text-7xl md:text-8xl lg:text-9xl /* Title scaling */

/* Layout */
flex-col sm:flex-row /* Stack on mobile, row on desktop */
px-4 sm:px-6 lg:px-8 /* Responsive padding */
hidden lg:flex /* Hide on mobile, show on desktop */

/* Spacing */
gap-6 w-full max-w-xs sm:max-w-none /* Responsive gaps */
```

## 🎨 Utility Classes

### Background Effects
```css
/* Background texture pattern */
.bg-texture {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234d7c0f' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

/* Vignette effect */
.bg-vignette {
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
}
```

### Interactive States
```css
/* Hover effects */
hover:text-gold-rich           /* Color transition */
hover:scale-110                /* Scale on hover */
hover:-translate-y-1           /* Lift effect */
hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)] /* Gold shadow */
```

## 🔧 Implementation Guidelines

### 1. Color Usage
- Use `--color-fantasy-bg` for main backgrounds
- Use `--color-forest-deep` for header/footer backgrounds
- Use `--color-gold-rich` for primary interactive elements
- Use `--color-parchment` for primary text
- Use `--color-parchment-dim` for secondary text

### 2. Typography Hierarchy
- **H1**: Display font, largest size, gradient text
- **H2**: Display font, medium size, solid color
- **Body**: Lore font, italic, appropriate size
- **UI**: Body font, clear and readable

### 3. Animation Guidelines
- Use `animate-float` for decorative icons
- Use `animate-twinkle` for small decorative elements
- Use `animate-pulse-slow` for background elements
- Use firefly animations sparingly for magical feel

### 4. Component Structure
- Always use semantic HTML
- Maintain proper z-index layering
- Use backdrop-blur for depth
- Ensure proper contrast ratios
- Test on mobile devices

### 5. Accessibility
- Maintain sufficient color contrast
- Provide focus states for interactive elements
- Use appropriate ARIA labels
- Test with screen readers
- Ensure keyboard navigation works

## 📋 Component Checklist

Before adding new components, ensure they include:

- [ ] Fantasy theme colors
- [ ] Appropriate typography
- [ ] Hover effects (subtle, not overwhelming)
- [ ] Mobile responsiveness
- [ ] Accessibility features
- [ ] Consistent with existing components
- [ ] Performance optimized

## 🚀 Future Enhancements

### Planned Features
- Dark/light mode toggle
- Additional magical animations
- More component variants
- Enhanced mobile experience
- Performance optimizations

### Color Variations
- Seasonal color themes
- User preference themes
- Accessibility-optimized variants

This style guide ensures consistency across all BotCafé components while maintaining the magical, fantasy aesthetic that defines the brand.
