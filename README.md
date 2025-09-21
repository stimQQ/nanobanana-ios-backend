# NanoBanana Backend - AI Image Generation Platform

A complete Next.js 14+ backend system for an AI-powered image generation app with Apple authentication, subscription management, and multi-language support.

## Features

- **Apple ID Authentication** with JWT token management
- **Subscription System** with 3 tiers (Basic, Pro, Premium)
- **AI Image Generation** (text-to-image and image-to-image)
- **Credit Management** with free attempts and paid credits
- **Multi-language Support** (EN, CN, JP, KR, DE, FR)
- **Supabase Integration** for database and storage
- **RESTful API** design for mobile app consumption
- **Vercel-ready** deployment configuration

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI Model**: Gemini 2.5 Flash (via API Core)
- **Authentication**: Apple ID + JWT
- **Deployment**: Vercel

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account
- API Core account for AI generation
- Apple Developer account (for Apple ID auth)
- Vercel account (for deployment)

### 2. Installation

```bash
# Clone the repository
cd nextjs-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Environment Setup

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Core
APICORE_API_KEY=your_apicore_api_key

# Apple Auth
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key

# JWT
JWT_SECRET=your_secure_jwt_secret

# Apple Pay
APPLE_MERCHANT_ID=your_merchant_id
```

### 4. Database Setup

```bash
# Run the setup script
./scripts/setup-supabase.sh

# Or manually:
# 1. Create a Supabase project
# 2. Run supabase/schema.sql in SQL editor
# 3. Create storage buckets: 'images', 'user-uploads'
```

### 5. Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/apple` - Apple ID login

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

### Subscriptions
- `POST /api/subscription/purchase` - Purchase subscription
- `GET /api/subscription/status` - Get subscription status

### Image Generation
- `POST /api/generate/image` - Generate AI image
- `POST /api/upload/image` - Upload image

### User History
- `GET /api/user/generations` - Get generation history
- `DELETE /api/user/generations` - Delete generation
- `GET /api/user/credits` - Get credit history

### Health Check
- `GET /api/health` - API health status

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## Subscription Plans

| Plan | Price | Credits | Images |
|------|-------|---------|--------|
| Free | $0 | 40 initial + 10 free attempts | - |
| Basic | $9.9/mo | 800 | 200 |
| Pro | $29.9/mo | 3000 | 750 |
| Premium | $59.9/mo | 8000 | 2000 |

## Project Structure

```
nextjs-backend/
├── app/
│   └── api/              # API routes
│       ├── auth/         # Authentication endpoints
│       ├── user/         # User management
│       ├── subscription/ # Subscription handling
│       ├── generate/     # Image generation
│       └── upload/       # Image uploads
├── lib/
│   ├── config/          # Configuration files
│   ├── middleware/      # Auth middleware
│   ├── supabase/        # Database client
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── supabase/
│   └── schema.sql       # Database schema
└── scripts/             # Setup and deployment scripts
```

## Deployment

### Deploy to Vercel

```bash
# Run deployment script
./scripts/deploy-vercel.sh

# Or manually:
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Add all variables from `.env.local` to your Vercel project settings.

## Security Considerations

- JWT tokens expire after 30 days
- All endpoints use CORS protection
- Row Level Security (RLS) enabled in Supabase
- API keys stored securely in environment variables
- Apple ID token validation required

## Credits System

- **Text-to-Image**: 1 credit per generation
- **Image-to-Image**: 2 credits per generation
- Credits deducted only on success
- Free attempts used before credits
- Monthly reset for subscribers

## Multi-Language Support

Supported languages:
- English (en) - Default
- Chinese (cn)
- Japanese (jp)
- Korean (kr)
- German (de)
- French (fr)

Set via `Accept-Language` header or user profile.

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/user/profile
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check Supabase credentials in `.env.local`
   - Verify database schema is applied

2. **Image generation fails**
   - Verify API Core API key
   - Check credit balance

3. **Authentication errors**
   - Validate Apple ID token format
   - Check JWT secret configuration

## Support

For issues or questions, please check:
- [API Documentation](./API_DOCUMENTATION.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## License

Proprietary - All rights reserved