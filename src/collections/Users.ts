import type { CollectionConfig } from 'payload'
import { createEmailService } from '../services/email.service'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // Enable forgot password functionality
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        try {
          const emailService = createEmailService()
          const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`

          // Use the email service to generate HTML
          const html = emailService['generatePasswordResetEmailHtml']({
            resetUrl,
            userEmail: user.email,
            userName: user.email,
          })

          return html
        } catch (error) {
          console.error('Failed to generate forgot password HTML:', error)
          return '<p>Password reset requested. Please check your email for instructions.</p>'
        }
      },
      generateEmailSubject: () => {
        return 'Reset Your Password - BotCafe'
      },
    },
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        try {
          // Send welcome email to new users (when password is first set)
          if (doc._isNew) {
            const emailService = createEmailService()
            await emailService.sendWelcomeEmail(doc.email, doc.email)
          }
        } catch (error) {
          console.error('Failed to send welcome email:', error)
          // Don't throw error to avoid breaking user creation
        }
      },
    ],
  },
}
