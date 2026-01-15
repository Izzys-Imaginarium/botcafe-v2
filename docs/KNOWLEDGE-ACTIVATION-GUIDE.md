# Knowledge Activation Guide

**Last Updated**: 2026-01-14
**Version**: 1.0

This guide explains how to configure knowledge entries (lore) to activate during conversations with your bots.

---

## Overview

BotCafé's knowledge system lets you control **when** and **how** your lore appears in conversations. Instead of dumping all your worldbuilding into every message, the system intelligently activates relevant entries based on your configuration.

---

## Activation Modes

Every knowledge entry has an **activation mode** that determines how it gets triggered.

### Keyword Mode 🔑

Activates when specific words or phrases are found in recent messages.

**Best for:**
- Character names ("Elvara", "Lord Blackwood")
- Location names ("Darkwood Forest", "Crystal Caverns")
- Specific topics ("dragon", "ancient prophecy")

**Settings:**

| Setting | Description | Default |
|---------|-------------|---------|
| Primary Keys | Main trigger words (higher priority) | Empty |
| Secondary Keys | Supporting words (lower priority) | Empty |
| Logic | How keywords combine (see below) | AND_ANY |
| Case Sensitive | "Dragon" ≠ "dragon" | Off |
| Match Whole Words | "dragon" won't match in "dragonfly" | Off |
| Use Regex | Treat keywords as regex patterns | Off |
| Scan Depth | How many messages back to check | 2 |

**Keyword Logic Options:**

| Logic | Description | Example |
|-------|-------------|---------|
| **AND_ANY** | Any primary OR any secondary triggers | "Elvara" OR "queen" triggers |
| **AND_ALL** | ALL primary AND ALL secondary must match | "Elvara" AND "throne" AND "queen" all required |
| **NOT_ANY** | Activate when NONE match | Triggers when nobody mentions the keywords |
| **NOT_ALL** | Activate when not ALL match | Triggers unless every single keyword is present |

**Example Configuration:**
```
Entry: "Elvara's Royal Lineage"
Mode: Keyword
Primary Keys: Elvara, elf queen, her majesty
Secondary Keys: throne, kingdom, royal
Logic: AND_ANY
```
This activates whenever someone mentions "Elvara", "elf queen", or "her majesty".

---

### Vector Mode 🎯

Activates based on **semantic similarity** - the meaning of what's said, not exact words.

**Best for:**
- Contextual memories ("our previous adventure")
- Conceptual topics (activates for "ancient woods" even if entry is about "primeval forests")
- Fallback when users might phrase things differently

**Settings:**

| Setting | Description | Default |
|---------|-------------|---------|
| Similarity Threshold | 0.0-1.0 (higher = stricter matching) | 0.7 |
| Max Results | How many vector matches to return | 5 |

**Threshold Guide:**
- **0.5-0.6**: Very loose matching (may get false positives)
- **0.7**: Balanced (recommended starting point)
- **0.8-0.9**: Strict matching (only very similar content)
- **0.95+**: Near-exact semantic match

**Example Configuration:**
```
Entry: "The Ancient Dragon Wars"
Mode: Vector
Threshold: 0.75
Max Results: 3
```
This activates when the conversation is semantically similar to dragon warfare, ancient battles, etc.

---

### Hybrid Mode 🔀

Combines **keyword AND vector** - activates if EITHER method triggers.

**Best for:**
- Important lore that should catch both exact mentions AND related topics
- Locations (exact name OR descriptions of similar places)
- Characters with nicknames (exact name OR personality descriptions)

**Example Configuration:**
```
Entry: "Darkwood Forest Lore"
Mode: Hybrid
Primary Keys: Darkwood, dark forest, haunted woods
Threshold: 0.75
```
This activates for:
- Exact mentions: "Let's go to Darkwood"
- Semantic similarity: "that creepy ancient forest we passed"

---

### Constant Mode ⭐

**Always included** in every prompt, regardless of conversation content.

**Best for:**
- World rules ("Magic requires mana to cast")
- Universal facts ("The year is 1247 of the Third Age")
- Important character traits that should never be forgotten
- System instructions for the bot

**Example Configuration:**
```
Entry: "Magic System Rules"
Mode: Constant
Position: system_top
Order: 1000
Ignore Budget: true
```

---

### Disabled Mode ⏸️

Entry **never activates**. Useful for:
- Draft entries you're still writing
- Archived lore you want to keep but not use
- Temporarily hiding entries without deleting them

---

## Positioning System

Controls **where** activated entries appear in the prompt sent to the AI.

