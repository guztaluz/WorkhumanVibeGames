import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Voting categories
export const VOTING_CATEGORIES = [
  { id: 'ui_design', name: 'UI Design', description: 'Visual aesthetics, polish, and consistency' },
  { id: 'ux_flow', name: 'UX Flow', description: 'Intuitive navigation and user journey' },
  { id: 'innovation', name: 'Innovation', description: 'Creativity and uniqueness of the concept' },
  { id: 'viability', name: 'Viability', description: 'Feasibility and real-world potential' },
  { id: 'accessibility', name: 'Accessibility', description: 'Inclusivity and usability for all users' },
  { id: 'fun_factor', name: 'Fun Factor', description: 'How enjoyable and engaging the experience is' },
] as const

export type VotingCategory = typeof VOTING_CATEGORIES[number]['id']
