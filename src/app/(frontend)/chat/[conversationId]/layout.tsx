/**
 * Chat Conversation Layout
 *
 * This layout removes the footer for chat conversation pages
 * to allow the chat interface to take up the full viewport height.
 */

import React from 'react'

export default function ChatConversationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Hide the footer for chat conversations using CSS */}
      <style>{`
        footer { display: none !important; }
        main { flex: 1; display: flex; flex-direction: column; }
      `}</style>
      {children}
    </>
  )
}
