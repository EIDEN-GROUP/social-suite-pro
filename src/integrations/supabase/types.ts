export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      companies: {
        Row: {
          accent_color: string;
          bio: string | null;
          category: string | null;
          client_password: string;
          cover_url: string | null;
          created_at: string;
          followers: string | null;
          following: number | null;
          id: string;
          link: string | null;
          logo_url: string | null;
          name: string;
          profile_pic_url: string | null;
          slug: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          accent_color?: string;
          bio?: string | null;
          category?: string | null;
          client_password?: string;
          cover_url?: string | null;
          created_at?: string;
          followers?: string | null;
          following?: number | null;
          id?: string;
          link?: string | null;
          logo_url?: string | null;
          name: string;
          profile_pic_url?: string | null;
          slug: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          accent_color?: string;
          bio?: string | null;
          category?: string | null;
          client_password?: string;
          cover_url?: string | null;
          created_at?: string;
          followers?: string | null;
          following?: number | null;
          id?: string;
          link?: string | null;
          logo_url?: string | null;
          name?: string;
          profile_pic_url?: string | null;
          slug?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          company_id: string;
          created_at: string;
          emoji: string | null;
          id: string;
          image: string | null;
          label: string | null;
          position: number;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          emoji?: string | null;
          id?: string;
          image?: string | null;
          label?: string | null;
          position?: number;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          emoji?: string | null;
          id?: string;
          image?: string | null;
          label?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          approved_content_version: number | null;
          caption: string | null;
          client_comment: string | null;
          company_id: string;
          content_version: number;
          created_at: string;
          decided_at: string | null;
          extra_media: Json;
          id: string;
          media_type: string | null;
          media_url: string | null;
          platform: Database["public"]["Enums"]["platform"];
          position: number;
          post_type: Database["public"]["Enums"]["post_type"];
          post_url: string | null;
          posted_at: string | null;
          publish_state: string | null;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["approval_status"];
          updated_at: string;
        };
        Insert: {
          approved_content_version?: number | null;
          caption?: string | null;
          client_comment?: string | null;
          company_id: string;
          content_version?: number;
          created_at?: string;
          decided_at?: string | null;
          extra_media?: Json;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          platform: Database["public"]["Enums"]["platform"];
          position?: number;
          post_type?: Database["public"]["Enums"]["post_type"];
          post_url?: string | null;
          posted_at?: string | null;
          publish_state?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["approval_status"];
          updated_at?: string;
        };
        Update: {
          approved_content_version?: number | null;
          caption?: string | null;
          client_comment?: string | null;
          company_id?: string;
          content_version?: number;
          created_at?: string;
          decided_at?: string | null;
          extra_media?: Json;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          platform?: Database["public"]["Enums"]["platform"];
          position?: number;
          post_type?: Database["public"]["Enums"]["post_type"];
          post_url?: string | null;
          posted_at?: string | null;
          publish_state?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["approval_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_configs: {
        Row: {
          app_name: string | null;
          auth_config_id: string | null;
          auth_mode: string;
          created_at: string;
          enabled: boolean;
          id: string;
          oauth_redirect_uri: string | null;
          platform: Database["public"]["Enums"]["platform"];
          provisioned_at: string | null;
          provisioning_error: string | null;
          scopes: string | null;
          toolkit: string;
          updated_at: string;
        };
        Insert: {
          app_name?: string | null;
          auth_config_id?: string | null;
          auth_mode?: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          oauth_redirect_uri?: string | null;
          platform: Database["public"]["Enums"]["platform"];
          provisioned_at?: string | null;
          provisioning_error?: string | null;
          scopes?: string | null;
          toolkit: string;
          updated_at?: string;
        };
        Update: {
          app_name?: string | null;
          auth_config_id?: string | null;
          auth_mode?: string;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          oauth_redirect_uri?: string | null;
          platform?: Database["public"]["Enums"]["platform"];
          provisioned_at?: string | null;
          provisioning_error?: string | null;
          scopes?: string | null;
          toolkit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_accounts: {
        Row: {
          account_type: string | null;
          avatar_url: string | null;
          can_publish: boolean;
          capabilities: Json;
          company_id: string;
          composio_user_id: string;
          connected_account_id: string;
          created_at: string;
          created_by: string | null;
          display_name: string;
          external_account_id: string | null;
          id: string;
          last_checked_at: string | null;
          last_error: string | null;
          last_synced_at: string | null;
          permissions: Json;
          platform: Database["public"]["Enums"]["platform"];
          status: Database["public"]["Enums"]["social_account_status"];
          updated_at: string;
          username: string | null;
        };
        Insert: {
          account_type?: string | null;
          avatar_url?: string | null;
          can_publish?: boolean;
          capabilities?: Json;
          company_id: string;
          composio_user_id: string;
          connected_account_id: string;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          external_account_id?: string | null;
          id?: string;
          last_checked_at?: string | null;
          last_error?: string | null;
          last_synced_at?: string | null;
          permissions?: Json;
          platform: Database["public"]["Enums"]["platform"];
          status?: Database["public"]["Enums"]["social_account_status"];
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          account_type?: string | null;
          avatar_url?: string | null;
          can_publish?: boolean;
          capabilities?: Json;
          company_id?: string;
          composio_user_id?: string;
          connected_account_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          external_account_id?: string | null;
          id?: string;
          last_checked_at?: string | null;
          last_error?: string | null;
          last_synced_at?: string | null;
          permissions?: Json;
          platform?: Database["public"]["Enums"]["platform"];
          status?: Database["public"]["Enums"]["social_account_status"];
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      publishing_jobs: {
        Row: {
          approved_content_version: number | null;
          attempts_count: number;
          company_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          idempotency_key: string;
          kind: Database["public"]["Enums"]["publishing_job_kind"];
          last_error: string | null;
          locked_at: string | null;
          platform: Database["public"]["Enums"]["platform"];
          post_id: string;
          scheduled_for: string | null;
          social_account_id: string | null;
          status: Database["public"]["Enums"]["publishing_job_status"];
          updated_at: string;
        };
        Insert: {
          approved_content_version?: number | null;
          attempts_count?: number;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          idempotency_key: string;
          kind?: Database["public"]["Enums"]["publishing_job_kind"];
          last_error?: string | null;
          locked_at?: string | null;
          platform: Database["public"]["Enums"]["platform"];
          post_id: string;
          scheduled_for?: string | null;
          social_account_id?: string | null;
          status?: Database["public"]["Enums"]["publishing_job_status"];
          updated_at?: string;
        };
        Update: {
          approved_content_version?: number | null;
          attempts_count?: number;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          idempotency_key?: string;
          kind?: Database["public"]["Enums"]["publishing_job_kind"];
          last_error?: string | null;
          locked_at?: string | null;
          platform?: Database["public"]["Enums"]["platform"];
          post_id?: string;
          scheduled_for?: string | null;
          social_account_id?: string | null;
          status?: Database["public"]["Enums"]["publishing_job_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publishing_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publishing_jobs_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publishing_jobs_social_account_id_fkey";
            columns: ["social_account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      publishing_attempts: {
        Row: {
          attempt_no: number;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          job_id: string;
          outcome: string;
          provider_request_id: string | null;
          provider_response: Json | null;
          started_at: string;
        };
        Insert: {
          attempt_no: number;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_id: string;
          outcome?: string;
          provider_request_id?: string | null;
          provider_response?: Json | null;
          started_at?: string;
        };
        Update: {
          attempt_no?: number;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          job_id?: string;
          outcome?: string;
          provider_request_id?: string | null;
          provider_response?: Json | null;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publishing_attempts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "publishing_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      published_posts: {
        Row: {
          created_at: string;
          external_post_id: string | null;
          external_url: string | null;
          id: string;
          job_id: string;
          platform: Database["public"]["Enums"]["platform"];
          post_id: string;
          published_at: string;
          raw: Json | null;
        };
        Insert: {
          created_at?: string;
          external_post_id?: string | null;
          external_url?: string | null;
          id?: string;
          job_id: string;
          platform: Database["public"]["Enums"]["platform"];
          post_id: string;
          published_at?: string;
          raw?: Json | null;
        };
        Update: {
          created_at?: string;
          external_post_id?: string | null;
          external_url?: string | null;
          id?: string;
          job_id?: string;
          platform?: Database["public"]["Enums"]["platform"];
          post_id?: string;
          published_at?: string;
          raw?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "published_posts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "publishing_jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_events: {
        Row: {
          company_id: string | null;
          created_at: string;
          id: string;
          message: string | null;
          payload: Json | null;
          social_account_id: string | null;
          type: Database["public"]["Enums"]["integration_event_type"];
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          payload?: Json | null;
          social_account_id?: string | null;
          type: Database["public"]["Enums"]["integration_event_type"];
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          payload?: Json | null;
          social_account_id?: string | null;
          type?: Database["public"]["Enums"]["integration_event_type"];
        };
        Relationships: [];
      };
      publishing_audit_logs: {
        Row: {
          action: string;
          actor_type: string;
          actor_user_id: string | null;
          created_at: string;
          detail: Json | null;
          id: string;
          job_id: string | null;
          post_id: string | null;
        };
        Insert: {
          action: string;
          actor_type?: string;
          actor_user_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          id?: string;
          job_id?: string | null;
          post_id?: string | null;
        };
        Update: {
          action?: string;
          actor_type?: string;
          actor_user_id?: string | null;
          created_at?: string;
          detail?: Json | null;
          id?: string;
          job_id?: string | null;
          post_id?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          company_id: string | null;
          created_at: string;
          dedupe_key: string | null;
          id: string;
          link: string | null;
          post_id: string | null;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          body?: string | null;
          company_id?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          link?: string | null;
          post_id?: string | null;
          read_at?: string | null;
          title: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          body?: string | null;
          company_id?: string | null;
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          link?: string | null;
          post_id?: string | null;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      claim_due_publishing_jobs: {
        Args: { p_limit?: number };
        Returns: Database["public"]["Tables"]["publishing_jobs"]["Row"][];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      user_company_id: { Args: { _user_id: string }; Returns: string };
    };
    Enums: {
      app_role: "superadmin" | "client";
      approval_status: "pending" | "approved" | "rejected" | "posted";
      integration_event_type:
        | "connected"
        | "reconnected"
        | "disconnected"
        | "expired"
        | "error"
        | "synced"
        | "auth_config_created"
        | "auth_config_reset";
      platform: "instagram" | "tiktok" | "facebook" | "twitter" | "linkedin";
      post_type: "post" | "reel" | "story" | "carousel";
      publishing_job_kind: "immediate" | "scheduled";
      publishing_job_status:
        | "ready"
        | "scheduled"
        | "processing"
        | "published"
        | "failed"
        | "cancelled"
        | "requires_attention";
      social_account_status:
        | "connected"
        | "attention_required"
        | "expired"
        | "disconnected"
        | "error";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "client"],
      approval_status: ["pending", "approved", "rejected", "posted"],
      integration_event_type: [
        "connected",
        "reconnected",
        "disconnected",
        "expired",
        "error",
        "synced",
      ],
      platform: ["instagram", "tiktok", "facebook", "twitter", "linkedin"],
      post_type: ["post", "reel", "story", "carousel"],
      publishing_job_kind: ["immediate", "scheduled"],
      publishing_job_status: [
        "ready",
        "scheduled",
        "processing",
        "published",
        "failed",
        "cancelled",
        "requires_attention",
      ],
      social_account_status: [
        "connected",
        "attention_required",
        "expired",
        "disconnected",
        "error",
      ],
    },
  },
} as const;
