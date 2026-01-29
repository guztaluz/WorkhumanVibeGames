export interface Database {
  public: {
    Tables: {
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

export type Team = Database['public']['Tables']['teams']['Row']
export type ProjectIdea = Database['public']['Tables']['project_ideas']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
