# Resend Email Integration Setup Guide

## Overview
This guide will help you set up and test the Resend email integration for password reset functionality in your BotCafe application.

## Prerequisites
1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: Verify your domain with Resend for better deliverability
3. **API Key**: Get your Resend API key from the dashboard

## Setup Steps

### 1. Configure Environment Variables

#### For Local Development (.env):
```bash
# Add to your .env file
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=BotCafe Admin
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### For Cloudflare Workers (Production):
Set environment variables in your Cloudflare dashboard:
- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: Your verified sender email
- `FROM_NAME`: BotCafe Admin (or your preferred name)
- `NEXT_PUBLIC_SITE_URL`: Your production domain

### 2. Domain Setup with Resend

1. **Add Domain**: In Resend dashboard, go to "Domains" and add your domain
2. **Verify DNS**: Add the required DNS records to your domain:
   ```
   Type: TXT
   Name: _resend
   Value: [Check Resend dashboard for exact value]
   
   Type: DKIM
   Name: [Check Resend dashboard for exact selector]
   Value: [Check Resend dashboard for exact value]
   ```
3. **SPF Record**: Add to your domain's SPF record:
   ```
   include:_spf.resend.com
   ```

### 3. Test Email Functionality

#### Local Testing:
```bash
# Start the development server
npm run dev

# Test in browser:
# 1. Go to /admin/login
# 2. Click "Forgot Password"
# 3. Enter your email
# 4. Check your email for the reset link
```

#### Production Testing:
```bash
# Deploy to production
npm run deploy

# Test password reset functionality
# 1. Go to https://yourdomain.com/admin/login
# 2. Test forgot password feature
```

## Testing Checklist

### ✅ Environment Setup
- [ ] Resend API key configured
- [ ] Sender email verified
- [ ] Domain configured (if using custom domain)
- [ ] Environment variables set

### ✅ Email Templates
- [ ] Password reset emails send successfully
- [ ] Welcome emails send to new users
- [ ] HTML templates render correctly
- [ ] Plain text versions work as fallback

### ✅ Functionality
- [ ] Password reset link expires correctly (1 hour)
- [ ] Emails arrive in inbox (not spam)
- [ ] Reset links work properly
- [ ] Error handling works for invalid emails

### ✅ Production Deployment
- [ ] Variables configured in Cloudflare
- [ ] Application deploys successfully
- [ ] Email functionality works in production
- [ ] Domain verification completed

## Troubleshooting

### Common Issues:

1. **"RESEND_API_KEY environment variable is required"**
   - Check that the API key is properly set
   - Verify no extra spaces or quotes

2. **Emails going to spam**
   - Ensure domain is verified with Resend
   - Check SPF/DKIM records are correct
   - Use a reputable sender email address

3. **CORS errors**
   - Ensure NEXT_PUBLIC_SITE_URL is correctly set
   - Check that the domain matches your Resend domain

4. **Template rendering issues**
   - Check browser console for errors
   - Verify email service initialization

### Debug Commands:

```bash
# Check environment variables
echo $RESEND_API_KEY

# Test email service directly
node -e "
const { createEmailService } = require('./src/services/email.service');
const service = createEmailService();
console.log('Email service initialized successfully');
"

# Test deployment
npm run build
npm run preview
```

## Security Notes

- Never commit real API keys to version control
- Use environment variables for all sensitive data
- The password reset tokens expire after 1 hour for security
- Email templates are sanitized to prevent injection attacks

## Support

If you encounter issues:
1. Check the application logs for detailed error messages
2. Verify Resend dashboard for delivery status
3. Test with a simple email first (welcome email)
4. Check domain verification status

## Next Steps

Once email functionality is working:
1. Customize email templates to match your brand
2. Set up email analytics tracking
3. Configure email rate limiting if needed
4. Add additional email notifications as needed
