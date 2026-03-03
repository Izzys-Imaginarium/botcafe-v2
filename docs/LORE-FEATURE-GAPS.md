# Lore Feature Gaps — BotCafe v2 vs SillyTavern

Comparison performed February 2026. This document catalogs features present in SillyTavern's World Info / Lorebook system that BotCafe v2 does not yet support, along with implementation notes.

---

## 1. Recursive Scanning

**What it is:** When a lore entry activates and its content contains keywords that match *other* entries, those entries activate too — chaining until no new entries trigger or a max depth is reached. SillyTavern also provides three per-entry flags:
- **Non-recursable** — entry can only be triggered by actual chat messages, not by other entries' content
- **Prevent further recursion** — this entry's content won't trigger other entries
- **Delay until recursion** — entry is skipped in the initial scan and only activates during recursive passes

**Why it matters:** Enables interconnected world-building. A user mentions "Gondor," which activates Gondor's entry, whose content mentions "Minas Tirith," which activates that entry automatically. Without this, users must manually keyword every relationship.

**Complexity: HIGH**

- The `ActivationEngine` currently runs a single pass: fetch entries, match keywords/vectors, apply budget, done. Recursion requires a loop that re-scans activated content against remaining entries.
- The keyword matcher and vector retriever are already modular, so the scan-per-pass logic can wrap the existing code.
- Three new boolean fields needed on the Knowledge schema: `exclude_recursion`, `prevent_recursion`, `delay_until_recursion`.
- A global/per-collection `max_recursion_steps` setting is needed to prevent infinite loops.
- Budget management becomes more complex — must track cumulative token usage across passes.

**Risks:**
- **Infinite loops.** If entry A triggers entry B triggers entry A, the engine loops forever without a depth cap. A hard max (e.g., 10) and cycle detection are mandatory.
- **Performance.** Each recursion pass is another round of keyword matching (and potentially vector queries). Deep chains could add noticeable latency to chat responses.
- **Token budget blowout.** Recursive activation can pull in far more content than expected. The budget manager must enforce limits strictly across all passes.
- **Debugging difficulty.** When lore activates unexpectedly, recursive chains make it hard for users to understand why. The existing activation logging helps, but should be extended to show the recursion chain.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new schema fields
- `src/lib/knowledge-activation/activation-engine.ts` — recursion loop
- `src/lib/knowledge-activation/keyword-matcher.ts` — support scanning entry content
- `src/lib/knowledge-activation/budget-manager.ts` — cross-pass budget tracking
- UI: activation settings accordion — new toggles

---

## 2. Inclusion Groups

**What it is:** Entries can be assigned to a named group. When multiple entries in the same group activate, only one is selected. SillyTavern offers three selection strategies:
- **Random weighted** — each entry has a `groupWeight` (default 100), selection is probabilistic
- **Prioritize by order** — deterministic, highest insertion order wins
- **Group scoring** — entries with more matched keywords get priority

**Why it matters:** Enables randomized variation. A "weather" group with entries for rain, sun, fog, and storm means only one weather condition is active per message, adding replayability. Also useful for mutually exclusive character states, alternate descriptions, or event variations.

**Complexity: MEDIUM**

- Three new fields on Knowledge schema: `inclusion_group` (string), `group_weight` (number), `group_scoring` (boolean).
- Selection logic goes into the activation engine after entries are matched but before budget allocation — filter each group down to one winner.
- The `order` field already exists and can serve the prioritize-by-order strategy.

**Risks:**
- **Interaction with recursion.** If recursion is also implemented, group selection needs to happen per-pass or entries may be incorrectly excluded before they could participate in a later recursion pass.
- **User confusion.** Group behavior is invisible unless surfaced well in the UI. Needs clear labeling and possibly a preview of which entries share a group.
- **Determinism expectations.** Random selection means different activations per message. Some users may expect consistency. The group override (prioritize by order) flag addresses this but must be clearly documented.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new schema fields
- `src/lib/knowledge-activation/activation-engine.ts` — group filtering step
- UI: activation settings accordion — group name input, weight slider, scoring toggle

---

## 3. Outlet / Manual Placement System

**What it is:** Entries can target a named "outlet" instead of a fixed position. The outlet content is placed wherever the user puts a `{{outlet::OutletName}}` macro in their prompt template or advanced formatting settings. This gives power users exact control over where lore appears.

**Why it matters:** The seven fixed positions cover most cases, but advanced users building complex system prompts want to place lore at exact locations — e.g., between two custom instruction blocks, or inside a specific XML tag structure.

**Complexity: MEDIUM-HIGH**

- New position option: `outlet` with an associated `outlet_name` string field.
- The prompt builder must collect outlet-targeted entries by name and expose them as a map.
- The system prompt template (or a user-configurable template system) must support `{{outlet::Name}}` macro resolution.
- Requires a template/macro system for system prompts that doesn't currently exist.

