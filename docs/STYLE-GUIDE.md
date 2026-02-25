# BotCafe v2 - Style Guide

**Last Updated**: 2026-02-24
**Version**: 3.2

---

## Theme Overview

BotCafe v2 uses a **fantasy dark forest theme** inspired by magical RPG aesthetics. The design features:
- Ultra-dark backgrounds with subtle green undertones
- Gold and amber accent colors
- Parchment-toned text for readability
- Glass morphism effects with magical glows
- Ornate decorative borders

---

## Color Palette

### Primary Colors (Dark Mode - Default)

| Name | HSL Value | Hex Approx | Usage |
|------|-----------|------------|-------|
| Fantasy Background | `hsl(2, 4%, 1%)` | `#020402` | Main page background |
| Forest Deep | `hsl(120, 29%, 14%)` | `#1a2e1a` | Card backgrounds |
| Forest | `hsl(84, 80%, 27%)` | `#4d7c0f` | Primary accent |
| Gold Rich | `hsl(46, 65%, 52%)` | `#d4af37` | Primary buttons, highlights |
| Gold Ancient | `hsl(42, 43%, 39%)` | `#8b7355` | Secondary accents, borders |
| Parchment | `hsl(38, 47%, 81%)` | `#e8dcc8` | Main text |
| Parchment Dim | `hsl(31, 30%, 66%)` | `#b8a88a` | Muted text |
| Magic Glow | `hsl(142, 69%, 58%)` | `#4ade80` | Success, magic effects |
| Magic Teal | `hsl(174, 72%, 50%)` | `#2dd4bf` | Highlights, links |

### CSS Variables

```css
:root {
  /* Dark mode (default) */
  --background: 2 4% 1%;
  --foreground: 38 47% 81%;
  --card: 120 29% 10%;
  --card-foreground: 38 47% 81%;
  --primary: 46 65% 52%;
  --primary-foreground: 120 29% 10%;
  --secondary: 120 29% 14%;
  --accent: 84 80% 27%;
  --muted: 120 20% 15%;
  --muted-foreground: 31 30% 66%;
  --border: 42 43% 25%;
  --ring: 46 65% 52%;
}
```

### Light Mode (Optional - Parchment Theme)

```css
:root {
  --background: 38 47% 95%;
  --foreground: 21 42% 12%;
  --card: 38 40% 92%;
  --primary: 84 80% 27%;
  --secondary: 42 43% 39%;
  --accent: 46 65% 52%;
}
```

### Chart Variables

Used for data visualization components (e.g., analytics charts):

```css
/* Light mode */
--chart-1: 84 80% 27%;   /* Forest green */
--chart-2: 46 65% 52%;   /* Gold */
--chart-3: 174 72% 50%;  /* Teal */
--chart-4: 42 43% 39%;   /* Ancient gold */
--chart-5: 142 69% 58%;  /* Magic green */

/* Dark mode */
--chart-1: 142 69% 58%;  /* Magic green */
--chart-2: 46 65% 52%;   /* Gold */
--chart-3: 174 72% 50%;  /* Teal */
--chart-4: 84 80% 40%;   /* Lighter forest */
--chart-5: 42 43% 50%;   /* Lighter ancient gold */
```

### Sidebar Variables

Dedicated color tokens for the sidebar component:

```css
/* Light mode */
--sidebar: 38 40% 92%;
--sidebar-foreground: 21 42% 12%;
--sidebar-primary: 84 80% 27%;
--sidebar-primary-foreground: 38 47% 95%;
--sidebar-accent: 46 65% 52%;
--sidebar-accent-foreground: 21 42% 12%;
--sidebar-border: 42 43% 70%;
--sidebar-ring: 46 65% 52%;

/* Dark mode */
--sidebar: 120 29% 8%;
--sidebar-foreground: 38 47% 81%;
--sidebar-primary: 46 65% 52%;
--sidebar-primary-foreground: 120 29% 10%;
--sidebar-accent: 84 80% 27%;
--sidebar-accent-foreground: 38 47% 95%;
--sidebar-border: 42 43% 25%;
--sidebar-ring: 46 65% 52%;
```

---

## Typography

### Font Families

| Font | CSS Variable | Usage |
|------|--------------|-------|
| Quintessential | `--font-display` | Headlines, titles, magical text |
| Crimson Text | `--font-lore` | Body text, descriptions, narratives |
| Inter | `--font-body` | UI elements, forms, labels |

