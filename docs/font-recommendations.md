# Font Recommendations for BotCafé Splash Page

## Current Issue
The current `Cinzel_Decorative` font has similar-looking "C" and "O" characters, making "botcafe" hard to read at large sizes.

## Recommended Fantasy Fonts with Clear C vs O Distinction

### 1. **Uncial Antiqua** ⭐ TOP RECOMMENDATION
- **Feel**: Ancient manuscript, medieval fantasy
- **C vs O**: Very clear distinction - C has sharp points, O is perfectly round
- **Usage**: `font-display` class replacement
- **Google Fonts**: `Uncial_Antiqua`

### 2. **MedievalSharp** 
- **Feel**: Medieval illuminated manuscripts
- **C vs O**: Excellent distinction, C has inward curve, O is round
- **Usage**: Good for fantasy theme consistency
- **Google Fonts**: `MedievalSharp`

### 3. **Caesar Dressing**
- **Feel**: Roman/cinema poster style, bold fantasy
- **C vs O**: Very distinctive - C is angular, O is circular
- **Usage**: Bold statement font, great for titles
- **Google Fonts**: `Caesar_Dressing`

### 4. **Rye**
- **Feel**: Western/fantasy frontier
- **C vs O**: Clear distinction, decorative but readable
- **Usage**: Unique character, maintains fantasy feel
- **Google Fonts**: `Rye`

### 5. **Almendra Display**
- **Feel**: High fantasy, elegant serif
- **C vs O**: Good distinction with decorative elements
- **Usage**: Sophisticated fantasy feel
- **Google Fonts**: `Almendra_Display`

## Implementation Steps

### Option A: Quick Google Fonts Import
Replace the font import in `src/app/(frontend)/layout.tsx`:

```typescript
import { Uncial_Antiqua } from 'next/font/google'

const uncialAntiqua = Uncial_Antiqua({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})
```

### Option B: Test Multiple Fonts
Create a font testing component to preview all recommendations.

## Visual Comparison Needed
To make the best choice, we should see how each font renders "BotCafé" at the current large size (text-9xl) to evaluate:
- C vs O distinction
- Overall aesthetic fit with the fantasy theme
- Readability at different screen sizes

## Recommendation
Start with **Uncial Antiqua** as it offers the best combination of:
- Clear C vs O distinction
- Authentic medieval fantasy feel
- Good readability at large sizes
- Matches the enchanted/mystical theme of BotCafé
