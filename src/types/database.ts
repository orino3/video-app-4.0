export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      annotation_drawings: {
        Row: {
          annotation_id: string;
          created_at: string;
          drawing_data: Json;
          id: string;
          original_canvas_height: number;
          original_canvas_width: number;
          updated_at: string;
        };
        Insert: {
          annotation_id: string;
          created_at?: string;
          drawing_data: Json;
          id?: string;
          original_canvas_height: number;
          original_canvas_width: number;
          updated_at?: string;
        };
        Update: {
          annotation_id?: string;
          created_at?: string;
          drawing_data?: Json;
          id?: string;
          original_canvas_height?: number;
          original_canvas_width?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'annotation_drawings_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
        ];
      };
      annotation_loops: {
        Row: {
          annotation_id: string;
          created_at: string;
          id: string;
          loop_end: number;
          loop_start: number;
          name: string | null;
          updated_at: string;
        };
        Insert: {
          annotation_id: string;
          created_at?: string;
          id?: string;
          loop_end: number;
          loop_start: number;
          name?: string | null;
          updated_at?: string;
        };
        Update: {
          annotation_id?: string;
          created_at?: string;
          id?: string;
          loop_end?: number;
          loop_start?: number;
          name?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'annotation_loops_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
        ];
      };
      annotation_mentions: {
        Row: {
          annotation_id: string;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
          team_member_id: string | null;
        };
        Insert: {
          annotation_id: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
          team_member_id?: string | null;
        };
        Update: {
          annotation_id?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
          team_member_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'annotation_mentions_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'annotation_mentions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      annotation_notes: {
        Row: {
          annotation_id: string;
          content: string;
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          annotation_id: string;
          content: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          annotation_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'annotation_notes_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
        ];
      };
      annotation_tags: {
        Row: {
          annotation_id: string;
          category: string | null;
          created_at: string;
          id: string;
          tag_name: string;
          updated_at: string;
        };
        Insert: {
          annotation_id: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          tag_name: string;
          updated_at?: string;
        };
        Update: {
          annotation_id?: string;
          category?: string | null;
          created_at?: string;
          id?: string;
          tag_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'annotation_tags_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
        ];
      };
      annotations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string | null;
          timestamp_end: number;
          timestamp_start: number;
          updated_at: string;
          video_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string | null;
          timestamp_end: number;
          timestamp_start: number;
          updated_at?: string;
          video_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string | null;
          timestamp_end?: number;
          timestamp_start?: number;
          updated_at?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'annotations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'annotations_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      auto_compilation_rules: {
        Row: {
          auto_share_to_parents: boolean | null;
          created_at: string;
          created_by: string;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          rule_config: Json;
          rule_name: string;
          rule_type: string;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          auto_share_to_parents?: boolean | null;
          created_at?: string;
          created_by: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          rule_config: Json;
          rule_name: string;
          rule_type: string;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          auto_share_to_parents?: boolean | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          rule_config?: Json;
          rule_name?: string;
          rule_type?: string;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'auto_compilation_rules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'auto_compilation_rules_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      compilation_items: {
        Row: {
          annotation_id: string | null;
          compilation_id: string;
          created_at: string;
          end_time: number | null;
          id: string;
          order_index: number;
          start_time: number | null;
          title: string | null;
          video_id: string | null;
        };
        Insert: {
          annotation_id?: string | null;
          compilation_id: string;
          created_at?: string;
          end_time?: number | null;
          id?: string;
          order_index?: number;
          start_time?: number | null;
          title?: string | null;
          video_id?: string | null;
        };
        Update: {
          annotation_id?: string | null;
          compilation_id?: string;
          created_at?: string;
          end_time?: number | null;
          id?: string;
          order_index?: number;
          start_time?: number | null;
          title?: string | null;
          video_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'compilation_items_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'compilation_items_compilation_id_fkey';
            columns: ['compilation_id'];
            isOneToOne: false;
            referencedRelation: 'video_compilations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'compilation_items_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      external_viewers: {
        Row: {
          id: string;
          ip_address: unknown | null;
          session_duration: number | null;
          share_id: string;
          user_agent: string | null;
          viewed_at: string;
          viewer_email: string | null;
          viewer_name: string | null;
        };
        Insert: {
          id?: string;
          ip_address?: unknown | null;
          session_duration?: number | null;
          share_id: string;
          user_agent?: string | null;
          viewed_at?: string;
          viewer_email?: string | null;
          viewer_name?: string | null;
        };
        Update: {
          id?: string;
          ip_address?: unknown | null;
          session_duration?: number | null;
          share_id?: string;
          user_agent?: string | null;
          viewed_at?: string;
          viewer_email?: string | null;
          viewer_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'external_viewers_share_id_fkey';
            columns: ['share_id'];
            isOneToOne: false;
            referencedRelation: 'public_shares';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      public_shares: {
        Row: {
          allow_download: boolean | null;
          annotation_id: string | null;
          compilation_id: string | null;
          created_at: string;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          max_views: number | null;
          message: string | null;
          password_protected: boolean | null;
          share_password: string | null;
          share_token: string;
          show_player_names: boolean | null;
          show_team_info: boolean | null;
          team_id: string;
          title: string;
          updated_at: string;
          video_id: string | null;
          view_count: number | null;
        };
        Insert: {
          allow_download?: boolean | null;
          annotation_id?: string | null;
          compilation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          max_views?: number | null;
          message?: string | null;
          password_protected?: boolean | null;
          share_password?: string | null;
          share_token?: string;
          show_player_names?: boolean | null;
          show_team_info?: boolean | null;
          team_id: string;
          title: string;
          updated_at?: string;
          video_id?: string | null;
          view_count?: number | null;
        };
        Update: {
          allow_download?: boolean | null;
          annotation_id?: string | null;
          compilation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          max_views?: number | null;
          message?: string | null;
          password_protected?: boolean | null;
          share_password?: string | null;
          share_token?: string;
          show_player_names?: boolean | null;
          show_team_info?: boolean | null;
          team_id?: string;
          title?: string;
          updated_at?: string;
          video_id?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'public_shares_annotation_id_fkey';
            columns: ['annotation_id'];
            isOneToOne: false;
            referencedRelation: 'annotations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_shares_compilation_id_fkey';
            columns: ['compilation_id'];
            isOneToOne: false;
            referencedRelation: 'video_compilations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_shares_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_shares_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'public_shares_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      share_notifications: {
        Row: {
          created_at: string;
          id: string;
          notification_type: string;
          opened_at: string | null;
          player_id: string | null;
          recipient_email: string;
          recipient_name: string | null;
          sent_at: string | null;
          share_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notification_type: string;
          opened_at?: string | null;
          player_id?: string | null;
          recipient_email: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          share_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notification_type?: string;
          opened_at?: string | null;
          player_id?: string | null;
          recipient_email?: string;
          recipient_name?: string | null;
          sent_at?: string | null;
          share_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'share_notifications_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'share_notifications_share_id_fkey';
            columns: ['share_id'];
            isOneToOne: false;
            referencedRelation: 'public_shares';
            referencedColumns: ['id'];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          id: string;
          jersey_number: string | null;
          role: string;
          team_id: string;
          updated_at: string;
          user_id: string | null;
          is_pending: boolean;
          pending_player_name: string | null;
          pending_player_position: string | null;
          claimed_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          jersey_number?: string | null;
          role: string;
          team_id: string;
          updated_at?: string;
          user_id?: string | null;
          is_pending?: boolean;
          pending_player_name?: string | null;
          pending_player_position?: string | null;
          claimed_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          jersey_number?: string | null;
          role?: string;
          team_id?: string;
          updated_at?: string;
          user_id?: string | null;
          is_pending?: boolean;
          pending_player_name?: string | null;
          pending_player_position?: string | null;
          claimed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      team_invitations: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          role: string;
          invited_by: string | null;
          accepted: boolean;
          accepted_at: string | null;
          accepted_by: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          email: string;
          role: string;
          invited_by?: string | null;
          accepted?: boolean;
          accepted_at?: string | null;
          accepted_by?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          email?: string;
          role?: string;
          invited_by?: string | null;
          accepted?: boolean;
          accepted_at?: string | null;
          accepted_by?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'team_invitations_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_invitations_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_invitations_accepted_by_fkey';
            columns: ['accepted_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          organization_id: string | null;
          owner_id: string | null;
          sport: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          organization_id?: string | null;
          owner_id?: string | null;
          sport: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          organization_id?: string | null;
          owner_id?: string | null;
          sport?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      video_compilations: {
        Row: {
          compilation_type: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          team_id: string;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          compilation_type: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          team_id: string;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          compilation_type?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          team_id?: string;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_compilations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_compilations_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      videos: {
        Row: {
          created_at: string;
          duration: number | null;
          id: string;
          source: string;
          team_id: string;
          title: string;
          updated_at: string;
          uploaded_by: string | null;
          video_url: string;
        };
        Insert: {
          created_at?: string;
          duration?: number | null;
          id?: string;
          source: string;
          team_id: string;
          title: string;
          updated_at?: string;
          uploaded_by?: string | null;
          video_url: string;
        };
        Update: {
          created_at?: string;
          duration?: number | null;
          id?: string;
          source?: string;
          team_id?: string;
          title?: string;
          updated_at?: string;
          uploaded_by?: string | null;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'videos_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'videos_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      video_shares: {
        Row: {
          id: string;
          video_id: string;
          shared_to_team_id: string;
          shared_by: string;
          shared_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          shared_to_team_id: string;
          shared_by: string;
          shared_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          shared_to_team_id?: string;
          shared_by?: string;
          shared_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'video_shares_video_id_fkey';
            columns: ['video_id'];
            isOneToOne: false;
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_shares_shared_to_team_id_fkey';
            columns: ['shared_to_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'video_shares_shared_by_fkey';
            columns: ['shared_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_shared_content: {
        Args: { share_token_param: string };
        Returns: Json;
      };
      record_external_view: {
        Args: {
          share_token_param: string;
          viewer_email_param?: string;
          viewer_name_param?: string;
          ip_address_param?: unknown;
          user_agent_param?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
