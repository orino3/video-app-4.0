# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video coaching platform built with Next.js 15 and Supabase for sports teams to analyze game footage with annotations, drawings, loops, and player mentions.

## Development Commands

```bash
# All commands run from coaching-platform/ directory
cd coaching-platform

# Development server (Turbopack enabled)
npm run dev

# Production build
npm run build

# Type checking and linting (run after changes)
npm run lint

# Start production server
npm run start
```

## Environment Setup

Create `.env.local` in `coaching-platform/`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Architecture Patterns

### Three-Layer Authentication
1. **Client:** `/lib/supabase/client.ts` - Browser-side operations
2. **Server:** `/lib/supabase/server.ts` - SSR with cookies
3. **Middleware:** `/middleware.ts` - Session refresh & route protection
4. **Global State:** `/stores/authStore.ts` - Zustand store with auto-sync

### Unified Video Player
- **Interface:** `IVideoPlayer` in `/types/VideoPlayer.ts` - Source-agnostic API
- **Adapters:** HTML5 and YouTube in `/lib/video/adapters/`
- **Canvas Overlay:** Annotations work identically across all video sources
- **Component:** `UnifiedVideoPlayer.tsx` manages player switching

### Database Hierarchy
```
Organizations (optional) → Teams → Users (via team_members)
Videos → Annotations → Components (notes, drawings, loops, tags, mentions)
```

**Multi-Team Support:**
- Coaches can belong to multiple teams across different organizations
- Teams can exist independently without organizations
- Active team selection persists across sessions
- Pending players system for immediate tagging without email

### Component Structure
- **Layout Flow:** RootLayout → QueryProvider → AuthProvider → Pages
- **Protected Routes:** `<ProtectedRoute requireAuth={true} requireRole={['coach']} />`
- **Permissions:** `const { isCoach, canManageTeam } = useAuth()`
- **Styling:** `cn()` utility for conditional Tailwind classes

## Testing Strategy
- Manual testing with Puppeteer MCP for UI
- Supabase MCP for database verification
- Always verify with `npm run lint`

## Implementation Status

✅ **Complete:**
- Three-layer auth system
- Video upload (500MB, MP4/MOV/AVI)
- Unified player with adapters
- Canvas drawing system with coordinate fix
- Multi-team management across organizations
- Pending player system (tag without email)
- Bulk player upload via CSV

🚧 **In Progress:**
- Email invitation system
- Enhanced annotation components

📋 **Planned:**
- Real-time collaboration
- Video compilations
- Public sharing
- AI features