# Video Coaching Platform - TODO List

## Status Legend
- ✅ Completed
- 🚧 In Progress  
- ⏳ Pending
- 🧪 Needs Testing
- ❌ Blocked/Issue
- 🔧 Fixed

## 🎯 HIGH PRIORITY - MVP Features for Coach Testing

### 1. **Player Management Without Email** ✅ COMPLETED
**Why:** Coaches need to immediately tag players in videos without waiting for email verification
- ✅ Add "Quick Add Player" button that doesn't require email
- ✅ Create player form with name, jersey number, position only
- ✅ Generate placeholder user records with "pending_activation" status
- ✅ Allow tagging of pending players in annotations immediately
- ✅ Display "Pending" indicator on unclaimed player profiles
- ✅ Link email invitations to existing placeholder records

### 2. **Loop Playback Implementation** ⏳ CRITICAL
**Why:** Loop creation works but videos don't actually loop
- [ ] Implement actual video looping functionality in UnifiedVideoPlayer
- [ ] Add loop controls (play loop, exit loop)
- [ ] Visual indicator when loop is active
- [ ] Keyboard shortcuts for loop control

### 3. **Video Sharing System** ⏳ HIGH
**Why:** Coaches need to share annotated videos with players and parents
- [ ] Build public share link generation UI
- [ ] Implement share settings (password, expiration, view limits)
- [ ] Create public view page for shared videos
- [ ] Add share tracking analytics
- [ ] Enable/disable annotation visibility in shares

### 4. **Basic Analytics Dashboard** ⏳ HIGH
**Why:** Coaches need insights into team engagement and progress
- [ ] Create analytics page with key metrics
- [ ] Video view counts and engagement time
- [ ] Most used tags and annotation patterns
- [ ] Player participation metrics
- [ ] Export data for reports

## 🗑️ DELETION FUNCTIONALITY - CRITICAL SAFETY FEATURES

### 5. **Delete Annotation/Event** ✅ COMPLETED
**Current Status:** Enhanced with permission checks and soft delete
- ✅ Delete button exists in annotation panel
- ✅ Confirmation dialog implemented
- ✅ Permission checks (only coach/creator can delete)
- ✅ Soft delete option for recovery (30-day window)
- ✅ Visual feedback for deletion

**Completed Features:**
- Soft delete with deleted_at timestamp
- Permission-based access (coaches can delete any, players only their own)
- Comprehensive confirmation dialog with content summary
- Database migration for soft delete support

### 6. **Delete Team** ✅ COMPLETED
**Guidelines:** Only team owner (first coach) can delete team
- ✅ Delete button in team management page (owner only)
- ✅ Confirmation modal with team name verification
- ✅ Content summary (videos, members, annotations count)
- ✅ Soft delete with 30-day recovery period
- ✅ Team recovery page at /teams/recover
- ✅ Automatic cleanup after 30 days

**Completed Features:**
- Owner tracking with owner_id column
- DeleteTeamModal component with safety checks
- Team recovery interface for deleted teams
- RLS policies for soft-deleted teams
- Content preservation during recovery window

### 7. **Delete Team Member** ✅ COMPLETED
**Guidelines:** Role-based permission system
- ✅ Remove button next to each member in PlayerManagement
- ✅ Confirmation dialog with member info
- ✅ Permission checks:
  - ✅ Coaches can remove players/analysts
  - ✅ Only team owner can remove other coaches
  - ✅ Cannot remove yourself
- ✅ Option to preserve or delete member's annotations
- ⏳ Email notification (system not configured)

**Completed Features:**
- DeleteMemberModal with role-based permissions
- Annotation preservation option
- Visual permission feedback
- Integration with PlayerManagement component

### 8. **Delete Video** ⏳ PENDING
**Guidelines:**
- Only uploader or coach can delete
- Warn about losing all annotations
- Option to download before deletion
- Remove from storage and database
- Handle shared videos appropriately

**Implementation Steps:**
- [ ] Add delete button in video list (conditional display)
- [ ] Pre-deletion modal:
  - [ ] Warning about annotation loss
  - [ ] Count of annotations that will be deleted
  - [ ] Download video option
  - [ ] Download annotations as JSON option
- [ ] Backend process:
  - [ ] Permission check (uploader or coach)
  - [ ] Delete from Supabase storage
  - [ ] Remove database record
  - [ ] Cascade delete annotations
  - [ ] Remove from video_shares

### 9. **Delete Individual Annotation Components** ⏳ LOW PRIORITY
**Guidelines:**
- Delete specific parts of annotation (drawing, note, tag, etc.)
- Keep annotation if other components exist
- Delete entire annotation if last component removed

### 10. **Delete User Account** ⏳ LOW PRIORITY
**Guidelines:**
- User can delete own account
- Must remove from all teams first
- Export data option
- 30-day recovery period
- GDPR compliance

## 🔧 RECENTLY FIXED ISSUES

### Team Data Isolation ✅ FIXED (2025-01-08)
**Issue:** All teams showed the same videos and players
**Root Causes:**
1. React components not clearing state when switching teams
2. useEffect dependencies missing, causing stale closures
3. Dashboard "View Videos" and "Manage Team" buttons not setting active team

**Fixes Applied:**
1. **VideoList.tsx**:
   - Added useCallback to prevent stale closures
   - Clear videos array before fetching new data
   - Fixed useEffect dependencies
   - Added console logging for debugging

2. **PlayerManagement.tsx**:
   - Clear player arrays when switching teams
   - Added proper useEffect dependencies

3. **TeamManagement.tsx**:
   - Use team ID in useEffect dependency (not object reference)
   - Clear member arrays when fetching

4. **DashboardContent.tsx**:
   - Changed Link components to Button with onClick
   - Set active team before navigation
   - Added visual indicators for active team

