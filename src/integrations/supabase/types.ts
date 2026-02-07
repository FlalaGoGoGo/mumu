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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aic_highlights: {
        Row: {
          artic_id: string
          artist: string | null
          created_at: string | null
          floor: number | null
          gallery: number | null
          image_url: string | null
          route_1h_order: number | null
          route_full_group: number | null
          title: string
          year: string | null
        }
        Insert: {
          artic_id: string
          artist?: string | null
          created_at?: string | null
          floor?: number | null
          gallery?: number | null
          image_url?: string | null
          route_1h_order?: number | null
          route_full_group?: number | null
          title: string
          year?: string | null
        }
        Update: {
          artic_id?: string
          artist?: string | null
          created_at?: string | null
          floor?: number | null
          gallery?: number | null
          image_url?: string | null
          route_1h_order?: number | null
          route_full_group?: number | null
          title?: string
          year?: string | null
        }
        Relationships: []
      }
      museums: {
        Row: {
          address: string | null
          city: string
          country: string
          created_at: string | null
          has_full_content: boolean | null
          hero_image_url: string | null
          highlight: boolean | null
          lat: number
          lng: number
          museum_id: string
          name: string
          opening_hours: string | null
          state: string | null
          tags: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          city: string
          country: string
          created_at?: string | null
          has_full_content?: boolean | null
          hero_image_url?: string | null
          highlight?: boolean | null
          lat: number
          lng: number
          museum_id: string
          name: string
          opening_hours?: string | null
          state?: string | null
          tags?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          country?: string
          created_at?: string | null
          has_full_content?: boolean | null
          hero_image_url?: string | null
          highlight?: boolean | null
          lat?: number
          lng?: number
          museum_id?: string
          name?: string
          opening_hours?: string | null
          state?: string | null
          tags?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      store_products: {
        Row: {
          created_at: string
          currency: string
          image_url: string | null
          is_featured: boolean
          museum_id: string | null
          official_url: string | null
          price: number
          product_id: string
          tags: string | null
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string
          image_url?: string | null
          is_featured?: boolean
          museum_id?: string | null
          official_url?: string | null
          price?: number
          product_id: string
          tags?: string | null
          title: string
        }
        Update: {
          created_at?: string
          currency?: string
          image_url?: string | null
          is_featured?: boolean
          museum_id?: string | null
          official_url?: string | null
          price?: number
          product_id?: string
          tags?: string | null
          title?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_date: string
          event_id: string
          event_type: string
          item_id: string
          item_type: string
          meta: Json | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string
          event_id?: string
          event_type: string
          item_id: string
          item_type: string
          meta?: Json | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_id?: string
          event_type?: string
          item_id?: string
          item_type?: string
          meta?: Json | null
          session_id?: string
        }
        Relationships: []
      }
      user_highlight_completions: {
        Row: {
          artic_id: string | null
          completed_at: string | null
          id: string
          session_id: string
        }
        Insert: {
          artic_id?: string | null
          completed_at?: string | null
          id?: string
          session_id: string
        }
        Update: {
          artic_id?: string | null
          completed_at?: string | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_highlight_completions_artic_id_fkey"
            columns: ["artic_id"]
            isOneToOne: false
            referencedRelation: "aic_highlights"
            referencedColumns: ["artic_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          avatar_url: string | null
          created_at: string
          discounts: string[]
          gender: string | null
          id: string
          interests: string[]
          kid_friendly_content: boolean
          knowledge_level: string
          language: string
          location_city: string | null
          location_country: string | null
          location_region: string | null
          nickname: string | null
          pace_preference: string
          prefer_elevator: boolean
          prefer_less_walking: boolean
          remind_free_days: boolean
          session_id: string
          show_eligible_discounts_only: boolean
          updated_at: string
          visit_reminders: boolean
          visit_style: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discounts?: string[]
          gender?: string | null
          id?: string
          interests?: string[]
          kid_friendly_content?: boolean
          knowledge_level?: string
          language?: string
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          nickname?: string | null
          pace_preference?: string
          prefer_elevator?: boolean
          prefer_less_walking?: boolean
          remind_free_days?: boolean
          session_id: string
          show_eligible_discounts_only?: boolean
          updated_at?: string
          visit_reminders?: boolean
          visit_style?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discounts?: string[]
          gender?: string | null
          id?: string
          interests?: string[]
          kid_friendly_content?: boolean
          knowledge_level?: string
          language?: string
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          nickname?: string | null
          pace_preference?: string
          prefer_elevator?: boolean
          prefer_less_walking?: boolean
          remind_free_days?: boolean
          session_id?: string
          show_eligible_discounts_only?: boolean
          updated_at?: string
          visit_reminders?: boolean
          visit_style?: string
        }
        Relationships: []
      }
      user_visits: {
        Row: {
          id: string
          museum_id: string | null
          notes: string | null
          session_id: string
          visited_at: string | null
        }
        Insert: {
          id?: string
          museum_id?: string | null
          notes?: string | null
          session_id: string
          visited_at?: string | null
        }
        Update: {
          id?: string
          museum_id?: string | null
          notes?: string | null
          session_id?: string
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_visits_museum_id_fkey"
            columns: ["museum_id"]
            isOneToOne: false
            referencedRelation: "museums"
            referencedColumns: ["museum_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
