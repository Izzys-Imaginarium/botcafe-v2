'use client'

import React, { useEffect, useState } from 'react'

export function HtmlWrapper({ children }: { children: React.ReactNode }) {
  const [htmlClassName, setHtmlClassName] = useState<string>('')

  useEffect(() => {
    // Get the current HTML element's className, including any browser extension additions
    const currentClassName = document.documentElement.className || ''
    setHtmlClassName(currentClassName)
  }, [])

  // Update className when it changes (e.g., from browser extensions)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const newClassName = document.documentElement.className || ''
          setHtmlClassName(newClassName)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <html lang="en" className={htmlClassName}>
      <body className="font-body antialiased">
        <main>{children}</main>
      </body>
    </html>
  )
}
