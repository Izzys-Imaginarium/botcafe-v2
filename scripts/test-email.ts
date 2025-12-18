// Test script to verify Resend email integration
import { createEmailService } from '../src/services/email.service'

async function testEmailService() {
  console.log('Testing Email Service...')

  try {
    // Test email service initialization
    const emailService = createEmailService()
    console.log('✅ Email service initialized successfully')

    // Test password reset email
    console.log('\nTesting password reset email...')
    await emailService.sendPasswordResetEmail({
      resetUrl: 'http://localhost:3000/reset-password?token=test123',
      userEmail: 'test@example.com',
      userName: 'Test User',
    })
    console.log('✅ Password reset email sent successfully')

    // Test welcome email
    console.log('\nTesting welcome email...')
    await emailService.sendWelcomeEmail('test@example.com', 'Test User')
    console.log('✅ Welcome email sent successfully')

    console.log('\n🎉 All email tests passed!')
  } catch (error) {
    console.error('❌ Email test failed:', error)
    console.log('\nMake sure you have:')
    console.log('1. Set up your .env file with RESEND_API_KEY')
    console.log('2. Verified your domain with Resend')
    console.log('3. Configured FROM_EMAIL and FROM_NAME')
  }
}

// Run the test
testEmailService()
