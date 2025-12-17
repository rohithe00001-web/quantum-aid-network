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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fleet_vehicles: {
        Row: {
          assigned_shelter_id: string | null
          assigned_volunteer_id: string | null
          capacity: number | null
          created_at: string
          current_location: Json | null
          fuel_level: number | null
          id: string
          last_maintenance: string | null
          status: string
          updated_at: string
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          assigned_shelter_id?: string | null
          assigned_volunteer_id?: string | null
          capacity?: number | null
          created_at?: string
          current_location?: Json | null
          fuel_level?: number | null
          id?: string
          last_maintenance?: string | null
          status?: string
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string
        }
        Update: {
          assigned_shelter_id?: string | null
          assigned_volunteer_id?: string | null
          capacity?: number | null
          created_at?: string
          current_location?: Json | null
          fuel_level?: number | null
          id?: string
          last_maintenance?: string | null
          status?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_vehicles_assigned_shelter_id_fkey"
            columns: ["assigned_shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometric_enabled: boolean | null
          created_at: string
          full_name: string | null
          id: string
          offline_token: string | null
          offline_token_expires_at: string | null
          phone: string | null
          qr_code_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          created_at?: string
          full_name?: string | null
          id?: string
          offline_token?: string | null
          offline_token_expires_at?: string | null
          phone?: string | null
          qr_code_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          biometric_enabled?: boolean | null
          created_at?: string
          full_name?: string | null
          id?: string
          offline_token?: string | null
          offline_token_expires_at?: string | null
          phone?: string | null
          qr_code_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qpu_budget: {
        Row: {
          active_backend: string | null
          budget_limit: number
          budget_used: number
          id: string
          total_shots: number
          updated_at: string
          used_shots: number
        }
        Insert: {
          active_backend?: string | null
          budget_limit?: number
          budget_used?: number
          id?: string
          total_shots?: number
          updated_at?: string
          used_shots?: number
        }
        Update: {
          active_backend?: string | null
          budget_limit?: number
          budget_used?: number
          id?: string
          total_shots?: number
          updated_at?: string
          used_shots?: number
        }
        Relationships: []
      }
      quantum_operations: {
        Row: {
          algorithm: string
          completed_at: string | null
          created_at: string
          id: string
          is_simulation: boolean | null
          operation_type: string
          operator_id: string
          parameters: Json | null
          priority_override: boolean | null
          result: Json | null
          shots_used: number | null
          status: string
        }
        Insert: {
          algorithm: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_simulation?: boolean | null
          operation_type: string
          operator_id: string
          parameters?: Json | null
          priority_override?: boolean | null
          result?: Json | null
          shots_used?: number | null
          status?: string
        }
        Update: {
          algorithm?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_simulation?: boolean | null
          operation_type?: string
          operator_id?: string
          parameters?: Json | null
          priority_override?: boolean | null
          result?: Json | null
          shots_used?: number | null
          status?: string
        }
        Relationships: []
      }
      resource_requests: {
        Row: {
          created_at: string
          id: string
          needs_baby_formula: boolean | null
          needs_food: boolean | null
          needs_insulin: boolean | null
          needs_medicine: boolean | null
          needs_water: boolean | null
          other_needs: string | null
          priority_level: number | null
          sos_request_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          needs_baby_formula?: boolean | null
          needs_food?: boolean | null
          needs_insulin?: boolean | null
          needs_medicine?: boolean | null
          needs_water?: boolean | null
          other_needs?: string | null
          priority_level?: number | null
          sos_request_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          needs_baby_formula?: boolean | null
          needs_food?: boolean | null
          needs_insulin?: boolean | null
          needs_medicine?: boolean | null
          needs_water?: boolean | null
          other_needs?: string | null
          priority_level?: number | null
          sos_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_requests_sos_request_id_fkey"
            columns: ["sos_request_id"]
            isOneToOne: false
            referencedRelation: "sos_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          address: string | null
          amenities: string[] | null
          capacity: number
          contact_phone: string | null
          created_at: string
          current_occupancy: number
          id: string
          latitude: number
          longitude: number
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number
          contact_phone?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          latitude: number
          longitude: number
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          capacity?: number
          contact_phone?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sos_requests: {
        Row: {
          assigned_volunteer_id: string | null
          created_at: string
          eta_minutes: number | null
          id: string
          location: Json
          resolved_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          assigned_volunteer_id?: string | null
          created_at?: string
          eta_minutes?: number | null
          id?: string
          location: Json
          resolved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          assigned_volunteer_id?: string | null
          created_at?: string
          eta_minutes?: number | null
          id?: string
          location?: Json
          resolved_at?: string | null
          status?: string
          user_id?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vehicle_dispatches: {
        Row: {
          completed_at: string | null
          dispatch_type: string
          dispatched_at: string
          id: string
          notes: string | null
          shelter_id: string
          status: string
          vehicle_id: string
        }
        Insert: {
          completed_at?: string | null
          dispatch_type?: string
          dispatched_at?: string
          id?: string
          notes?: string | null
          shelter_id: string
          status?: string
          vehicle_id: string
        }
        Update: {
          completed_at?: string | null
          dispatch_type?: string
          dispatched_at?: string
          id?: string
          notes?: string | null
          shelter_id?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_dispatches_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_dispatches_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          assigned_at: string
          completed_at: string | null
          current_location: Json | null
          current_route: Json | null
          id: string
          operation_id: string | null
          status: string
          volunteer_id: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          current_location?: Json | null
          current_route?: Json | null
          id?: string
          operation_id?: string | null
          status?: string
          volunteer_id: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          current_location?: Json | null
          current_route?: Json | null
          id?: string
          operation_id?: string | null
          status?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "quantum_operations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "volunteer" | "user"
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
      app_role: ["admin", "operator", "volunteer", "user"],
    },
  },
} as const
