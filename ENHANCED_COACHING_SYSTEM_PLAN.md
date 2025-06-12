# Enhanced Coaching System Implementation Plan

## Overview
This document outlines the enhanced coaching event system with UX improvements and comprehensive testing strategies using Supabase MCP (backend) and Puppeteer MCP (frontend).

## Core Architecture

### Coaching Event Model
```
Annotation (Core Event)
├── timestamp_start
├── timestamp_end
├── created_by
└── Components
    ├── annotation_notes[]
    ├── annotation_drawings[]
    ├── annotation_loops (single)
    ├── annotation_tags[]
    └── annotation_mentions[]
```

## Implementation Phases

### Phase 1: Foundation (High Priority)

#### 1. Complete Video Upload System
**Features:**
- File upload to Supabase Storage
- Progress tracking UI
- Multiple format support (MP4, MOV, WebM)
- Automatic thumbnail generation

**Testing:**
```javascript
// Puppeteer Test
await page.setInputFiles('input[type=file]', './test-video.mp4');
await page.click('button[data-testid="upload-video"]');
await page.waitForSelector('[data-testid="upload-complete"]');

// Supabase MCP Verification
const { data: videos } = await supabase
  .from('videos')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(1);
assert(videos[0].storage_path !== null);
```

#### 2. Unified Video Player
**Features:**
- IVideoPlayer interface implementation
- HTML5PlayerAdapter for uploaded videos
- YouTubePlayerAdapter for YouTube videos
- Seamless source switching
- Consistent controls across sources

**Testing:**
```javascript
// Test adapter switching
await page.goto('/videos/[youtube-video-id]');
await page.waitForSelector('.youtube-player');
await page.goto('/videos/[uploaded-video-id]');
await page.waitForSelector('.html5-player');
```

### Phase 2: Core Annotation System

#### 3. Basic Annotation Creation
**Features:**
- "Add Coaching Event" button
- Timestamp capture (start/end)
- Auto-pause option (user preference)
- Database persistence

**Implementation Details:**
```typescript
interface AnnotationCreation {
  videoId: string;
  timestampStart: number;
  timestampEnd: number;
  createdBy: string;
  autoPause?: boolean;
}
```

#### 4. Quick Action Buttons
**Features:**
- Quick Draw - One-click drawing mode
- Quick Note - Instant note creation
- Quick Loop - Fast loop marking
- Floating action button (FAB) design

**UI Layout:**
```
┌─────────────────────┐
│  Video Player       │
│                     │
│  ╔═══╗ ╔═══╗ ╔═══╗ │ <- Quick Actions Bar
│  ║ ✏️ ║ ║ 📝║ ║ 🔁║ │
│  ╚═══╝ ╚═══╝ ╚═══╝ │
└─────────────────────┘
```

### Phase 3: Component Implementation

#### 5. Canvas Drawing System
**Features:**
- Transparent overlay canvas
- Drawing tools:
  - Pen (multiple colors)
  - Straight line
  - Arrow
  - Rectangle/Circle
  - Text labels
- Undo/Redo functionality
- Responsive scaling based on video dimensions

**Data Structure:**
```typescript
interface DrawingData {
  tools: Array<{
    type: 'pen' | 'line' | 'arrow' | 'rect' | 'circle' | 'text';
    points: Array<{x: number, y: number}>;
    color: string;
    width: number;
  }>;
  originalCanvasWidth: number;
  originalCanvasHeight: number;
}
```

#### 6. Note System
**Features:**
- Rich text editor (basic formatting)
- Markdown support
- Character limit (500 chars)
- Edit history

#### 7. Loop Component
**Features:**
- Visual loop markers on timeline
- Drag to adjust start/end
- Loop count setting
- Preview before saving

#### 8. Tag System
**Features:**
- Predefined categories:
  - Tactical (offense, defense, transition)
  - Technical (passing, shooting, dribbling)
  - Physical (speed, strength, endurance)
  - Mental (decision-making, awareness)
- Custom tags per team
- Auto-complete suggestions
- Bulk tagging

#### 9. Player Mentions
**Features:**
- @ mention interface
- Player search/filter
- Jersey number display
- Multiple selections

### Phase 4: UX Enhancements

