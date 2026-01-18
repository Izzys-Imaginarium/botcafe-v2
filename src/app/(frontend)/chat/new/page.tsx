/**
 * New Chat Page
 *
 * Server component wrapper to prevent static prerendering.
 */

import { NewChatClient } from './new-chat-client'

export const dynamic = 'force-dynamic'

export default function NewChatPage() {
  return <NewChatClient />
}
