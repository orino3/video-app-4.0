# Video Coaching Platform - Implementation Plan

## Current Status ✅
- **Authentication System:** Complete and tested
- **User Profile Management:** Complete and tested  
- **Basic Dashboard:** Complete and tested
- **Database Schema:** Complete with proper relationships
- **Supabase Integration:** Working properly

## Implementation Phases - Updated Plan

### Phase 1: Core Video Management 🎥
**Goal:** Enable coaches to upload, store, and organize videos

### 1.1 Development Environment Setup
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS for styling
- [ ] Set up ESLint and Prettier for code quality
- [ ] Configure Git repository and branching strategy
- [ ] Set up development environment variables

### 1.2 Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure Supabase client in Next.js
- [ ] Set up environment variables for Supabase
- [ ] Configure Row Level Security (RLS) policies foundation

### 1.3 Project Structure
```
├── app/                    # Next.js 14 app directory
├── components/             # Reusable UI components
├── lib/                    # Utilities and configurations
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── styles/                 # Global styles
└── public/                 # Static assets
```

### 1.4 Core Dependencies Installation
- [ ] React 18 and related dependencies
- [ ] Zustand for state management
- [ ] React Query for data fetching
- [ ] YouTube and Vimeo player SDKs
- [ ] Canvas drawing libraries evaluation

## Phase 2: Database Schema Design & Implementation (Week 2)

