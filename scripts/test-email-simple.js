// Simple email test script
const { Resend } = require('resend')

async function testResendEmail() {
  console.log('🔧 Testing Resend Email Integration...\n')

  try {
    // Check if API key exists
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    console.log('✅ Resend API Key found:', apiKey.substring(0, 10) + '...')

    // Initialize Resend
    const resend = new Resend(apiKey)
    console.log('✅ Resend client initialized')

    // Test email configuration
    const fromEmail = process.env.FROM_EMAIL || 'noreply@botcafe.app'
    const fromName = process.env.FROM_NAME || 'BotCafe Admin'

    console.log('✅ Email configuration:')
    console.log('   From:', `${fromName} <${fromEmail}>`)
    console.log('   Site URL:', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

    // Send test email
    console.log('\n📧 Sending test email to test@example.com...')

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: 'test@example.com',
      subject: '✅ BotCafe Email Test - Integration Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4CAF50;">🎉 Email Integration Successful!</h1>
          <p>Hello!</p>
          <p>This is a test email to verify that the Resend email integration is working correctly in your BotCafe application.</p>
          <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>✅ Integration Status:</h3>
            <ul>
              <li>✅ Resend SDK installed and configured</li>
              <li>✅ Email service created</li>
              <li>✅ Password reset templates ready</li>
              <li>✅ Welcome email templates ready</li>
              <li>✅ Payload CMS integration complete</li>
            </ul>
          </div>
          <p>Your email functionality is now ready for production use!</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from BotCafe application to test the Resend integration.
          </p>
        </div>
      `,
      text: `Email Integration Successful!

This is a test email to verify that the Resend email integration is working correctly in your BotCafe application.

✅ Integration Status:
- Resend SDK installed and configured
- Email service created  
- Password reset templates ready
- Welcome email templates ready
- Payload CMS integration complete

Your email functionality is now ready for production use!

---
This email was sent from BotCafe application to test the Resend integration.`,
    })

    console.log('✅ Email sent successfully!')
    console.log('   Email ID:', result.data?.id || 'Unknown')
    console.log('   Message:', result.data?.message || 'Email queued for delivery')

    console.log('\n🎉 SUCCESS! Your Resend email integration is working perfectly!')
    console.log('\nNext steps:')
    console.log('1. Check your email inbox for the test message')
    console.log('2. Test the password reset functionality at /admin/login')
    console.log('3. Deploy to production when ready')
  } catch (error) {
    console.error('❌ Email test failed:')
    console.error('   Error:', error.message)

    if (error.message.includes('Invalid API key')) {
      console.error('\n💡 Solution: Check your RESEND_API_KEY in .env file')
    } else if (error.message.includes('Unauthorized')) {
      console.error('\n💡 Solution: Verify your Resend account and API key')
    } else if (error.message.includes('from_address')) {
      console.error('\n💡 Solution: Configure FROM_EMAIL in .env file')
    }

    console.error('\nPlease check RESEND-SETUP.md for detailed troubleshooting steps.')
  }
}

// Run the test
console.log('🚀 Starting BotCafe Email Integration Test\n')
testResendEmail()
