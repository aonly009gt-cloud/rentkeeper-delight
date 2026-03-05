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
      bills: {
        Row: {
          billing_month: string
          created_at: string
          current_meter: number
          elec_meter_photo: string | null
          electricity_cost: number
          electricity_rate: number
          id: string
          is_paid: boolean
          note: string | null
          paid_at: string | null
          slip_url: string | null
          slip_status: "pending" | "verified" | "rejected" | null
          slip_uploaded_at: string | null
          previous_balance: number
          previous_meter: number
          rent: number
          room_id: string
          room_name: string
          tenant_name: string
          total: number
          updated_at: string
          user_id: string
          water_cost: number
          water_meter_photo: string | null
        }
        Insert: {
          billing_month: string
          created_at?: string
          current_meter?: number
          elec_meter_photo?: string | null
          electricity_cost?: number
          electricity_rate?: number
          id?: string
          is_paid?: boolean
          note?: string | null
          paid_at?: string | null
          slip_url?: string | null
          slip_status?: "pending" | "verified" | "rejected" | null
          slip_uploaded_at?: string | null
          previous_balance?: number
          previous_meter?: number
          rent?: number
          room_id: string
          room_name?: string
          tenant_name?: string
          total?: number
          updated_at?: string
          user_id: string
          water_cost?: number
          water_meter_photo?: string | null
        }
        Update: {
          billing_month?: string
          created_at?: string
          current_meter?: number
          elec_meter_photo?: string | null
          electricity_cost?: number
          electricity_rate?: number
          id?: string
          is_paid?: boolean
          note?: string | null
          paid_at?: string | null
          slip_url?: string | null
          slip_status?: "pending" | "verified" | "rejected" | null
          slip_uploaded_at?: string | null
          previous_balance?: number
          previous_meter?: number
          rent?: number
          room_id?: string
          room_name?: string
          tenant_name?: string
          total?: number
          updated_at?: string
          user_id?: string
          water_cost?: number
          water_meter_photo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          id: string
          room_id: string
          tenant_id: string
          contract_text: string
          signature_url: string | null
          signed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          tenant_id: string
          contract_text: string
          signature_url?: string | null
          signed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          tenant_id?: string
          contract_text?: string
          signature_url?: string | null
          signed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      inspections: {
        Row: {
          id: string
          room_id: string
          tenant_id: string
          type: "move_in" | "move_out"
          items_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          tenant_id: string
          type: "move_in" | "move_out"
          items_json?: Json
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          tenant_id?: string
          type?: "move_in" | "move_out"
          items_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          date: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          date: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          amount?: number
          date?: string
          category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          photo_url: string | null
          room_id: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          photo_url?: string | null
          room_id: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          photo_url?: string | null
          room_id?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          billing_month: string
          created_at: string
          current_meter: number
          id: string
          is_paid: boolean
          move_in_date: string | null
          name: string
          note: string | null
          occupant_count: number | null
          previous_meter: number
          rent: number
          tenant_address: string | null
          tenant_emergency_contact: string | null
          tenant_emergency_phone: string | null
          tenant_id_card_number: string | null
          tenant_name: string
          tenant_phone: string | null
          updated_at: string
          user_id: string
          water_cost: number
        }
        Insert: {
          billing_month: string
          created_at?: string
          current_meter?: number
          id?: string
          is_paid?: boolean
          move_in_date?: string | null
          name: string
          note?: string | null
          occupant_count?: number | null
          previous_meter?: number
          rent?: number
          tenant_address?: string | null
          tenant_emergency_contact?: string | null
          tenant_emergency_phone?: string | null
          tenant_id_card_number?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string
          user_id: string
          water_cost?: number
        }
        Update: {
          billing_month?: string
          created_at?: string
          current_meter?: number
          id?: string
          is_paid?: boolean
          move_in_date?: string | null
          name?: string
          note?: string | null
          occupant_count?: number | null
          previous_meter?: number
          rent?: number
          tenant_address?: string | null
          tenant_emergency_contact?: string | null
          tenant_emergency_phone?: string | null
          tenant_id_card_number?: string | null
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string
          user_id?: string
          water_cost?: number
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          full_name: string
          id: string
          id_card_number: string | null
          is_primary: boolean | null
          line_user_id: string | null
          phone: string | null
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          id?: string
          id_card_number?: string | null
          is_primary?: boolean | null
          line_user_id?: string | null
          phone?: string | null
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          full_name?: string
          id?: string
          id_card_number?: string | null
          is_primary?: boolean | null
          line_user_id?: string | null
          phone?: string | null
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          billing_day: number | null
          created_at: string
          default_rent: number | null
          default_water_cost: number | null
          dorm_name: string | null
          electricity_rate: number | null
          id: string
          liff_id: string | null
          payment_deadline_days: number | null
          qr_code_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          billing_day?: number | null
          created_at?: string
          default_rent?: number | null
          default_water_cost?: number | null
          dorm_name?: string | null
          electricity_rate?: number | null
          id?: string
          liff_id?: string | null
          payment_deadline_days?: number | null
          qr_code_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          billing_day?: number | null
          created_at?: string
          default_rent?: number | null
          default_water_cost?: number | null
          dorm_name?: string | null
          electricity_rate?: number | null
          id?: string
          liff_id?: string | null
          payment_deadline_days?: number | null
          qr_code_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
