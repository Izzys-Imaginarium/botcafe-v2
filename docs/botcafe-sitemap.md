# BotCafé Sitemap - Fantasy AI Chatbot Platform

## Overview
BotCafé is a dark fantasy-themed AI chatbot platform with advanced RAG capabilities, memory management, persona systems, and mental health features. This sitemap outlines the complete navigation structure and user experience flow.
s
---

## 🏰 Main Navigation Structure

### Primary Navigation (Header)
```
🏠 Home                    (Landing page & overview)
🔍 Explore                 (Browse bots & conversations)  
📚 Grimoire               (Knowledge & RAG management)
🎭 Create                 (Bot creation & persona management)
👑 Creators               (Bot creator profiles & showcase)
💬 Chat                  (Personal conversations)
👤 Account               (User profile & settings)
```

---

## 📖 Detailed Sitemap

### 1. 🏠 Home
**Path:** `/`
**Description:** Landing page with magical introduction to BotCafé

#### Sub-pages:
- **Hero Section** - Animated coffee cup with fantasy background
- **Features Showcase** - Key capabilities overview
- **Getting Started** - Quick onboarding guide
- **Live Chat Preview** - Interactive demo

---

### 2. 🔍 Explore
**Path:** `/explore`
**Description:** Browse and discover existing bots, conversations, and public content

#### Navigation Structure:
```
📁 /explore
├── 🤖 Bots Directory
│   ├── Public Bots
│   ├── Community Favorites
│   ├── Featured Creations
│   └── Search & Filters
├── 💬 Shared Conversations
│   ├── Public Chats
│   ├── Tutorial Examples
│   └── Community Highlights
└── 📚 Knowledge Libraries
    ├── Public Grimoires
    ├── Tutorial Collections
    └── Featured Knowledge
```

#### Sub-pages:
- **Bots Directory** (`/explore/bots`)
  - Grid view of available bots
  - Filtering by category, popularity, creator, privacy level
  - Search functionality
  - Public bots only (private/shared-with-select bots hidden)
- **Conversations Gallery** (`/explore/conversations`)
  - Public chat transcripts
  - Notable conversation examples
  - Community highlights
- **Knowledge Library** (`/explore/knowledge`)
  - Shared knowledge collections
  - Tutorial materials
  - Public grimoires

---

### 3. 📚 Grimoire (Knowledge Management - RAG System)
**Path:** `/grimoire`
**Description:** Comprehensive knowledge management system with fantasy theming

#### Navigation Structure:
```
📁 /grimoire
├── 🏠 Dashboard
│   ├── Knowledge Overview
│   ├── Recent Activity
│   └── Quick Actions
├── 📝 Knowledge Entries
│   ├── All Entries
│   ├── Create New
│   ├── Import/Export
│   ├── Search & Filter
│   └── Privacy Controls (Private/Shared/Select People)
├── 📚 Collections
│   ├── My Collections
│   ├── Shared Collections
│   ├── Curated Collections (Moderator-Approved)
│   ├── Create Collection
│   ├── Manage Organization
│   └── Privacy Settings & Access Control
├── 🏷️ Metadata Tags
│   ├── Tag Management
│   ├── Tag Categories
│   ├── Bulk Tagging
│   └── Tag Analytics
├── 🧠 AI Insights
│   ├── Knowledge Analytics
│   ├── Usage Statistics
│   └── Performance Metrics
└── ⚙️ Settings
    ├── RAG Configuration
    ├── Access Permissions
    └── Import/Export Tools
```

#### Sub-pages:
- **Knowledge Dashboard** (`/grimoire/dashboard`)
  - Overview of all knowledge resources
  - Recent additions and updates
  - Usage analytics
- **Knowledge Entries** (`/grimoire/entries`)
  - List view of all entries
  - Create/edit individual knowledge pieces
  - Bulk import functionality
  - Privacy controls (Private/Shared/Select People)
- **Collections** (`/grimoire/collections`)
  - Organize knowledge into themed collections
  - **Curated Collections** (moderator-approved, pre-configured features)
  - Collaborative sharing options
  - Collection analytics
  - **Legal Compliance Collections** (guard rails, slash commands, etc.)
- **Metadata Management** (`/grimoire/tags`)
  - Tag creation and management
  - Category organization
  - Bulk tagging tools
- **Analytics** (`/grimoire/analytics`)
  - Knowledge usage statistics
  - Search effectiveness metrics
  - Performance insights

---

### 4. 🎭 Create (Bot & Persona Management)
**Path:** `/create`
**Description:** Create bots, manage personas, and customize AI behavior

