import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

// Category type matching the Documentation collection
type DocumentationCategory =
  | 'getting-started'
  | 'bot-creation'
  | 'bot-management'
  | 'knowledge-base'
  | 'personas-moods'
  | 'analytics-insights'
  | 'api-reference'
  | 'troubleshooting'
  | 'best-practices'
  | 'account-billing'
  | 'creator-programs'
  | 'legal-compliance'
  | 'platform-updates'
  | 'faq'

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

interface HelpArticle {
  slug: string
  title: string
  category: DocumentationCategory
  difficultyLevel: DifficultyLevel
  estimatedReadTime: number
  isFeatured: boolean
  sortOrder: number
  metaDescription: string
  tags: Array<{ tag: string }>
  content: any
}

// Helper to create lexical content
const createContent = (children: any[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
})

const heading = (text: string, tag: 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text }],
})

const bulletList = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  children: items.map((item) => ({
    type: 'listitem',
    children: [{ type: 'text', text: item }],
  })),
})

const numberedList = (items: string[]) => ({
  type: 'list',
  listType: 'number',
  children: items.map((item) => ({
    type: 'listitem',
    children: [{ type: 'text', text: item }],
  })),
})

// ============ HELP ARTICLES ============

const welcomeArticle: HelpArticle = {
  slug: 'welcome-to-botcafe',
  title: 'Welcome to BotCafe',
  category: 'getting-started',
  difficultyLevel: 'beginner',
  estimatedReadTime: 3,
  isFeatured: true,
  sortOrder: 1,
  metaDescription: 'Get started with BotCafe - your platform for creating and chatting with AI companions.',
  tags: [{ tag: 'welcome' }, { tag: 'introduction' }, { tag: 'getting-started' }],
  content: createContent([
    paragraph('Welcome to BotCafe! This is your creative space for building, sharing, and chatting with AI companions. Whether you want to create immersive roleplay characters, helpful assistants, or creative writing partners, BotCafe has the tools you need.'),
    heading('What You Can Do'),
    bulletList([
      'Create AI bots with unique personalities, backstories, and knowledge',
      'Chat with bots created by you and other creators',
      'Build lore and knowledge bases to make your bots smarter',
      'Track your conversations with memories that persist across chats',
      'Define personas to customize how bots see and interact with you',
      'Discover amazing bots from the community',
    ]),
    heading('Getting Started'),
    numberedList([
      'Create your account using the Sign Up button',
      'Explore public bots on the Explore page to see what\'s possible',
      'Create your first bot using the Create button',
      'Start a conversation and see your bot come to life!',
    ]),
    heading('Need Help?'),
    paragraph('Browse our help articles by category, use the search feature, or join our Discord community for support from other creators.'),
  ]),
}

const createFirstBotArticle: HelpArticle = {
  slug: 'create-your-first-bot',
  title: 'Create Your First Bot',
  category: 'getting-started',
  difficultyLevel: 'beginner',
  estimatedReadTime: 5,
  isFeatured: true,
  sortOrder: 2,
  metaDescription: 'Step-by-step guide to creating your first AI bot on BotCafe.',
  tags: [{ tag: 'tutorial' }, { tag: 'bot-creation' }, { tag: 'beginner' }],
  content: createContent([
    paragraph('Creating a bot on BotCafe is easy! This guide will walk you through the bot creation wizard step by step.'),
    heading('Step 1: Start the Wizard'),
    paragraph('Click the "Create" button in the navigation bar. This opens the bot creation wizard.'),
    heading('Step 2: Basic Information'),
    bulletList([
      'Name: Give your bot a memorable name',
      'Description: Write a short description that tells users what to expect',
      'Picture: Upload an avatar image for your bot (optional but recommended)',
    ]),
    heading('Step 3: Personality'),
    paragraph('This is where your bot comes to life! Define:'),
    bulletList([
      'System Prompt: The core instructions that define how your bot behaves',
      'Personality Traits: Key characteristics like "friendly", "mysterious", or "sarcastic"',
      'Speaking Style: How your bot talks - formal, casual, uses emojis, etc.',
    ]),
    heading('Step 4: Background (Optional)'),
    paragraph('Add depth to your bot with:'),
    bulletList([
      'Backstory: Your bot\'s history and background',
      'World/Setting: The context or universe your bot exists in',
      'Relationships: Connections to other characters or entities',
    ]),
    heading('Step 5: Review & Create'),
    paragraph('Review your bot\'s settings, then click Create. You can always edit your bot later!'),
    heading('Tips for Great Bots'),
    bulletList([
      'Be specific in your system prompt - vague instructions lead to inconsistent behavior',
      'Give your bot a distinct voice and personality',
      'Test your bot by having a conversation before making it public',
      'Use the Lore system to give your bot knowledge about their world',
    ]),
  ]),
}

