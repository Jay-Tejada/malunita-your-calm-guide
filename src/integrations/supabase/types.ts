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
      profiles: {
        Row: {
          autocategorize_enabled: boolean | null
          average_tasks_per_day: number | null
          common_prefixes: string[] | null
          created_at: string
          current_goal: string | null
          goal_timeframe: string | null
          goal_updated_at: string | null
          id: string
          likes_routine_nudges: boolean | null
          notification_preferences: Json | null
          often_time_based: boolean | null
          peak_activity_time: string | null
          preferred_gpt_model: string | null
          preferred_input_style: string | null
          total_tasks_logged: number | null
          updated_at: string
          uses_names: boolean | null
          uses_reminders: boolean | null
          wants_voice_playback: boolean | null
        }
        Insert: {
          autocategorize_enabled?: boolean | null
          average_tasks_per_day?: number | null
          common_prefixes?: string[] | null
          created_at?: string
          current_goal?: string | null
          goal_timeframe?: string | null
          goal_updated_at?: string | null
          id: string
          likes_routine_nudges?: boolean | null
          notification_preferences?: Json | null
          often_time_based?: boolean | null
          peak_activity_time?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          total_tasks_logged?: number | null
          updated_at?: string
          uses_names?: boolean | null
          uses_reminders?: boolean | null
          wants_voice_playback?: boolean | null
        }
        Update: {
          autocategorize_enabled?: boolean | null
          average_tasks_per_day?: number | null
          common_prefixes?: string[] | null
          created_at?: string
          current_goal?: string | null
          goal_timeframe?: string | null
          goal_updated_at?: string | null
          id?: string
          likes_routine_nudges?: boolean | null
          notification_preferences?: Json | null
          often_time_based?: boolean | null
          peak_activity_time?: string | null
          preferred_gpt_model?: string | null
          preferred_input_style?: string | null
          total_tasks_logged?: number | null
          updated_at?: string
          uses_names?: boolean | null
          uses_reminders?: boolean | null
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
      tasks: {
        Row: {
          alignment_reason: string | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          context: string | null
          created_at: string
          focus_date: string | null
          goal_aligned: boolean | null
          has_person_name: boolean | null
          has_reminder: boolean | null
          id: string
          input_method: string | null
          is_focus: boolean | null
          is_time_based: boolean | null
          keywords: string[] | null
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
          focus_date?: string | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          keywords?: string[] | null
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
          focus_date?: string | null
          goal_aligned?: boolean | null
          has_person_name?: boolean | null
          has_reminder?: boolean | null
          id?: string
          input_method?: string | null
          is_focus?: boolean | null
          is_time_based?: boolean | null
          keywords?: string[] | null
          title?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_old_focus_items: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