**Risks:**
- **Template system dependency.** This feature only makes sense if users can customize the system prompt template. If the system prompt is hardcoded, outlets have nowhere to be placed. May need to build or extend a prompt template editor first.
- **Empty outlets.** If a macro references a nonexistent outlet, it must resolve to an empty string silently — not break the prompt.
- **User complexity.** This is a power-user feature that could confuse casual users. Should be hidden behind an "advanced" toggle.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new position enum value + outlet_name field
- `src/lib/knowledge-activation/prompt-builder.ts` — outlet collection logic
- `src/lib/chat/context-builder.ts` — macro resolution in system prompt
- New: system prompt template system (if not yet present)
- UI: positioning selector — outlet option with name input

---

## 4. Generation Type Filtering

**What it is:** Entries can be configured to only activate for specific generation types: Normal, Continue, Impersonate, Swipe, Regenerate, or Quiet. This prevents lore from re-triggering on swipes or regenerations when context hasn't actually changed.

**Why it matters:** Token efficiency. Without this, swiping through responses or regenerating re-activates all the same lore entries, wasting budget. Also useful for lore that should only appear on the first generation of a response, or that should be suppressed during impersonation.

**Complexity: LOW**

- New field on Knowledge schema: `active_generation_types` (array of enum values).
- The activation engine needs to know the current generation type (passed from the chat handler) and filter entries accordingly.
- The chat/generation handler must pass a `generationType` flag to the activation engine.

**Risks:**
- **Generation type detection.** The chat system must reliably distinguish between normal sends, continues, swipes, and regenerations. If BotCafe doesn't currently differentiate these at the API level, that plumbing needs to be added first.
- **Low risk otherwise.** This is a simple filter step with no complex interactions.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new enum + array field
- `src/lib/knowledge-activation/activation-engine.ts` — filter by generation type
- Chat API route — pass generation type to activation engine
- UI: activation settings accordion — generation type checkboxes

---

## 5. Author's Note Integration

**What it is:** SillyTavern has a dedicated "Author's Note" — a short instruction injected at a specific depth in the conversation. Lore entries can target "Top of Author's Note" or "Bottom of Author's Note" positions, effectively extending the Author's Note dynamically based on context.

**Why it matters:** Author's Notes are a popular way to steer AI behavior mid-conversation. Allowing lore to augment the Author's Note means the AI's steering instructions adapt automatically based on what's happening in the story.

**Complexity: LOW-MEDIUM**

- Depends on whether BotCafe has an Author's Note / Jailbreak / System Note concept. If not, the feature itself needs to be built first.
- If there is an equivalent, adding two new position enum values (`author_note_top`, `author_note_bottom`) and having the prompt builder insert there is straightforward.

**Risks:**
- **Prerequisite feature.** If there's no Author's Note system, this becomes a two-part feature: build the Author's Note, then build lore integration with it.
- **Position stacking.** Multiple entries targeting Author's Note top/bottom could make the note very large, diluting its effectiveness. May need per-position token limits.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new position enum values
- `src/lib/knowledge-activation/prompt-builder.ts` — Author's Note insertion
- `src/lib/chat/context-builder.ts` — Author's Note handling
- UI: positioning selector — new options

---

## 6. Macro Support in Lore Content

**What it is:** SillyTavern supports template macros inside lore entry content: `{{char}}` (character name), `{{user}}` (user name), `{{getvar::varname}}` (script variables), etc. These resolve at activation time, so a single entry can work across multiple characters.

**Why it matters:** Without macros, a lore entry that says "{{char}} is the queen of this realm" must be duplicated for each character. With macros, one entry works for any character, making global lorebooks much more reusable.

**Complexity: LOW**

- Add a macro resolution step in the prompt builder after entries are selected but before they're injected.
- Core macros needed: `{{char}}` (bot name), `{{user}}` (user display name or persona name).
- More advanced macros (variables, conditionals) can come later.

**Risks:**
- **Injection.** If user-provided content contains macro-like patterns unintentionally, they could resolve unexpectedly. Use a distinct delimiter or escape mechanism.
- **Performance.** String replacement across all activated entries is cheap. No real performance concern.
- **Scope creep.** SillyTavern has dozens of macros. Start with `{{char}}` and `{{user}}` only, expand based on demand.

**Files likely affected:**
- `src/lib/knowledge-activation/prompt-builder.ts` — macro resolution step
- New utility: `src/lib/knowledge-activation/macro-resolver.ts`

---

## 7. Additional Scan Sources (Scenario, Creator's Notes, Character's Note)

**What it is:** SillyTavern allows per-entry toggles to also scan against Scenario text, Creator's Notes, and Character's Note (depth prompt) when checking keywords. BotCafe already supports matching against bot description, bot personality, and persona description, but is missing these three.

**Why it matters:** Broadens the surface area for keyword activation without requiring the keywords to appear in the actual chat messages.

**Complexity: LOW**

- BotCafe would need equivalent concepts (scenario, creator notes) or map to existing fields.
- Add new boolean flags to the Knowledge schema and pass the additional text to the keyword matcher.

