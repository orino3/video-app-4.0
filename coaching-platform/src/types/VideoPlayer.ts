export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isReady: boolean;
  error: string | null;
}

export interface VideoPlayerEvents {
  onReady: () => void;
  onPlay: () => void;
  onPause: () => void;
  onTimeUpdate: (time: number) => void;
  onEnded: () => void;
  onError: (error: string) => void;
  onVolumeChange: (volume: number, isMuted: boolean) => void;
}

export interface IVideoPlayer {
  // Core playback controls
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;

  // Volume controls
  setVolume(volume: number): void;
  mute(): void;
  unmute(): void;

  // State getters
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  isMuted(): boolean;
  isPlaying(): boolean;

  // Lifecycle
  initialize(container: HTMLElement): Promise<void>;
  destroy(): void;

  // Event handling
  on<K extends keyof VideoPlayerEvents>(
    event: K,
    handler: VideoPlayerEvents[K]
  ): void;

  off<K extends keyof VideoPlayerEvents>(
    event: K,
    handler: VideoPlayerEvents[K]
  ): void;
}

type EventHandler = (...args: any[]) => void;

export abstract class BaseVideoPlayer implements IVideoPlayer {
  protected container: HTMLElement | null = null;
  protected eventHandlers: Map<keyof VideoPlayerEvents, Set<EventHandler>> =
    new Map();

  abstract play(): Promise<void>;
  abstract pause(): void;
  abstract seek(time: number): void;
  abstract setVolume(volume: number): void;
  abstract mute(): void;
  abstract unmute(): void;
  abstract getCurrentTime(): number;
  abstract getDuration(): number;
  abstract getVolume(): number;
  abstract isMuted(): boolean;
  abstract isPlaying(): boolean;
  abstract initialize(container: HTMLElement): Promise<void>;
  abstract destroy(): void;

  on<K extends keyof VideoPlayerEvents>(
    event: K,
    handler: VideoPlayerEvents[K]
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);
  }

  off<K extends keyof VideoPlayerEvents>(
    event: K,
    handler: VideoPlayerEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }

  protected emit<K extends keyof VideoPlayerEvents>(
    event: K,
    ...args: Parameters<VideoPlayerEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(...args);
      });
    }
  }
}