const exploringBotsArticle: HelpArticle = {
  slug: 'exploring-bots',
  title: 'Exploring and Finding Bots',
  category: 'getting-started',
  difficultyLevel: 'beginner',
  estimatedReadTime: 3,
  isFeatured: true,
  sortOrder: 3,
  metaDescription: 'Learn how to discover and find bots on BotCafe.',
  tags: [{ tag: 'explore' }, { tag: 'discover' }, { tag: 'search' }],
  content: createContent([
    paragraph('BotCafe has a growing community of creators sharing their bots. Here\'s how to find bots you\'ll love.'),
    heading('The Explore Page'),
    paragraph('Click "Explore" in the navigation to browse all public bots. You can:'),
    bulletList([
      'Search by name, description, or creator',
      'Filter by classification (Fantasy, Comedy, Fanfic, etc.)',
      'Sort by newest, most liked, or most favorited',
      'Filter to show only bots you\'ve liked or favorited',
    ]),
    heading('Liking and Favoriting'),
    bulletList([
      'Like: Show appreciation for a bot. Creators can see how many likes their bots have.',
      'Favorite: Save a bot to your favorites for quick access later.',
    ]),
    heading('Creator Profiles'),
    paragraph('Click on a creator\'s name to see their profile and all their public bots. You can follow creators to stay updated on their new creations.'),
    heading('Starting a Chat'),
    paragraph('Found a bot you want to try? Click the "Chat" button on any bot card to start a conversation immediately.'),
  ]),
}

const loreBasicsArticle: HelpArticle = {
  slug: 'understanding-lore',
  title: 'Understanding Lore (Knowledge Base)',
  category: 'knowledge-base',
  difficultyLevel: 'beginner',
  estimatedReadTime: 4,
  isFeatured: true,
  sortOrder: 1,
  metaDescription: 'Learn how to use the Lore system to give your bots knowledge and context.',
  tags: [{ tag: 'lore' }, { tag: 'knowledge' }, { tag: 'context' }],
  content: createContent([
    paragraph('The Lore system lets you give your bots knowledge about their world, characters, events, and more. Think of it as your bot\'s long-term memory and reference library.'),
    heading('What is Lore?'),
    paragraph('Lore entries are pieces of information that your bots can reference during conversations. This could be:'),
    bulletList([
      'Character profiles and relationships',
      'World-building details (history, geography, magic systems)',
      'Plot points and story events',
      'Reference materials and facts',
      'Conversation context and user preferences',
    ]),
    heading('How Lore Works'),
    paragraph('When you chat with a bot, relevant lore entries are automatically retrieved and provided to the AI as context. The system uses semantic search to find the most relevant information for each conversation.'),
    heading('Lore vs Memories'),
    bulletList([
      'Lore: Static reference information you create and manage',
      'Memories: Dynamic records of past conversations and interactions',
    ]),
    paragraph('Both work together to give your bots rich, contextual knowledge.'),
    heading('Getting Started with Lore'),
    paragraph('Visit the Dashboard and click on the "Lore" tab to start creating entries. You can organize them into Tomes (collections) for better management.'),
  ]),
}

