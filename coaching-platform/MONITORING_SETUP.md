# Monitoring Setup Guide

This guide will help you set up monitoring for the coaching platform.

## Overview

The platform includes the following monitoring solutions:
- **Sentry** - Error tracking and performance monitoring
- **Vercel Analytics** - Page views and user metrics
- **Vercel Speed Insights** - Core Web Vitals and performance
- **Custom Analytics** - Application-specific events

## 1. Sentry Setup

### Create a Sentry Account
1. Go to [sentry.io](https://sentry.io) and create a free account
2. Create a new project:
   - Platform: Next.js
   - Alert frequency: Alert me on every new issue
   - Team: Your team name
   - Project name: coaching-platform

### Get Your Configuration
After creating the project, you'll need:
- **DSN**: Found in Settings → Projects → Client Keys (DSN)
- **Organization Slug**: Found in Settings → General
- **Project Slug**: Your project name (e.g., coaching-platform)
- **Auth Token**: Create one in Settings → Account → Auth Tokens

### Update Environment Variables
Add these to your `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@sentry.io/YOUR_PROJECT_ID
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=coaching-platform
SENTRY_AUTH_TOKEN=your-auth-token
```

### Update Configuration
In `next.config.ts`, update:
```typescript
org: "your-organization-slug",  // Replace with your org
project: "coaching-platform",    // Replace with your project
```

## 2. Vercel Deployment Setup

### Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your project
3. Add environment variables during setup
4. Deploy

### Enable Analytics
After deployment:
1. Go to your project dashboard on Vercel
2. Navigate to the Analytics tab
3. Enable Analytics (free tier includes 2,500 events/month)
4. Speed Insights are automatically enabled

## 3. Uptime Monitoring

### Better Uptime (Recommended)
1. Sign up at [betteruptime.com](https://betteruptime.com)
2. Add a new monitor:
   - URL: Your production URL
   - Check frequency: 3 minutes
   - Alert contacts: Your email/phone
3. Set up status page (optional)

### Alternative: Uptime Robot
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor with your production URL
3. Configure alert contacts

## 4. Supabase Monitoring

### Database Monitoring
1. Go to your Supabase project dashboard
2. Set up alerts in Settings → Alerts:
   - Database size > 450MB (500MB limit)
   - Storage usage > 900MB (1GB limit)  
   - API requests > 80% of limit

### Create Analytics Table
Run this SQL in Supabase SQL Editor:
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

## 5. Custom Events

The platform tracks these events automatically:
- `video_uploaded` - When a video is uploaded
- `video_deleted` - When a video is deleted
- `annotation_created` - When an annotation is created
- `drawing_created` - When a drawing is added
- `note_created` - When a note is added
- `loop_created` - When a loop is created
- `tag_added` - When tags are added
- `player_mentioned` - When players are mentioned

### Using the Monitoring Hook
```typescript
import { useMonitoring, EVENTS } from '@/hooks/useMonitoring';

function MyComponent() {
  const { logEvent, trackError } = useMonitoring();
  
  // Track custom events
  await logEvent(EVENTS.VIDEO_UPLOADED, {
    file_size: file.size,
    file_type: file.type,
  });
  
  // Track errors
  try {
    // Your code
  } catch (error) {
    trackError(error, { context: 'upload_video' });
  }
}
```

## 6. Monitoring Dashboard

### Quick Links
After setup, bookmark these:
- **Sentry Dashboard**: https://sentry.io/organizations/YOUR_ORG/projects/
- **Vercel Analytics**: https://vercel.com/YOUR_NAME/YOUR_PROJECT/analytics
- **Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT
- **Better Uptime**: https://betteruptime.com/monitors

### Key Metrics to Watch
1. **Error Rate** - Should be < 1% of sessions
2. **Page Load Time** - Should be < 3s on 4G
3. **Database Size** - Monitor growth rate
4. **Storage Usage** - Video uploads consume space quickly
5. **API Usage** - Stay within Supabase limits

## 7. Alerts Setup

### Critical Alerts
Configure these alerts:
1. **Site Down** - Immediate notification
2. **Error Spike** - > 10 errors in 5 minutes  
3. **Database Near Limit** - > 90% capacity
4. **High Response Time** - > 5s average

### Alert Channels
Set up multiple channels:
- Email (primary)
- SMS (for critical alerts)
- Slack/Discord (team notifications)

## Local Development

Monitoring is disabled in development by default. Events are logged to console with the 📊 emoji.

To test monitoring locally:
1. Set `NODE_ENV=production` temporarily
2. Add your Sentry DSN to `.env.local`
3. Check browser console for Sentry initialization

## Troubleshooting

### Sentry Not Reporting
- Check DSN is correct in `.env.local`
- Verify `NODE_ENV` is production
- Check browser console for errors
- Ensure ad blockers aren't blocking Sentry

### Analytics Not Showing
- Wait 24 hours after deployment
- Verify Analytics component is in layout.tsx
- Check Vercel dashboard for activation

### Custom Events Not Logging
- Check Supabase table exists
- Verify RLS policies are correct
- Check browser console for errors
- Ensure user is authenticated