#### Navigation Structure:
```
📁 /create
├── 🤖 Bot Creation
│   ├── Bot Builder Wizard
│   ├── Template Gallery
│   ├── Personality Design
│   ├── Knowledge Assignment
│   └── Privacy Controls (Private/Shared/Select People)
├── 🎭 Persona System
│   ├── My Personas
│   ├── Create Persona
│   ├── Apply Personas
│   └── Persona Library
├── 🎨 Customization
│   ├── Appearance Settings
│   ├── Voice Configuration
│   ├── Behavior Tuning
│   └── Response Styles
└── 🧪 Testing
    ├── Bot Simulator
    ├── Conversation Testing
    ├── Knowledge Validation
    └── Performance Review
```

#### Sub-pages:
- **Bot Creation Wizard** (`/create/bot`)
  - Step-by-step bot building process
  - Template selection
  - Knowledge base assignment
  - Personality configuration
  - **Privacy Settings**: Private/Public/Shared with Select People
  - **Access Control**: User permission management
  - **Sharing Options**: Bot visibility and collaboration settings
- **Persona Management** (`/create/personas`)
  - Create custom personas
  - Apply personas to conversations
  - Persona library and organization
- **Customization Studio** (`/create/customize`)
  - Visual appearance settings
  - Voice and tone configuration
  - Response behavior tuning
- **Testing Laboratory** (`/create/test`)
  - Conversation simulation
  - Knowledge base validation
  - Performance testing tools

---

### 5. 👑 Creators (Bot Creator Profiles & Showcase)
**Path:** `/creators`
**Description:** Multi-tenant platform featuring bot creator profiles and showcases

#### Navigation Structure:
```
📁 /creators
├── 🏠 Creator Directory
│   ├── All Creators
│   ├── Featured Artisans
│   ├── Rising Stars
│   └── Search & Filters
├── 👑 Creator Profiles
│   ├── Public Profiles
│   ├── Creator Portfolios
│   ├── Bot Showcases
│   └── Creator Stories
├── 🏪 Creator Showcase
│   ├── Featured Bot Gallery
│   ├── Free Bot Collections
│   ├── Creator Spotlights
│   └── Community Highlights
├── 📊 Creator Analytics
│   ├── Creator Dashboard
│   ├── Bot Performance Stats
│   ├── Usage Analytics
│   └── Community Engagement
├── 🎨 Creator Tools
│   ├── Portfolio Builder
│   ├── Bot Promotion Tools
│   ├── Social Features
│   └── Collaboration Hub
└── 🏆 Creator Programs
    ├── Featured Creator Program
    ├── Community Recognition
    ├── Creator Challenges
    └── Future: Monetization Features
```

#### Sub-pages:
- **Creator Directory** (`/creators/directory`)
  - Browse all bot creators
  - Filter by specialty, popularity, rating
  - Featured creator spotlights
- **Creator Profile Pages** (`/creators/[username]`)
  - Public creator profiles
  - Bot portfolio showcase
  - Creator bio and story
  - Social links and contact
- **Creator Dashboard** (`/creators/dashboard`)
  - Personal creator analytics
  - Bot performance metrics
  - Usage tracking
  - Community engagement stats
- **Bot Showcase Gallery** (`/creators/showcase`)
  - Curated bot galleries
  - Creator collections
  - Community favorites
  - Trending creations
- **Creator Programs** (`/creators/programs`)
  - Featured creator applications
  - Community recognition system
  - Creator challenges and events
  - **Future:** Monetization features (revenue sharing, premium content)

---

### 6. 💬 Chat Interface
**Path:** `/chat/[conversationId]`
**Description:** Main conversation interface with memory integration and multi-bot support

#### Navigation Structure:
```
📁 /chat/[id]
├── 💬 Active Conversation
│   ├── Message Interface
│   ├── Multi-bot Response Generation
│   ├── Dynamic Bot Add/Remove
│   ├── File Sharing
│   └── Voice Input
├── 🤖 Active Bots Panel
│   ├── Current Conversation Bots
│   ├── Add/Remove Bots Interface
│   ├── Bot Performance Comparison
│   └── Minimum One Bot Enforcement
├── 🧠 Memory Management
│   ├── Memory Preview
│   ├── Edit Memories
│   ├── Memory Timeline
│   └── Story Progression
├── 🎭 Persona Controls
│   ├── Current Persona
│   ├── Switch Persona
│   ├── Persona Effects
│   └── Custom Instructions
└── ⚙️ Chat Settings
    ├── Bot Configuration
    ├── Knowledge Access Controls
    ├── Privacy & Sharing Options
    └── Multi-bot Conversation Settings
```