const creatingLoreArticle: HelpArticle = {
  slug: 'creating-lore-entries',
  title: 'Creating Lore Entries',
  category: 'knowledge-base',
  difficultyLevel: 'intermediate',
  estimatedReadTime: 5,
  isFeatured: false,
  sortOrder: 2,
  metaDescription: 'Step-by-step guide to creating effective lore entries for your bots.',
  tags: [{ tag: 'lore' }, { tag: 'tutorial' }, { tag: 'knowledge' }],
  content: createContent([
    paragraph('Lore entries are the building blocks of your bot\'s knowledge. Here\'s how to create entries that work well.'),
    heading('Creating an Entry'),
    numberedList([
      'Go to Dashboard > Lore',
      'Click "New Entry"',
      'Fill in the title and content',
      'Optionally assign it to a Tome',
      'Save your entry',
    ]),
    heading('Writing Effective Lore'),
    paragraph('Good lore entries are:'),
    bulletList([
      'Focused: Cover one topic per entry',
      'Clear: Write in a way the AI can understand',
      'Relevant: Include information the bot will actually use',
      'Formatted: Use sections and structure for complex topics',
    ]),
    heading('Example Entry: Character Profile'),
    paragraph('Title: "Elena - The Court Mage"'),
    paragraph('Content: "Elena is the royal court mage, age 45, known for her ice magic and stern demeanor. She serves Queen Marguerite and is secretly researching forbidden summoning magic. She distrusts the knight commander due to an old rivalry. She speaks formally and rarely shows emotion in public."'),
    heading('Tips'),
    bulletList([
      'Start with the most important information',
      'Include how the subject relates to the bot',
      'Add personality details for characters',
      'Update entries as your story evolves',
    ]),
  ]),
}

const tomesArticle: HelpArticle = {
  slug: 'organizing-with-tomes',
  title: 'Organizing Lore with Tomes',
  category: 'knowledge-base',
  difficultyLevel: 'intermediate',
  estimatedReadTime: 3,
  isFeatured: false,
  sortOrder: 3,
  metaDescription: 'Learn how to organize your lore entries into collections called Tomes.',
  tags: [{ tag: 'tomes' }, { tag: 'organization' }, { tag: 'collections' }],
  content: createContent([
    paragraph('Tomes are collections that help you organize your lore entries. They\'re especially useful when you have lots of entries or multiple bots.'),
    heading('Why Use Tomes?'),
    bulletList([
      'Group related entries together',
      'Assign entire tomes to specific bots',
      'Share lore between multiple bots',
      'Keep your knowledge base organized',
    ]),
    heading('Creating a Tome'),
    numberedList([
      'Go to Dashboard > Lore',
      'Click "New Tome"',
      'Give it a name and description',
      'Add entries by editing them and selecting the tome',
    ]),
    heading('Example Organization'),
    paragraph('For a fantasy roleplay bot, you might have:'),
    bulletList([
      'Tome: "World of Eldoria" - General world-building',
      'Tome: "Castle Thornwood" - Location-specific details',
      'Tome: "Major Characters" - NPC profiles',
      'Tome: "Magic System" - Rules and spells',
    ]),
    heading('Assigning Tomes to Bots'),
    paragraph('When editing a bot, you can select which tomes it has access to. This lets you reuse lore across multiple bots while keeping their knowledge appropriate to their role.'),
  ]),
}

