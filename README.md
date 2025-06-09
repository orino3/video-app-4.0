# Sports Video Coaching Platform

![Deploy Status](https://img.shields.io/badge/deploy-ready-green)

A comprehensive video analysis platform for sports teams, built with Next.js 15 and Supabase.

## Features

- 🎥 Video upload and YouTube integration
- ✏️ Advanced annotation system (drawings, notes, loops, tags, player mentions)
- 👥 Team management with role-based permissions
- 🔒 Secure authentication with Supabase Auth
- 📊 Analytics and monitoring with Sentry
- 🚀 Optimized for performance with Vercel

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **State Management**: Zustand, TanStack Query
- **Monitoring**: Sentry, Vercel Analytics

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production Deployment

This project is optimized for deployment on Vercel. See deployment guide in the repository.

## License

Private - All rights reserved