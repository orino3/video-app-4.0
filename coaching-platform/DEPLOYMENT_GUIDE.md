# Vercel Deployment Guide

This guide walks you through deploying the Sports Video Coaching Platform to Vercel.

## Prerequisites

1. GitHub account
2. Vercel account (free tier is sufficient to start)
3. Supabase project already set up
4. (Optional) Sentry account for error tracking

## Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository

```bash
cd "/Users/oriraz/cursor/video app 4.0/coaching-platform"
git init
git add .
git commit -m "Initial commit: Sports Video Coaching Platform MVP"
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name your repository (e.g., `coaching-platform`)
3. Keep it **Private** for now
4. Don't initialize with README (we already have one)
5. Create repository

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/coaching-platform.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. If not connected, click "Add GitHub Account" and authorize Vercel
4. Select your `coaching-platform` repository
5. Click "Import"

### 2.2 Configure Project

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `./` (leave as is)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

### 2.3 Add Environment Variables

Click "Environment Variables" and add each of these:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://jpxtnsqnnwadmvqluore.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here

# Site URL (Required - use your Vercel URL)
NEXT_PUBLIC_SITE_URL=https://your-project-name.vercel.app

# Sentry (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=coaching-platform
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Node Environment
NODE_ENV=production
```

**Important**: 
- Replace `your-project-name` with your actual Vercel project name
- Get your Supabase anon key from Supabase Dashboard → Settings → API
- For Sentry, create a project first at sentry.io

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like `https://coaching-platform-abc123.vercel.app`

## Step 3: Post-Deployment Setup

### 3.1 Update Site URL

1. Go back to Vercel Dashboard → Settings → Environment Variables
2. Update `NEXT_PUBLIC_SITE_URL` to your actual Vercel URL
3. Redeploy by going to Deployments → Three dots → Redeploy

### 3.2 Configure Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - Site URL: `https://your-project-name.vercel.app`
   - Redirect URLs: 
     - `https://your-project-name.vercel.app/auth/callback`
     - `https://your-project-name.vercel.app`

### 3.3 Run Database Migrations

In Supabase SQL Editor, run the analytics table migration:

```sql
-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event VARCHAR(255) NOT NULL,
  properties JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_team_id ON public.analytics_events(team_id);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own events"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = analytics_events.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('coach', 'admin')
    )
  );
```

### 3.4 Set Up Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain
5. Update Supabase redirect URLs

## Step 4: Enable Monitoring

### 4.1 Vercel Analytics

1. Go to Vercel Dashboard → Analytics tab
2. Click "Enable Analytics"
3. Analytics will start collecting data automatically

### 4.2 Set Up Uptime Monitoring

1. Sign up at [betteruptime.com](https://betteruptime.com)
2. Add monitor:
   - URL: Your production URL
   - Check interval: 3 minutes
   - Alert contacts: Your email

## Step 5: Test Your Deployment

1. Visit your deployed URL
2. Create an account
3. Test key features:
   - Sign up / Login
   - Create a team
   - Upload a video
   - Add annotations
   - Invite team members (note: emails won't send without email service setup)

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Try building locally first: `npm run build`

### Authentication Issues
- Verify Supabase URL and anon key are correct
- Check redirect URLs in Supabase match your Vercel URL
- Ensure cookies are enabled in browser

### Videos Not Uploading
- Check Supabase storage bucket exists and is public
- Verify file size limits (500MB default)
- Check browser console for errors

### Performance Issues
- Enable Vercel Edge Functions for better performance
- Consider upgrading Vercel plan for more resources
- Monitor with Vercel Analytics

## Security Checklist

- [x] Environment variables are not exposed in code
- [x] `.env.local` is in `.gitignore`
- [x] Server-only operations use `server-only` package
- [x] Supabase RLS policies are enabled
- [x] Source maps disabled in production
- [x] Sentry configured to filter sensitive data

## Next Steps

1. **Set up email service** for team invitations
2. **Configure Sentry** for error tracking
3. **Add custom domain** for professional appearance
4. **Set up staging environment** for testing
5. **Enable Supabase backups** for data protection

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)