**Risks:**
- **Concept mapping.** BotCafe may not have direct equivalents for "scenario" or "creator's notes." These fields may need to be added to the Bot schema first, or this item can be deferred until those concepts exist.
- **Minimal technical risk.** This is additive — just more text fed into existing matchers.

**Files likely affected:**
- `src/collections/Knowledge.ts` — new boolean fields
- `src/lib/knowledge-activation/keyword-matcher.ts` — additional scan text sources
- UI: activation settings — new match toggles

---

## 8. Lore Export to SillyTavern Format

**What it is:** BotCafe can import SillyTavern World Books, but cannot export lore back to that format. SillyTavern users who try BotCafe have no way to take their lore back.

**Why it matters:** Two-way compatibility builds trust and lowers adoption friction. Users won't invest in BotCafe's lore system if they fear vendor lock-in.

**Complexity: LOW-MEDIUM**

- Build a JSON serializer that maps Knowledge entries back to the SillyTavern World Book format.
- The import endpoint already has the field mapping — reverse it.
- Serve as a downloadable JSON file from an API endpoint.

**Risks:**
- **Lossy conversion.** BotCafe has features ST doesn't (vector thresholds, multi-content types, sharing metadata). These fields will be lost on export. Should warn the user.
- **Format drift.** SillyTavern's format evolves. The export should target the latest known spec and be versioned.

**Files likely affected:**
- New: `src/app/(app)/api/knowledge-collections/[id]/export-worldbook/route.ts`
- UI: Tome view — export button

---

## 9. Character Card Lore Embedding on Export

**What it is:** When SillyTavern exports a character card (PNG or JSON), the primary lorebook is embedded inside it per the Character Card V2/V3 spec (`character_book` field). BotCafe's SillyTavern export doesn't currently include linked lore.

**Why it matters:** Character cards shared without their lore lose essential context. Embedding lore in the card makes characters self-contained and portable.

**Complexity: MEDIUM**

- The character card export endpoint must query the bot's linked knowledge collections, serialize entries to the Character Book format, and embed them in the card JSON.
- Needs field mapping from Knowledge schema to `CharacterBookEntry`.

**Risks:**
- **Token budget / size.** A bot with hundreds of lore entries produces a very large character card. May need to cap or let users select which collection to embed.
- **V2 vs V3 spec.** Must decide which spec version to target. V2 is more widely supported; V3 is newer. Consider supporting both.

**Files likely affected:**
- Existing SillyTavern export endpoint — extend with `character_book` field
- Reuse mapping logic from the World Book import (reversed)

---

## 10. Slash Commands / Scripting Interface for Lore

**What it is:** SillyTavern exposes commands like `/world name`, `/wi-scan`, `/wi-list-entries` that can be used in STscript automation. This allows advanced users to programmatically control lore activation.

**Why it matters:** Power users and bot creators want to script lore behavior — toggling books on/off mid-conversation, forcing scans, listing active entries for debugging.

**Complexity: MEDIUM**

- Requires a command/scripting interface in the chat system.
- Commands would call existing API endpoints internally.
- Depends on whether BotCafe has or plans a chat command system.

**Risks:**
- **Prerequisite.** Needs a chat command parsing system. If one doesn't exist, this is a larger feature.
- **Security.** Commands that modify lore state must respect ownership and permissions.

**Files likely affected:**
- Chat message handler — command parsing
- New: command handlers for lore operations
- Existing API endpoints — reused internally

---

## Priority Summary

| # | Feature | Complexity | User Impact | Recommended Priority |
|---|---------|-----------|-------------|---------------------|
| 1 | Recursive Scanning | HIGH | HIGH | P1 — Core feature gap |
| 2 | Inclusion Groups | MEDIUM | MEDIUM | P1 — Enables variation/replayability |
| 3 | Outlet / Manual Placement | MEDIUM-HIGH | LOW-MEDIUM | P3 — Power-user feature |
| 4 | Generation Type Filtering | LOW | MEDIUM | P2 — Token efficiency |
| 5 | Author's Note Integration | LOW-MEDIUM | MEDIUM | P2 — Popular feature |
| 6 | Macro Support in Content | LOW | HIGH | P1 — High value, low effort |
| 7 | Additional Scan Sources | LOW | LOW | P3 — Incremental improvement |
| 8 | Lore Export to ST Format | LOW-MEDIUM | MEDIUM | P2 — Adoption/trust |
| 9 | Character Card Lore Embedding | MEDIUM | MEDIUM | P2 — Portability |
| 10 | Slash Commands / Scripting | MEDIUM | LOW | P3 — Power-user feature |

**Suggested implementation order (effort vs. impact):**
1. Macro Support in Content (low effort, high impact)
2. Inclusion Groups (medium effort, unlocks variation)
3. Recursive Scanning (high effort, flagship feature)
4. Generation Type Filtering (low effort, practical)
5. Lore Export + Character Card Embedding (together, completes interop story)
6. Author's Note Integration
7. Additional Scan Sources
8. Outlet System
9. Slash Commands
