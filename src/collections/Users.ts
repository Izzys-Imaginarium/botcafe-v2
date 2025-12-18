import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // Enable forgot password functionality
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`
        const userName = user.email

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
            <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <div class="warning">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </div>
        
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
        
        <p>Best regards,<br>The BotCafe Team</p>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2025 BotCafe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim()
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
      async ({ doc, req, operation }) => {
        // Send welcome email to new users
        if (operation === 'create' && req.payload.email) {
          try {
            await req.payload.sendEmail({
              to: doc.email,
              subject: 'Welcome to BotCafe!',
              html: generateWelcomeEmailHtml(doc.email),
            })
          } catch (error) {
            console.error('Failed to send welcome email:', error)
            // Don't throw error to avoid breaking user creation
          }
        }
      },
    ],
  },
}

function generateWelcomeEmailHtml(email: string): string {
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
        
        <p>Hello ${email},</p>
        
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
