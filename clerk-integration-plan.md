# Clerk Integration Plan for BotCafé

## Overview
Integrate Clerk authentication service to replace mock user data with real authentication and user management.

## Installation & Setup

### 1. Install Clerk Dependencies
```bash
npm install @clerk/nextjs
```

### 2. Environment Variables
Add to `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/account
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/account
```

### 3. Clerk Provider Setup
Update `src/app/(frontend)/layout.tsx` to include Clerk provider:
- Wrap the app with `ClerkProvider`
- Add Clerk components for authentication state

## Authentication Pages

### 1. Sign In Page (`/sign-in`)
- Create custom sign-in form with BotCafé styling
- Use Clerk's `SignIn` component with fantasy theming
- Maintain glass-rune design consistency

### 2. Sign Up Page (`/sign-up`)
- Create custom sign-up form
- Use Clerk's `SignUp` component
- Include terms acceptance and email verification

### 3. User Profile Integration
- Replace mock user data with Clerk user data
- Update `ProfileSidebar` to use `useUser` hook
- Real-time user information synchronization

## Component Updates

### 1. Profile Sidebar
- Replace mock user with Clerk `useUser()` hook
- Real avatar integration with Clerk's profile picture
- Dynamic user status and verification

### 2. Account Dashboard
- Remove mock user data
- Integrate real user statistics from Clerk
- Connect to Clerk's user management features

### 3. Navigation Updates
- Add authentication state to navbar
- Show "Sign In" / "Sign Up" when not authenticated
- Show user menu when authenticated
- Protect authenticated routes

## Protected Routes
- `/account` - Require authentication
- `/explore` - Allow anonymous browsing
- `/create` - Require authentication
- `/chat/*` - Require authentication

## Clerk Components Integration

### 1. UserButton
- Custom styled user menu
- Profile, settings, sign out options
- Fantasy theme styling

### 2. UserProfile
- Custom user profile management
- Integration with existing profile forms
- Real-time updates

### 3. Organization Features (Optional)
- Multi-user support for bot sharing
- Team collaboration features
- Creator programs integration

## Migration Strategy

### Phase 1: Basic Integration
1. Install Clerk and set up environment
2. Create sign-in/sign-up pages
3. Update layout with Clerk provider
4. Basic authentication state management

### Phase 2: User Data Integration
1. Replace mock user data in components
2. Update profile sidebar with real user
3. Connect account dashboard to Clerk data
4. Remove mock user dependencies

### Phase 3: Enhanced Features
1. User profile management
2. Organization features
3. Advanced authentication flows
4. Email verification and security

## Benefits
- **Real Authentication**: Secure, production-ready auth
- **User Management**: Built-in user profiles and settings
- **Multi-factor Authentication**: Enhanced security options
- **Social Login**: Google, GitHub, etc. integration
- **Email Verification**: Built-in email workflows
- **Session Management**: Automatic session handling

## Implementation Priority
1. **High Priority**: Sign-in/sign-up pages, basic auth flow
2. **Medium Priority**: User data integration, profile updates
3. **Low Priority**: Advanced features, organizations

## Testing Strategy
1. Test authentication flows
2. Verify protected routes
3. Test user profile integration
4. Validate session management
5. Test with multiple user scenarios