#### 10. Keyboard Shortcuts
```
Space     - Play/Pause
E         - New Event
D         - Draw mode
N         - Note mode
L         - Loop mode
T         - Tag mode
1-9       - Quick tag presets
Ctrl+Z    - Undo
Ctrl+S    - Save annotation
← →       - Frame by frame
Shift+←/→ - 5 second jump
```

#### 11. Timeline Visualization
**Features:**
- Color-coded event markers
- Hover preview (tooltip)
- Density indicator for busy sections
- Click to navigate
- Filter by type

**Visual Design:**
```
|----[📝]--[✏️]-[🔁🏷️]----[📝✏️]-------|
0:00                              10:00
```

### Phase 5: Advanced Features

#### 12. Voice Notes
**Features:**
- Browser audio recording
- Supabase Storage for audio files
- Playback speed control
- Optional auto-transcription
- Waveform visualization

**Testing:**
```javascript
// Test microphone permission
await page.evaluate(() => {
  return navigator.mediaDevices.getUserMedia({ audio: true });
});
```

#### 13. Coaching Templates
**Predefined Templates:**
1. **Defensive Analysis**
   - Auto-tags: defense, positioning
   - Pre-selected: drawing tool
   - Focus: player positions

2. **Technique Review**
   - Auto-tags: technique, individual
   - Pre-selected: loop + note
   - Focus: single player

3. **Set Play Breakdown**
   - Auto-tags: tactics, team
   - Pre-selected: drawing + note
   - Focus: team movement

#### 14. Mobile Optimizations
- Larger touch targets (44px minimum)
- Gesture controls:
  - Swipe for timeline navigation
  - Pinch to zoom on drawings
  - Long press for quick actions
- Simplified toolbar
- Voice-first on mobile

### Phase 6: Team Features

#### 15. Team Management UI
**Features:**
- Team creation wizard
- Member invitation system
- Role assignment (coach, player, analyst)
- Permission management
- Team settings

## Testing Strategy

### MCP Testing Approach

#### Backend Testing (Supabase MCP)
For each feature:
1. Create test data
2. Verify database records
3. Check RLS policies
4. Test data relationships
5. Validate data integrity

Example:
```javascript
// After creating annotation with drawing
const { data: annotation } = await supabase
  .from('annotations')
  .select(`
    *,
    annotation_drawings(*),
    annotation_notes(*),
    annotation_tags(*)
  `)
  .single();

assert(annotation.annotation_drawings.length > 0);
assert(annotation.annotation_drawings[0].drawing_data !== null);
```

#### Frontend Testing (Puppeteer MCP)
For each feature:
1. Navigate to feature
2. Perform user actions
3. Verify UI updates
4. Check network requests
5. Validate final state

Example:
```javascript
// Test quick draw action
await page.click('[data-testid="quick-draw"]');
await page.mouse.move(100, 100);
await page.mouse.down();
await page.mouse.move(200, 200);
await page.mouse.up();
await page.click('[data-testid="save-drawing"]');

// Verify drawing saved
await page.waitForSelector('[data-testid="annotation-saved"]');
```

### Performance Benchmarks
- Video load time: < 3 seconds
- Annotation creation: < 500ms
- Drawing responsiveness: 60 FPS
- Timeline scrubbing: Smooth at 30 FPS

### Error Handling
- Network failures: Offline queue
- Invalid inputs: Client-side validation
- Permission errors: Clear user feedback
- Storage limits: Proactive warnings

## Implementation Order

1. **Week 1-2:** Video upload + player (Phase 1)
2. **Week 3-4:** Core annotations + quick actions (Phase 2)
3. **Week 5-6:** Drawing + notes + loops (Phase 3)
4. **Week 7:** Tags + mentions + timeline (Phase 3)
5. **Week 8:** Keyboard shortcuts + templates (Phase 4)
6. **Week 9:** Voice notes + mobile (Phase 5)
7. **Week 10:** Team management (Phase 6)

## Success Metrics
- Time to create annotation: < 10 seconds
- User satisfaction: > 4.5/5
- Feature adoption: > 80% use quick actions
- Performance: < 3% dropped frames during playback
- Reliability: < 0.1% data loss

## Migration Considerations
- Existing video data compatibility
- Progressive enhancement approach
- Feature flags for gradual rollout
- Backwards compatibility for older annotations