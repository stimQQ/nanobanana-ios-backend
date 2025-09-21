# Google OAuth Setup Guide

## Prerequisites

1. Google Cloud Console account
2. A project in Google Cloud Console
3. Your application's domain(s)

## Configuration Steps

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**

### 2. Create OAuth 2.0 Client ID

1. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Select **Web application** as the Application type
3. Add a name for your OAuth client (e.g., "NanoBanana Web")

### 3. Configure Authorized JavaScript Origins

Add ALL of the following origins to support different environments:

**Development:**
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:3002`
- `http://localhost:3003`
- `https://localhost:3000`

**Production:**
- `https://nanobanana.app`
- `https://www.nanobanana.app`
- `https://nanobanana.vercel.app`
- `https://nanobanana-ios-nextjs-backend.vercel.app`

**Important:** Add your actual production domain(s) here.

### 4. Configure Authorized Redirect URIs

Although we're using the Google Sign-In JavaScript library (which doesn't require redirect URIs), it's good practice to add them:

- `http://localhost:3000/api/auth/callback/google`
- `https://nanobanana.app/api/auth/callback/google`
- `https://nanobanana.vercel.app/api/auth/callback/google`

### 5. Save and Copy Credentials

1. Click **CREATE**
2. Copy the **Client ID**
3. Copy the **Client Secret** (keep this secure!)

### 6. Update Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Current Configuration

The application is currently configured with:
- Client ID: `85523758539-mmka868bo5486mpmssjmlsm1o3l061q1.apps.googleusercontent.com`

## Common Issues and Solutions

### Issue: "The given origin is not allowed for the given client ID"

**Solution:**
1. Verify that your current domain is added to the Authorized JavaScript Origins in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate
3. Clear browser cache and cookies
4. Try incognito/private browsing mode

### Issue: Cross-Origin-Opener-Policy errors

**Solution:**
The application includes middleware that sets the correct CORS headers:
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `Cross-Origin-Embedder-Policy: unsafe-none`

These are automatically configured in `/middleware.ts`

### Issue: Hydration mismatch warnings

**Solution:**
The login page properly handles client-side rendering of the Google OAuth provider to prevent hydration issues.

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run the authentication test suite:
   ```bash
   node scripts/test-auth.js
   ```

3. Visit http://localhost:3000/login and test:
   - Google Sign In
   - Dev Mode login (development only)

## Security Considerations

1. **Never commit credentials:** Keep your `.env.local` file in `.gitignore`
2. **Use environment variables:** Always use `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`
3. **Validate tokens server-side:** The API routes validate Google tokens before creating sessions
4. **HTTPS in production:** Always use HTTPS for production deployments

## Database Schema Notes

The application uses a unified `apple_id` field for all authentication providers:
- Apple Sign In: Uses actual Apple ID
- Google Sign In: Uses `google_${email}` prefix
- Dev Mode: Uses `dev_${email}` prefix

This allows the existing iOS app database schema to work with multiple auth providers.

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all origins are correctly configured in Google Cloud Console
3. Ensure environment variables are properly set
4. Check that the database is accessible and migrations are applied