const personasArticle: HelpArticle = {
  slug: 'creating-personas',
  title: 'Creating and Using Personas',
  category: 'personas-moods',
  difficultyLevel: 'beginner',
  estimatedReadTime: 4,
  isFeatured: true,
  sortOrder: 1,
  metaDescription: 'Learn how to create personas that customize how bots interact with you.',
  tags: [{ tag: 'personas' }, { tag: 'customization' }, { tag: 'identity' }],
  content: createContent([
    paragraph('Personas let you define who YOU are in conversations with bots. Instead of being "the user", you can be a specific character with their own name, background, and personality.'),
    heading('What is a Persona?'),
    paragraph('A persona is your in-character identity. When you use a persona in a conversation, bots will address you by your persona\'s name and treat you according to your persona\'s description.'),
    heading('Why Use Personas?'),
    bulletList([
      'Roleplay as different characters',
      'Maintain consistent identity across conversations',
      'Provide bots with context about who they\'re talking to',
      'Have multiple "identities" for different scenarios',
    ]),
    heading('Creating a Persona'),
    numberedList([
      'Go to Dashboard > Personas',
      'Click "Create New Persona"',
      'Fill in your persona\'s name, nickname, and description',
      'Add personality traits and background',
      'Save your persona',
    ]),
    heading('Using a Persona'),
    paragraph('When starting a new conversation or in your account settings, you can select which persona to use. The bot will receive your persona information and interact with you accordingly.'),
    heading('Tips'),
    bulletList([
      'Be descriptive - the more detail, the better the interaction',
      'Include how your persona would speak and act',
      'Create different personas for different types of roleplay',
    ]),
  ]),
}

const managingBotsArticle: HelpArticle = {
  slug: 'managing-your-bots',
  title: 'Managing Your Bots',
  category: 'bot-management',
  difficultyLevel: 'beginner',
  estimatedReadTime: 4,
  isFeatured: false,
  sortOrder: 1,
  metaDescription: 'Learn how to edit, organize, and manage your created bots.',
  tags: [{ tag: 'management' }, { tag: 'editing' }, { tag: 'bots' }],
  content: createContent([
    paragraph('Once you\'ve created bots, you\'ll want to manage and improve them. Here\'s how to keep your bots in top shape.'),
    heading('Finding Your Bots'),
    paragraph('Access your bots from the Dashboard. Click "My Bots" to see all bots you\'ve created.'),
    heading('Editing a Bot'),
    paragraph('Click on any bot to view its details, then click "Edit" to modify:'),
    bulletList([
      'Basic info (name, description, picture)',
      'Personality and system prompt',
      'Background and story elements',
      'Visibility settings (public/private)',
      'Assigned lore tomes',
    ]),
    heading('Bot Statistics'),
    paragraph('Each bot shows stats including:'),
    bulletList([
      'Number of conversations',
      'Likes and favorites count',
      'View count',
    ]),
    heading('Deleting a Bot'),
    paragraph('You can delete a bot from its edit page. This action is permanent and will remove all associated data.'),
  ]),
}

const sharingPrivacyArticle: HelpArticle = {
  slug: 'sharing-and-privacy',
  title: 'Bot Sharing and Privacy',
  category: 'bot-management',
  difficultyLevel: 'intermediate',
  estimatedReadTime: 4,
  isFeatured: false,
  sortOrder: 2,
  metaDescription: 'Understand bot visibility settings and how to share your bots.',
  tags: [{ tag: 'sharing' }, { tag: 'privacy' }, { tag: 'visibility' }],
  content: createContent([
    paragraph('BotCafe gives you control over who can see and interact with your bots.'),
    heading('Visibility Settings'),
    paragraph('Each bot has visibility settings:'),
    bulletList([
      'Private: Only you can see and chat with this bot',
      'Public: Anyone can discover and chat with this bot on the Explore page',
    ]),
    heading('Sharing with Specific Users'),
    paragraph('You can share private bots with specific users without making them fully public. This is useful for:'),
    bulletList([
      'Testing with friends before publishing',
      'Creating bots for a small group',
      'Collaborative storytelling with specific people',
    ]),
    heading('What Others Can See'),
    paragraph('When your bot is public, others can see:'),
    bulletList([
      'Bot name, description, and picture',
      'Your creator profile and username',
      'Bot statistics (likes, favorites)',
    ]),
    paragraph('They cannot see:'),
    bulletList([
      'Your private conversations with the bot',
      'Your lore entries (unless shared)',
      'Your editing interface or full system prompt',
    ]),
  ]),
}

