# Revised Implementation Plan - Unified Video Architecture

## Key Architectural Decision: Unified Video Player

The annotation system must work identically for both uploaded videos and YouTube videos. This requires careful architectural planning to abstract the video source while maintaining a consistent user experience.

---

## ARCHITECTURAL OVERVIEW

### Video Source Abstraction

```typescript
interface VideoPlayer {
  play(): void;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
}

// Implementations:
class YouTubeVideoPlayer implements VideoPlayer { }
class HTML5VideoPlayer implements VideoPlayer { }
class VimeoVideoPlayer implements VideoPlayer { } // Future
```

### Unified Component Structure

```
UnifiedVideoPlayer/
├── VideoPlayerContainer.tsx    # Main container
├── VideoCanvas.tsx            # Annotation canvas overlay
├── VideoControls.tsx          # Custom unified controls
├── adapters/
│   ├── YouTubeAdapter.tsx     # YouTube iframe API wrapper
│   ├── HTML5Adapter.tsx       # Native video element wrapper
│   └── VimeoAdapter.tsx       # Future: Vimeo player wrapper
└── hooks/
    └── useVideoPlayer.ts      # Unified player interface
```

---

## PHASE 1: VIDEO MANAGEMENT (REVISED) ✅ Partially Complete

### Feature 1.1: Video Upload System ✅ COMPLETE
- Storage configuration ✅
- Upload component ✅
- Video listing ✅

### Feature 1.2: YouTube Video Integration
**Priority:** HIGH | **Estimated Time:** 2 days | **Must Complete Before Annotations**

#### Implementation Steps:

**Step 1.2.1: YouTube URL Input Component**
- [ ] Create `components/videos/AddYouTubeVideo.tsx`
- [ ] URL validation for YouTube links
- [ ] Extract video ID from various YouTube URL formats
- [ ] Preview YouTube thumbnail

**Verification:**
- [ ] Valid YouTube URLs accepted
- [ ] Invalid URLs rejected with clear error
- [ ] Video ID extracted correctly
- [ ] Thumbnail preview shows

**Step 1.2.2: Save YouTube Videos to Database**
- [ ] Store YouTube video metadata
- [ ] Set source = 'youtube'
- [ ] Store video_id in video_url field
- [ ] Fetch duration from YouTube API (if possible)

**Verification:**
- [ ] YouTube videos saved to database
- [ ] Videos appear in video list
- [ ] Source correctly set to 'youtube'
- [ ] Can distinguish between uploaded and YouTube videos

---

## PHASE 2: UNIFIED VIDEO PLAYER 🎯 Critical

### Feature 2.1: Video Player Abstraction Layer
**Priority:** CRITICAL | **Estimated Time:** 3-4 days

#### Implementation Steps:

**Step 2.1.1: Create Video Player Interface**
- [ ] Define TypeScript interface for video players
- [ ] Create base player hooks
- [ ] Implement event system
- [ ] Handle loading states

**Step 2.1.2: HTML5 Video Adapter**
- [ ] Wrap native video element
- [ ] Implement all interface methods
- [ ] Handle video loading from Storage
- [ ] Event mapping

**Step 2.1.3: YouTube Player Adapter**
- [ ] Load YouTube IFrame API
- [ ] Implement all interface methods
- [ ] Handle YouTube-specific events
- [ ] Sync time precisely

**Step 2.1.4: Unified Player Component**
- [ ] Auto-detect video source
- [ ] Load appropriate adapter
- [ ] Consistent UI regardless of source
- [ ] Handle adapter switching

**Verification:**
- [ ] Both video types play correctly
- [ ] Controls work identically
- [ ] Time sync is accurate
- [ ] Events fire consistently

---

## PHASE 3: UNIFIED ANNOTATION SYSTEM 📝

### Feature 3.1: Canvas Overlay System
**Priority:** HIGH | **Estimated Time:** 3-4 days

#### Implementation Steps:

**Step 3.1.1: Universal Canvas Overlay**
- [ ] Create canvas that works over both video types
- [ ] Handle YouTube iframe z-index issues
- [ ] Responsive scaling for both players
- [ ] Pointer events handling

