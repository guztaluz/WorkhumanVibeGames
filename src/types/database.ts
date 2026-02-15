export type SkillLevel = "just_starting" | "getting_hang" | "master"

export interface CreateTeamSafeResult {
  success: boolean
  reason?: string
  team?: {
    id: string
    name: string
    avatar_url: string | null
    members: string[]
    selected_idea: string | null
    created_at: string
  }
  existing_team?: {
    id: string
    name: string
    avatar_url: string | null
    members: string[]
    selected_idea: string | null
    created_at: string
  }
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          skill_level: SkillLevel
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar_url?: string | null
          skill_level?: SkillLevel
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          skill_level?: SkillLevel
          created_at?: string
        }
      }
      event_state: {
        Row: {
          id: string
          current_phase: string
          updated_at: string
        }
        Insert: {
          id?: string
          current_phase?: string
          updated_at?: string
        }
        Update: {
          id?: string
          current_phase?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          members: string[]
          selected_idea: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          avatar_url?: string | null
          members: string[]
          selected_idea?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          members?: string[]
          selected_idea?: string | null
          created_at?: string
        }
      }
      project_ideas: {
        Row: {
          id: string
          title: string
          description: string
          is_random_pool: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          is_random_pool?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          is_random_pool?: boolean
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          voter_name: string
          team_id: string
          category: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          voter_name: string
          team_id: string
          category: string
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          voter_name?: string
          team_id?: string
          category?: string
          score?: number
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Team = Database["public"]["Tables"]["teams"]["Row"]
export type ProjectIdea = Database["public"]["Tables"]["project_ideas"]["Row"]
export type Vote = Database["public"]["Tables"]["votes"]["Row"]