### Font Loading (Next.js)

```typescript
import { Quintessential, Crimson_Text, Inter } from 'next/font/google'

const quintessential = Quintessential({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

const crimsonText = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-lore',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})
```

### Typography Scale

| Element | Class | Font |
|---------|-------|------|
| Page Title | `text-4xl md:text-5xl font-display` | Quintessential |
| Section Heading | `text-2xl md:text-3xl font-display` | Quintessential |
| Card Title | `text-xl font-semibold` | Inter |
| Body Text | `text-base font-lore` | Crimson Text |
| Small Text | `text-sm text-muted-foreground` | Inter |
| Labels | `text-xs uppercase tracking-wider` | Inter |

---

## Component Patterns

### Glass Rune Effect

Used for cards and containers with a magical glass appearance:

```css
.glass-rune {
  background: linear-gradient(135deg,
    hsla(120, 29%, 14%, 0.8),
    hsla(120, 40%, 6%, 0.9)
  );
  backdrop-filter: blur(8px);
  border: 1px solid hsla(42, 43%, 39%, 0.3);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px hsla(46, 65%, 52%, 0.1);
}
```

**Usage:**
```tsx
<div className="glass-rune rounded-lg p-6">
  Content here
</div>
```

### Ornate Border

Decorative corner borders that expand on hover:

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

### Text Glow Effects

```css
.text-glow-gold {
  text-shadow:
    0 0 15px hsla(46, 65%, 52%, 0.4),
    0 0 30px hsla(46, 65%, 52%, 0.2);
}

.text-glow-magic {
  text-shadow: 0 0 10px hsla(142, 69%, 58%, 0.3);
}
```

---

## Animation Patterns

### Float Animation

```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.animate-float {
  animation: float 8s ease-in-out infinite;
}
```

### Twinkle Animation

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.animate-twinkle {
  animation: twinkle 4s ease-in-out infinite;
}
```

### Pulse Slow

```css
.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Component Library

BotCafe uses **shadcn/ui** components with custom styling. All 54 components are located in `/src/components/ui/`.

### Core Components

| Component | Path | Description |
|-----------|------|-------------|
| Button | `/components/ui/button` | Primary action buttons |
| Card | `/components/ui/card` | Content containers |
| Input | `/components/ui/input` | Form text inputs |
| Textarea | `/components/ui/textarea` | Multi-line text input |
| Select | `/components/ui/select` | Dropdown selections |
| Badge | `/components/ui/badge` | Status indicators |
| Dialog | `/components/ui/dialog` | Modal dialogs |
| Tabs | `/components/ui/tabs` | Tab navigation |
| Progress | `/components/ui/progress` | Progress bars |
| Avatar | `/components/ui/avatar` | User/bot avatars |
| Tooltip | `/components/ui/tooltip` | Hover tooltips |
| ScrollArea | `/components/ui/scroll-area` | Scrollable containers |
| InfiniteScrollTrigger | `/components/ui/infinite-scroll-trigger` | Infinite scroll loading trigger |

### Additional Components