const creatorProfileArticle: HelpArticle = {
  slug: 'setting-up-creator-profile',
  title: 'Setting Up Your Creator Profile',
  category: 'creator-programs',
  difficultyLevel: 'beginner',
  estimatedReadTime: 3,
  isFeatured: true,
  sortOrder: 1,
  metaDescription: 'Create a public creator profile to showcase your bots and connect with the community.',
  tags: [{ tag: 'creator' }, { tag: 'profile' }, { tag: 'community' }],
  content: createContent([
    paragraph('A creator profile lets you build your presence on BotCafe. It\'s your public identity as a bot creator.'),
    heading('Why Create a Profile?'),
    bulletList([
      'Get discovered by users browsing creators',
      'Build a following who can see your new bots',
      'Showcase all your public bots in one place',
      'Add social links and personal branding',
    ]),
    heading('Setting Up Your Profile'),
    numberedList([
      'Go to Creators > Set Up Profile',
      'Choose a unique username',
      'Add a display name and bio',
      'Upload a profile picture and banner',
      'Add your specialties and social links',
      'Set your profile visibility',
    ]),
    heading('Profile Features'),
    paragraph('Your creator profile includes:'),
    bulletList([
      'Avatar and banner image',
      'Bio and specialties',
      'Social media links',
      'All your public bots',
      'Follower and following counts',
      'Recent activity feed',
    ]),
    heading('Getting Followers'),
    paragraph('Users can follow you to see your new bots. Build your following by creating great bots and engaging with the community!'),
  ]),
}

const apiKeysArticle: HelpArticle = {
  slug: 'using-your-own-api-keys',
  title: 'Using Your Own API Keys',
  category: 'account-billing',
  difficultyLevel: 'intermediate',
  estimatedReadTime: 4,
  isFeatured: false,
  sortOrder: 1,
  metaDescription: 'Learn how to add your own AI provider API keys for unlimited usage.',
  tags: [{ tag: 'api-keys' }, { tag: 'openai' }, { tag: 'anthropic' }, { tag: 'billing' }],
  content: createContent([
    paragraph('BotCafe allows you to use your own API keys from AI providers. This gives you more control and removes platform limits.'),
    heading('Supported Providers'),
    bulletList([
      'OpenAI (GPT-4, GPT-3.5)',
      'Anthropic (Claude)',
      'Google (Gemini)',
      'OpenRouter (access to multiple models)',
    ]),
    heading('Adding Your API Key'),
    numberedList([
      'Go to Account > API Keys',
      'Select your provider',
      'Paste your API key',
      'Save',
    ]),
    heading('Getting an API Key'),
    paragraph('You\'ll need to sign up with the provider:'),
    bulletList([
      'OpenAI: platform.openai.com',
      'Anthropic: console.anthropic.com',
      'Google AI: makersuite.google.com',
      'OpenRouter: openrouter.ai',
    ]),
    heading('Security'),
    paragraph('Your API keys are encrypted and stored securely. They\'re only used to process your conversations and are never shared.'),
    heading('Costs'),
    paragraph('When using your own keys, you pay the provider directly based on their pricing. BotCafe does not add any markup.'),
  ]),
}

