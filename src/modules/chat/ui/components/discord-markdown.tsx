'use client'

/**
 * Discord-style Markdown Renderer
 *
 * Supports:
 * - **bold**
 * - *italic* or _italic_
 * - __underline__
 * - ~~strikethrough~~
 * - ||spoiler||
 * - `inline code`
 * - ```code blocks``` with syntax highlighting
 * - > blockquotes
 * - # Headers (h1-h3)
 * - [links](url)
 * - <action text> for roleplay actions (angle brackets)
 * - Proper handling of < and > characters
 */

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

interface DiscordMarkdownProps {
  content: string
  className?: string
}

// Token types for parsing
type TokenType =
  | 'text'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'spoiler'
  | 'code'
  | 'codeblock'
  | 'blockquote'
  | 'header'
  | 'link'
  | 'newline'
  | 'action' // For <action text> roleplay format

interface Token {
  type: TokenType
  content: string
  language?: string // For code blocks
  level?: number // For headers (1-3)
  url?: string // For links
  children?: Token[]
}

// Spoiler component with reveal on click
function Spoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={cn(
        'rounded px-1 cursor-pointer transition-all duration-200',
        revealed
          ? 'bg-muted/30 text-foreground'
          : 'bg-muted text-transparent hover:bg-muted/80 select-none'
      )}
      title={revealed ? 'Click to hide' : 'Click to reveal spoiler'}
    >
      {children}
    </span>
  )
}

// Code block with optional syntax highlighting
function CodeBlock({ content, language }: { content: string; language?: string }) {
  return (
    <pre className="my-2 p-3 bg-[#2b2d31] rounded-md overflow-x-auto border border-border/30">
      {language && (
        <div className="text-xs text-muted-foreground mb-2 pb-2 border-b border-border/30">
          {language}
        </div>
      )}
      <code className="text-sm font-mono text-[#dcddde]">{content}</code>
    </pre>
  )
}

