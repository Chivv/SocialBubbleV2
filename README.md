# Social Bubble Internal Platform

An internal agency platform for managing creators, clients, and campaigns built with Next.js, Clerk authentication, and Supabase.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and App Router
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **UI Components**: ShadCN UI with Tailwind CSS
- **Forms**: React Hook Form with Zod validation

## Features

### User Types
1. **Social Bubble Colleagues**: Internal team members with full platform access
2. **Clients**: Businesses using creative services
3. **Creators**: Creative professionals offering services

### Key Features
- Multi-step onboarding forms with validation
- Role-based dashboards
- Creator profile management
- Client status tracking (Onboarding, Active, Lost)
- Client metadata management (creators count, briefings, creatives, invoice date)

## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file and add the following:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Supabase Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `lib/supabase/schema.sql` in the Supabase SQL editor
3. Enable Row Level Security (RLS) on all tables

### 3. Clerk Setup
1. Create a new Clerk application
2. Configure the sign-in and sign-up URLs in Clerk dashboard
3. Add the following webhook endpoints if needed

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
app/
├── dashboard/
│   ├── client/         # Client dashboard
│   ├── creator/        # Creator dashboard
│   ├── social-bubble/  # Social Bubble team dashboard
│   ├── creators/       # Creators list (Social Bubble only)
│   └── clients/        # Clients list with management
├── onboarding/         # Role selection
├── signup/
│   ├── creator/        # Creator multi-step signup
│   └── client/         # Client multi-step signup
├── sign-in/            # Clerk sign-in
└── sign-up/            # Clerk sign-up

components/
├── dashboard/          # Dashboard-specific components
└── ui/                 # ShadCN UI components

lib/
├── supabase/           # Supabase client configuration
├── hooks/              # Custom React hooks
└── utils.ts            # Utility functions

types/                  # TypeScript type definitions
```

## Database Schema

### Tables
- `creators`: Creator profiles and information
- `clients`: Client company information
- `client_users`: Individual users linked to client companies
- `user_roles`: Maps Clerk users to their roles

## Development Notes

- All forms include proper validation using Zod schemas
- File uploads are prepared but need Supabase Storage configuration
- Client invite system structure is in place but needs email service integration
- RLS policies ensure users can only access appropriate data

## Next Steps

1. Configure Supabase Storage for file uploads (profile pictures, videos, brand assets)
2. Implement email invitation system for client team members
3. Add more detailed analytics and reporting features
4. Enhance the creator-client matching system