| Component | Path | Description |
|-----------|------|-------------|
| Accordion | `/components/ui/accordion` | Collapsible content sections |
| Alert / AlertDialog | `/components/ui/alert`, `alert-dialog` | Notifications and confirmation dialogs |
| Breadcrumb | `/components/ui/breadcrumb` | Navigation breadcrumbs |
| ButtonGroup | `/components/ui/button-group` | Grouped button layouts |
| Calendar | `/components/ui/calendar` | Date picker calendar |
| Carousel | `/components/ui/carousel` | Content carousel/slider |
| Chart | `/components/ui/chart` | Data visualization charts |
| Checkbox | `/components/ui/checkbox` | Checkbox inputs |
| Command | `/components/ui/command` | Command palette / search |
| ContextMenu | `/components/ui/context-menu` | Right-click menus |
| Drawer | `/components/ui/drawer` | Bottom/side drawers |
| DropdownMenu | `/components/ui/dropdown-menu` | Dropdown menus |
| Empty | `/components/ui/empty` | Empty state UI with variants |
| Form / Field | `/components/ui/form`, `field` | Form wrappers with validation |
| HoverCard | `/components/ui/hover-card` | Cards shown on hover |
| InputGroup | `/components/ui/input-group` | Input with addons |
| InputOTP | `/components/ui/input-otp` | One-time password inputs |
| Kbd | `/components/ui/kbd` | Keyboard shortcut display |
| Label | `/components/ui/label` | Form labels |
| Menubar | `/components/ui/menubar` | Menu bar navigation |
| NavigationMenu | `/components/ui/navigation-menu` | Top-level navigation |
| Pagination | `/components/ui/pagination` | Page navigation |
| Popover | `/components/ui/popover` | Floating content panels |
| RadioGroup | `/components/ui/radio-group` | Radio button groups |
| Resizable | `/components/ui/resizable` | Resizable panels |
| Separator | `/components/ui/separator` | Visual dividers |
| Sheet | `/components/ui/sheet` | Slide-out panels |
| Sidebar | `/components/ui/sidebar` | Sidebar layout with context provider |
| Skeleton | `/components/ui/skeleton` | Loading placeholder shapes |
| Slider | `/components/ui/slider` | Range slider inputs |
| Spinner | `/components/ui/spinner` | Lightweight loading spinner (Loader2Icon) |
| Switch | `/components/ui/switch` | Toggle switches |
| Table | `/components/ui/table` | Data tables |
| Toggle / ToggleGroup | `/components/ui/toggle`, `toggle-group` | Toggle buttons |

### ScrollArea Usage Caution

The `ScrollArea` component (from Radix UI) uses `overflow-hidden` internally. This can cause **clipping issues** when:

1. The ScrollArea is inside a flex container without an explicit height
2. Child elements have content that extends outside bounds (dropdowns, tooltips)
3. The parent chain doesn't have defined height constraints

**Problematic Pattern:**
```tsx
// ❌ Can cause clipping - flex container with no explicit height
<div className="flex flex-col h-full">
  <ScrollArea className="flex-1">
    <div className="space-y-2">
      {items.map(item => (
        <ItemWithDropdown key={item.id} /> // Dropdown gets clipped!
      ))}
    </div>
  </ScrollArea>
</div>
```

**Recommended Alternatives:**

```tsx
// ✅ Option 1: Use a regular div with overflow-y-auto
<div className="flex flex-col">
  <div className="flex-1 overflow-y-auto">
    <div className="space-y-2">
      {items.map(item => <ItemWithDropdown key={item.id} />)}
    </div>
  </div>
</div>

// ✅ Option 2: Use ScrollArea only when you have explicit height
<ScrollArea className="h-[400px]">
  <div className="space-y-2">
    {items.map(item => <ItemWithDropdown key={item.id} />)}
  </div>
</ScrollArea>
```

**When to use ScrollArea:**
- Fixed height containers where you want styled scrollbars
- Modal/dialog content with known max heights
- Sidebars with explicit height constraints

**When to use regular overflow:**
- Dynamic height flex layouts
- Lists with interactive elements (dropdowns, menus)
- When content extends beyond container bounds

### Infinite Scroll Pattern

```tsx
import { useInfiniteList } from '@/hooks/use-infinite-list'
import { InfiniteScrollTrigger } from '@/components/ui/infinite-scroll-trigger'

const { items, isLoading, isLoadingMore, hasMore, loadMore, setParams } = useInfiniteList<Item>({
  endpoint: '/api/items',
  limit: 500,
  itemsKey: 'items',
})

// In JSX
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
  <InfiniteScrollTrigger
    onLoadMore={loadMore}
    hasMore={hasMore}
    isLoading={isLoadingMore}
    endMessage="You've seen all items!"
  />
</div>
```

### Button Variants

```tsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Card Usage

```tsx
<Card className="glass-rune">
  <CardHeader>
    <CardTitle className="font-display">Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

---

## Icon System

BotCafe uses **Lucide React** for icons:

```tsx
import { Bot, Heart, Star, BookOpen, Brain, Users } from 'lucide-react'

// Usage
<Bot className="h-5 w-5 text-purple-400" />
<Heart className="h-5 w-5 text-pink-500" />
```

### Common Icon Colors