#### Sub-pages:
- **Main Chat** (`/chat/[id]`)
  - Real-time messaging interface with multiple bots
  - Multi-bot response generation and comparison
  - Dynamic bot add/remove (drop-in/drop-out)
  - Memory integration display
- **Active Bots Panel** (`/chat/[id]/bots`)
  - Current conversation bots
  - Add/remove bots interface
  - Bot performance comparison
  - Minimum one bot requirement enforcement
- **Memory Review** (`/chat/[id]/memories`)
  - Generated conversation memories
  - Edit and refine memories
  - Memory timeline visualization
- **Chat Settings** (`/chat/[id]/settings`)
  - Bot configuration and preferences
  - Knowledge access controls
  - Privacy and sharing options
  - Multi-bot conversation settings

---

### 7. 👤 Account & Profile
**Path:** `/account`
**Description:** User profile, settings, and account management

#### Navigation Structure:
```
📁 /account
├── 🏠 Profile Dashboard
│   ├── User Overview
│   ├── Activity Summary
│   ├── Quick Stats
│   └── Recent Activity
├── 👤 Profile Settings
│   ├── Personal Information
│   ├── Avatar & Display
│   ├── Username & Bio
│   └── Privacy Controls
├── 🔐 Security
│   ├── Password Change
│   ├── Two-Factor Auth
│   ├── Session Management
│   └── Login History
├── 🔑 API Key Management
│   ├── OpenAI API Keys
│   ├── Anthropic Claude API Keys
│   ├── DeepSeek, Google, ElectronHub Keys
│   ├── OpenRouter Integration
│   └── Usage Tracking & Limits
├── 💳 Billing & Subscriptions
│   ├── Current Plan
│   ├── Usage Statistics
│   ├── Payment Methods
│   └── Billing History
└── 🗑️ Data Management
    ├── Export My Data
    ├── Delete Account
    ├── Privacy Settings
    └── Data Retention
```

#### Sub-pages:
- **Profile Dashboard** (`/account/dashboard`)
  - Personal activity overview
  - Usage statistics
  - Quick access to recent content
- **Profile Settings** (`/account/profile`)
  - Personal information management
  - Avatar and display customization
  - Privacy preferences
- **Security Center** (`/account/security`)
  - Password and authentication
  - Login session management
  - Security audit log
- **API Key Management** (`/account/api-keys`)
  - OpenAI API key configuration
  - Anthropic Claude API key management
  - DeepSeek, Google, ElectronHub, OpenRouter integration
  - API usage tracking and cost monitoring
  - Secure key storage and rotation
- **Billing** (`/account/billing`)
  - Subscription management
  - Usage tracking
  - Payment method management

---

### 8. 🧠 Mood Journal & Mental Health
**Path:** `/wellbeing`
**Description:** Mental health tracking and self-moderation tools

#### Navigation Structure:
```
📁 /wellbeing
├── 📔 Mood Journal
│   ├── Daily Check-ins
│   ├── Mood Tracking
│   ├── Reflection Prompts
│   └── Mood Analytics
├── 📊 Mental Health Dashboard
│   ├── Wellbeing Overview
│   ├── Usage Patterns
│   ├── Alert Systems
│   └── Progress Tracking
├── 🛡️ Self-Moderation
│   ├── Usage Limits
│   ├── Time Management
│   ├── Healthy Habits
│   └── Intervention Tools
├── 📈 Analytics & Insights
│   ├── Mood Trends
│   ├── Usage Statistics
│   ├── Wellbeing Reports
│   └── Personal Insights
└── 🆘 Support Resources
    ├── Mental Health Resources
    ├── Crisis Support
    ├── Community Guidelines
    └── Professional Help
```

#### Sub-pages:
- **Mood Journal** (`/wellbeing/journal`)
  - Daily mood check-ins
  - Emotional reflection tools
  - Mood pattern tracking
- **Mental Health Dashboard** (`/wellbeing/dashboard`)
  - Overall wellbeing overview
  - Usage pattern analysis
  - Alert system for concerning trends
- **Self-Moderation Tools** (`/wellbeing/moderation`)
  - Set usage time limits
  - Healthy habit reminders
  - Intervention protocols
- **Support Resources** (`/wellbeing/support`)
  - Mental health resources
  - Crisis intervention tools
  - Professional help connections

---

### 9. 📚 Memory Archive
**Path:** `/memories`
**Description:** Comprehensive memory management and story progression