// Parse Discord markdown into tokens
function parseMarkdown(text: string): Token[] {
  const tokens: Token[] = []
  let remaining = text

  while (remaining.length > 0) {
    // Code blocks (```language\ncode```)
    const codeBlockMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      tokens.push({
        type: 'codeblock',
        content: codeBlockMatch[2],
        language: codeBlockMatch[1] || undefined,
      })
      remaining = remaining.slice(codeBlockMatch[0].length)
      continue
    }

    // Blockquotes (> text or >>> multiline)
    const multiBlockquoteMatch = remaining.match(/^>>> ([\s\S]+?)(?=\n\n|$)/)
    if (multiBlockquoteMatch) {
      tokens.push({
        type: 'blockquote',
        content: multiBlockquoteMatch[1],
        children: parseMarkdown(multiBlockquoteMatch[1]),
      })
      remaining = remaining.slice(multiBlockquoteMatch[0].length)
      continue
    }

    const blockquoteMatch = remaining.match(/^> (.+?)(?=\n|$)/)
    if (blockquoteMatch) {
      tokens.push({
        type: 'blockquote',
        content: blockquoteMatch[1],
        children: parseMarkdown(blockquoteMatch[1]),
      })
      remaining = remaining.slice(blockquoteMatch[0].length)
      continue
    }

    // Headers (# ## ###)
    const headerMatch = remaining.match(/^(#{1,3}) (.+?)(?=\n|$)/)
    if (headerMatch) {
      tokens.push({
        type: 'header',
        content: headerMatch[2],
        level: headerMatch[1].length,
        children: parseMarkdown(headerMatch[2]),
      })
      remaining = remaining.slice(headerMatch[0].length)
      continue
    }

    // Inline code (`code`)
    const inlineCodeMatch = remaining.match(/^`([^`\n]+)`/)
    if (inlineCodeMatch) {
      tokens.push({
        type: 'code',
        content: inlineCodeMatch[1],
      })
      remaining = remaining.slice(inlineCodeMatch[0].length)
      continue
    }

    // Spoiler (||text||)
    const spoilerMatch = remaining.match(/^\|\|(.+?)\|\|/)
    if (spoilerMatch) {
      tokens.push({
        type: 'spoiler',
        content: spoilerMatch[1],
        children: parseMarkdown(spoilerMatch[1]),
      })
      remaining = remaining.slice(spoilerMatch[0].length)
      continue
    }

    // Strikethrough (~~text~~)
    const strikeMatch = remaining.match(/^~~(.+?)~~/)
    if (strikeMatch) {
      tokens.push({
        type: 'strikethrough',
        content: strikeMatch[1],
        children: parseMarkdown(strikeMatch[1]),
      })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // Underline (__text__)
    const underlineMatch = remaining.match(/^__(.+?)__/)
    if (underlineMatch) {
      tokens.push({
        type: 'underline',
        content: underlineMatch[1],
        children: parseMarkdown(underlineMatch[1]),
      })
      remaining = remaining.slice(underlineMatch[0].length)
      continue
    }

    // Bold (**text**)
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      tokens.push({
        type: 'bold',
        content: boldMatch[1],
        children: parseMarkdown(boldMatch[1]),
      })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic (*text* or _text_)
    const italicMatch = remaining.match(/^\*([^*\n]+)\*/) || remaining.match(/^_([^_\n]+)_/)
    if (italicMatch) {
      tokens.push({
        type: 'italic',
        content: italicMatch[1],
        children: parseMarkdown(italicMatch[1]),
      })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Links [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      tokens.push({
        type: 'link',
        content: linkMatch[1],
        url: linkMatch[2],
      })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Action text <action> - common in roleplay for actions/narration
    // Match <text> but not things that look like HTML tags (no spaces after <)
    // or self-closing patterns. We want to match roleplay actions like <walks over>
    const actionMatch = remaining.match(/^<([^<>]+)>/)
    if (actionMatch) {
      // Check it's not likely an HTML tag (doesn't start with a letter followed by attributes)
      const innerContent = actionMatch[1]
      const looksLikeHtmlTag = /^[a-z]+(\s|\/|$)/i.test(innerContent) &&
        /^(div|span|p|a|br|hr|img|input|button|form|table|tr|td|th|ul|ol|li|h[1-6]|script|style|link|meta)(\s|\/|$)/i.test(innerContent)

      if (!looksLikeHtmlTag) {
        tokens.push({
          type: 'action',
          content: innerContent,
        })
        remaining = remaining.slice(actionMatch[0].length)
        continue
      }
    }

    // Newlines
    if (remaining.startsWith('\n')) {
      tokens.push({ type: 'newline', content: '\n' })
      remaining = remaining.slice(1)
      continue
    }

    // Plain text - consume until next potential markdown, newline, or angle bracket
    const nextSpecial = remaining.search(/[*_~`|>\[\n#<]/)
    if (nextSpecial === -1) {
      tokens.push({ type: 'text', content: remaining })
      break
    } else if (nextSpecial === 0) {
      // The special char isn't actually starting a pattern, treat as text
      tokens.push({ type: 'text', content: remaining[0] })
      remaining = remaining.slice(1)
    } else {
      tokens.push({ type: 'text', content: remaining.slice(0, nextSpecial) })
      remaining = remaining.slice(nextSpecial)
    }
  }

  return tokens
}

// Render tokens to React elements
function renderTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${token.type}-${index}`

    switch (token.type) {
      case 'text':
        return <span key={key}>{token.content}</span>

      case 'newline':
        return <br key={key} />

      case 'bold':
        return (
          <strong key={key} className="font-bold">
            {token.children ? renderTokens(token.children) : token.content}
          </strong>
        )

      case 'italic':
        return (
          <em key={key} className="italic">
            {token.children ? renderTokens(token.children) : token.content}
          </em>
        )

      case 'underline':
        return (
          <span key={key} className="underline">
            {token.children ? renderTokens(token.children) : token.content}
          </span>
        )

      case 'strikethrough':
        return (
          <span key={key} className="line-through">
            {token.children ? renderTokens(token.children) : token.content}
          </span>
        )

      case 'spoiler':
        return (
          <Spoiler key={key}>
            {token.children ? renderTokens(token.children) : token.content}
          </Spoiler>
        )

      case 'code':
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 mx-0.5 bg-[#2b2d31] rounded text-sm font-mono text-[#dcddde]"
          >
            {token.content}
          </code>
        )

      case 'codeblock':
        return <CodeBlock key={key} content={token.content} language={token.language} />

      case 'blockquote':
        return (
          <div
            key={key}
            className="pl-3 border-l-4 border-muted-foreground/30 my-1 text-foreground/80"
          >
            {token.children ? renderTokens(token.children) : token.content}
          </div>
        )

      case 'header':
        const headerClasses = {
          1: 'text-xl font-bold mt-4 mb-2',
          2: 'text-lg font-bold mt-3 mb-1.5',
          3: 'text-base font-semibold mt-2 mb-1',
        }
        const headerClass = headerClasses[token.level as 1 | 2 | 3] || ''
        const headerContent = token.children ? renderTokens(token.children) : token.content
        // Use explicit elements instead of dynamic tag
        if (token.level === 1) {
          return <h1 key={key} className={headerClass}>{headerContent}</h1>
        } else if (token.level === 2) {
          return <h2 key={key} className={headerClass}>{headerContent}</h2>
        } else {
          return <h3 key={key} className={headerClass}>{headerContent}</h3>
        }

      case 'link':
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline"
          >
            {token.content}
          </a>
        )

      case 'action':
        // Roleplay action text in angle brackets - render with distinct styling
        return (
          <span key={key} className="text-muted-foreground italic">
            &lt;{token.content}&gt;
          </span>
        )

      default:
        return <span key={key}>{token.content}</span>
    }
  })
}

export function DiscordMarkdown({ content, className }: DiscordMarkdownProps) {
  const rendered = useMemo(() => {
    const tokens = parseMarkdown(content)
    return renderTokens(tokens)
  }, [content])

  return <div className={cn('discord-markdown', className)}>{rendered}</div>
}