| Icon Type | Color Class |
|-----------|-------------|
| Bot/AI | `text-purple-400` |
| Like/Heart | `text-pink-500` |
| Favorite/Star | `text-yellow-500` |
| Knowledge/Book | `text-green-400` |
| Memory/Brain | `text-orange-400` |
| Persona/Users | `text-pink-400` |
| Settings/Gear | `text-gray-400` |
| Success | `text-green-500` |
| Warning | `text-yellow-500` |
| Error | `text-red-500` |

---

## Layout Patterns

### Page Container

```tsx
<div className="container mx-auto px-4 py-8">
  <div className="max-w-4xl mx-auto">
    {/* Page content */}
  </div>
</div>
```

### Magical Background

```tsx
import { MagicalBackground } from '@/modules/home/ui/components/magical-background'

export default function Page() {
  return (
    <>
      <MagicalBackground />
      <div className="relative z-10 pt-24">
        {/* Page content */}
      </div>
    </>
  )
}
```

### Grid Layouts

```tsx
// Stats Grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Stat cards */}
</div>

// Card Grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Content cards */}
</div>

// Two-Column Layout
<div className="grid lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">Main content</div>
  <div>Sidebar</div>
</div>
```

---

## Gradient Patterns

### Text Gradients

```tsx
// Gold Gradient
<h1 className="bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
  Title
</h1>

// Purple to Pink
<h2 className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
  Subtitle
</h2>

// Blue to Green
<h2 className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
  Analytics
</h2>
```

### Background Gradients

```tsx
// Card Overlay
<div className="bg-gradient-to-t from-black/80 to-transparent">

// Hover Effect
<div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
```

---

## Responsive Design

### Breakpoints (Tailwind CSS)

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

### Mobile-First Examples

```tsx
// Typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Spacing
<div className="p-4 md:p-6 lg:p-8">

// Visibility
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

### Mobile Overflow Prevention

When content can exceed viewport width on mobile, use these patterns:

```tsx
// Dashboard containers - prevent horizontal scroll
<div className="px-5 sm:px-6 lg:px-12 py-8 flex flex-col gap-6 overflow-x-hidden">

// Grid columns that need to shrink properly
<div className="lg:col-span-3 min-w-0">

// Flex containers with content that might overflow
<div className="flex items-center gap-2 min-w-0">
  <Icon className="shrink-0" />
  <span className="truncate">Long text that should truncate</span>
</div>
```

### Tab Grid Pattern (Mobile-Responsive)

When using grid-based tabs that wrap to multiple rows on mobile:

```tsx
// ❌ Fixed height causes overlap with multiple rows
<TabsList className="grid grid-cols-2 lg:grid-cols-4 h-9">

// ✅ Auto height on mobile, fixed on desktop
<TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-1 h-auto lg:h-9">
  <TabsTrigger className="text-xs lg:text-sm py-2 lg:py-1">
    Tab 1
  </TabsTrigger>
</TabsList>
```

### Flex Stack Pattern (Mobile-Responsive)

For layouts that should be horizontal on desktop but stack on mobile:

```tsx
// Header with title and controls
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h2>Title</h2>
    <p>Description</p>
  </div>
  <div className="flex gap-2">
    {/* Controls */}
  </div>
</div>

// Card with info and actions
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
  <div className="flex items-center gap-3">
    <Avatar />
    <div className="min-w-0">
      <p className="font-medium">Title</p>
      <p className="text-sm truncate">Subtitle</p>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Button className="w-full sm:w-auto">Action</Button>
  </div>
</div>
```

### Mobile Progress Indicator Pattern

For multi-step wizards, show simplified progress on mobile:

```tsx
{/* Mobile: Simplified progress bar */}
<div className="md:hidden mb-4">
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm text-muted-foreground">Step {current + 1} of {total}</span>
    <span className="text-sm font-medium">{steps[current].title}</span>
  </div>
  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
    <div
      className="h-full bg-forest transition-all duration-300"
      style={{ width: `${((current + 1) / total) * 100}%` }}
    />
  </div>
</div>

{/* Desktop: Full step indicator */}
<div className="hidden md:flex items-center justify-between mb-4">
  {steps.map((step, index) => (
    // Full step icons with titles
  ))}
</div>
```

---

## Accessibility

BotCafe includes built-in accessibility options available to all visitors (no login required). Settings are stored in `localStorage` and persist across sessions.

### AccessibilityProvider

The `AccessibilityProvider` (`/src/components/AccessibilityProvider.tsx`) wraps the app in `layout.tsx` and provides a React context with two toggles:

```tsx
import { useAccessibility } from '@/components/AccessibilityProvider'