### Position Options

| Position | Where It Goes | Best For |
|----------|---------------|----------|
| **system_top** | Very beginning of system prompt | World rules, universal instructions |
| **before_character** | Before bot's personality | Background lore, setting info |
| **after_character** | After bot's personality | Character-specific knowledge |
| **before_examples** | Before example dialogues | Context for examples |
| **after_examples** | After example dialogues | Additional context |
| **at_depth** | At specific message depth | Dynamic insertion in conversation |
| **system_bottom** | End of system prompt | Reminders, final instructions |

### Position Diagram

```
┌─────────────────────────────────────┐
│  SYSTEM_TOP                         │  ← World rules, universal lore
├─────────────────────────────────────┤
│  BEFORE_CHARACTER                   │  ← Setting, background
├─────────────────────────────────────┤
│  [Bot's Personality & Description]  │
├─────────────────────────────────────┤
│  AFTER_CHARACTER                    │  ← Character-specific lore
├─────────────────────────────────────┤
│  BEFORE_EXAMPLES                    │
├─────────────────────────────────────┤
│  [Example Dialogues]                │
├─────────────────────────────────────┤
│  AFTER_EXAMPLES                     │
├─────────────────────────────────────┤
│  SYSTEM_BOTTOM                      │  ← Final reminders
└─────────────────────────────────────┘
```

### Order (Priority)

The **Order** field (0-1000) determines which entries appear first when multiple entries activate.

- **Higher number = Higher priority** (inserted first)
- Default is 100
- Entries with the same order are sorted by activation score

**Suggested Order Ranges:**
| Order | Use For |
|-------|---------|
| 900-1000 | Critical rules that must always be first |
| 500-800 | Important character/world lore |
| 100-400 | Standard lore entries |
| 1-99 | Low priority, nice-to-have context |

---

## Advanced Activation (Timed Effects)

Control activation behavior across multiple messages.

### Sticky

**Keeps the entry active** for N messages after it triggers.

**Use case:** Combat rules should stay active throughout a fight, not just when "attack" is first mentioned.

```
Entry: "Combat Mechanics"
Primary Keys: attack, fight, battle, combat
Sticky: 5
```
When someone says "attack", this entry stays active for the next 5 messages.

### Cooldown

**Prevents reactivation** for N messages after the entry deactivates.

**Use case:** Prevent repetitive lore from appearing too often.

```
Entry: "Town History"
Primary Keys: Millbrook, town history
Cooldown: 10
```
After this entry activates and deactivates, it won't trigger again for 10 messages.

### Delay

**Only activates after** message N in the conversation.

**Use case:** Don't reveal plot twists too early, or save tutorial info for later.

```
Entry: "The Secret Betrayal"
Primary Keys: Marcus, traitor
Delay: 20
```
This won't activate until at least 20 messages into the conversation.

---

## Filtering

Restrict which bots or personas can trigger an entry.

### Bot Filtering

| Setting | Description |
|---------|-------------|
| Filter by Bots | Enable bot-specific filtering |
| Allowed Bot IDs | Only these bots can trigger this entry |
| Excluded Bot IDs | These bots can never trigger this entry |

**Use case:** Character-specific lore that only applies to certain bots.

```
Entry: "Elvara's Secret Past"
Filter by Bots: On
Allowed Bots: [Elvara, Elvara's Sister]
```

### Persona Filtering

| Setting | Description |
|---------|-------------|
| Filter by Personas | Enable persona-specific filtering |
| Allowed Persona IDs | Only these personas can trigger |
| Excluded Persona IDs | These personas can never trigger |

**Use case:** Lore that only appears when you're using certain personas.

### Context Matching

| Setting | Description |
|---------|-------------|
| Match Bot Description | Also scan the bot's description for keywords |
| Match Bot Personality | Also scan personality traits for keywords |
| Match Persona Description | Also scan your persona's description |

---

## Budget Control

Manages how much context space your knowledge entries can use.

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Ignore Budget | Always include, even if budget is full | Off |
| Max Tokens | Maximum tokens this entry can use | 1000 |
| Token Cost | Auto-calculated from content length | (calculated) |

### How Budget Works

1. The system has a total **token budget** for knowledge (usually 20% of context)
2. Entries are added in priority order (by Order field, then activation score)
3. When budget is full, remaining entries are excluded
4. Entries with "Ignore Budget" on are always included

**Tip:** Use "Ignore Budget" sparingly for only the most critical lore (world rules, essential character info).

---

## Common Configuration Recipes