**Result:** Each team now properly shows only its own videos and players

### Multi-Team System ✅ IMPLEMENTED (2025-01-07)
- ✅ Video sharing between teams (coaches only)
- ✅ Team-specific video isolation
- ✅ Team ownership concept (first coach = owner)
- ✅ Active team persistence in localStorage
- ✅ Team selector in navigation bar

## 🔄 MEDIUM PRIORITY - UX Improvements

### 11. **Multi-Team Coach Enhancements** ⏳
- [ ] Add "Create New Team" option in team selector dropdown
- [ ] Implement team switching without page reload
- [ ] Visual indicator for active team in selector
- [ ] Quick team switch keyboard shortcut

### 12. **Timeline Reliability** 🧪
- [ ] Fix intermittent timeline marker display issue
- [ ] Ensure all annotations always appear on timeline
- [ ] Add timeline zoom/density controls
- [ ] Improve timeline performance with many annotations

### 13. **Enhanced Drawing Tools** ⏳
- [ ] Add color picker for drawings
- [ ] Shape tools (arrows, circles, rectangles)
- [ ] Text annotation on canvas
- [ ] Undo/redo functionality
- [ ] Line thickness options

### 14. **Player Profile System** ⏳
- [ ] Create player_profiles table (referenced but missing)
- [ ] Two-tier profile view (basic vs authenticated)
- [ ] Profile claiming process via email
- [ ] Player stats and performance tracking
- [ ] Privacy controls for player data

### 15. **Help & Documentation** ⏳
- [ ] In-app tutorial for first-time users
- [ ] Feature tooltips and guides
- [ ] Video tutorials for common tasks
- [ ] FAQ section
- [ ] Best practices guide for coaches

## ✅ COMPLETED FEATURES (Verified Working)

### Core Platform
- ✅ Three-layer authentication system (client/server/middleware)
- ✅ Protected routes with role-based access
- ✅ Team selector and management UI
- ✅ Video upload with Supabase Storage (500MB limit)
- ✅ Unified Video Player with HTML5 and YouTube adapters

### Annotation System (Fully Functional)
- ✅ Create and save annotations with timestamps
- ✅ Drawing canvas overlay with persistence and manual save
- ✅ Note creation and editing with inline editor
- ✅ Loop creation UI with preview (playback not implemented)
- ✅ Tag system with categories and visual selection
- ✅ Player mentions with team roster search
- ✅ Timeline visualization with color-coded markers
- ✅ Quick Actions (Draw, Note, Loop) for fast annotation
- ✅ Auto-pause on annotation creation with toggle
- ✅ Edit/Delete annotations with permission checks
- ✅ "Run" presentation mode for annotations
- ✅ Unified event panel for viewing/editing
- ✅ Soft delete for annotations with recovery

### Team Features
- ✅ Multi-team support with proper data isolation
- ✅ Team member invitation via email
- ✅ Role assignment (coach, player, analyst)
- ✅ Bulk CSV player upload
- ✅ Active team persistence
- ✅ Quick Add Player without email
- ✅ Team ownership tracking
- ✅ Team deletion with recovery
- ✅ Member removal with permissions
- ✅ Video sharing between teams

### Developer Tools
- ✅ Debug panel showing active team (bottom-right)
- ✅ Console logging for team switches
- ✅ Cache clearing page at /clear-cache.html

## 📋 FUTURE ENHANCEMENTS (Post-MVP)

### Advanced Features
- [ ] Video compilation/highlight reels
- [ ] Real-time collaboration
- [ ] Voice note annotations
- [ ] AI-powered auto-tagging
- [ ] Mobile app (React Native)
- [ ] Offline video support
- [ ] Advanced search and filters
- [ ] Coaching templates
- [ ] Integration with game stats APIs

### Performance & Scale
- [ ] Video thumbnail generation
- [ ] Annotation caching strategy
- [ ] CDN for video delivery
- [ ] Database query optimization
- [ ] Background job processing

## 🐛 KNOWN ISSUES

### Critical
- ❌ Loop playback doesn't work (only UI exists)
- ❌ player_profiles table referenced in code but exists in database

### Medium
- ⚠️ Timeline markers sometimes don't appear (intermittent)
- ⚠️ Email notifications not configured (affects invites, sharing)

### Minor
- ⚠️ No automated tests configured
- ⚠️ Some TypeScript any types need proper typing
- ⚠️ Prettier formatting warnings in console

## 📝 NOTES FOR DEVELOPMENT

1. **Testing Strategy:** Currently using manual testing with Puppeteer MCP and Supabase MCP. Consider adding automated tests for critical paths.

2. **Email Integration:** Multiple features require email (invitations, sharing) but email service isn't configured. Features store data but don't send notifications.

3. **Deletion Safety:** All deletion features include:
   - Confirmation dialogs with clear warnings
   - Permission checks (role-based access)
   - Soft delete where appropriate for recovery
   - Cascade handling for related data
   - Data preservation options

4. **Team Isolation:** Fixed issue where all teams showed same data. Each team now properly isolated with team_id filtering.

5. **Server Port:** Development server can run on different ports:
   - Default: `npm run dev` (port 3000)
   - Port 3001: `npm run dev:3001` or `PORT=3001 npm run dev`

## Last Updated: 2025-01-08

Major changes in this revision:
- Marked Player Management Without Email as COMPLETED
- Marked Delete Annotation as COMPLETED (with soft delete)
- Marked Delete Team as COMPLETED (with recovery system)
- Marked Delete Team Member as COMPLETED (with permissions)
- Added "Recently Fixed Issues" section documenting team isolation fix
- Updated team features to reflect multi-team improvements
- Added developer tools section for debugging
- Clarified remaining deletion features to implement
- Updated known issues to reflect current state