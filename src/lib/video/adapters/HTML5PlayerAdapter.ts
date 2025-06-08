import { BaseVideoPlayer } from '@/types/VideoPlayer';
import { createClient } from '@/lib/supabase/client';

export class HTML5PlayerAdapter extends BaseVideoPlayer {
  private video: HTMLVideoElement | null = null;
  private videoUrl: string;
  private storagePath?: string;
  private supabase = createClient();
  private eventHandlersMap = new Map<string, EventListener>();

  constructor(videoUrl: string, storagePath?: string) {
    super();
    this.videoUrl = videoUrl;
    this.storagePath = storagePath;
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    // Create video element
    this.video = document.createElement('video');
    this.video.className = 'w-full h-full';
    this.video.controls = false; // We'll use custom controls

    // Get signed URL from Supabase storage
    if (this.storagePath) {
      const { data: signedUrlData, error } = await this.supabase.storage
        .from('videos')
        .createSignedUrl(this.storagePath, 3600); // 1 hour expiry

      if (error) {
        this.emit('onError', error.message);
        throw error;
      }

      this.video.src = signedUrlData.signedUrl;
    } else {
      this.video.src = this.videoUrl;
    }

    // Set up event listeners
    this.setupEventListeners();

    // Append to container
    container.appendChild(this.video);

    // Load video metadata
    this.video.load();
  }

  private setupEventListeners(): void {
    if (!this.video) return;

    // Helper to add event listener and store reference
    const addListener = (event: string, handler: EventListener) => {
      this.video!.addEventListener(event, handler);
      this.eventHandlersMap.set(event, handler);
    };

    addListener('loadedmetadata', () => {
      this.emit('onReady');
    });

    addListener('play', () => {
      this.emit('onPlay');
    });

    addListener('pause', () => {
      this.emit('onPause');
    });

    addListener('timeupdate', () => {
      if (this.video) {
        this.emit('onTimeUpdate', this.video.currentTime);
      }
    });

    addListener('ended', () => {
      this.emit('onEnded');
    });

    addListener('error', (e) => {
      const error = this.video?.error;
      const message = error
        ? `Video error: ${error.message}`
        : 'Unknown video error';
      this.emit('onError', message);
    });

    addListener('volumechange', () => {
      if (this.video) {
        this.emit('onVolumeChange', this.video.volume, this.video.muted);
      }
    });
  }

  async play(): Promise<void> {
    if (!this.video) throw new Error('Video not initialized');
    await this.video.play();
  }

  pause(): void {
    if (!this.video) throw new Error('Video not initialized');
    this.video.pause();
  }

  seek(time: number): void {
    if (!this.video) throw new Error('Video not initialized');
    this.video.currentTime = time;
  }

  setVolume(volume: number): void {
    if (!this.video) throw new Error('Video not initialized');
    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  mute(): void {
    if (!this.video) throw new Error('Video not initialized');
    this.video.muted = true;
  }

  unmute(): void {
    if (!this.video) throw new Error('Video not initialized');
    this.video.muted = false;
  }

  getCurrentTime(): number {
    return this.video?.currentTime || 0;
  }

  getDuration(): number {
    return this.video?.duration || 0;
  }

  getVolume(): number {
    return this.video?.volume || 1;
  }

  isMuted(): boolean {
    return this.video?.muted || false;
  }

  isPlaying(): boolean {
    return this.video ? !this.video.paused && !this.video.ended : false;
  }

  destroy(): void {
    if (this.video) {
      // Remove all event listeners
      this.eventHandlersMap.forEach((handler, event) => {
        this.video?.removeEventListener(event, handler);
      });
      this.eventHandlersMap.clear();

      // Stop and cleanup video
      this.video.pause();
      this.video.src = '';
      this.video.load(); // Reset the video element
      this.video.remove();
      this.video = null;
    }
    this.container = null;
    this.eventHandlers.clear();
  }
}
