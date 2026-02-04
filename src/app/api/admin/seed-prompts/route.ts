import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { DEFAULT_PROMPTS, type PromptType } from '@/lib/chat/system-prompts'

export const dynamic = 'force-dynamic'

// Prompt definitions with metadata
const PROMPT_DEFINITIONS: Array<{
  name: string
  promptType: PromptType
  content: string
  description: string
  version: string
  priority: number
}> = [
  {
    name: 'Roleplay Introduction',
    promptType: 'roleplay_intro',
    content: DEFAULT_PROMPTS.roleplay_intro,
    description: 'Opening instruction that sets up the roleplay context. Use {{bot_name}} as placeholder.',
    version: '1.0',
    priority: 100,
  },
  {
    name: 'Knowledge Instructions',
    promptType: 'knowledge_instructions',
    content: DEFAULT_PROMPTS.knowledge_instructions,
    description: 'Instructions for how the bot should use knowledge, memories, lore, and persona information.',
    version: '1.0',
    priority: 100,
  },
  {
    name: 'Roleplay Guidelines',
    promptType: 'roleplay_guidelines',
    content: DEFAULT_PROMPTS.roleplay_guidelines,
    description: 'Guidelines for staying in character. Use {{bot_name}} as placeholder.',
    version: '1.0',
    priority: 100,
  },
  {
    name: 'Multi-Bot Instructions',
    promptType: 'multibot_instructions',
    content: DEFAULT_PROMPTS.multibot_instructions,
    description: 'Instructions for group conversations with multiple bots. Use {{bot_name}} and {{other_bots}} as placeholders.',
    version: '1.0',
    priority: 100,
  },
  {
    name: 'AI Disclaimer',
    promptType: 'ai_disclaimer',
    content: DEFAULT_PROMPTS.ai_disclaimer,
    description: 'Disclaimer shown after the bot greeting message.',
    version: '1.0',
    priority: 100,
  },
]

/**
 * GET /api/admin/seed-prompts
 * Preview what prompts would be seeded
 */
export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if user is admin
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0 || users.docs[0].role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Check existing prompts
    const existing = await payload.find({
      collection: 'system-prompts',
      limit: 100,
      overrideAccess: true,
    })

    const existingTypes = new Set(existing.docs.map(d => (d as { promptType: string }).promptType))

    return NextResponse.json({
      success: true,
      existing: existing.docs.length,
      wouldCreate: PROMPT_DEFINITIONS.filter(p => !existingTypes.has(p.promptType)).length,
      prompts: PROMPT_DEFINITIONS.map(p => ({
        name: p.name,
        promptType: p.promptType,
        exists: existingTypes.has(p.promptType),
        contentLength: p.content.length,
      })),
    })
  } catch (error: unknown) {
    console.error('Seed prompts preview error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to preview' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/seed-prompts
 * Seed default system prompts into database
 *
 * Body:
 * - force?: boolean (default: false) - If true, overwrites existing prompts
 */
export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Check if user is admin
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: clerkUser.emailAddresses[0]?.emailAddress } },
      overrideAccess: true,
    })

    if (users.docs.length === 0 || users.docs[0].role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as { force?: boolean }
    const force = body.force === true

    // Check existing prompts
    const existing = await payload.find({
      collection: 'system-prompts',
      limit: 100,
      overrideAccess: true,
    })

    const existingByType = new Map<string, number>()
    for (const doc of existing.docs) {
      const d = doc as { promptType: string; id: number }
      existingByType.set(d.promptType, d.id)
    }

    let created = 0
    let updated = 0
    let skipped = 0

    for (const prompt of PROMPT_DEFINITIONS) {
      const existingId = existingByType.get(prompt.promptType)

      if (existingId && !force) {
        skipped++
        continue
      }

      if (existingId && force) {
        // Update existing
        await payload.update({
          collection: 'system-prompts',
          id: existingId,
          data: {
            name: prompt.name,
            content: prompt.content,
            description: prompt.description,
            version: prompt.version,
            priority: prompt.priority,
            isActive: true,
          },
          overrideAccess: true,
        })
        updated++
      } else {
        // Create new
        await payload.create({
          collection: 'system-prompts',
          data: {
            name: prompt.name,
            promptType: prompt.promptType,
            content: prompt.content,
            description: prompt.description,
            version: prompt.version,
            priority: prompt.priority,
            isActive: true,
          },
          overrideAccess: true,
        })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      message: `Seeded system prompts: ${created} created, ${updated} updated, ${skipped} skipped`,
    })
  } catch (error: unknown) {
    console.error('Seed prompts error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to seed prompts' },
      { status: 500 }
    )
  }
}
