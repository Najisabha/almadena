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
      appointments: {
        Row: {
          appointment_date: string
          appointment_type: string
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          id: string
          instructor_name: string | null
          location: string | null
          notes: string | null
          status: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_type: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          location?: string | null
          notes?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_type?: string
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          id?: string
          instructor_name?: string | null
          location?: string | null
          notes?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          duration_hours: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          lessons_count: number | null
          license_type: string | null
          package_name: string
          package_name_ar: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_hours?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          lessons_count?: number | null
          license_type?: string | null
          package_name: string
          package_name_ar: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_hours?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          lessons_count?: number | null
          license_type?: string | null
          package_name?: string
          package_name_ar?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          full_address: string | null
          id: string
          id_image_url: string | null
          last_name: string
          license_type: string | null
          phone: string | null
          town: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          full_address?: string | null
          id: string
          id_image_url?: string | null
          last_name: string
          license_type?: string | null
          phone?: string | null
          town?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          full_address?: string | null
          id?: string
          id_image_url?: string | null
          last_name?: string
          license_type?: string | null
          phone?: string | null
          town?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string | null
          correct_answer: string
          created_at: string | null
          difficulty: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string | null
          question_text: string
          question_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          correct_answer: string
          created_at?: string | null
          difficulty?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a: string
          option_b: string
          option_c: string
          option_d?: string | null
          question_text: string
          question_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          correct_answer?: string
          created_at?: string | null
          difficulty?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string | null
          question_text?: string
          question_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string | null
          id: string
          last_exam_date: string | null
          notes: string | null
          practical_score: number | null
          theory_score: number | null
          total_exams_taken: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_exam_date?: string | null
          notes?: string | null
          practical_score?: number | null
          theory_score?: number | null
          total_exams_taken?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_exam_date?: string | null
          notes?: string | null
          practical_score?: number | null
          theory_score?: number | null
          total_exams_taken?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          content_url: string | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          material_type: string
          scheduled_date: string | null
          thumbnail_url: string | null
          title: string
          title_ar: string
          updated_at: string | null
          zoom_meeting_id: string | null
          zoom_password: string | null
        }
        Insert: {
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          material_type: string
          scheduled_date?: string | null
          thumbnail_url?: string | null
          title: string
          title_ar: string
          updated_at?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
        }
        Update: {
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          material_type?: string
          scheduled_date?: string | null
          thumbnail_url?: string | null
          title?: string
          title_ar?: string
          updated_at?: string | null
          zoom_meeting_id?: string | null
          zoom_password?: string | null
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          license_type: string
          name: string
          pass_date: string
          rating: number | null
          review: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          license_type: string
          name: string
          pass_date: string
          rating?: number | null
          review: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          license_type?: string
          name?: string
          pass_date?: string
          rating?: number | null
          review?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
