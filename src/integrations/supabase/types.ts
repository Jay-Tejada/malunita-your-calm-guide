export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_usage_logs: {
        Row: {
          created_at: string
          estimated_cost: number
          function_name: string
          id: string
          model_used: string
          tokens_used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_cost: number
          function_name: string
          id?: string
          model_used: string
          tokens_used: number
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_cost?: number
          function_name?: string
          id?: string
          model_used?: string
          tokens_used?: number
          user_id?: string
        }
        Relationships: []
      }
      category_keywords: {
        Row: {
          created_at: string
          custom_category_id: string
          id: string
          keyword: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_category_id: string
          id?: string
          keyword: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_category_id?: string
          id?: string
          keyword?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_keywords_custom_category_id_fkey"
            columns: ["custom_category_id"]
            isOneToOne: false
            referencedRelation: "custom_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_history: {
        Row: {
          audio_played: boolean | null
          content: string
          created_at: string
          id: string
          mood: string | null
          role: string
          session_id: string
          user_id: string
          was_saved: boolean | null
        }
        Insert: {
          audio_played?: boolean | null
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          role: string
          session_id: string
          user_id: string
          was_saved?: boolean | null
        }
        Update: {
          audio_played?: boolean | null
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          role?: string
          session_id?: string
          user_id?: string
          was_saved?: boolean | null
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_focus_history: {
        Row: {
          cluster_label: string | null
          created_at: string
          date: string
          focus_task: string
          id: string
          note: string | null
          outcome: string
          user_id: string
        }
        Insert: {
          cluster_label?: string | null
          created_at?: string
          date: string
          focus_task: string
          id?: string
          note?: string | null
          outcome: string
          user_id: string
        }
        Update: {
          cluster_label?: string | null
          created_at?: string
          date?: string
          focus_task?: string
          id?: string
          note?: string | null
          outcome?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_sessions: {
        Row: {
          created_at: string
          date: string
          deep_work_blocks: Json | null
          id: string
          idea_dump_processed: Json | null
          idea_dump_raw: string | null
          priority_three: string | null
          priority_two: string | null
          reflection_gratitude: string | null
          reflection_improve: string | null
          reflection_wins: string | null
          tomorrow_focus: string | null
          top_focus: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          deep_work_blocks?: Json | null
          id?: string
          idea_dump_processed?: Json | null
          idea_dump_raw?: string | null
          priority_three?: string | null
          priority_two?: string | null
          reflection_gratitude?: string | null
          reflection_improve?: string | null
          reflection_wins?: string | null
          tomorrow_focus?: string | null
          top_focus?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          deep_work_blocks?: Json | null
          id?: string
          idea_dump_processed?: Json | null
          idea_dump_raw?: string | null
          priority_three?: string | null
          priority_two?: string | null
          reflection_gratitude?: string | null
          reflection_improve?: string | null
          reflection_wins?: string | null
          tomorrow_focus?: string | null
          top_focus?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_embeddings: {
        Row: {
          cluster_label: string | null
          created_at: string
          embedding: string | null
          id: string
          outcome: string | null
          task_id: string | null
          task_text: string
          unlocks_count: number | null
          user_id: string
        }
        Insert: {
          cluster_label?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          outcome?: string | null
          task_id?: string | null
          task_text: string
          unlocks_count?: number | null
          user_id: string
        }
        Update: {
          cluster_label?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          outcome?: string | null
          task_id?: string | null
          task_text?: string
          unlocks_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      focus_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_updated_date: string
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_updated_date?: string
          longest_streak?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_updated_date?: string
          longest_streak?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_at: string
          created_at: string
          day_of_week: number
          id: string
          task_category: string
          task_duration_minutes: number | null
          task_id: string | null
          task_title: string
          time_of_day: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_of_week: number
          id?: string
          task_category: string
          task_duration_minutes?: number | null
          task_id?: string | null
          task_title: string
          time_of_day: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_of_week?: number
          id?: string
          task_category?: string
          task_duration_minutes?: number | null
          task_id?: string | null
          task_title?: string
          time_of_day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      hatching_moments: {
        Row: {
          captured_at: string
          companion_name: string | null
          created_at: string
          id: string
          image_path: string
          personality_type: string | null
          stage_reached: number
          user_id: string
        }
        Insert: {
          captured_at?: string
          companion_name?: string | null
          created_at?: string
          id?: string
          image_path: string
          personality_type?: string | null
          stage_reached: number
          user_id: string
        }
        Update: {
          captured_at?: string
          companion_name?: string | null
          created_at?: string
          id?: string
          image_path?: string
          personality_type?: string | null
          stage_reached?: number
          user_id?: string
        }
        Relationships: []
      }
      learning_trends: {
        Row: {
          analysis_date: string
          categorization_improvements: string | null
          common_patterns: Json
          created_at: string
          id: string
          suggestion_improvements: string | null
          top_misunderstood_phrasings: Json
          total_corrections_analyzed: number
        }
        Insert: {
          analysis_date?: string
          categorization_improvements?: string | null
          common_patterns?: Json
          created_at?: string
          id?: string
          suggestion_improvements?: string | null
          top_misunderstood_phrasings?: Json
          total_corrections_analyzed?: number
        }
        Update: {
          analysis_date?: string
          categorization_improvements?: string | null
          common_patterns?: Json
          created_at?: string
          id?: string
          suggestion_improvements?: string | null
          top_misunderstood_phrasings?: Json
          total_corrections_analyzed?: number
        }
        Relationships: []
      }
      malunita_backups: {
        Row: {
          backup_data: Json
          backup_name: string | null
          created_at: string
          id: string
          is_auto_save: boolean
          user_id: string
          version: number
        }
        Insert: {
          backup_data: Json
          backup_name?: string | null
          created_at?: string
          id?: string
          is_auto_save?: boolean
          user_id: string
          version?: number
        }
        Update: {
          backup_data?: Json
          backup_name?: string | null
          created_at?: string
          id?: string
          is_auto_save?: boolean
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      memory_journal: {
        Row: {
          ai_summary: string | null
          created_at: string
          date: string
          emotional_state: Json
          entry_type: string | null
          id: string
          mood: string
          tasks_completed: number | null
          tasks_created: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          date: string
          emotional_state?: Json
          entry_type?: string | null
          id?: string
          mood: string
          tasks_completed?: number | null
          tasks_created?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          date?: string
          emotional_state?: Json
          entry_type?: string | null
          id?: string
          mood?: string
          tasks_completed?: number | null
          tasks_created?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_focus_enabled: boolean | null
          autocategorize_enabled: boolean | null
          average_tasks_per_day: number | null
          bonding_score: number | null
          bonding_tier: string | null
          common_prefixes: string[] | null
          companion_colorway: string | null
          companion_name: string | null
          companion_personality_type: string | null
          companion_stage: number | null
          companion_xp: number | null
          created_at: string
          current_goal: string | null
          custom_stop_commands: string[] | null
          custom_wake_word: string | null
          emotional_memory: Json | null
          fiesta_completion_count: number | null
          focus_persona: Json | null
          focus_preferences: Json | null
          goal_timeframe: string | null
          goal_updated_at: string | null
          id: string
          insights: Json | null
          last_interaction_at: string | null
          last_lore_shown_at: string | null
          last_personalization_run: string | null
          likes_routine_nudges: boolean | null
          lore_moments_seen: number | null
          notification_preferences: Json | null
          notification_snooze_until: string | null
          often_time_based: boolean | null
          peak_activity_time: string | null
          preferences_summary: string | null
          preferred_gpt_model: string | null
          preferred_input_style: string | null
          reflection_streak: number | null
          ritual_preferences: Json | null
          selected_accessory: string | null
          selected_ambient_world: string | null
          selected_aura: string | null
          selected_colorway: string | null
          selected_trail: string | null
          task_completion_streak: number | null
          total_tasks_logged: number | null
          unlocked_accessories: string[] | null
          unlocked_auras: string[] | null
          unlocked_colorways: string[] | null
          unlocked_expressions: string[] | null
          unlocked_trails: string[] | null
          updated_at: string
          uses_names: boolean | null
          uses_reminders: boolean | null
          voice_session_count: number | null
          wake_word_enabled: boolean | null
          wants_voice_playback: boolean | null
        }
        Insert: {
          auto_focus_enabled?: boolean | null
          autocategorize_enabled?: boolean | null
          average_tasks_per_day?: number | null
          bonding_score?: number | null
          bonding_tier?: string | null
          common_prefixes?: string[] | null
          companion_colorway?: string | null
          companion_name?: string | null
          companion_personality_type?: string | null
          companion_stage?: number | null
          companion_xp?: number | null
          created_at?: string
          current_goal?: string | null
          custom_stop_commands?: string[] | null
          custom_wake_word?: string | null
          emotional_memory?: Json | null
          fiesta_completion_count?: number | null
          focus_persona?: Json | null
          focus_preferences?: Json | null
          goal_timeframe?: string | null
          goal_updated_at?: string | null
          id: string
          insights?: Json | null
          last_interaction_at?: string | null
          last_lore_shown_at?: string | null
          last_personalization_run?: string | null
          likes_routine_nudges?: boolean | null
          lore_moments_seen?: number | null
          notification_preferences?: Json | null
          notification_snooze_until?: string | null
          often_time_based?: boolean | null
          peak_activity_time?: string | null
          preferences_summary?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          reflection_streak?: number | null
          ritual_preferences?: Json | null
          selected_accessory?: string | null
          selected_ambient_world?: string | null
          selected_aura?: string | null
          selected_colorway?: string | null
          selected_trail?: string | null
          task_completion_streak?: number | null
          total_tasks_logged?: number | null
          unlocked_accessories?: string[] | null
          unlocked_auras?: string[] | null
          unlocked_colorways?: string[] | null
          unlocked_expressions?: string[] | null
          unlocked_trails?: string[] | null
          updated_at?: string
          uses_names?: boolean | null
          uses_reminders?: boolean | null
          voice_session_count?: number | null
          wake_word_enabled?: boolean | null
          wants_voice_playback?: boolean | null
        }
        Update: {
          auto_focus_enabled?: boolean | null
          autocategorize_enabled?: boolean | null
          average_tasks_per_day?: number | null
          bonding_score?: number | null
          bonding_tier?: string | null
          common_prefixes?: string[] | null
          companion_colorway?: string | null
          companion_name?: string | null
          companion_personality_type?: string | null
          companion_stage?: number | null
          companion_xp?: number | null
          created_at?: string
          current_goal?: string | null
          custom_stop_commands?: string[] | null
          custom_wake_word?: string | null
          emotional_memory?: Json | null
          fiesta_completion_count?: number | null
          focus_persona?: Json | null
          focus_preferences?: Json | null
          goal_timeframe?: string | null
          goal_updated_at?: string | null
          id?: string
          insights?: Json | null
          last_interaction_at?: string | null
          last_lore_shown_at?: string | null
          last_personalization_run?: string | null
          likes_routine_nudges?: boolean | null
          lore_moments_seen?: number | null
          notification_preferences?: Json | null
          notification_snooze_until?: string | null
          often_time_based?: boolean | null
          peak_activity_time?: string | null
          preferences_summary?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          reflection_streak?: number | null
          ritual_preferences?: Json | null
          selected_accessory?: string | null
          selected_ambient_world?: string | null
          selected_aura?: string | null
          selected_colorway?: string | null
          selected_trail?: string | null
          task_completion_streak?: number | null
          total_tasks_logged?: number | null
          unlocked_accessories?: string[] | null
          unlocked_auras?: string[] | null
          unlocked_colorways?: string[] | null
          unlocked_expressions?: string[] | null
          unlocked_trails?: string[] | null
          updated_at?: string
          uses_names?: boolean | null
          uses_reminders?: boolean | null
          voice_session_count?: number | null
          wake_word_enabled?: boolean | null
          wants_voice_playback?: boolean | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      recent_event_titles: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          title: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          title: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          title?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          created_at: string | null
          created_from_week: string | null
          description: string
          dismissed: boolean | null
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          recommendation_type: string
          suggested_day: string | null
          suggested_time: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_from_week?: string | null
          description: string
          dismissed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          recommendation_type: string
          suggested_day?: string | null
          suggested_time?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_from_week?: string | null
          description?: string
          dismissed?: boolean | null
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          recommendation_type?: string
          suggested_day?: string | null
          suggested_time?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_learning_feedback: {
        Row: {
          actual_category: string
          actual_timeframe: string
          created_at: string
          id: string
          original_text: string
          suggested_category: string
          suggested_timeframe: string
          task_title: string
          user_id: string
          was_corrected: boolean
        }
        Insert: {
          actual_category: string
          actual_timeframe: string
          created_at?: string
          id?: string
          original_text: string
          suggested_category: string
          suggested_timeframe: string
          task_title: string
          user_id: string
          was_corrected?: boolean
        }
        Update: {
          actual_category?: string
          actual_timeframe?: string
          created_at?: string
          id?: string
          original_text?: string
          suggested_category?: string
          suggested_timeframe?: string
          task_title?: string
          user_id?: string
          was_corrected?: boolean
        }
        Relationships: []
      }
      task_reminders: {
        Row: {
          created_at: string
          id: string
          reminder_time: string
          sent_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_time: string
          sent_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_time?: string
          sent_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          alignment_reason: string | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          context: string | null
          created_at: string
          custom_category_id: string | null
          daily_session_id: string | null
          display_order: number | null
          focus_date: string | null
          focus_source: string | null
          goal_aligned: boolean | null
          has_person_name: boolean | null
          has_reminder: boolean | null
          id: string
          input_method: string | null
          is_focus: boolean | null
          is_time_based: boolean | null
          keywords: string[] | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          parent_task_id: string | null
          primary_focus_alignment: string | null
          recurrence_day: number | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_reason?: string | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          context?: string | null
          created_at?: string
          custom_category_id?: string | null
          daily_session_id?: string | null
          display_order?: number | null
          focus_date?: string | null
          focus_source?: string | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          keywords?: string[] | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          parent_task_id?: string | null
          primary_focus_alignment?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_reason?: string | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          context?: string | null
          created_at?: string
          custom_category_id?: string | null
          daily_session_id?: string | null
          display_order?: number | null
          focus_date?: string | null
          focus_source?: string | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          keywords?: string[] | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          parent_task_id?: string | null
          primary_focus_alignment?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_custom_category_id_fkey"
            columns: ["custom_category_id"]
            isOneToOne: false
            referencedRelation: "custom_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_daily_session_id_fkey"
            columns: ["daily_session_id"]
            isOneToOne: false
            referencedRelation: "daily_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tiny_task_fiesta_sessions: {
        Row: {
          completion_rate: number | null
          created_at: string
          duration_minutes: number
          ended_at: string | null
          id: string
          started_at: string
          tasks_completed: string[]
          tasks_included: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          tasks_completed?: string[]
          tasks_included?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_rate?: number | null
          created_at?: string
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          started_at?: string
          tasks_completed?: string[]
          tasks_included?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_quests: {
        Row: {
          claimed: boolean
          completed: boolean
          created_at: string
          current_value: number
          description: string
          id: string
          quest_type: string
          reward_affection: number
          reward_cosmetic_id: string | null
          reward_cosmetic_type: string | null
          reward_xp: number
          target_value: number
          title: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          current_value?: number
          description: string
          id?: string
          quest_type: string
          reward_affection?: number
          reward_cosmetic_id?: string | null
          reward_cosmetic_type?: string | null
          reward_xp?: number
          target_value?: number
          title: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          current_value?: number
          description?: string
          id?: string
          quest_type?: string
          reward_affection?: number
          reward_cosmetic_id?: string | null
          reward_cosmetic_type?: string | null
          reward_xp?: number
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _endpoint: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_habit_logs: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      clear_old_focus_items: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      match_focus_embeddings: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          target_user_id: string
        }
        Returns: {
          cluster_label: string
          created_at: string
          id: string
          outcome: string
          similarity: number
          task_id: string
          task_text: string
          unlocks_count: number
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