### Recipe 1: Character Backstory

```
Name: "Elvara's Origins"
Mode: Keyword
Primary Keys: Elvara, elf queen, Silverwood
Secondary Keys: past, history, origins, childhood
Logic: AND_ANY
Position: after_character
Order: 150
```

### Recipe 2: Always-On World Rules

```
Name: "Magic System"
Mode: Constant
Position: system_top
Order: 1000
Ignore Budget: true
```

### Recipe 3: Location with Semantic Fallback

```
Name: "Darkwood Forest"
Mode: Hybrid
Primary Keys: Darkwood, dark forest
Threshold: 0.7
Position: before_character
Order: 100
```

### Recipe 4: Combat System with Persistence

```
Name: "Combat Mechanics"
Mode: Keyword
Primary Keys: attack, fight, battle, combat, sword, spell
Logic: AND_ANY
Sticky: 5
Position: system_bottom
Order: 200
```

### Recipe 5: Plot Twist (Delayed Reveal)

```
Name: "The Betrayal"
Mode: Keyword
Primary Keys: Marcus, trusted advisor
Delay: 30
Position: after_character
Order: 300
```

### Recipe 6: Bot-Specific Memory

```
Name: "Previous Adventure with Elvara"
Mode: Vector
Threshold: 0.8
Filter by Bots: On
Allowed Bots: [Elvara]
Position: before_examples
Order: 80
```

### Recipe 7: Cooldown to Prevent Repetition

```
Name: "Town Welcome Speech"
Mode: Keyword
Primary Keys: Millbrook, arrive, enter town
Cooldown: 20
Position: after_character
Order: 100
```

---

## Best Practices

### Do's ✅

1. **Start with Vector mode** if unsure - it's the most flexible
2. **Use Hybrid for important lore** to catch both exact and semantic matches
3. **Set appropriate thresholds** - start at 0.7 and adjust based on results
4. **Use Order to prioritize** critical information over nice-to-have details
5. **Test your keywords** - check what actually triggers in conversations
6. **Use Sticky for ongoing contexts** like combat, romance scenes, investigations

### Don'ts ❌

1. **Don't set everything to Constant** - you'll bloat your prompts
2. **Don't use very low thresholds** (< 0.5) - too many false positives
3. **Don't forget Ignore Budget is powerful** - use sparingly
4. **Don't make keywords too generic** - "the", "is", "and" will match everything
5. **Don't stack too many entries at system_top** - keep it for essentials

---

## Troubleshooting

### Entry Not Activating

1. **Check activation mode** - is it Disabled?
2. **Check keywords** - are they spelled correctly?
3. **Check scan depth** - is it looking back far enough?
4. **Check filters** - is the current bot/persona allowed?
5. **Check delay** - has the conversation reached that message count?
6. **Check cooldown** - is it in cooldown from recent activation?

### Entry Activating Too Often

1. **Increase vector threshold** (e.g., 0.7 → 0.85)
2. **Use more specific keywords** (not generic words)
3. **Add cooldown** to limit frequency
4. **Switch from Hybrid to Keyword** for more control

### Too Many Entries Activating

1. **Increase Order** on important entries
2. **Lower Max Results** for vector mode
3. **Enable budget controls** to limit total tokens
4. **Use stricter keyword logic** (AND_ALL instead of AND_ANY)

### Entries Cut Off by Budget

1. **Increase Order** on the entry you want included
2. **Enable Ignore Budget** for critical entries
3. **Reduce content length** of less important entries
4. **Lower Max Tokens** on verbose entries

---

## Quick Reference Card

| Mode | Triggers On | Best For |
|------|-------------|----------|
| **Keyword** | Exact word matches | Names, places, specific topics |
| **Vector** | Semantic similarity | Concepts, memories, context |
| **Hybrid** | Keywords OR similarity | Important lore with fallbacks |
| **Constant** | Always | World rules, universal facts |
| **Disabled** | Never | Drafts, archived entries |

| Position | Location | Best For |
|----------|----------|----------|
| **system_top** | Beginning | World rules |
| **before_character** | Before bot personality | Setting info |
| **after_character** | After bot personality | Character lore |
| **system_bottom** | End | Reminders |

| Timed Effect | Does What |
|--------------|-----------|
| **Sticky** | Keeps active for N messages |
| **Cooldown** | Prevents reactivation for N messages |
| **Delay** | Only activates after message N |

---

**Need more help?** Check the [full technical documentation](./HYBRID-KNOWLEDGE-ACTIVATION.md) or ask in our support channels.