### 2.1 Core Tables Design
```sql
-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    role TEXT NOT NULL CHECK (role IN ('coach', 'player', 'analyst')),
    jersey_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('youtube', 'vimeo', 'upload')),
    duration INTEGER, -- seconds
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching Events (Annotations)
CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id),
    created_by UUID REFERENCES users(id),
    name TEXT,
    timestamp_start DECIMAL NOT NULL,
    timestamp_end DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Components
CREATE TABLE annotation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_loops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    loop_start DECIMAL NOT NULL,
    loop_end DECIMAL NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    drawing_data JSONB NOT NULL,
    original_canvas_width INTEGER NOT NULL,
    original_canvas_height INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE annotation_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID REFERENCES annotations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 RLS Policies Implementation
- [ ] Users can view their own profile
- [ ] Team members can view team videos
- [ ] Coaches can create/edit annotations
- [ ] Players can view annotations they're mentioned in
- [ ] Implement organization-level access controls

### 2.3 Database Functions & Triggers
- [ ] Auto-create user profile on signup
- [ ] Cascade deletes for annotation components
- [ ] Timestamp update triggers

## Phase 3: Authentication & User Management (Week 3)

### 3.1 Authentication Setup
- [ ] Configure Supabase Auth with email/password
- [ ] Create signup flow with team invitation codes
- [ ] Implement login/logout functionality
- [ ] Password reset functionality
- [ ] Session management with Zustand

### 3.2 User Interface Components
- [ ] Login page
- [ ] Signup page with role selection
- [ ] User profile page
- [ ] Team management interface
- [ ] User invitation system

### 3.3 Authorization Middleware
- [ ] Route protection for authenticated users
- [ ] Role-based access control
- [ ] Team membership verification

## Phase 4: Video Management System (Week 4-5)

### 4.1 Video Linking Interface
- [ ] YouTube URL parsing and validation
- [ ] Vimeo URL parsing and validation
- [ ] Video metadata extraction
- [ ] Video library UI with grid/list views

### 4.2 Video Player Integration
- [ ] YouTube IFrame API integration
- [ ] Vimeo Player SDK integration
- [ ] Unified video player interface
- [ ] Player state management

### 4.3 Video Details & Management
- [ ] Video detail page layout
- [ ] Video metadata display
- [ ] Team association
- [ ] Basic search/filter functionality

## Phase 5: Coaching Events Core Functionality (Week 6-7)

### 5.1 Event Creation UI
- [ ] "Create Analysis Point" button
- [ ] Event creation modal/panel
- [ ] Timestamp capture from current playback
- [ ] Event naming interface

### 5.2 Integrated Components Editor
- [ ] Notes section with text input
- [ ] Loop definition controls
- [ ] Tag selection interface
- [ ] User mention selector
- [ ] Save/Cancel functionality

### 5.3 Event Display & Navigation
- [ ] Events list/timeline view
- [ ] Timeline markers on video progress bar
- [ ] Event activation/deactivation
- [ ] Clear displayed components button

### 5.4 Event Management
- [ ] Edit existing events
- [ ] Delete events
- [ ] Event search/filter

## Phase 6: Drawing Canvas & Telestration (Week 8-9)

### 6.1 Canvas Implementation
- [ ] HTML5 Canvas setup
- [ ] Canvas overlay positioning
- [ ] Responsive scaling system
- [ ] Drawing state management

### 6.2 Drawing Tools
- [ ] Pencil tool implementation
- [ ] Color picker
- [ ] Stroke width control
- [ ] Undo/Redo functionality
- [ ] Clear canvas option

### 6.3 Drawing Persistence
- [ ] Save drawing operations as JSON
- [ ] Load and render saved drawings
- [ ] Handle canvas resizing/scaling
- [ ] Optimize performance for multiple drawings

## Phase 7: External Video Controls & Enlarged Player Mode (Week 10)

### 7.1 Custom Video Controls
- [ ] Play/Pause button
- [ ] Custom seek bar
- [ ] Volume control
- [ ] Playback speed selector (0.5x-2x)
- [ ] Loop activation toggle
- [ ] Current time/duration display

### 7.2 Enlarged Player Mode
- [ ] Enlarge/Shrink toggle button
- [ ] Layout adjustments for enlarged mode
- [ ] Maintain control accessibility
- [ ] Preserve drawing canvas scaling
- [ ] Smooth transitions

### 7.3 Control Integration
- [ ] Sync controls with video APIs
- [ ] Handle player state changes
- [ ] Keyboard shortcuts
- [ ] Touch-friendly controls

## Phase 8: Sharing & Collaboration Features (Week 11)

### 8.1 Event Sharing
- [ ] Share with team functionality
- [ ] Share with specific users
- [ ] Sharing permissions UI
- [ ] Shared events dashboard

### 8.2 Notifications
- [ ] Mention notifications
- [ ] New shared event notifications
- [ ] Email notification preferences

### 8.3 Collaboration Features
- [ ] Event visibility controls
- [ ] Comment system foundation
- [ ] Activity feed

## Phase 9: Mobile Optimization & PWA (Week 12)

### 9.1 Responsive Design
- [ ] Mobile-first CSS approach
- [ ] Touch-optimized controls
- [ ] Responsive video player
- [ ] Mobile navigation patterns

### 9.2 PWA Implementation
- [ ] Service worker setup
- [ ] Manifest file configuration
- [ ] Offline capability planning
- [ ] App installation prompts

### 9.3 Mobile-Specific Features
- [ ] Simplified athlete view
- [ ] Mobile-optimized event viewing
- [ ] Touch-friendly drawing tools
- [ ] Performance optimization

## Phase 10: Testing, Deployment & Launch (Week 13-14)

### 10.1 Testing
- [ ] Unit tests for core functions
- [ ] Integration tests for APIs
- [ ] E2E tests for critical paths
- [ ] Cross-browser testing
- [ ] Mobile device testing

### 10.2 Performance Optimization
- [ ] Code splitting
- [ ] Image optimization
- [ ] API response caching
- [ ] Database query optimization
- [ ] Bundle size analysis

### 10.3 Deployment Setup
- [ ] Production environment configuration
- [ ] CI/CD pipeline setup
- [ ] Domain and SSL configuration
- [ ] Monitoring and logging
- [ ] Backup strategies

### 10.4 Launch Preparation
- [ ] User documentation
- [ ] Admin documentation
- [ ] Beta testing with select teams
- [ ] Feedback collection system
- [ ] Launch announcement planning

## Post-MVP Roadmap

### Content Creation Features
- Clip compilation from events
- Highlight reel generator
- MP4 export functionality
- Custom branding options

### Advanced Features
- Direct video upload
- Advanced drawing tools (shapes, arrows, text)
- AI-powered auto-tagging
- Real-time collaboration
- Advanced analytics dashboard

### Platform Expansion
- Native mobile applications
- Multi-sport customizations
- Integration with third-party tools
- API for external developers

## Risk Mitigation Strategies

1. **Technical Risks**
   - Regular code reviews
   - Incremental feature deployment
   - Performance monitoring from day 1
   - Fallback options for video APIs

2. **User Adoption**
   - Early user feedback sessions
   - Iterative UI/UX improvements
   - Comprehensive onboarding flow
   - In-app help system

3. **Scalability**
   - Database indexing strategy
   - CDN for video content
   - Efficient state management
   - Microservices architecture planning

## Success Criteria

- Successfully create and display coaching events
- Smooth video playback with custom controls
- Drawing canvas works reliably at different sizes
- Mobile users can effectively view shared content
- System handles 100+ concurrent users
- Page load times under 3 seconds
- 95% uptime achievement