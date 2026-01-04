# BotCafé Visual Sitemap Diagram

## 🎨 Visual Hierarchy Map

```
🏰 BotCafé Platform
│
├── 🏠 HOME (/)
│   ├── Hero Section
│   ├── Features Showcase
│   ├── Getting Started Guide
│   └── Live Chat Preview
│
├── 🔍 EXPLORE (/explore)
│   ├── 🤖 Bots Directory (/explore/bots)
│   │   ├── Public Bots
│   │   ├── Community Favorites
│   │   └── Featured Creations
│   │
│   ├── 💬 Shared Conversations (/explore/conversations)
│   │   ├── Public Chats
│   │   ├── Tutorial Examples
│   │   └── Community Highlights
│   │
│   └── 📚 Knowledge Libraries (/explore/knowledge)
│       ├── Public Lore Collections
│       ├── Tutorial Collections
│       └── Featured Knowledge
│
├── 📚 LORE (/lore) [RAG System]
│   ├── 🏠 Dashboard (/lore/dashboard)
│   │   ├── Knowledge Overview
│   │   ├── Recent Activity
│   │   └── Quick Actions
│   │
│   ├── 📝 Knowledge Entries (/lore/entries)
│   │   ├── All Entries List
│   │   ├── Create New Entry
│   │   ├── Import/Export Tools
│   │   └── Search & Filter
│   │
│   ├── 📚 Collections (/lore/collections)
│   │   ├── My Collections
│   │   ├── Shared Collections
│   │   ├── Create Collection
│   │   └── Manage Organization
│   │
│   ├── 🏷️ Metadata Tags (/lore/tags)
│   │   ├── Tag Management
│   │   ├── Tag Categories
│   │   ├── Bulk Tagging
│   │   └── Tag Analytics
│   │
│   ├── 🧠 AI Insights (/lore/analytics)
│   │   ├── Knowledge Analytics
│   │   ├── Usage Statistics
│   │   └── Performance Metrics
│   │
│   └── ⚙️ Settings (/lore/settings)
│       ├── RAG Configuration
│       ├── Access Permissions
│       └── Import/Export Tools
│
├── 🎭 CREATE (/create) [Bot & Persona Management]
│   ├── 🤖 Bot Creation (/create/bot)
│   │   ├── Bot Builder Wizard
│   │   ├── Template Gallery
│   │   ├── Personality Design
│   │   └── Knowledge Assignment
│   │
│   ├── 🎭 Persona System (/create/personas)
│   │   ├── My Personas
│   │   ├── Create Persona
│   │   ├── Apply Personas
│   │   └── Persona Library
│   │
│   ├── 🎨 Customization (/create/customize)
│   │   ├── Appearance Settings
│   │   ├── Voice Configuration
│   │   ├── Behavior Tuning
│   │   └── Response Styles
│   │
│   └── 🧪 Testing (/create/test)
│       ├── Bot Simulator
│       ├── Conversation Testing
│       ├── Knowledge Validation
│       └── Performance Review
│
├── 💬 CHAT (/chat/[conversationId])
│   ├── 💬 Active Conversation
│   │   ├── Message Interface
│   │   ├── Real-time Responses
│   │   ├── File Sharing
│   │   └── Voice Input
│   │
│   ├── 🧠 Memory Management (/chat/[id]/memories)
│   │   ├── Memory Preview
│   │   ├── Edit Memories
│   │   ├── Memory Timeline
│   │   └── Story Progression
│   │
│   ├── 🎭 Persona Controls
│   │   ├── Current Persona
│   │   ├── Switch Persona
│   │   ├── Persona Effects
│   │   └── Custom Instructions
│   │
│   └── ⚙️ Chat Settings (/chat/[id]/settings)
│       ├── Bot Selection
│       ├── Knowledge Access
│       ├── Privacy Controls
│       └── Export Options
│
├── 👤 ACCOUNT (/account)
│   ├── 🏠 Profile Dashboard (/account/dashboard)
│   │   ├── User Overview
│   │   ├── Activity Summary
│   │   ├── Quick Stats
│   │   └── Recent Activity
│   │
│   ├── 👤 Profile Settings (/account/profile)
│   │   ├── Personal Information
│   │   ├── Avatar & Display
│   │   ├── Username & Bio
│   │   └── Privacy Controls
│   │
│   ├── 🔐 Security (/account/security)
│   │   ├── Password Change
│   │   ├── Two-Factor Auth
│   │   ├── Session Management
│   │   └── Login History
│   │
│   ├── 💳 Billing & Subscriptions (/account/billing)
│   │   ├── Current Plan
│   │   ├── Usage Statistics
│   │   ├── Payment Methods
│   │   └── Billing History
│   │
│   └── 🗑️ Data Management (/account/data)
│       ├── Export My Data
│       ├── Delete Account
│       ├── Privacy Settings
│       └── Data Retention
│
├── 🧠 WELLBEING (/wellbeing) [Mental Health & Self-Moderation]
│   ├── 📔 Mood Journal (/wellbeing/journal)
│   │   ├── Daily Check-ins
│   │   ├── Mood Tracking
│   │   ├── Reflection Prompts
│   │   └── Mood Analytics
│   │
│   ├── 📊 Mental Health Dashboard (/wellbeing/dashboard)
│   │   ├── Wellbeing Overview
│   │   ├── Usage Patterns
│   │   ├── Alert Systems
│   │   └── Progress Tracking
│   │
│   ├── 🛡️ Self-Moderation (/wellbeing/moderation)
│   │   ├── Usage Limits
│   │   ├── Time Management
│   │   ├── Healthy Habits
│   │   └── Intervention Tools
│   │
│   ├── 📈 Analytics & Insights (/wellbeing/analytics)
│   │   ├── Mood Trends
│   │   ├── Usage Statistics
│   │   ├── Wellbeing Reports
│   │   └── Personal Insights
│   │
│   └── 🆘 Support Resources (/wellbeing/support)
│       ├── Mental Health Resources
│       ├── Crisis Support
│       ├── Community Guidelines
│       └── Professional Help
│
├── 📚 MEMORIES (/memories)
│   ├── 🏠 Memory Dashboard (/memories/dashboard)
│   │   ├── All Conversations
│   │   ├── Memory Overview
│   │   ├── Story Timeline
│   │   └── Quick Access
│   │
│   ├── 📖 Memory Library (/memories/library)
│   │   ├── By Conversation
│   │   ├── By Bot
│   │   ├── By Date
│   │   └── By Mood/Theme
│   │
│   ├── ✏️ Memory Editor (/memories/edit)
│   │   ├── Edit Individual Memories
│   │   ├── Bulk Edit Tools
│   │   ├── Memory Merging
│   │   └── Version Control
│   │
│   ├── 🔍 Search & Filter (/memories/search)
│   │   ├── Keyword Search
│   │   ├── Date Ranges
│   │   ├── Conversation Filters
│   │   └── Tag-based Search
│   │
│   └── 📤 Export & Sharing (/memories/export)
│       ├── Memory Export
│       ├── Story Compilation
│       ├── Sharing Controls
│       └── Backup Options
│
├── 📊 ANALYTICS (/analytics)
│   ├── 📈 Usage Analytics (/analytics/usage)
│   │   ├── Chat Statistics
│   │   ├── Bot Performance
│   │   ├── Knowledge Usage
│   │   └── Time Spent Analysis
│   │
│   ├── 🧠 Memory Insights (/analytics/memories)
│   │   ├── Story Progression
│   │   ├── Character Development
│   │   ├── Mood Patterns
│   │   └── Narrative Themes
│   │
│   ├── 🎯 Persona Effectiveness (/analytics/personas)
│   │   ├── Persona Usage Stats
│   │   ├── Response Quality
│   │   ├── User Satisfaction
│   │   └── Performance Metrics
│   │
│   └── 📊 Custom Reports (/analytics/reports)
│       ├── Generate Reports
│       ├── Scheduled Reports
│       ├── Export Options
│       └── Report Templates
│
└── ❓ HELP (/help)
    ├── 📖 Documentation (/help/docs)
    │   ├── Getting Started
    │   ├── Feature Guides
    │   ├── API Documentation
    │   └── Troubleshooting
    │
    ├── 🎓 Tutorials (/help/tutorials)
    │   ├── Video Tutorials
    │   ├── Step-by-Step Guides
    │   ├── Interactive Demos
    │   └── Best Practices
    │
    ├── 💬 Community (/help/community)
    │   ├── Forum
    │   ├── Discord Server
    │   ├── User Groups
    │   └── Feature Requests
    │
    └── 🆘 Support (/help/support)
        ├── Contact Support
        ├── Bug Reports
        ├── Feature Requests
        └── Status Updates
```

