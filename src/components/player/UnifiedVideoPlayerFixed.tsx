'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { IVideoPlayer } from '@/types/VideoPlayer';
import { HTML5PlayerAdapter } from '@/lib/video/adapters/HTML5PlayerAdapter';
import { YouTubePlayerAdapter } from '@/lib/video/adapters/YouTubePlayerAdapter';
import { CanvasOverlay } from './CanvasOverlay';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { NoteEditor } from '@/components/annotations/NoteEditor';
import { LoopEditor } from '@/components/annotations/LoopEditor';
import { AnnotationPanel } from '@/components/annotations/AnnotationPanel';
import { CompactTagSelector } from '@/components/annotations/CompactTagSelector';
import { CompactMentionSelector } from '@/components/annotations/CompactMentionSelector';
import { Button } from '@/components/ui/Button';

interface UnifiedVideoPlayerProps {
  video: {
    id: string;
    source: string;
    video_url: string;
    storage_path?: string;
  };
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

export function UnifiedVideoPlayer({
  video,
  onReady,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onError,
}: UnifiedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<IVideoPlayer | null>(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [currentAnnotationId, setCurrentAnnotationId] = useState<string | null>(
    null
  );
  const [pendingDrawingData, setPendingDrawingData] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
  const [activeAnnotation, setActiveAnnotation] = useState<any | null>(null); // Currently active annotation to display
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [pendingAnnotationForNote, setPendingAnnotationForNote] = useState<
    string | null
  >(null);
  const [showLoopEditor, setShowLoopEditor] = useState(false);
  const [pendingAnnotationForLoop, setPendingAnnotationForLoop] = useState<
    string | null
  >(null);
  const [showInlineTagSelector, setShowInlineTagSelector] = useState(false);
  const [pendingAnnotationForTags, setPendingAnnotationForTags] = useState<
    string | null
  >(null);
  const [showInlineMentionSelector, setShowInlineMentionSelector] = useState(false);
  const [pendingAnnotationForMentions, setPendingAnnotationForMentions] =
    useState<string | null>(null);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(false);
  const [currentPanelAnnotation, setCurrentPanelAnnotation] = useState<{
    id: string;
    timestamp: number;
    title: string;
    hasNote: boolean;
    hasDrawing: boolean;
    hasLoop: boolean;
    hasTags: boolean;
    hasMentions: boolean;
  } | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(() => {
    // Load auto-pause preference from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('video-auto-pause');
      return saved === 'true';
    }
    return true; // Default to enabled
  });

  const supabase = createClient();
  const { user, isCoach } = useAuth();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Function to fetch annotations
  const fetchAnnotations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('annotations')
        .select(
          `
          *,
          annotation_notes(id, content),
          annotation_drawings(id, drawing_data, original_canvas_width, original_canvas_height),
          annotation_loops(id, loop_start, loop_end, name),
          annotation_tags(id, tag_name, category),
          annotation_mentions(
            id, 
            team_member_id,
            team_members(
              id,
              pending_player_name,
              is_pending,
              jersey_number,
              users(id, full_name)
            )
          )
        `
        )
        .eq('video_id', video.id)
        .order('timestamp_start', { ascending: true });

      if (error) throw error;

      console.log('Fetched annotations:', data);
      setAnnotations(data || []);
    } catch (err) {
      console.error('Error fetching annotations:', err);
    }
  }, [video.id, supabase]);

  // Fetch annotations for the current video
  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  useEffect(() => {
    const initializePlayer = async () => {
      // Prevent double initialization
      if (
        initializingRef.current ||
        !containerRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      initializingRef.current = true;

      try {
        console.log(
          'UnifiedVideoPlayer: Starting initialization for video:',
          video.id
        );
        setIsLoading(true);
        setError(null);

        // Cleanup previous player if exists
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        // Create appropriate adapter based on video source
        let player: IVideoPlayer;
        switch (video.source) {
          case 'youtube':
            player = new YouTubePlayerAdapter(video.video_url);
            break;
          case 'upload':
            player = new HTML5PlayerAdapter(
              video.video_url,
              video.storage_path
            );
            break;
          default:
            throw new Error(`Unknown video source: ${video.source}`);
        }

        // Set up event handlers before initialization
        player.on('onReady', () => {
          console.log('UnifiedVideoPlayer: onReady event received');
          if (!mountedRef.current) return;

          setIsLoading(false);
          const dur = player.getDuration();
          setDuration(dur);
          console.log('Video duration:', dur);
          onReady?.();
        });

        player.on('onPlay', () => {
          if (!mountedRef.current) return;
          setIsPlaying(true);
          onPlay?.();
        });

        player.on('onPause', () => {
          if (!mountedRef.current) return;
          setIsPlaying(false);
          onPause?.();
        });

        player.on('onTimeUpdate', (time) => {
          if (!mountedRef.current) return;
          setCurrentTime(time);
          onTimeUpdate?.(time);
        });

        player.on('onEnded', () => {
          if (!mountedRef.current) return;
          setIsPlaying(false);
          onEnded?.();
        });

        player.on('onError', (error) => {
          if (!mountedRef.current) return;
          console.error('Player error:', error);
          setError(error);
          setIsLoading(false);
          onError?.(error);
        });

        player.on('onVolumeChange', (volume, muted) => {
          if (!mountedRef.current) return;
          setVolume(volume);
          setIsMuted(muted);
        });

        // Initialize player
        await player.initialize(containerRef.current);

        if (mountedRef.current) {
          playerRef.current = player;
          console.log('Player initialized successfully');
        } else {
          player.destroy();
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize player';
        console.error('Player initialization error:', message);
        if (mountedRef.current) {
          setError(message);
          setIsLoading(false);
          onError?.(message);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    // Small delay to ensure container is ready
    const timer = setTimeout(initializePlayer, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [video.id, video.source, video.video_url]); // Only re-init if video changes

  const handlePlayPause = useCallback(async () => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        await playerRef.current.play();
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (!playerRef.current) return;
    playerRef.current.seek(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(newVolume);
  }, []);

  const handleMuteToggle = useCallback(() => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unmute();
    } else {
      playerRef.current.mute();
    }
  }, [isMuted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAutoPause = useCallback(() => {
    const newValue = !autoPauseEnabled;
    setAutoPauseEnabled(newValue);
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('video-auto-pause', newValue.toString());
    }
    console.log('Auto-pause', newValue ? 'enabled' : 'disabled');
  }, [autoPauseEnabled]);

  const createAnnotation = useCallback(async () => {
    if (!user || !playerRef.current) return;

    setIsCreatingAnnotation(true);
    const timestamp = playerRef.current.getCurrentTime();

    try {
      // Create annotation record
      const { data: annotation, error: annotationError } = await supabase
        .from('annotations')
        .insert({
          video_id: video.id,
          created_by: user.id,
          name: '',
          timestamp_start: timestamp,
          timestamp_end: timestamp,
        })
        .select()
        .single();

      if (annotationError) throw annotationError;

      console.log('Created annotation:', annotation);
      setCurrentAnnotationId(annotation.id);

      // Show annotation panel
      setCurrentPanelAnnotation({
        id: annotation.id,
        timestamp: timestamp,
        title: '',
        hasNote: false,
        hasDrawing: false,
        hasLoop: false,
        hasTags: false,
        hasMentions: false,
      });
      setShowAnnotationPanel(true);

      // Pause the video if auto-pause is enabled
      if (autoPauseEnabled && playerRef.current) {
        playerRef.current.pause();
      }

      // Add to annotations list
      setAnnotations((prev) =>
        [...prev, annotation].sort(
          (a, b) =>
            parseFloat(a.timestamp_start) - parseFloat(b.timestamp_start)
        )
      );
    } catch (err) {
      console.error('Error creating annotation:', err);
      alert('Failed to create annotation');
    } finally {
      setIsCreatingAnnotation(false);
    }
  }, [
    user,
    video.id,
    formatTime,
    supabase,
    pendingDrawingData,
    isPlaying,
    autoPauseEnabled,
  ]);

  const saveDrawingToAnnotation = useCallback(
    async (annotationId: string, drawingData: any) => {
      if (!user) return;

      try {
        const { error: drawingError } = await supabase
          .from('annotation_drawings')
          .insert({
            annotation_id: annotationId,
            drawing_data: {
              dataUrl: drawingData.dataUrl,
              timestamp: drawingData.timestamp,
            },
            original_canvas_width: drawingData.dimensions.width,
            original_canvas_height: drawingData.dimensions.height,
          });

        if (drawingError) throw drawingError;

        console.log('Drawing saved to annotation');

        // Update local annotations list to reflect the drawing
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === annotationId
              ? {
                  ...ann,
                  annotation_drawings: [
                    {
                      id: 'temp-' + Date.now(),
                      drawing_data: {
                        dataUrl: drawingData.dataUrl,
                        timestamp: drawingData.timestamp,
                      },
                      original_canvas_width: drawingData.dimensions.width,
                      original_canvas_height: drawingData.dimensions.height,
                    },
                  ],
                }
              : ann
          )
        );

        // Turn off drawing mode after saving
        setIsDrawingMode(false);

        // Show visual feedback
        console.log('Drawing saved successfully!');

        // Refresh annotations to get the latest data
        setTimeout(() => {
          fetchAnnotations();
        }, 500);
      } catch (err) {
        console.error('Error saving drawing:', err);
        alert('Failed to save drawing');
      }
    },
    [user, supabase, fetchAnnotations]
  );

  const handleDrawingComplete = useCallback(
    async (drawingData: any) => {
      console.log('Drawing completed:', drawingData);

      // If we have an annotation context, save to it
      if (currentAnnotationId || currentPanelAnnotation?.id) {
        const annotationId = currentAnnotationId || currentPanelAnnotation?.id;
        saveDrawingToAnnotation(annotationId!, drawingData);

        // Update panel state if drawing from panel
        if (currentPanelAnnotation) {
          setCurrentPanelAnnotation((prev) =>
            prev ? { ...prev, hasDrawing: true } : null
          );
        }
      } else {
        // No annotation context - create a new annotation for this drawing
        if (!user || !playerRef.current) return;

        const timestamp = playerRef.current.getCurrentTime();

        try {
          // Create annotation record
          const { data: annotation, error: annotationError } = await supabase
            .from('annotations')
            .insert({
              video_id: video.id,
              created_by: user.id,
              name: `Drawing at ${formatTime(timestamp)}`,
              timestamp_start: timestamp,
              timestamp_end: timestamp,
            })
            .select()
            .single();

          if (annotationError) throw annotationError;

          console.log('Created annotation for drawing:', annotation);

          // Save the drawing to the new annotation
          await saveDrawingToAnnotation(annotation.id, drawingData);

          // Add to annotations list with drawing data
          const annotationWithDrawing = {
            ...annotation,
            annotation_drawings: [
              {
                id: 'temp-' + Date.now(),
                drawing_data: {
                  dataUrl: drawingData.dataUrl,
                  timestamp: drawingData.timestamp,
                },
                original_canvas_width: drawingData.dimensions.width,
                original_canvas_height: drawingData.dimensions.height,
              },
            ],
          };

          setAnnotations((prev) =>
            [...prev, annotationWithDrawing].sort(
              (a, b) =>
                parseFloat(a.timestamp_start) - parseFloat(b.timestamp_start)
            )
          );

          // Turn off drawing mode after saving
          setIsDrawingMode(false);

          // Show success feedback
          console.log('Drawing saved successfully to new annotation');

          // Refresh annotations to get server data
          setTimeout(() => {
            fetchAnnotations();
          }, 500);
        } catch (err) {
          console.error('Error saving drawing:', err);
          alert('Failed to save drawing');
        }
      }
    },
    [
      currentAnnotationId,
      currentPanelAnnotation,
      saveDrawingToAnnotation,
      user,
      video.id,
      formatTime,
      supabase,
      fetchAnnotations,
    ]
  );

  const seekToAnnotation = useCallback(
    (annotationId: string, timestamp: number) => {
      if (playerRef.current) {
        playerRef.current.seek(timestamp);
        setSelectedAnnotation(null);

        // Set this annotation as active to display its content
        const annotation = annotations.find((a) => a.id === annotationId);
        if (annotation) {
          setActiveAnnotation(annotation);
          console.log('Active annotation set:', annotation);

          // If it's a loop annotation, auto-play the loop
          if (annotation.annotation_loops?.length > 0) {
            const loop = annotation.annotation_loops[0];
            // TODO: Implement loop playback
          }
        }
      }
    },
    [annotations]
  );

  // Quick Actions
  const quickDraw = useCallback(() => {
    if (!user || !playerRef.current) return;

    // Just enable drawing mode for temporary drawing
    setIsDrawingMode(true);
    // Clear any annotation context so it doesn't auto-save
    setCurrentAnnotationId(null);
    // Don't create annotation - let user decide if they want to save it
  }, [user]);

  const quickNote = useCallback(async () => {
    if (!user || !playerRef.current) return;

    // Create annotation first
    const timestamp = playerRef.current.getCurrentTime();

    try {
      // Create annotation
      const { data: annotation, error: annotationError } = await supabase
        .from('annotations')
        .insert({
          video_id: video.id,
          created_by: user.id,
          name: '',
          timestamp_start: timestamp,
          timestamp_end: timestamp,
        })
        .select()
        .single();

      if (annotationError) throw annotationError;

      // Show note editor
      setPendingAnnotationForNote(annotation.id);
      setShowNoteEditor(true);

      // Pause the video if auto-pause is enabled
      if (autoPauseEnabled && playerRef.current) {
        playerRef.current.pause();
      }

      // Add annotation to list (without note content yet)
      setAnnotations((prev) =>
        [...prev, annotation].sort(
          (a, b) =>
            parseFloat(a.timestamp_start) - parseFloat(b.timestamp_start)
        )
      );
    } catch (err) {
      console.error('Error creating annotation for note:', err);
      alert('Failed to create annotation');
    }
  }, [user, video.id, formatTime, supabase, autoPauseEnabled]);

  const saveNoteContent = useCallback(
    async (content: string) => {
      if (!pendingAnnotationForNote) return;

      try {
        // Check if we're editing an existing note
        const annotation = annotations.find(
          (a) => a.id === pendingAnnotationForNote
        );
        const existingNote = annotation?.annotation_notes?.[0];

        if (existingNote) {
          // Update existing note
          const { error: updateError } = await supabase
            .from('annotation_notes')
            .update({ content: content })
            .eq('id', existingNote.id);

          if (updateError) throw updateError;
        } else {
          // Add new note
          const { error: noteError } = await supabase
            .from('annotation_notes')
            .insert({
              annotation_id: pendingAnnotationForNote,
              content: content,
            });

          if (noteError) throw noteError;
        }

        // Update annotation in list
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === pendingAnnotationForNote
              ? { ...ann, annotation_notes: [{ content }] }
              : ann
          )
        );

        // Close editor
        setShowNoteEditor(false);
        setPendingAnnotationForNote(null);

        // Update panel state if note from panel
        if (currentPanelAnnotation?.id === pendingAnnotationForNote) {
          setCurrentPanelAnnotation((prev) =>
            prev ? { ...prev, hasNote: true } : null
          );
        }
      } catch (err) {
        console.error('Error saving note:', err);
        alert('Failed to save note');
      }
    },
    [pendingAnnotationForNote, annotations, supabase, currentPanelAnnotation]
  );

  const quickLoop = useCallback(async () => {
    if (!user || !playerRef.current) return;

    // Create annotation first
    const currentTime = playerRef.current.getCurrentTime();

    try {
      // Create annotation
      const { data: annotation, error: annotationError } = await supabase
        .from('annotations')
        .insert({
          video_id: video.id,
          created_by: user.id,
          name: '',
          timestamp_start: currentTime,
          timestamp_end: currentTime + 5, // Default 5 second span
        })
        .select()
        .single();

      if (annotationError) throw annotationError;

      // Show loop editor
      setPendingAnnotationForLoop(annotation.id);
      setShowLoopEditor(true);

      // Pause the video if auto-pause is enabled
      if (autoPauseEnabled && playerRef.current) {
        playerRef.current.pause();
      }

      // Add annotation to list (without loop content yet)
      setAnnotations((prev) =>
        [...prev, annotation].sort(
          (a, b) =>
            parseFloat(a.timestamp_start) - parseFloat(b.timestamp_start)
        )
      );
    } catch (err) {
      console.error('Error creating annotation for loop:', err);
      alert('Failed to create annotation');
    }
  }, [user, video.id, formatTime, supabase, autoPauseEnabled]);

  const saveLoopContent = useCallback(
    async (loopStart: number, loopEnd: number, loopName?: string) => {
      if (!pendingAnnotationForLoop) return;

      try {
        // Update annotation timestamps
        const { error: updateError } = await supabase
          .from('annotations')
          .update({
            timestamp_start: loopStart,
            timestamp_end: loopEnd,
            name:
              loopName ||
              `Loop ${formatTime(loopStart)} - ${formatTime(loopEnd)}`,
          })
          .eq('id', pendingAnnotationForLoop);

        if (updateError) throw updateError;

        // Add loop
        const { error: loopError } = await supabase
          .from('annotation_loops')
          .insert({
            annotation_id: pendingAnnotationForLoop,
            loop_start: loopStart,
            loop_end: loopEnd,
            name: loopName || 'Custom Loop',
          });

        if (loopError) throw loopError;

        // Update annotation in list
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === pendingAnnotationForLoop
              ? {
                  ...ann,
                  timestamp_start: loopStart,
                  timestamp_end: loopEnd,
                  annotation_loops: [{}],
                }
              : ann
          )
        );

        // Close editor
        setShowLoopEditor(false);
        setPendingAnnotationForLoop(null);

        // Update panel state if loop from panel
        if (currentPanelAnnotation?.id === pendingAnnotationForLoop) {
          setCurrentPanelAnnotation((prev) =>
            prev ? { ...prev, hasLoop: true } : null
          );
        }
      } catch (err) {
        console.error('Error saving loop:', err);
        alert('Failed to save loop');
      }
    },
    [pendingAnnotationForLoop, supabase, formatTime]
  );

  const previewLoop = useCallback((start: number, end: number) => {
    if (!playerRef.current) return;

    // Seek to start and play
    playerRef.current.seek(start);
    playerRef.current.play();

    // Set timeout to pause at end
    setTimeout(
      () => {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.seek(start); // Return to start
        }
      },
      (end - start) * 1000
    );
  }, []);

  const saveTagsContent = useCallback(
    async (tags: { name: string; category: string }[]) => {
      if (!pendingAnnotationForTags) return;

      try {
        // First, delete existing tags if we're editing
        const annotation = annotations.find(
          (a) => a.id === pendingAnnotationForTags
        );
        if (annotation?.annotation_tags?.length > 0) {
          const { error: deleteError } = await supabase
            .from('annotation_tags')
            .delete()
            .eq('annotation_id', pendingAnnotationForTags);

          if (deleteError) throw deleteError;
        }

        // Save each tag
        for (const tag of tags) {
          const { error: tagError } = await supabase
            .from('annotation_tags')
            .insert({
              annotation_id: pendingAnnotationForTags,
              tag_name: tag.name,
              category: tag.category,
            });

          if (tagError) throw tagError;
        }

        // Update annotation in list
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === pendingAnnotationForTags
              ? {
                  ...ann,
                  annotation_tags: tags.map((t) => ({
                    tag_name: t.name,
                    category: t.category,
                  })),
                }
              : ann
          )
        );

        // Close selector
        setShowInlineTagSelector(false);
        setPendingAnnotationForTags(null);

        // Update panel state if tags from panel
        if (currentPanelAnnotation?.id === pendingAnnotationForTags) {
          setCurrentPanelAnnotation((prev) =>
            prev ? { ...prev, hasTags: tags.length > 0 } : null
          );
        }
      } catch (err) {
        console.error('Error saving tags:', err);
        alert('Failed to save tags');
      }
    },
    [pendingAnnotationForTags, annotations, supabase, currentPanelAnnotation]
  );

  const saveMentionsContent = useCallback(
    async (playerIds: string[]) => {
      if (!pendingAnnotationForMentions) return;

      try {
        // First, delete existing mentions if we're editing
        const annotation = annotations.find(
          (a) => a.id === pendingAnnotationForMentions
        );
        if (annotation?.annotation_mentions?.length > 0) {
          const { error: deleteError } = await supabase
            .from('annotation_mentions')
            .delete()
            .eq('annotation_id', pendingAnnotationForMentions);

          if (deleteError) throw deleteError;
        }

        // Save each mention
        if (playerIds.length > 0 && user) {
          const mentions = playerIds.map(playerId => ({
            annotation_id: pendingAnnotationForMentions,
            team_member_id: playerId,
            user_id: user.id,
          }));
          
          const { error: mentionError } = await supabase
            .from('annotation_mentions')
            .insert(mentions);

          if (mentionError) {
            console.error('Mention insert error:', mentionError);
            throw mentionError;
          }
        }

        // Update annotation in list
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === pendingAnnotationForMentions
              ? {
                  ...ann,
                  annotation_mentions: playerIds.map((id) => ({
                    team_member_id: id,
                    user_id: user?.id || '',
                  })),
                }
              : ann
          )
        );

        // Close selector
        setShowInlineMentionSelector(false);
        setPendingAnnotationForMentions(null);

        // Update panel state if mentions from panel
        if (currentPanelAnnotation?.id === pendingAnnotationForMentions) {
          setCurrentPanelAnnotation((prev) =>
            prev ? { ...prev, hasMentions: playerIds.length > 0 } : null
          );
        }

        // Refresh annotations to get the latest data
        setTimeout(() => {
          fetchAnnotations();
        }, 500);
      } catch (err) {
        console.error('Error saving mentions:', err);
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? (err as any).message 
          : 'Unknown error occurred';
        alert(`Failed to save mentions: ${errorMessage}`);
      }
    },
    [
      pendingAnnotationForMentions,
      annotations,
      supabase,
      currentPanelAnnotation,
      fetchAnnotations,
      user,
    ]
  );

  const handlePanelAddNote = useCallback(() => {
    if (!currentPanelAnnotation) return;
    setPendingAnnotationForNote(currentPanelAnnotation.id);
    setShowNoteEditor(true);
  }, [currentPanelAnnotation]);

  const handlePanelAddDrawing = useCallback(() => {
    if (!currentPanelAnnotation) return;
    setIsDrawingMode(true);
    setIsPanelMinimized(true); // Auto-minimize when drawing
  }, [currentPanelAnnotation]);

  const handlePanelAddLoop = useCallback(() => {
    if (!currentPanelAnnotation) return;
    setPendingAnnotationForLoop(currentPanelAnnotation.id);
    setShowLoopEditor(true);
  }, [currentPanelAnnotation]);

  const handlePanelAddTags = useCallback(() => {
    if (!currentPanelAnnotation) return;
    setPendingAnnotationForTags(currentPanelAnnotation.id);
    setShowInlineTagSelector(true);
    setShowInlineMentionSelector(false);
  }, [currentPanelAnnotation]);

  const handlePanelAddMentions = useCallback(() => {
    if (!currentPanelAnnotation) return;
    setPendingAnnotationForMentions(currentPanelAnnotation.id);
    setShowInlineMentionSelector(true);
    setShowInlineTagSelector(false);
  }, [currentPanelAnnotation]);

  const handlePanelTitleChange = useCallback(
    (title: string) => {
      if (!currentPanelAnnotation) return;

      setCurrentPanelAnnotation((prev) => (prev ? { ...prev, title } : null));
    },
    [currentPanelAnnotation]
  );

  const handlePanelClose = useCallback(() => {
    setShowAnnotationPanel(false);

    // If no content was added and not editing, remove the annotation
    if (
      currentPanelAnnotation &&
      !editingAnnotation &&
      !currentPanelAnnotation.hasNote &&
      !currentPanelAnnotation.hasDrawing &&
      !currentPanelAnnotation.hasLoop &&
      !currentPanelAnnotation.hasTags &&
      !currentPanelAnnotation.hasMentions &&
      !currentPanelAnnotation.title
    ) {
      setAnnotations((prev) =>
        prev.filter((a) => a.id !== currentPanelAnnotation.id)
      );
      // Also delete from database
      supabase
        .from('annotations')
        .delete()
        .eq('id', currentPanelAnnotation.id)
        .then(() => console.log('Deleted empty annotation'));
    } else {
      // If annotation has content, turn off drawing mode
      setIsDrawingMode(false);
    }

    setCurrentPanelAnnotation(null);
    setCurrentAnnotationId(null);
    setEditingAnnotation(null);
  }, [currentPanelAnnotation, editingAnnotation, supabase]);

  const handlePanelSave = useCallback(async () => {
    if (!currentPanelAnnotation) return;

    // Update the annotation title in the database
    if (currentPanelAnnotation.title) {
      try {
        const { error } = await supabase
          .from('annotations')
          .update({ name: currentPanelAnnotation.title })
          .eq('id', currentPanelAnnotation.id);

        if (error) throw error;

        // Update local annotations list
        setAnnotations((prev) =>
          prev.map((ann) =>
            ann.id === currentPanelAnnotation.id
              ? { ...ann, name: currentPanelAnnotation.title }
              : ann
          )
        );
      } catch (err) {
        console.error('Error updating annotation title:', err);
      }
    }

    // Turn off drawing mode when saving
    setIsDrawingMode(false);

    setShowAnnotationPanel(false);
    setCurrentPanelAnnotation(null);
    setCurrentAnnotationId(null);
  }, [currentPanelAnnotation, supabase]);

  const handleEditAnnotation = useCallback((annotation: any) => {
    console.log('Editing annotation:', annotation);

    // Set the annotation for editing
    setEditingAnnotation(annotation);

    // Populate the panel with existing data
    setCurrentPanelAnnotation({
      id: annotation.id,
      timestamp: parseFloat(annotation.timestamp_start),
      title: annotation.name || '',
      hasNote: annotation.annotation_notes?.length > 0,
      hasDrawing: annotation.annotation_drawings?.length > 0,
      hasLoop: annotation.annotation_loops?.length > 0,
      hasTags: annotation.annotation_tags?.length > 0,
      hasMentions: annotation.annotation_mentions?.length > 0,
    });

    // Show the annotation panel for editing
    setShowAnnotationPanel(true);

    // Pause the video and seek to annotation time
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.seek(parseFloat(annotation.timestamp_start));
    }
  }, []);

  const handleDeleteAnnotation = useCallback(
    async (annotationId: string) => {
      // Find the annotation to check permissions
      const annotation = annotations.find((ann) => ann.id === annotationId);
      if (!annotation) return;

      // Check if user can delete (must be coach or creator)
      const canDelete = isCoach || annotation.created_by === user?.id;

      if (!canDelete) {
        alert('You do not have permission to delete this annotation');
        return;
      }

      // Show confirmation
      setShowDeleteConfirm(annotationId);
    },
    [annotations, isCoach, user]
  );

  const confirmDeleteAnnotation = useCallback(async () => {
    if (!showDeleteConfirm) return;

    try {
      // Soft delete the annotation by setting deleted_at
      const { error } = await supabase
        .from('annotations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', showDeleteConfirm);

      if (error) throw error;

      // Remove from local state
      setAnnotations((prev) =>
        prev.filter((ann) => ann.id !== showDeleteConfirm)
      );

      // Clear confirmation
      setShowDeleteConfirm(null);

      console.log('Annotation soft-deleted successfully');

      // Show success message with recovery info
      alert(
        'Annotation deleted. It can be recovered within 30 days by a coach.'
      );
    } catch (err) {
      console.error('Error deleting annotation:', err);
      alert('Failed to delete annotation. Please try again.');
    }
  }, [showDeleteConfirm, supabase]);

  const handleRunAnnotation = useCallback((annotation: any) => {
    console.log('Running annotation:', annotation);

    // Clear any existing drawing mode
    setIsDrawingMode(false);

    // Close any open panels
    setShowAnnotationPanel(false);
    setShowNoteEditor(false);
    setShowLoopEditor(false);
    setShowInlineTagSelector(false);
    setShowInlineMentionSelector(false);

    // Set this as the active annotation
    setActiveAnnotation(annotation);

    // Seek to the annotation time
    if (playerRef.current) {
      playerRef.current.seek(parseFloat(annotation.timestamp_start));

      // Pause the video to show the annotation
      playerRef.current.pause();
    }

    // If it's a loop annotation, prepare for loop playback
    if (annotation.annotation_loops?.length > 0) {
      const loop = annotation.annotation_loops[0];
      console.log('Loop annotation:', loop);
      // TODO: Implement loop playback functionality
    }
  }, []);

  return (
    <div className="flex gap-4">
      {/* Main Video Container */}
      <div className="flex-1 relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
        {/* Top Toolbar */}
        {!isLoading && !error && user && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-40">
            <div className="flex items-center justify-between">
              {/* Left Controls - Quick Actions and Drawing */}
              {!activeAnnotation ? (
                <div className="flex items-center gap-2">
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg p-1 flex gap-1">
                    {/* Drawing Mode Toggle - Moved from bottom */}
                    <button
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                      className={`px-3 py-1.5 rounded transition-all text-sm flex items-center gap-2 ${
                        isDrawingMode
                          ? 'bg-red-600/90 text-white'
                          : 'text-white/90 hover:text-white hover:bg-white/20'
                      }`}
                      title={
                        isDrawingMode
                          ? 'Stop drawing'
                          : 'Start drawing on video'
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <span className="font-medium">
                        {isDrawingMode ? 'Drawing' : 'Draw'}
                      </span>
                    </button>

                    <div className="w-px bg-white/20" />

                    <button
                      onClick={quickNote}
                      className="text-white/90 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded transition-all text-sm flex items-center gap-2"
                      title="Quick Note - Add a text annotation"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span className="font-medium">Note</span>
                    </button>

                    <div className="w-px bg-white/20" />

                    <button
                      onClick={quickLoop}
                      className="text-white/90 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded transition-all text-sm flex items-center gap-2"
                      title="Quick Loop - Create a 5-second loop"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="font-medium">Loop</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Minimal presentation mode indicator
                <div className="text-white/90 text-sm">
                  <span className="font-medium">Presentation Mode Active</span>
                </div>
              )}

              {/* Right side controls */}
              <div className="flex items-center gap-2">
                {/* Stop presentation button */}
                {activeAnnotation && (
                  <button
                    onClick={() => setActiveAnnotation(null)}
                    className="bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded transition-all text-sm flex items-center gap-2 shadow-lg"
                    title="Stop presentation mode"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                    <span className="font-medium">Stop Presentation</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            style={{ zIndex: 51 }}
          >
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Annotation?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this annotation? This action
                cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDeleteAnnotation}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Safe zone for UI elements - positioned higher to avoid controls */}
        {/* Position at 80px from top to clear top toolbar, centered vertically */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 49 }}
        >
          {/* Note Editor Overlay - shifted left when annotation panel is open */}
          {showNoteEditor && (
            <div
              className={`absolute pointer-events-auto ${showAnnotationPanel ? 'left-1/3' : 'left-1/2'} transform -translate-x-1/2`}
              style={{ top: '80px' }}
            >
              <NoteEditor
                initialContent={(() => {
                  if (pendingAnnotationForNote) {
                    const annotation = annotations.find(
                      (a) => a.id === pendingAnnotationForNote
                    );
                    return annotation?.annotation_notes?.[0]?.content || '';
                  }
                  return '';
                })()}
                onSave={saveNoteContent}
                onCancel={() => {
                  setShowNoteEditor(false);
                  setPendingAnnotationForNote(null);
                }}
                autoFocus={true}
              />
            </div>
          )}

          {/* Loop Editor Overlay - shifted left when annotation panel is open */}
          {showLoopEditor && (
            <div
              className={`absolute pointer-events-auto ${showAnnotationPanel ? 'left-1/3' : 'left-1/2'} transform -translate-x-1/2`}
              style={{ top: '80px' }}
            >
              <LoopEditor
                currentTime={currentTime}
                duration={duration}
                onSave={saveLoopContent}
                onCancel={() => {
                  setShowLoopEditor(false);
                  setPendingAnnotationForLoop(null);
                }}
                onPreview={previewLoop}
              />
            </div>
          )}

          {/* Inline selectors will be rendered in the annotation panel instead */}

          {/* REMOVED - We'll use the unified panel instead */}
        </div>

        {/* Video Container */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video"
          style={{ minHeight: '400px' }}
        >
          {/* Loading overlay - only show if actually loading */}
          {isLoading && !error && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gray-900 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
                <p className="text-sm text-gray-400 mt-2">
                  Video ID: {video.video_url}
                </p>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-gray-900"
              style={{ zIndex: 30 }}
            >
              <div className="text-center p-4">
                <p className="text-red-500 mb-2 font-semibold">
                  Error loading video
                </p>
                <p className="text-white text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  Video ID: {video.video_url}
                </p>
              </div>
            </div>
          )}

          {/* Canvas Overlay for Annotations */}
          {!isLoading && !error && (
            <CanvasOverlay
              isDrawingMode={isDrawingMode}
              onDraw={handleDrawingComplete}
              autoSave={false} // Always show save button for explicit user control
              activeDrawing={activeAnnotation?.annotation_drawings?.[0]}
            />
          )}
        </div>

        {/* Bottom Controls Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent"
          style={{ zIndex: 50 }}
        >
          {/* Progress Bar - Separate from controls for better visibility */}
          <div className="px-4 pb-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider hover:h-2 transition-all"
              disabled={isLoading || !!error}
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`,
              }}
            />
          </div>

          {/* Main Controls */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
                  disabled={isLoading || !!error}
                >
                  {isPlaying ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={handleMuteToggle}
                    className="text-white/80 hover:text-white transition-colors"
                    disabled={isLoading || !!error}
                  >
                    {isMuted ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="w-0 group-hover:w-20 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    disabled={isLoading || !!error}
                  />
                </div>

                {/* Time */}
                <div className="text-white/80 text-sm font-medium tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Auto-pause toggle */}
                <button
                  onClick={toggleAutoPause}
                  className={`text-white/80 hover:text-white transition-colors p-2 rounded ${
                    autoPauseEnabled ? 'bg-white/20' : ''
                  }`}
                  title={
                    autoPauseEnabled
                      ? 'Auto-pause enabled'
                      : 'Auto-pause disabled'
                  }
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {autoPauseEnabled ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                </button>
                {/* Fullscreen button */}
                <button
                  onClick={() => {
                    const container =
                      containerRef.current?.parentElement?.parentElement;
                    if (container) {
                      if (!document.fullscreenElement) {
                        container.requestFullscreen();
                      } else {
                        document.exitFullscreen();
                      }
                    }
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2"
                  title="Toggle fullscreen"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
                {/* Add Event Button - Hide during presentation */}
                {!activeAnnotation && (
                  <button
                    onClick={createAnnotation}
                    className="px-4 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 shadow-lg"
                    disabled={
                      isLoading || !!error || isCreatingAnnotation || !user
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {isCreatingAnnotation ? 'Creating...' : 'Add Event'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Annotation Timeline */}
        {!isLoading && !error && annotations.length > 0 && (
          <div
            className="absolute bottom-20 left-0 right-0 px-4"
            style={{ zIndex: 45 }}
          >
            <div className="relative h-2 bg-gray-700 rounded-full">
              {/* Progress bar background */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {/* Current progress */}
                <div
                  className="h-full bg-gray-500 transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              {/* Annotation markers */}
              {annotations.map((annotation) => {
                const position =
                  (parseFloat(annotation.timestamp_start) / duration) * 100;
                const isHovered = selectedAnnotation === annotation.id;
                const isActive = activeAnnotation?.id === annotation.id;

                return (
                  <div
                    key={annotation.id}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      left: `${position}%`,
                      transform: `translateX(-50%) translateY(-50%)`,
                    }}
                    onMouseEnter={() => setSelectedAnnotation(annotation.id)}
                    onMouseLeave={() => setSelectedAnnotation(null)}
                  >
                    <button
                      onClick={() =>
                        seekToAnnotation(
                          annotation.id,
                          parseFloat(annotation.timestamp_start)
                        )
                      }
                      className={`relative w-3 h-3 rounded-full transition-all ${
                        isHovered ? 'scale-150 z-10' : 'hover:scale-125'
                      } ${isActive ? 'ring-4 ring-white/50' : ''}`}
                      style={{
                        backgroundColor:
                          annotation.annotation_drawings?.length > 0
                            ? '#ef4444'
                            : annotation.annotation_notes?.length > 0
                              ? '#3b82f6'
                              : annotation.annotation_loops?.length > 0
                                ? '#10b981'
                                : annotation.annotation_tags?.length > 0
                                  ? '#9333ea'
                                  : annotation.annotation_mentions?.length > 0
                                    ? '#6366f1'
                                    : '#6b7280',
                      }}
                      title={annotation.name}
                    />
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-auto">
                        {/* Invisible bridge to maintain hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-4" />
                        <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg max-w-xs">
                          <div className="font-medium">
                            {annotation.name &&
                            !annotation.name.startsWith('Annotation at ')
                              ? annotation.name
                              : `Event at ${formatTime(parseFloat(annotation.timestamp_start))}`}
                          </div>
                          {annotation.name &&
                            !annotation.name.startsWith('Annotation at ') && (
                              <div className="text-gray-400 text-xs">
                                {formatTime(
                                  parseFloat(annotation.timestamp_start)
                                )}
                              </div>
                            )}
                          <div className="flex gap-2 mt-1">
                            {annotation.annotation_drawings?.length > 0 && (
                              <span className="text-red-400">Drawing</span>
                            )}
                            {annotation.annotation_notes?.length > 0 && (
                              <span className="text-blue-400">Note</span>
                            )}
                            {annotation.annotation_loops?.length > 0 && (
                              <span className="text-green-400">Loop</span>
                            )}
                            {annotation.annotation_tags?.length > 0 && (
                              <span className="text-purple-400">Tags</span>
                            )}
                            {annotation.annotation_mentions?.length > 0 && (
                              <span className="text-indigo-400">Mentions</span>
                            )}
                          </div>
                          {annotation.annotation_tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {annotation.annotation_tags.map(
                                (tag: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded"
                                  >
                                    {tag.tag_name}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                          {/* Actions */}
                          <div className="flex gap-1 mt-2 pt-2 border-t border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunAnnotation(annotation);
                              }}
                              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                            >
                              Run
                            </button>
                            {(user?.id === annotation.created_by ||
                              isCoach) && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditAnnotation(annotation);
                                  }}
                                  className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAnnotation(annotation.id);
                                  }}
                                  className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                          {/* Arrow - attached to tooltip */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline labels */}
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>{formatTime(0)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Unified Side Panel - For both creating/editing and viewing events */}
      {(activeAnnotation ||
        (showAnnotationPanel && currentPanelAnnotation)) && (
        <div className="w-48 bg-gray-900 shadow-2xl overflow-y-auto rounded-lg max-h-[600px]">
          <div className="p-2 space-y-1.5">
            {/* Header with actions for edit mode */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {showAnnotationPanel && currentPanelAnnotation ? (
                  // Edit mode - editable title
                  <input
                    type="text"
                    value={currentPanelAnnotation.title}
                    onChange={(e) => handlePanelTitleChange(e.target.value)}
                    placeholder="Event title..."
                    className="w-full text-sm font-semibold bg-gray-800 text-white px-2 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  // View mode - display title
                  <h3 className="text-sm font-semibold text-white truncate">
                    {activeAnnotation.name ||
                      `Event at ${formatTime(parseFloat(activeAnnotation.timestamp_start))}`}
                  </h3>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatTime(
                    parseFloat(
                      activeAnnotation?.timestamp_start ||
                        currentPanelAnnotation?.timestamp ||
                        0
                    )
                  )}
                </p>
              </div>
              {showAnnotationPanel && (
                <button
                  onClick={handlePanelClose}
                  className="text-gray-400 hover:text-white ml-2"
                  title="Close"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Content sections - show existing or add new */}
            {/* Drawing */}
            {activeAnnotation?.annotation_drawings?.length > 0 ||
            currentPanelAnnotation?.hasDrawing ? (
              <div className="bg-red-500/10 rounded px-2 py-1 flex items-center gap-1.5">
                <svg
                  className="w-3 h-3 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                <span className="text-xs text-red-400">Drawing</span>
              </div>
            ) : (
              showAnnotationPanel && (
                <button
                  onClick={handlePanelAddDrawing}
                  className="w-full bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">Add Drawing</span>
                </button>
              )
            )}

            {/* Note */}
            {activeAnnotation?.annotation_notes?.length > 0 ||
            currentPanelAnnotation?.hasNote ? (
              <div className="bg-gray-800 rounded p-2">
                <p className="text-xs text-gray-200 leading-relaxed">
                  {activeAnnotation?.annotation_notes?.[0]?.content ||
                    (currentPanelAnnotation?.hasNote ? 'Note added' : '')}
                </p>
                {showAnnotationPanel && (
                  <button
                    onClick={handlePanelAddNote}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Edit Note
                  </button>
                )}
              </div>
            ) : (
              showAnnotationPanel && (
                <button
                  onClick={handlePanelAddNote}
                  className="w-full bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">Add Note</span>
                </button>
              )
            )}

            {/* Loop */}
            {activeAnnotation?.annotation_loops?.length > 0 ||
            currentPanelAnnotation?.hasLoop ? (
              <div className="flex items-center gap-1 text-green-400">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-xs">
                  {activeAnnotation?.annotation_loops?.[0]
                    ? `${formatTime(activeAnnotation.annotation_loops[0].loop_start)}-${formatTime(activeAnnotation.annotation_loops[0].loop_end)}`
                    : 'Loop added'}
                </span>
              </div>
            ) : (
              showAnnotationPanel && (
                <button
                  onClick={handlePanelAddLoop}
                  className="w-full bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
                >
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs text-gray-400">Add Loop</span>
                </button>
              )
            )}

            {/* Tags */}
            {activeAnnotation?.annotation_tags?.length > 0 ||
            currentPanelAnnotation?.hasTags ? (
              <div>
                {showAnnotationPanel && (
                  <button
                    onClick={handlePanelAddTags}
                    className="text-xs text-gray-400 hover:text-white mb-1"
                  >
                    Edit Tags
                  </button>
                )}
                <div className="flex flex-wrap gap-1">
                  {activeAnnotation?.annotation_tags?.map(
                    (tag: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            tag.category === 'offensive'
                              ? '#dc2626'
                              : tag.category === 'defensive'
                                ? '#2563eb'
                                : tag.category === 'transition'
                                  ? '#f59e0b'
                                  : tag.category === 'technical'
                                    ? '#10b981'
                                    : tag.category === 'situational'
                                      ? '#8b5cf6'
                                      : '#6b7280',
                          color: 'white',
                          opacity: 0.9,
                        }}
                      >
                        {tag.tag_name}
                      </span>
                    )
                  ) ||
                    (currentPanelAnnotation?.hasTags && (
                      <span className="text-xs text-gray-400">Tags added</span>
                    ))}
                </div>
              </div>
            ) : (
              showAnnotationPanel && (
                showInlineTagSelector ? (
                  <CompactTagSelector
                    initialTags={(() => {
                      if (pendingAnnotationForTags) {
                        const annotation = annotations.find(
                          (a) => a.id === pendingAnnotationForTags
                        );
                        return (
                          annotation?.annotation_tags?.map((t: any) => ({
                            name: t.tag_name,
                            category: t.category,
                          })) || []
                        );
                      }
                      return [];
                    })()}
                    onSave={saveTagsContent}
                    onCancel={() => {
                      setShowInlineTagSelector(false);
                      setPendingAnnotationForTags(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={handlePanelAddTags}
                    className="w-full bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
                  >
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-xs text-gray-400">Add Tags</span>
                  </button>
                )
              )
            )}

            {/* Player Mentions */}
            {activeAnnotation?.annotation_mentions?.length > 0 ||
            currentPanelAnnotation?.hasMentions ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Players:</p>
                  {showAnnotationPanel && (
                    <button
                      onClick={handlePanelAddMentions}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeAnnotation?.annotation_mentions?.map(
                    (mention: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded"
                      >
                        {mention.team_members?.is_pending
                          ? mention.team_members?.pending_player_name
                          : mention.team_members?.users?.full_name ||
                            `Player ${idx + 1}`}
                      </span>
                    )
                  ) ||
                    (currentPanelAnnotation?.hasMentions && (
                      <span className="text-xs text-gray-400">
                        Players mentioned
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              showAnnotationPanel && (
                showInlineMentionSelector ? (
                  <CompactMentionSelector
                    initialPlayerIds={(() => {
                      if (pendingAnnotationForMentions) {
                        const annotation = annotations.find(
                          (a) => a.id === pendingAnnotationForMentions
                        );
                        return (
                          annotation?.annotation_mentions?.map(
                            (m: any) => m.team_member_id
                          ) || []
                        );
                      }
                      return [];
                    })()}
                    onSave={saveMentionsContent}
                    onCancel={() => {
                      setShowInlineMentionSelector(false);
                      setPendingAnnotationForMentions(null);
                    }}
                  />
                ) : (
                  <button
                    onClick={handlePanelAddMentions}
                    className="w-full bg-gray-800 hover:bg-gray-700 rounded px-2 py-1 flex items-center gap-1.5 transition-colors"
                  >
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="text-xs text-gray-400">Mention Players</span>
                  </button>
                )
              )
            )}

            {/* Save button for edit mode */}
            {showAnnotationPanel && (
              <div className="pt-2 border-t border-gray-700">
                <button
                  onClick={handlePanelSave}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded transition-colors"
                >
                  Save Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Annotation?
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                This annotation will be soft-deleted and can be recovered within
                30 days by a coach.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> All associated content (drawings,
                  notes, loops, tags, and player mentions) will also be removed.
                </p>
              </div>
              {(() => {
                const annotation = annotations.find(
                  (a) => a.id === showDeleteConfirm
                );
                if (!annotation) return null;

                const components = [];
                if (annotation.annotation_drawings?.length > 0)
                  components.push('Drawing');
                if (annotation.annotation_notes?.length > 0)
                  components.push('Note');
                if (annotation.annotation_loops?.length > 0)
                  components.push('Loop');
                if (annotation.annotation_tags?.length > 0)
                  components.push(`${annotation.annotation_tags.length} Tags`);
                if (annotation.annotation_mentions?.length > 0)
                  components.push(
                    `${annotation.annotation_mentions.length} Player Mentions`
                  );

                if (components.length > 0) {
                  return (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">
                        This annotation contains:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {components.map((component, idx) => (
                          <li key={idx}>{component}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAnnotation}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Annotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