const { reduceAnimations, easyReadFont, toggleReduceAnimations, toggleEasyReadFont } =
  useAccessibility()
```

### Floating Settings Button

The `AccessibilitySettings` component (`/src/components/accessibility-settings.tsx`) renders a floating button in the bottom-left corner of every page. It opens a popover with Switch toggles for both settings.

### Reduce Animations

When enabled, adds `.reduce-animations` to `<html>`. This:
- Zeros out all `animation-duration`, `animation-delay`, and `transition-duration` site-wide via `!important`
- Conditionally hides animated elements in `MagicalBackground` (fireflies, glow orbs, SVG decorations)
- Respects `prefers-reduced-motion: reduce` as the default on first visit

```css
.reduce-animations *,
.reduce-animations *::before,
.reduce-animations *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
}
```

### Easy Read Font

When enabled, adds `.easy-read-font` to `<html>`. This overrides the `--font-display` (Quintessential) and `--font-lore` (Crimson Text) CSS variables to use the body font (Inter) instead.

The CSS rule targets `html.easy-read-font body` to beat the specificity of Next.js font loader classes applied on `<body>`:

```css
html.easy-read-font body {
  --font-display: var(--font-body), sans-serif;
  --font-lore: var(--font-body), sans-serif;
}
```

### localStorage Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `botcafe-reduce-animations` | `"true"` / `"false"` | OS `prefers-reduced-motion` | Disable animations |
| `botcafe-easy-read-font` | `"true"` / `"false"` | `"false"` | Switch to Inter everywhere |

---

## Dark Mode

BotCafe defaults to dark mode. The theme is controlled via:

```tsx
// In layout.tsx
<html className="dark">
```

### Conditional Styling

```tsx
<div className="bg-white dark:bg-card">
  <p className="text-gray-900 dark:text-foreground">
    Text content
  </p>
</div>
```

### Custom Scrollbar (Dark Mode)

The app applies themed scrollbar styling in dark mode via WebKit pseudo-elements:

```css
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: hsl(120, 29%, 14%); /* Forest dark */
}
::-webkit-scrollbar-thumb {
  background: hsl(42, 43%, 39%); /* Ancient gold */
  border-radius: 5px;
  border: 2px solid hsl(120, 29%, 14%);
}
::-webkit-scrollbar-thumb:hover {
  background: hsl(46, 65%, 52%); /* Bright gold */
}
```

---

## Form Patterns

### Input with Label

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Bot Name</Label>
  <Input
    id="name"
    placeholder="Enter a name..."
    className="bg-muted/50"
  />
</div>
```

### Select with Label

```tsx
<div className="space-y-2">
  <Label>Category</Label>
  <Select>
    <SelectTrigger>
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="fantasy">Fantasy</SelectItem>
      <SelectItem value="scifi">Sci-Fi</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Loading States

### Spinner Component

```tsx
import { Spinner } from '@/components/ui/spinner'

<Spinner />
```

### Manual Spinner (alternative)

```tsx
import { RefreshCw } from 'lucide-react'

<RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
```

### Loading Container

```tsx
<div className="flex items-center justify-center py-20">
  <Spinner />
</div>
```

---

## Error States

```tsx
import { AlertCircle } from 'lucide-react'

<Card className="border-red-500/20">
  <CardContent className="pt-6">
    <div className="text-center text-red-400">
      <AlertCircle className="h-12 w-12 mx-auto mb-4" />
      <p>Error message here</p>
      <Button onClick={retry} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## Empty States

```tsx
<div className="text-center py-12">
  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 text-purple-400" />
  <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
  <p className="text-muted-foreground mb-4">
    Create your first bot to get started
  </p>
  <Button>Create Bot</Button>
</div>
```

---

## File Organization

### Module Structure

```
src/modules/[feature]/
├── ui/
│   ├── components/     # Reusable components
│   └── views/          # Page-level views
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── types/              # TypeScript types
```

### View Component Pattern

```tsx
// src/modules/[feature]/ui/views/[feature]-view.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FeatureData {
  // Type definition
}

export const FeatureView = () => {
  const [data, setData] = useState<FeatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  // Render UI
}
```