## 🎯 User Flow Diagrams

### 🔄 Primary User Journey Flow
```
🏠 HOME
   ↓
🔍 EXPLORE (Browse content)
   ↓
🎭 CREATE (Build bot/persona)
   ↓
💬 CHAT (Start conversation)
   ↓
📚 MEMORIES (Review & edit)
   ↓
👤 ACCOUNT (Manage settings)
   ↓
🧠 WELLBEING (Monitor health)
```

### 🎯 Feature Integration Flow
```
💬 CHAT Interface
   ↓
🧠 Memory Generation
   ↓
📚 MEMORIES Archive
   ↓
📚 LORE (Knowledge)
   ↓
🎭 PERSONAS (User identity)
   ↓
🧠 WELLBEING (Mental health)
```

## 🌟 Fantasy Theme Integration Points

### 🎨 Visual Theme Mapping
- **🏠 Home** → Magical portal entrance
- **🔍 Explore** → Wandering through enchanted forest
- **📚 Lore** → Ancient library with glowing books
- **🎭 Create** → Alchemy laboratory/workshop
- **💬 Chat** → Mystical conversation circle
- **👤 Account** → Personal sanctum/chambers
- **🧠 Wellbeing** → Healing springs/meditation garden
- **📚 Memories** → Chronicles archive/story vault
- **📊 Analytics** → Scrying crystal/scrolls
- **❓ Help** → Wise sage/council chambers

