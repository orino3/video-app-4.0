import { BaseVideoPlayer } from '@/types/VideoPlayer';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export class YouTubePlayerAdapter extends BaseVideoPlayer {
  private player: any = null;
  private videoId: string;
  private playerReady: boolean = false;
  private playbackTimer: number | null = null;

  constructor(videoId: string) {
    super();
    this.videoId = videoId;
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    // Create container div for YouTube player
    const playerDiv = document.createElement('div');
    playerDiv.id = `youtube-player-${this.videoId}`;
    container.appendChild(playerDiv);

    // Load YouTube API if not already loaded
    await this.loadYouTubeAPI();

    // Create player
    return new Promise((resolve, reject) => {
      try {
        this.player = new window.YT.Player(playerDiv.id, {
          videoId: this.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              console.log('YouTube player onReady event fired');
              this.playerReady = true;
              this.emit('onReady');
              resolve();
            },
            onStateChange: (event: any) => {
              this.handleStateChange(event);
            },
            onError: (event: any) => {
              const errorMessages: { [key: number]: string } = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found',
                101: 'Video not allowed to be played in embedded players',
                150: 'Video not allowed to be played in embedded players',
              };
              const message =
                errorMessages[event.data] || 'Unknown YouTube error';
              this.emit('onError', message);
              reject(new Error(message));
            },
          },
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async loadYouTubeAPI(): Promise<void> {
    if (window.YT && window.YT.Player) {
      return;
    }

    return new Promise((resolve) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  }

  private handleStateChange(event: any): void {
    const YT = window.YT;

    switch (event.data) {
      case YT.PlayerState.PLAYING:
        this.startTimeUpdateTimer();
        this.emit('onPlay');
        break;
      case YT.PlayerState.PAUSED:
        this.stopTimeUpdateTimer();
        this.emit('onPause');
        break;
      case YT.PlayerState.ENDED:
        this.stopTimeUpdateTimer();
        this.emit('onEnded');
        break;
    }
  }

  private startTimeUpdateTimer(): void {
    this.stopTimeUpdateTimer();
    this.playbackTimer = window.setInterval(() => {
      if (this.player && this.playerReady) {
        this.emit('onTimeUpdate', this.player.getCurrentTime());
      }
    }, 100); // Update every 100ms
  }

  private stopTimeUpdateTimer(): void {
    if (this.playbackTimer !== null) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  async play(): Promise<void> {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.playVideo();
  }

  pause(): void {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.pauseVideo();
  }

  seek(time: number): void {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.seekTo(time, true);
  }

  setVolume(volume: number): void {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.setVolume(volume * 100); // YouTube uses 0-100
    this.emit('onVolumeChange', volume, this.isMuted());
  }

  mute(): void {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.mute();
    this.emit('onVolumeChange', this.getVolume(), true);
  }

  unmute(): void {
    if (!this.player || !this.playerReady)
      throw new Error('Player not initialized');
    this.player.unMute();
    this.emit('onVolumeChange', this.getVolume(), false);
  }

  getCurrentTime(): number {
    if (!this.player || !this.playerReady) return 0;
    return this.player.getCurrentTime() || 0;
  }

  getDuration(): number {
    if (!this.player || !this.playerReady) return 0;
    return this.player.getDuration() || 0;
  }

  getVolume(): number {
    if (!this.player || !this.playerReady) return 1;
    return this.player.getVolume() / 100; // Convert from 0-100 to 0-1
  }

  isMuted(): boolean {
    if (!this.player || !this.playerReady) return false;
    return this.player.isMuted();
  }

  isPlaying(): boolean {
    if (!this.player || !this.playerReady) return false;
    return this.player.getPlayerState() === window.YT?.PlayerState?.PLAYING;
  }

  destroy(): void {
    this.stopTimeUpdateTimer();
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
    this.playerReady = false;
    this.container = null;
    this.eventHandlers.clear();
  }
}