const troubleshootingArticle: HelpArticle = {
  slug: 'common-issues',
  title: 'Common Issues and Solutions',
  category: 'troubleshooting',
  difficultyLevel: 'beginner',
  estimatedReadTime: 5,
  isFeatured: false,
  sortOrder: 1,
  metaDescription: 'Solutions to common problems you might encounter on BotCafe.',
  tags: [{ tag: 'troubleshooting' }, { tag: 'help' }, { tag: 'issues' }],
  content: createContent([
    paragraph('Having trouble? Here are solutions to common issues.'),
    heading('Bot Not Responding'),
    paragraph('If your bot stops responding:'),
    bulletList([
      'Check your internet connection',
      'Refresh the page and try again',
      'If using your own API key, verify it\'s valid and has credits',
      'Try starting a new conversation',
    ]),
    heading('Bot Behavior is Wrong'),
    paragraph('If your bot isn\'t behaving as expected:'),
    bulletList([
      'Review your system prompt for clarity',
      'Check that personality traits align with desired behavior',
      'Test with a new conversation (old context may be causing issues)',
      'Make sure relevant lore is assigned to the bot',
    ]),
    heading('Can\'t See My Bot'),
    paragraph('If your bot isn\'t appearing:'),
    bulletList([
      'Check if it\'s set to Private (only visible to you)',
      'Make sure it was saved successfully',
      'Try refreshing the page or logging out and back in',
    ]),
    heading('Images Not Loading'),
    paragraph('If bot pictures aren\'t showing:'),
    bulletList([
      'Check your image file size (max 5MB)',
      'Ensure the format is JPG, PNG, or WebP',
      'Try re-uploading the image',
    ]),
    heading('Still Need Help?'),
    paragraph('Join our Discord community for real-time support from the team and other creators.'),
  ]),
}

const faqArticle: HelpArticle = {
  slug: 'frequently-asked-questions',
  title: 'Frequently Asked Questions',
  category: 'faq',
  difficultyLevel: 'beginner',
  estimatedReadTime: 6,
  isFeatured: true,
  sortOrder: 1,
  metaDescription: 'Answers to the most common questions about BotCafe.',
  tags: [{ tag: 'faq' }, { tag: 'questions' }, { tag: 'help' }],
  content: createContent([
    heading('General Questions'),
    heading('What is BotCafe?', 'h3'),
    paragraph('BotCafe is a platform for creating, sharing, and chatting with AI companions. You can build characters with unique personalities and have conversations with them.'),
    heading('Is BotCafe free?', 'h3'),
    paragraph('BotCafe offers free access with some limitations. You can also bring your own AI API keys for unlimited usage.'),
    heading('What AI models does BotCafe use?', 'h3'),
    paragraph('We support multiple AI providers including OpenAI (GPT-4), Anthropic (Claude), Google (Gemini), and more via OpenRouter.'),
    heading('Bot Creation'),
    heading('How many bots can I create?', 'h3'),
    paragraph('There\'s no limit on the number of bots you can create!'),
    heading('Can I make my bot private?', 'h3'),
    paragraph('Yes! All bots are private by default. You choose when to make them public.'),
    heading('Can I edit my bot after creating it?', 'h3'),
    paragraph('Absolutely. You can edit any aspect of your bot at any time from your dashboard.'),
    heading('Privacy & Safety'),
    heading('Are my conversations private?', 'h3'),
    paragraph('Yes. Your conversations are only visible to you. Other users cannot see your chat history.'),
    heading('Can I delete my data?', 'h3'),
    paragraph('Yes. You can delete individual conversations, bots, or your entire account from your settings.'),
    heading('What content is allowed?', 'h3'),
    paragraph('Please review our Responsible AI Use Policy for guidelines on acceptable content. We prohibit harmful and illegal content.'),
  ]),
}