### 🗣️ Fantasy Naming Conventions
- **Knowledge Entries** → "Spell Scrolls" or "Enchanted Tomes"
- **Collections** → "Themed Lore Collections" or "Knowledge Chambers"
- **Personas** → "Masks of Identity" or "Aspect Avatars"
- **Memories** → "Story Fragments" or "Chronicle Shards"
- **Chat** → "Mystic Dialogue" or "Enchanted Discourse"
- **Mood Journal** → "Soul Mirror" or "Emotional Compass"

## 📱 Mobile Navigation Flow

### 📲 Mobile Menu Structure
```
📱 Hamburger Menu
├── 🏠 Home
├── 🔍 Explore
├── 📚 Lore
├── 🎭 Create
├── 💬 Recent Chats
├── 📚 Memories
├── 🧠 Wellbeing
├── 👤 Account
├── 📊 Analytics
└── ❓ Help
```

### 🎯 Quick Actions (Floating Button)
```
⚡ Quick Actions Menu
├── 💬 Start Chat
├── 🎭 Apply Persona
├── 📝 Add Memory
├── 🧠 Mood Check-in
└── 📚 Quick Lore
```

## 🔄 Cross-Feature Integration

### 📊 Data Flow Between Features
```
👤 User Account
   ↓
🎭 Persona Selection
   ↓
💬 Chat Interface
   ↓
🧠 Memory Generation
   ↓
📚 Lore Integration
   ↓
📊 Analytics Tracking
   ↓
🧠 Wellbeing Monitoring
```

### 🔗 Feature Dependencies
- **Chat** requires **Bot** (from Create)
- **Memories** generated from **Chat**
- **Lore** knowledge used in **Chat**
- **Personas** applied in **Chat**
- **Wellbeing** tracks **Chat** usage
- **Analytics** aggregates all features

## 🎨 Design System Integration

### 🎭 Component Hierarchy
```
🌟 Global Components
├── 🧭 Navigation (Header/Footer)
├── 🎨 Theme Provider
├── 🔧 UI Components
└── 📱 Mobile Components

🏗️ Page Components
├── 🏠 Landing Pages
├── 🛠️ Feature Dashboards
├── 💬 Interactive Interfaces
└── 📊 Data Visualization

🎨 Fantasy Elements
├── ✨ Magical Animations
├── 🌟 Glowing Effects
├── 🎭 Fantasy Icons
└── 📜 Scroll-like Layouts
```

This visual sitemap provides a clear blueprint for BotCafé's navigation structure while maintaining the magical, fantasy theme throughout the user experience.
