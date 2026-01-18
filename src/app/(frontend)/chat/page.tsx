/**
 * Chat Home Page
 *
 * Server component wrapper to prevent static prerendering.
 */

import { ChatHomeClient } from './chat-home-client'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
  return <ChatHomeClient />
}
