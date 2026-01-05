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
      ai_corrections: {
        Row: {
          ai_guess: Json
          confidence_score: number | null
          context_snapshot: Json | null
          corrected_output: Json
          correction_type: string | null
          created_at: string
          id: string
          is_not_task: boolean | null
          original_text: string | null
          processed_at: string | null
          task_id: string | null
          task_title: string
          user_id: string
        }
        Insert: {
          ai_guess?: Json
          confidence_score?: number | null
          context_snapshot?: Json | null
          corrected_output?: Json
          correction_type?: string | null
          created_at?: string
          id?: string
          is_not_task?: boolean | null
          original_text?: string | null
          processed_at?: string | null
          task_id?: string | null
          task_title: string
          user_id: string
        }
        Update: {
          ai_guess?: Json
          confidence_score?: number | null
          context_snapshot?: Json | null
          corrected_output?: Json
          correction_type?: string | null
          created_at?: string
          id?: string
          is_not_task?: boolean | null
          original_text?: string | null
          processed_at?: string | null
          task_id?: string | null
          task_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_corrections_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_memory_profiles: {
        Row: {
          category_preferences: Json | null
          emotional_triggers: Json | null
          energy_pattern: Json | null
          last_updated: string | null
          positive_reinforcers: Json | null
          priority_bias: Json | null
          procrastination_triggers: Json | null
          streak_history: Json | null
          tiny_task_threshold: number | null
          user_id: string
          writing_style: string | null
        }
        Insert: {
          category_preferences?: Json | null
          emotional_triggers?: Json | null
          energy_pattern?: Json | null
          last_updated?: string | null
          positive_reinforcers?: Json | null
          priority_bias?: Json | null
          procrastination_triggers?: Json | null
          streak_history?: Json | null
          tiny_task_threshold?: number | null
          user_id: string
          writing_style?: string | null
        }
        Update: {
          category_preferences?: Json | null
          emotional_triggers?: Json | null
          energy_pattern?: Json | null
          last_updated?: string | null
          positive_reinforcers?: Json | null
          priority_bias?: Json | null
          procrastination_triggers?: Json | null
          streak_history?: Json | null
          tiny_task_threshold?: number | null
          user_id?: string
          writing_style?: string | null
        }
        Relationships: []
      }
      ai_reasoning_log: {
        Row: {
          answer: string | null
          context_snapshot: Json | null
          created_at: string
          id: string
          mode: string
          reasoning_metadata: Json | null
          steps: Json | null
          time_taken_ms: number | null
          transcript: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          mode: string
          reasoning_metadata?: Json | null
          steps?: Json | null
          time_taken_ms?: number | null
          transcript: string
          user_id: string
        }
        Update: {
          answer?: string | null
          context_snapshot?: Json | null
          created_at?: string
          id?: string
          mode?: string
          reasoning_metadata?: Json | null
          steps?: Json | null
          time_taken_ms?: number | null
          transcript?: string
          user_id?: string
        }
        Relationships: []
      }
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
      canvas_projects: {
        Row: {
          color: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      capture_sessions: {
        Row: {
          created_at: string
          id: string
          intent_tags: string[]
          raw_text: string
          summary: string | null
          task_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_tags?: string[]
          raw_text: string
          summary?: string | null
          task_ids?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_tags?: string[]
          raw_text?: string
          summary?: string | null
          task_ids?: string[]
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
      daily_one_thing: {
        Row: {
          created_at: string
          date: string
          id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          text?: string
          updated_at?: string
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
      exercise_sets: {
        Row: {
          created_at: string | null
          exercise_name: string
          id: string
          is_pr: boolean | null
          notes: string | null
          reps: number | null
          session_id: string | null
          set_number: number
          user_id: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_name: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          session_id?: string | null
          set_number: number
          user_id: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_name?: string
          id?: string
          is_pr?: boolean | null
          notes?: string | null
          reps?: number | null
          session_id?: string | null
          set_number?: number
          user_id?: string
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          reflection: string | null
          session_type: string
          started_at: string | null
          status: string
          target_duration_minutes: number
          task_ids: string[]
          tasks_completed: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          reflection?: string | null
          session_type: string
          started_at?: string | null
          status?: string
          target_duration_minutes: number
          task_ids?: string[]
          tasks_completed?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          reflection?: string | null
          session_type?: string
          started_at?: string | null
          status?: string
          target_duration_minutes?: number
          task_ids?: string[]
          tasks_completed?: number | null
          title?: string
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
      gallery_items: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          metadata: Json | null
          page_id: string
          sort_order: number | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          metadata?: Json | null
          page_id: string
          sort_order?: number | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          page_id?: string
          sort_order?: number | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_at: string | null
          date: string | null
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          date?: string | null
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          date?: string | null
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
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
      habits: {
        Row: {
          archived: boolean | null
          color: string | null
          created_at: string | null
          frequency: string | null
          icon: string | null
          id: string
          target_count: number | null
          title: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          color?: string | null
          created_at?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          target_count?: number | null
          title: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          color?: string | null
          created_at?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          target_count?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
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
      idea_board_items: {
        Row: {
          color: string | null
          content: Json | null
          created_at: string
          height: number | null
          id: string
          item_type: string
          metadata: Json | null
          page_id: string
          position_x: number | null
          position_y: number | null
          updated_at: string
          user_id: string
          width: number | null
          z_index: number | null
        }
        Insert: {
          color?: string | null
          content?: Json | null
          created_at?: string
          height?: number | null
          id?: string
          item_type?: string
          metadata?: Json | null
          page_id: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          user_id: string
          width?: number | null
          z_index?: number | null
        }
        Update: {
          color?: string | null
          content?: Json | null
          created_at?: string
          height?: number | null
          id?: string
          item_type?: string
          metadata?: Json | null
          page_id?: string
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          user_id?: string
          width?: number | null
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_board_items_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_cleanup_log: {
        Row: {
          archived_count: number
          completed_count: number
          created_at: string
          id: string
          snoozed_count: number
          total_tasks: number
          user_id: string
        }
        Insert: {
          archived_count?: number
          completed_count?: number
          created_at?: string
          id?: string
          snoozed_count?: number
          total_tasks?: number
          user_id: string
        }
        Update: {
          archived_count?: number
          completed_count?: number
          created_at?: string
          id?: string
          snoozed_count?: number
          total_tasks?: number
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_type: string | null
          id: string
          photos: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_type?: string | null
          id?: string
          photos?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_type?: string | null
          id?: string
          photos?: string[] | null
          title?: string
          updated_at?: string
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
      memory_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
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
      model_confusion_matrix: {
        Row: {
          actual_category: string | null
          actual_priority: string | null
          common_phrases: string[] | null
          id: string
          last_seen_at: string
          occurrence_count: number | null
          predicted_category: string | null
          predicted_priority: string | null
        }
        Insert: {
          actual_category?: string | null
          actual_priority?: string | null
          common_phrases?: string[] | null
          id?: string
          last_seen_at?: string
          occurrence_count?: number | null
          predicted_category?: string | null
          predicted_priority?: string | null
        }
        Update: {
          actual_category?: string | null
          actual_priority?: string | null
          common_phrases?: string[] | null
          id?: string
          last_seen_at?: string
          occurrence_count?: number | null
          predicted_category?: string | null
          predicted_priority?: string | null
        }
        Relationships: []
      }
      page_blocks: {
        Row: {
          block_type: string
          content: Json | null
          created_at: string
          id: string
          indent_level: number | null
          metadata: Json | null
          page_id: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_type?: string
          content?: Json | null
          created_at?: string
          id?: string
          indent_level?: number | null
          metadata?: Json | null
          page_id: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_type?: string
          content?: Json | null
          created_at?: string
          id?: string
          indent_level?: number | null
          metadata?: Json | null
          page_id?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_insights: {
        Row: {
          created_at: string
          id: string
          insight: Json
          insight_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insight?: Json
          insight_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insight?: Json
          insight_type?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_records: {
        Row: {
          achieved_at: string | null
          exercise_name: string
          id: string
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          achieved_at?: string | null
          exercise_name: string
          id?: string
          reps: number
          user_id: string
          weight: number
        }
        Update: {
          achieved_at?: string | null
          exercise_name?: string
          id?: string
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      priority_storms: {
        Row: {
          cluster_density: Json | null
          created_at: string | null
          date: string
          deadline_count: number | null
          expected_load_score: number
          id: string
          recommended_focus_task: string | null
          recurrence_count: number | null
          task_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cluster_density?: Json | null
          created_at?: string | null
          date: string
          deadline_count?: number | null
          expected_load_score: number
          id?: string
          recommended_focus_task?: string | null
          recurrence_count?: number | null
          task_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cluster_density?: Json | null
          created_at?: string | null
          date?: string
          deadline_count?: number | null
          expected_load_score?: number
          id?: string
          recommended_focus_task?: string | null
          recurrence_count?: number | null
          task_count?: number | null
          updated_at?: string | null
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
          burnout_detected_at: string | null
          burnout_recovery_until: string | null
          burnout_risk: number | null
          common_prefixes: string[] | null
          companion_colorway: string | null
          companion_name: string | null
          companion_personality_type: string | null
          companion_stage: number | null
          companion_traits: Json | null
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
          learning_profile: Json | null
          likes_routine_nudges: boolean | null
          lore_moments_seen: number | null
          notification_preferences: Json | null
          notification_snooze_until: string | null
          often_time_based: boolean | null
          orb_energy: number | null
          orb_last_evolution: string | null
          orb_mood: string | null
          peak_activity_time: string | null
          preferences_summary: string | null
          preferred_gpt_model: string | null
          preferred_input_style: string | null
          reflection_streak: number | null
          ritual_preferences: Json | null
          rituals_enabled: boolean | null
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
          burnout_detected_at?: string | null
          burnout_recovery_until?: string | null
          burnout_risk?: number | null
          common_prefixes?: string[] | null
          companion_colorway?: string | null
          companion_name?: string | null
          companion_personality_type?: string | null
          companion_stage?: number | null
          companion_traits?: Json | null
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
          learning_profile?: Json | null
          likes_routine_nudges?: boolean | null
          lore_moments_seen?: number | null
          notification_preferences?: Json | null
          notification_snooze_until?: string | null
          often_time_based?: boolean | null
          orb_energy?: number | null
          orb_last_evolution?: string | null
          orb_mood?: string | null
          peak_activity_time?: string | null
          preferences_summary?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          reflection_streak?: number | null
          ritual_preferences?: Json | null
          rituals_enabled?: boolean | null
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
          burnout_detected_at?: string | null
          burnout_recovery_until?: string | null
          burnout_risk?: number | null
          common_prefixes?: string[] | null
          companion_colorway?: string | null
          companion_name?: string | null
          companion_personality_type?: string | null
          companion_stage?: number | null
          companion_traits?: Json | null
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
          learning_profile?: Json | null
          likes_routine_nudges?: boolean | null
          lore_moments_seen?: number | null
          notification_preferences?: Json | null
          notification_snooze_until?: string | null
          often_time_based?: boolean | null
          orb_energy?: number | null
          orb_last_evolution?: string | null
          orb_mood?: string | null
          peak_activity_time?: string | null
          preferences_summary?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          reflection_streak?: number | null
          ritual_preferences?: Json | null
          rituals_enabled?: boolean | null
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
      project_pages: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_collapsed: boolean | null
          page_type: string
          parent_page_id: string | null
          project_id: string
          sort_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_collapsed?: boolean | null
          page_type?: string
          parent_page_id?: string | null
          project_id: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_collapsed?: boolean | null
          page_type?: string
          parent_page_id?: string | null
          project_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pages_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "project_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "canvas_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_collapsed: boolean | null
          name: string
          sort_order: number | null
          space: string
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_collapsed?: boolean | null
          name: string
          sort_order?: number | null
          space: string
          user_id: string
        }
        Update: {
          archived?: boolean | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_collapsed?: boolean | null
          name?: string
          sort_order?: number | null
          space?: string
          user_id?: string
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
      ritual_history: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          type?: string
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
      task_history: {
        Row: {
          category: string | null
          completed_at: string
          created_at: string
          difficulty: string | null
          emotional_context: string | null
          id: string
          sentiment: string | null
          task_text: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at: string
          created_at?: string
          difficulty?: string | null
          emotional_context?: string | null
          id?: string
          sentiment?: string | null
          task_text: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string
          created_at?: string
          difficulty?: string | null
          emotional_context?: string | null
          id?: string
          sentiment?: string | null
          task_text?: string
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
          ai_confidence: number | null
          ai_metadata: Json | null
          ai_summary: string | null
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
          follow_up: string | null
          future_priority_score: number | null
          goal_aligned: boolean | null
          has_person_name: boolean | null
          has_reminder: boolean | null
          hidden_intent: string | null
          id: string
          input_method: string | null
          is_focus: boolean | null
          is_time_based: boolean | null
          is_tiny_task: boolean | null
          keywords: string[] | null
          link_url: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          parent_task_id: string | null
          pending_audio_path: string | null
          plan_id: string | null
          primary_focus_alignment: string | null
          processing_status: string | null
          project_id: string | null
          raw_content: string | null
          recurrence_day: number | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_time: string | null
          scheduled_bucket: string | null
          staleness_status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          ai_summary?: string | null
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
          follow_up?: string | null
          future_priority_score?: number | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          hidden_intent?: string | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          is_tiny_task?: boolean | null
          keywords?: string[] | null
          link_url?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          parent_task_id?: string | null
          pending_audio_path?: string | null
          plan_id?: string | null
          primary_focus_alignment?: string | null
          processing_status?: string | null
          project_id?: string | null
          raw_content?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          scheduled_bucket?: string | null
          staleness_status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_metadata?: Json | null
          ai_summary?: string | null
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
          follow_up?: string | null
          future_priority_score?: number | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          hidden_intent?: string | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          is_tiny_task?: boolean | null
          keywords?: string[] | null
          link_url?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          parent_task_id?: string | null
          pending_audio_path?: string | null
          plan_id?: string | null
          primary_focus_alignment?: string | null
          processing_status?: string | null
          project_id?: string | null
          raw_content?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_time?: string | null
          scheduled_bucket?: string | null
          staleness_status?: string | null
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
          {
            foreignKeyName: "tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      thoughts: {
        Row: {
          content: string
          created_at: string
          id: string
          source: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      tomorrow_plan: {
        Row: {
          created_at: string
          id: string
          plan_date: string
          reasoning: string | null
          recommended_one_thing: string
          recommended_one_thing_id: string | null
          storm_score: number | null
          supporting_tasks: Json
          tiny_task: string | null
          tiny_task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_date: string
          reasoning?: string | null
          recommended_one_thing: string
          recommended_one_thing_id?: string | null
          storm_score?: number | null
          supporting_tasks?: Json
          tiny_task?: string | null
          tiny_task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_date?: string
          reasoning?: string | null
          recommended_one_thing?: string
          recommended_one_thing_id?: string | null
          storm_score?: number | null
          supporting_tasks?: Json
          tiny_task?: string | null
          tiny_task_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_queue: {
        Row: {
          completed_at: string | null
          corrections_since_last: number | null
          created_at: string
          error_log: string | null
          id: string
          improvements: Json | null
          scheduled_for: string
          started_at: string | null
          status: string
          training_type: string
        }
        Insert: {
          completed_at?: string | null
          corrections_since_last?: number | null
          created_at?: string
          error_log?: string | null
          id?: string
          improvements?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          training_type?: string
        }
        Update: {
          completed_at?: string | null
          corrections_since_last?: number | null
          created_at?: string
          error_log?: string | null
          id?: string
          improvements?: Json | null
          scheduled_for?: string
          started_at?: string | null
          status?: string
          training_type?: string
        }
        Relationships: []
      }
      user_bias_patterns: {
        Row: {
          confidence: number | null
          first_observed_at: string
          id: string
          last_updated_at: string
          pattern_data: Json
          pattern_key: string
          pattern_type: string
          sample_size: number | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          first_observed_at?: string
          id?: string
          last_updated_at?: string
          pattern_data?: Json
          pattern_key: string
          pattern_type: string
          sample_size?: number | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          first_observed_at?: string
          id?: string
          last_updated_at?: string
          pattern_data?: Json
          pattern_key?: string
          pattern_type?: string
          sample_size?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_learning_preferences: {
        Row: {
          confidence_bias: number
          created_at: string
          decomposition_threshold: number
          edit_frequency: number
          preferred_destinations: Json
          signals_processed: number
          task_granularity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_bias?: number
          created_at?: string
          decomposition_threshold?: number
          edit_frequency?: number
          preferred_destinations?: Json
          signals_processed?: number
          task_granularity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_bias?: number
          created_at?: string
          decomposition_threshold?: number
          edit_frequency?: number
          preferred_destinations?: Json
          signals_processed?: number
          task_granularity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_learning_signals: {
        Row: {
          created_at: string
          id: string
          signal_data: Json
          signal_type: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_data?: Json
          signal_type: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_data?: Json
          signal_type?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_signals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_patterns: {
        Row: {
          id: string
          pattern_data: Json
          pattern_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          pattern_data?: Json
          pattern_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          preferences?: Json
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
      weekly_priorities: {
        Row: {
          calendar_blocks_accepted: boolean | null
          created_at: string
          id: string
          priority_one: string | null
          priority_three: string | null
          priority_two: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          calendar_blocks_accepted?: boolean | null
          created_at?: string
          id?: string
          priority_one?: string | null
          priority_three?: string | null
          priority_two?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          calendar_blocks_accepted?: boolean | null
          created_at?: string
          id?: string
          priority_one?: string | null
          priority_three?: string | null
          priority_two?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
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
      weekly_reflections: {
        Row: {
          created_at: string
          felt_off: string | null
          id: string
          themes_extracted: Json | null
          updated_at: string
          user_id: string
          week_start: string
          went_well: string | null
        }
        Insert: {
          created_at?: string
          felt_off?: string | null
          id?: string
          themes_extracted?: Json | null
          updated_at?: string
          user_id: string
          week_start: string
          went_well?: string | null
        }
        Update: {
          created_at?: string
          felt_off?: string | null
          id?: string
          themes_extracted?: Json | null
          updated_at?: string
          user_id?: string
          week_start?: string
          went_well?: string | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string | null
          date: string
          duration_minutes: number | null
          id: string
          notes: string | null
          user_id: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id?: string
          workout_type?: string | null
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
      update_user_pattern: {
        Args: { p_data: Json; p_pattern_type: string; p_user_id: string }
        Returns: undefined
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
