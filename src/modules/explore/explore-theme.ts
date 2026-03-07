export interface ExploreTheme {
  // Venue filter value passed to API
  venue: 'main' | 'backrooms'
  // URL param key for classifications
  classificationParam: string
  // Classification options
  classificationOptions: Array<{ value: string; label: string }>
  // CSS classes
  classes: {
    glassPanel: string
    glassPanelBg: string
    text: string
    textDim: string
    textHeading: string
    accent: string
    accentHover: string
    border: string
    checkboxBorder: string
    checkboxAccent: string
    inputBg: string
    inputBorder: string
    inputFocus: string
    cardHoverShadow: string
    avatarBorder: string
    avatarFallbackBg: string
    avatarFallbackText: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
    linkBg: string
    linkBorder: string
    copySuccessText: string
    likeActive: string
    likeHover: string
    favoriteActive: string
    favoriteHover: string
    buttonBorder: string
    buttonHover: string
    retryButtonBg: string
    skeletonBg: string
    skeletonBorder: string
  }
  // Text strings
  strings: {
    searchLabel: string
    searchPlaceholder: string
    filterHeading: string
    classificationLabel: string
    emptyTitle: string
    emptySubtitle: string
    endMessage: string
  }
}

const mainClassifications = [
  { value: 'conversational-ai', label: 'Conversational AI' },
  { value: 'creative-writing', label: 'Creative Writing' },
  { value: 'fantasy-rpg', label: 'Fantasy/RPG' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fanfic', label: 'Fanfic' },
  { value: 'oc', label: 'OC (Original Characters)' },
  { value: 'dead-dove', label: 'Dead Dove' },
  { value: 'comedy-parody', label: 'Comedy/Parody' },
  { value: 'long-form', label: 'Long-form' },
  { value: 'one-shot', label: 'One-shot' },
]

const backroomsClassifications = [
  { value: 'experimental', label: 'Experimental' },
  { value: 'deep-lore', label: 'Deep Lore' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'unhinged', label: 'Unhinged' },
  { value: 'wip', label: 'WIP' },
  { value: 'collab', label: 'Collab' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'niche', label: 'Niche' },
]

export const mainTheme: ExploreTheme = {
  venue: 'main',
  classificationParam: 'classifications',
  classificationOptions: mainClassifications,
  classes: {
    glassPanel: 'glass-rune',
    glassPanelBg: 'glass-rune border-gold-ancient/30 bg-[#0a140a]',
    text: 'text-parchment',
    textDim: 'text-parchment-dim',
    textHeading: 'text-gold-rich',
    accent: 'text-gold-rich',
    accentHover: 'hover:text-gold-rich',
    border: 'border-gold-ancient/20',
    checkboxBorder: 'border-gold-ancient/30',
    checkboxAccent: 'text-gold-rich focus:ring-gold-rich/20',
    inputBg: 'bg-[#0a140a]/50 border-gold-ancient/30 text-parchment placeholder:text-parchment-dim focus:border-gold-rich focus:ring-gold-rich/20',
    inputBorder: 'border-gold-ancient/30',
    inputFocus: 'focus:border-gold-rich focus:ring-gold-rich/20',
    cardHoverShadow: 'hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.3)]',
    avatarBorder: 'border-gold-ancient/30',
    avatarFallbackBg: 'bg-[#0a140a]',
    avatarFallbackText: 'text-gold-rich',
    badgeBg: 'bg-gold-ancient/20',
    badgeText: 'text-gold-rich',
    badgeBorder: 'border-gold-ancient/30',
    linkBg: 'bg-[#0a140a]/30',
    linkBorder: 'border-gold-ancient/20',
    copySuccessText: 'text-magic-teal',
    likeActive: 'bg-magic-glow/20 text-magic-glow',
    likeHover: 'hover:bg-magic-glow/10 text-parchment-dim hover:text-magic-glow',
    favoriteActive: 'bg-magic-teal/20 text-magic-teal',
    favoriteHover: 'hover:bg-magic-teal/10 text-parchment-dim hover:text-magic-teal',
    buttonBorder: 'ornate-border hover:bg-gold-ancient/20 hover:border-gold-rich',
    buttonHover: 'hover:bg-gold-ancient/20',
    retryButtonBg: 'bg-forest hover:bg-forest/90 text-white',
    skeletonBg: 'bg-[#0a140a]',
    skeletonBorder: 'border-gold-ancient/30',
  },
  strings: {
    searchLabel: 'Search Bots',
    searchPlaceholder: 'Search by name, description, or keywords...',
    filterHeading: 'Filter by',
    classificationLabel: 'Classification',
    emptyTitle: 'No bots found',
    emptySubtitle: 'Try adjusting your filters or create your own bot!',
    endMessage: "You've seen all the bots!",
  },
}

export const backroomsTheme: ExploreTheme = {
  venue: 'backrooms',
  classificationParam: 'backrooms_classifications',
  classificationOptions: backroomsClassifications,
  classes: {
    glassPanel: 'glass-backstage',
    glassPanelBg: 'glass-backstage border-velvet-deep/30',
    text: 'text-cream',
    textDim: 'text-cream-dim',
    textHeading: 'text-velvet',
    accent: 'text-velvet',
    accentHover: 'hover:text-velvet',
    border: 'border-velvet-deep/20',
    checkboxBorder: 'border-velvet-deep/30',
    checkboxAccent: 'text-velvet focus:ring-velvet/20',
    inputBg: 'bg-curtain-dark/50 border-velvet-deep/30 text-cream placeholder:text-cream-dim focus:border-velvet focus:ring-velvet/20',
    inputBorder: 'border-velvet-deep/30',
    inputFocus: 'focus:border-velvet focus:ring-velvet/20',
    cardHoverShadow: 'hover:shadow-[0_10px_40px_-10px_rgba(180,50,80,0.3)]',
    avatarBorder: 'border-velvet-deep/30',
    avatarFallbackBg: 'bg-curtain-dark',
    avatarFallbackText: 'text-velvet',
    badgeBg: 'bg-velvet-deep/30',
    badgeText: 'text-velvet',
    badgeBorder: 'border-velvet-deep/40',
    linkBg: 'bg-curtain-dark/30',
    linkBorder: 'border-velvet-deep/20',
    copySuccessText: 'text-brass',
    likeActive: 'bg-velvet/20 text-velvet',
    likeHover: 'hover:bg-velvet/10 text-cream-dim hover:text-velvet',
    favoriteActive: 'bg-brass/20 text-brass',
    favoriteHover: 'hover:bg-brass/10 text-cream-dim hover:text-brass',
    buttonBorder: 'velvet-border hover:bg-velvet-deep/20 hover:border-velvet',
    buttonHover: 'hover:bg-velvet-deep/20',
    retryButtonBg: 'bg-velvet-deep hover:bg-velvet text-white',
    skeletonBg: 'bg-curtain-dark',
    skeletonBorder: 'border-velvet-deep/30',
  },
  strings: {
    searchLabel: 'Search',
    searchPlaceholder: 'Search the backrooms...',
    filterHeading: 'Tags',
    classificationLabel: 'Tags',
    emptyTitle: 'The backrooms are empty...',
    emptySubtitle: 'No bots found. Try adjusting your filters.',
    endMessage: "You've reached the end of the backrooms.",
  },
}
