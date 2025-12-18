import { Resend } from 'resend'

export interface EmailConfig {
  apiKey: string
  fromEmail: string
  fromName?: string
}

export interface PasswordResetEmailData {
  resetUrl: string
  userEmail: string
  userName?: string
}

export class EmailService {
  private resend: Resend
  private fromEmail: string
  private fromName: string

  constructor(config: EmailConfig) {
    this.resend = new Resend(config.apiKey)
    this.fromEmail = config.fromEmail
    this.fromName = config.fromName || 'BotCafe Admin'
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    try {
      const subject = 'Reset Your Password - BotCafe'
      const html = this.generatePasswordResetEmailHtml(data)
      const text = this.generatePasswordResetEmailText(data)

      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.userEmail,
        subject,
        html,
        text,
      })

      console.log(`Password reset email sent to ${data.userEmail}`)
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw new Error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Send welcome email for new users
   */
  async sendWelcomeEmail(userEmail: string, userName?: string): Promise<void> {
    try {
      const subject = 'Welcome to BotCafe!'
      const html = this.generateWelcomeEmailHtml(userEmail, userName)
      const text = this.generateWelcomeEmailText(userEmail, userName)

      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: userEmail,
        subject,
        html,
        text,
      })

      console.log(`Welcome email sent to ${userEmail}`)
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      throw new Error(
        `Failed to send welcome email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Generate HTML template for password reset email
   */
  private generatePasswordResetEmailHtml(data: PasswordResetEmailData): string {
    const userName = data.userName || 'User'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - BotCafe</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 BotCafe</div>
            <h2>Password Reset Request</h2>
        </div>
        
        <p>Hello ${userName},</p>
        
        <p>We received a request to reset your password for your BotCafe account. If you made this request, you can reset your password by clicking the button below:</p>
        
        <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <div class="warning">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </div>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4CAF50;">${data.resetUrl}</p>
        
        <p>Best regards,<br>The BotCafe Team</p>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 BotCafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate plain text version of password reset email
   */
  private generatePasswordResetEmailText(data: PasswordResetEmailData): string {
    const userName = data.userName || 'User'

    return `
Hello ${userName},

We received a request to reset your password for your BotCafe account.

Reset your password by visiting this link:
${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The BotCafe Team

---
This is an automated message. Please do not reply to this email.
© 2025 BotCafe. All rights reserved.
    `.trim()
  }

  /**
   * Generate HTML template for welcome email
   */
  private generateWelcomeEmailHtml(userEmail: string, userName?: string): string {
    const name = userName || 'User'

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to BotCafe!</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .feature-list {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🤖 BotCafe</div>
            <h2>Welcome to BotCafe!</h2>
        </div>
        
        <p>Hello ${name},</p>
        
        <p>Welcome to BotCafe! We're excited to have you join our platform where you can create and manage intelligent bots.</p>
        
        <div class="feature-list">
            <h3>What you can do with BotCafe:</h3>
            <ul>
                <li>🤖 Create and customize AI-powered bots</li>
                <li>💬 Manage conversations and interactions</li>
                <li>🧠 Train your bots with knowledge bases</li>
                <li>📊 Monitor bot performance and analytics</li>
                <li>🔧 Configure bot personalities and moods</li>
            </ul>
        </div>
        
        <p>Getting started is easy! Simply log in to your account and begin creating your first bot.</p>
        
        <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
        
        <p>Best regards,<br>The BotCafe Team</p>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 BotCafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate plain text version of welcome email
   */
  private generateWelcomeEmailText(userEmail: string, userName?: string): string {
    const name = userName || 'User'

    return `
Hello ${name},

Welcome to BotCafe! We're excited to have you join our platform where you can create and manage intelligent bots.

What you can do with BotCafe:
• Create and customize AI-powered bots
• Manage conversations and interactions  
• Train your bots with knowledge bases
• Monitor bot performance and analytics
• Configure bot personalities and moods

Getting started is easy! Simply log in to your account and begin creating your first bot.

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Best regards,
The BotCafe Team

---
This is an automated message. Please do not reply to this email.
© 2025 BotCafe. All rights reserved.
    `.trim()
  }
}

/**
 * Create email service instance with environment variables
 */
export function createEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FROM_EMAIL || 'noreply@botcafe.app'
  const fromName = process.env.FROM_NAME || 'BotCafe Admin'

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }

  return new EmailService({
    apiKey,
    fromEmail,
    fromName,
  })
}