const bestPracticesArticle: HelpArticle = {
  slug: 'bot-creation-best-practices',
  title: 'Bot Creation Best Practices',
  category: 'best-practices',
  difficultyLevel: 'intermediate',
  estimatedReadTime: 6,
  isFeatured: false,
  sortOrder: 1,
  metaDescription: 'Expert tips for creating engaging and well-behaved AI bots.',
  tags: [{ tag: 'tips' }, { tag: 'best-practices' }, { tag: 'advanced' }],
  content: createContent([
    paragraph('Creating a great bot is both an art and a science. Here are proven techniques to make your bots more engaging and consistent.'),
    heading('Writing System Prompts'),
    bulletList([
      'Be specific and clear - avoid vague instructions',
      'Define the bot\'s core traits early in the prompt',
      'Include examples of how the bot should respond',
      'Specify what the bot should NOT do',
      'Keep it focused - longer isn\'t always better',
    ]),
    heading('Creating Consistent Characters'),
    bulletList([
      'Define clear personality boundaries',
      'Give your bot a distinct voice (vocabulary, speech patterns)',
      'Include emotional range and reactions',
      'Document backstory that explains behavior',
      'Test with various scenarios to ensure consistency',
    ]),
    heading('Using Lore Effectively'),
    bulletList([
      'Create focused entries rather than dumping everything into one',
      'Use consistent naming and terminology',
      'Include relationship dynamics between characters',
      'Update lore as your story evolves',
      'Organize with tomes for complex worlds',
    ]),
    heading('Engagement Tips'),
    bulletList([
      'Create hooks that invite conversation',
      'Design bots that ask questions and show curiosity',
      'Include secrets or mysteries for users to discover',
      'Allow for character growth and change',
    ]),
    heading('Testing Your Bot'),
    bulletList([
      'Have conversations covering different topics',
      'Test edge cases and unusual requests',
      'Get feedback from friends before publishing',
      'Iterate based on real conversations',
    ]),
  ]),
}

// All articles array
const helpArticles: HelpArticle[] = [
  welcomeArticle,
  createFirstBotArticle,
  exploringBotsArticle,
  loreBasicsArticle,
  creatingLoreArticle,
  tomesArticle,
  personasArticle,
  managingBotsArticle,
  sharingPrivacyArticle,
  creatorProfileArticle,
  apiKeysArticle,
  troubleshootingArticle,
  faqArticle,
  bestPracticesArticle,
]

/**
 * POST /api/admin/seed-help
 *
 * Seeds the documentation collection with help articles.
 * Requires authentication.
 */
export async function POST() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find or create the user in Payload by email
    const users = await payload.find({
      collection: 'users',
      where: {
        email: { equals: clerkUser.emailAddresses[0]?.emailAddress },
      },
    })

    let payloadUserId: string | number
    if (users.docs.length > 0) {
      payloadUserId = users.docs[0].id
    } else {
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`
            : clerkUser.username || 'Admin',
          role: 'admin',
        },
      })
      payloadUserId = newUser.id
    }

    const results = []
    const now = new Date().toISOString()

    for (const article of helpArticles) {
      // Check if article already exists
      const existing = await payload.find({
        collection: 'documentation',
        where: { slug: { equals: article.slug } },
      })

      if (existing.docs.length === 0) {
        const doc = await payload.create({
          collection: 'documentation',
          data: {
            title: article.title,
            slug: article.slug,
            category: article.category as any,
            content: article.content as any,
            language: 'en',
            isPublished: true,
            difficultyLevel: article.difficultyLevel as any,
            estimatedReadTime: article.estimatedReadTime,
            isFeatured: article.isFeatured,
            sortOrder: article.sortOrder,
            metaDescription: article.metaDescription,
            tags: article.tags,
            creator: payloadUserId,
            lastUpdated: now,
            viewCount: 0,
          },
        })
        results.push({ slug: article.slug, status: 'created', id: doc.id })
      } else {
        results.push({ slug: article.slug, status: 'exists', id: existing.docs[0].id })
      }
    }

    const created = results.filter((r) => r.status === 'created').length
    const existed = results.filter((r) => r.status === 'exists').length

    return NextResponse.json({
      success: true,
      message: `Help articles seeded: ${created} created, ${existed} already existed`,
      results,
    })
  } catch (error: any) {
    console.error('Error seeding help articles:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed help articles' },
      { status: 500 }
    )
  }
}