**Critical Consideration:**
```typescript
// YouTube iframe requires special handling
.youtube-container {
  position: relative;
}
.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none; // For YouTube
  z-index: 10;
}
.annotation-canvas.drawing {
  pointer-events: auto; // When drawing
}
```

**Step 3.1.2: Annotation Data Model**
- [ ] Same structure for all video sources
- [ ] Link annotations to video by video_id (not source)
- [ ] Store canvas dimensions for scaling
- [ ] Time-based annotation system

**Step 3.1.3: Drawing System**
- [ ] Implement drawing tools
- [ ] Work identically on both video types
- [ ] Handle canvas/video size sync
- [ ] Save drawing data uniformly

**Verification:**
- [ ] Canvas overlays both video types
- [ ] Drawing works on YouTube videos
- [ ] Annotations save correctly
- [ ] Scaling maintains accuracy

---

## PHASE 4: SYNCHRONIZED PLAYBACK & CONTROLS

### Feature 4.1: Custom Unified Controls
**Priority:** HIGH | **Estimated Time:** 2-3 days

#### Implementation Steps:

**Step 4.1.1: Custom Control Bar**
- [ ] Hide native YouTube controls
- [ ] Hide native HTML5 controls
- [ ] Create unified control interface
- [ ] Consistent styling

**Step 4.1.2: Time Synchronization**
- [ ] Accurate time tracking for both sources
- [ ] Frame-accurate annotation display
- [ ] Handle buffering states
- [ ] Sync annotation timeline

**Verification:**
- [ ] Controls look identical for both sources
- [ ] Time updates accurately
- [ ] Annotations appear at correct times
- [ ] No control conflicts

---

## CRITICAL IMPLEMENTATION NOTES

### 1. **YouTube IFrame Challenges**
- Cannot directly overlay canvas on iframe
- Must position canvas as sibling element
- Handle click events carefully
- Consider using YouTube's Player API for better control

### 2. **Time Synchronization**
- YouTube API may have slight delays
- Implement polling for accurate time
- Cache current time to reduce API calls
- Consider frame-based timing for precision

### 3. **Storage Strategy**
```typescript
// Videos table remains the same
{
  id: uuid,
  source: 'upload' | 'youtube' | 'vimeo',
  video_url: string, // Storage path OR YouTube ID
  title: string,
  // ... other fields
}

// Annotations work uniformly
{
  video_id: uuid, // Works for ANY video source
  timestamp_start: number,
  timestamp_end: number,
  // ... annotation data
}
```

### 4. **Player Detection Logic**
```typescript
function getVideoPlayer(video: Video) {
  switch(video.source) {
    case 'youtube':
      return new YouTubeAdapter(video.video_url);
    case 'upload':
      return new HTML5Adapter(video.storage_path);
    default:
      throw new Error(`Unsupported source: ${video.source}`);
  }
}
```

---

## IMPLEMENTATION ORDER (REVISED)

1. **First:** Complete YouTube video adding (Feature 1.2)
2. **Second:** Build video player abstraction (Feature 2.1)
3. **Third:** Implement unified canvas system (Feature 3.1)
4. **Fourth:** Create custom controls (Feature 4.1)
5. **Then:** Continue with annotations, loops, etc.

---

## SUCCESS CRITERIA

### Must Have:
- ✅ User cannot tell if video is YouTube or uploaded when viewing
- ✅ Annotations work identically on both sources
- ✅ Drawing on YouTube videos works smoothly
- ✅ Time sync is accurate within 0.1 seconds
- ✅ Controls are unified and consistent

### Nice to Have:
- Offline support for uploaded videos
- YouTube video caching
- Vimeo support ready to add
- Mobile gesture support

---

## DEVELOPMENT APPROACH

1. **Build for abstraction first** - Don't couple to video source
2. **Test with both sources constantly** - Every feature must work on both
3. **Handle edge cases** - YouTube API failures, CORS issues, etc.
4. **Maintain performance** - Canvas operations must be smooth
5. **Think mobile-first** - Touch events on both video types

---

*This unified approach ensures that users have a consistent experience regardless of video source, making the platform more powerful and flexible.*