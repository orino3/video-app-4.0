# Unified Video Player - Implementation Example

## Visual Architecture

```
┌─────────────────────────────────────────────────┐
│          UnifiedVideoPlayer Component           │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │          Video Container                   │ │
│  │                                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐ │ │
│  │  │                 │  │                 │ │ │
│  │  │  YouTube Iframe │  │  <video> tag   │ │ │
│  │  │   (if YouTube)  │  │  (if uploaded) │ │ │
│  │  │                 │  │                 │ │ │
│  │  └─────────────────┘  └─────────────────┘ │ │
│  │                                            │ │
│  │  ┌─────────────────────────────────────┐  │ │
│  │  │   Canvas Overlay (annotations)      │  │ │
│  │  │   position: absolute                │  │ │
│  │  │   pointer-events: none/auto         │  │ │
│  │  └─────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │        Unified Control Bar                │ │
│  │  [▶] [⏸] [━━━━━━●━━] [🔊] [⚙️] [⛶]      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Code Structure Example

```typescript
// UnifiedVideoPlayer.tsx
export function UnifiedVideoPlayer({ video }: { video: Video }) {
  const [player, setPlayer] = useState<VideoPlayerAdapter | null>(null);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load appropriate adapter based on video source
    const loadPlayer = async () => {
      let adapter: VideoPlayerAdapter;
      
      switch (video.source) {
        case 'youtube':
          adapter = new YouTubePlayerAdapter(video.video_url);
          break;
        case 'upload':
          adapter = new HTML5PlayerAdapter(video.video_url, video.storage_path);
          break;
        default:
          throw new Error(`Unknown video source: ${video.source}`);
      }
      
      await adapter.initialize();
      setPlayer(adapter);
      setIsReady(true);
    };
    
    loadPlayer();
  }, [video]);

  return (
    <div className="unified-video-player">
      <div className="video-container">
        {/* Render appropriate video element */}
        {video.source === 'youtube' && (
          <div id={`youtube-player-${video.id}`} />
        )}
        {video.source === 'upload' && (
          <video id={`html5-player-${video.id}`} />
        )}
        
        {/* Canvas overlay for annotations */}
        <canvas 
          ref={canvasRef}
          className="annotation-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Changes to 'auto' when drawing
          }}
        />
      </div>
      
      {/* Unified controls */}
      <UnifiedVideoControls player={player} />
    </div>
  );
}
```

## Adapter Implementation Example

```typescript
// adapters/YouTubePlayerAdapter.ts
export class YouTubePlayerAdapter implements VideoPlayerAdapter {
  private player: YT.Player | null = null;
  private videoId: string;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(videoId: string) {
    this.videoId = videoId;
  }

  async initialize(): Promise<void> {
    await this.loadYouTubeAPI();
    
    return new Promise((resolve) => {
      this.player = new YT.Player(`youtube-player-${this.videoId}`, {
        videoId: this.videoId,
        playerVars: {
          controls: 0, // Hide YouTube controls
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => resolve(),
          onStateChange: (event) => this.handleStateChange(event),
        },
      });
    });
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() || 0;
  }

  seek(time: number): void {
    this.player?.seekTo(time, true);
  }

  // ... more methods
}
```

## Usage in Components

```typescript
// VideoPage.tsx
export function VideoPage({ videoId }: { videoId: string }) {
  const { data: video } = useQuery(['video', videoId], fetchVideo);
  const { data: annotations } = useQuery(['annotations', videoId], fetchAnnotations);

  if (!video) return <Loading />;

  return (
    <div>
      {/* Same component handles ALL video types */}
      <UnifiedVideoPlayer video={video} />
      
      {/* Annotations work the same for ALL video types */}
      <AnnotationPanel 
        videoId={videoId} 
        annotations={annotations}
      />
    </div>
  );
}
```

## Key Benefits Illustrated

1. **Single Component** - One `UnifiedVideoPlayer` for all sources
2. **Consistent Interface** - Same props, same events, same methods
3. **Transparent to Features** - Annotations don't know/care about video source
4. **Easy to Extend** - Add Vimeo? Just create `VimeoPlayerAdapter`
5. **Unified Experience** - Users see the same UI regardless of source

## Canvas Overlay Magic

The canvas overlay is the secret sauce that makes annotations work uniformly:

```css
.video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10; /* Above video, below controls */
}

/* Critical for YouTube */
.youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

This architecture ensures that whether drawing on a YouTube video or an uploaded video, the experience is **exactly the same**.