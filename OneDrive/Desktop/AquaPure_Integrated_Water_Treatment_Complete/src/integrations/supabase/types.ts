export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      nutrient_batches: {
        Row: {
          batch_id: string
          batch_name: string
          certification_date: string
          certifier: string
          created_at: string
          expiry_date: string
          id: string
          quantity: string
          status: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          batch_name: string
          certification_date: string
          certifier: string
          created_at?: string
          expiry_date: string
          id?: string
          quantity: string
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          batch_name?: string
          certification_date?: string
          certifier?: string
          created_at?: string
          expiry_date?: string
          id?: string
          quantity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_recovery: {
        Row: {
          biogas_yield_m3: number
          created_at: string
          date: string
          id: string
          methane_content_pct: number
          notes: string | null
          reclaimed_water_m3: number
          reuse_application: string
          sludge_dry_solids_pct: number
          sludge_generated_kg: number
        }
        Insert: {
          biogas_yield_m3?: number
          created_at?: string
          date?: string
          id?: string
          methane_content_pct?: number
          notes?: string | null
          reclaimed_water_m3?: number
          reuse_application?: string
          sludge_dry_solids_pct?: number
          sludge_generated_kg?: number
        }
        Update: {
          biogas_yield_m3?: number
          created_at?: string
          date?: string
          id?: string
          methane_content_pct?: number
          notes?: string | null
          reclaimed_water_m3?: number
          reuse_application?: string
          sludge_dry_solids_pct?: number
          sludge_generated_kg?: number
        }
        Relationships: []
      }
      transaction_history: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          status: string
          timestamp: string
          tx_id: string
          tx_type: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          status?: string
          timestamp?: string
          tx_id: string
          tx_type: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          status?: string
          timestamp?: string
          tx_id?: string
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "nutrient_batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      treatment_history: {
        Row: {
          created_at: string
          date: string
          id: string
          operator: string
          ph_after: number
          ph_before: number
          source: string
          status: string
          tds_after: number
          tds_before: number
          treatment_id: string
          treatment_type: string
          turbidity_after: number
          turbidity_before: number
          volume_treated: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          operator: string
          ph_after: number
          ph_before: number
          source: string
          status?: string
          tds_after: number
          tds_before: number
          treatment_id: string
          treatment_type: string
          turbidity_after: number
          turbidity_before: number
          volume_treated: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          operator?: string
          ph_after?: number
          ph_before?: number
          source?: string
          status?: string
          tds_after?: number
          tds_before?: number
          treatment_id?: string
          treatment_type?: string
          turbidity_after?: number
          turbidity_before?: number
          volume_treated?: number
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
} as const;
