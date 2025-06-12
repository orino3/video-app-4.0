import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface EventProperties {
  [key: string]: any;
}

export function useMonitoring() {
  const { user } = useAuth();
  const supabase = createClient();
  const activeTeam = useAuth().getActiveTeam();

  const logEvent = async (event: string, properties?: EventProperties) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Event:', event, properties);
      return;
    }

    // Note: analytics_events table doesn't exist in the current schema
    // This feature would require creating the table first
    // For now, just log to console
    console.log('📊 Event (production):', event, properties);
  };

  const trackError = (error: Error, context?: EventProperties) => {
    console.error('Application error:', error);
    
    // Log error details to console with context
    if (context) {
      console.error('Error context:', context);
    }
    
    // In production, you might want to send this to a different error tracking service
    // For now, we'll just log it
  };

  const trackPerformance = (name: string, duration: number, properties?: EventProperties) => {
    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Performance: ${name} took ${duration}ms`, properties);
    }
    
    // In production, you might want to send this to an analytics service
    // For now, we'll just log it
  };

  return {
    logEvent,
    trackError,
    trackPerformance,
  };
}

// Pre-defined event names for consistency
export const EVENTS = {
  // Video events
  VIDEO_UPLOADED: 'video_uploaded',
  VIDEO_DELETED: 'video_deleted',
  VIDEO_VIEWED: 'video_viewed',
  
  // Annotation events
  ANNOTATION_CREATED: 'annotation_created',
  ANNOTATION_DELETED: 'annotation_deleted',
  DRAWING_CREATED: 'drawing_created',
  NOTE_CREATED: 'note_created',
  LOOP_CREATED: 'loop_created',
  TAG_ADDED: 'tag_added',
  PLAYER_MENTIONED: 'player_mentioned',
  
  // Team events
  TEAM_CREATED: 'team_created',
  TEAM_MEMBER_INVITED: 'team_member_invited',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
  
  // Auth events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
} as const;