#### Navigation Structure:
```
📁 /memories
├── 🏠 Memory Dashboard
│   ├── All Conversations
│   ├── Memory Overview
│   ├── Story Timeline
│   └── Quick Access
├── 📖 Memory Library
│   ├── By Conversation
│   ├── By Bot
│   ├── By Date
│   └── By Mood/Theme
├── ✏️ Memory Editor
│   ├── Edit Individual Memories
│   ├── Bulk Edit Tools
│   ├── Memory Merging
│   └── Version Control
├── 🔍 Search & Filter
│   ├── Keyword Search
│   ├── Date Ranges
│   ├── Conversation Filters
│   └── Tag-based Search
└── 📤 Export & Sharing
    ├── Memory Export
    ├── Story Compilation
    ├── Sharing Controls
    └── Backup Options
```

#### Sub-pages:
- **Memory Dashboard** (`/memories/dashboard`)
  - Overview of all stored memories
  - Recent memory activity
  - Quick access to important memories
- **Memory Library** (`/memories/library`)
  - Organized memory browsing
  - Filter by various criteria
  - Memory search functionality
- **Memory Editor** (`/memories/edit`)
  - Edit and refine individual memories
  - Bulk editing capabilities
  - Memory merging and organization

---

### 10. 📊 Analytics & Insights
**Path:** `/analytics`
**Description:** Detailed usage analytics and insights

#### Navigation Structure:
```
📁 /analytics
├── 📈 Usage Analytics
│   ├── Chat Statistics
│   ├── Bot Performance
│   ├── Knowledge Usage
│   └── Time Spent Analysis
├── 🧠 Memory Insights
│   ├── Story Progression
│   ├── Character Development
│   ├── Mood Patterns
│   └── Narrative Themes
├── 🎯 Persona Effectiveness
│   ├── Persona Usage Stats
│   ├── Response Quality
│   ├── User Satisfaction
│   └── Performance Metrics
└── 📊 Custom Reports
    ├── Generate Reports
    ├── Scheduled Reports
    ├── Export Options
    └── Report Templates
```

---

### 11. ⚖️ Legal & Compliance
**Path:** `/legal`
**Description:** Legal disclaimers and responsible use policies

#### Navigation Structure:
```
📁 /legal
├── 📜 Terms of Service
│   ├── Platform Usage Rules
│   ├── User Responsibilities
│   └── Service Limitations
├── 🔒 Privacy Policy
│   ├── Data Usage Policies
│   ├── Data Collection Notice
│   └── User Rights & Controls
├── 🛡️ Responsible AI Use
│   ├── Ethical Guidelines
│   ├── AI Safety Protocols
│   └── Community Standards
└── ⚠️ Legal Disclaimers
    ├── AI Response Disclaimers
    ├── Content Responsibility
    └── Limitation of Liability
```

#### Sub-pages:
- **Terms of Service** (`/legal/terms`)
  - Platform usage rules and guidelines
  - User responsibilities and obligations
  - Service limitations and restrictions
- **Privacy Policy** (`/legal/privacy`)
  - Data usage and collection policies
  - User privacy rights and controls
  - Data retention and deletion policies
- **Responsible AI Use** (`/legal/responsible-use`)
  - Ethical AI usage guidelines
  - Safety protocols and best practices
  - Community standards and moderation
- **Legal Disclaimers** (`/legal/disclaimers`)
  - AI response accuracy disclaimers
  - Content responsibility notices
  - Limitation of liability statements

---

### 12. ❓ Help & Support
**Path:** `/help`
**Description:** Documentation, tutorials, and support resources

#### Navigation Structure:
```
📁 /help
├── 📖 Documentation
│   ├── Getting Started
│   ├── Feature Guides
│   ├── API Documentation
│   └── Troubleshooting
├── 🎓 Tutorials
│   ├── Video Tutorials
│   ├── Step-by-Step Guides
│   ├── Interactive Demos
│   └── Best Practices
├── 💬 Community
│   ├── Forum
│   ├── Discord Server
│   ├── User Groups
│   └── Feature Requests
└── 🆘 Support
    ├── Contact Support
    ├── Bug Reports
    ├── Feature Requests
    └── Status Updates
```

---

## 🎨 Fantasy Theme Integration

### Navigation Naming Conventions
- **Home** → "Home" (keep simple for accessibility)
- **Explore** → "Explore" (discovery theme)
- **Knowledge Management** → "Grimoire" (fantasy library theme)
- **Bot Creation** → "Create" (creation theme)
- **Personas** → "Masks" or "Avatars" within Create section
- **Chat** → "Converse" or "Dialogue"
- **Memories** → "Chronicles" or "Lore"
- **Mood Journal** → "Reflective Waters" or "Soul Mirror"
- **Creators** → "Artisan Guild" (master craftsperson theme)
- **Legal** → "Council Chambers" (official documentation theme)

### Visual Hierarchy
