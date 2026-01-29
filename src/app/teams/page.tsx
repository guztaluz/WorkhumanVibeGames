"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TeamForm } from "@/components/team-form"
import { TeamCard } from "@/components/team-card"
import { IdeaGenerator } from "@/components/idea-generator"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Trophy, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Team } from "@/types/database"
import { supabase } from "@/lib/supabase"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)

  // Load teams on mount
  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    setIsLoading(true)
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
      setUseLocalStorage(false)
    } catch {
      // Fallback to localStorage if Supabase is not configured
      console.log('Using localStorage fallback')
      setUseLocalStorage(true)
      const stored = localStorage.getItem('vibe-games-teams')
      if (stored) {
        setTeams(JSON.parse(stored))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: Omit<Team, 'id' | 'created_at'>) => {
    if (useLocalStorage) {
      // localStorage fallback
      const newTeam: Team = {
        ...teamData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      }
      const updatedTeams = [newTeam, ...teams]
      setTeams(updatedTeams)
      localStorage.setItem('vibe-games-teams', JSON.stringify(updatedTeams))
      setSelectedIdea(null)
    } else {
      // Use Supabase
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData as never)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setTeams([data as Team, ...teams])
      }
      setSelectedIdea(null)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Team Setup</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Create Your Team</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Form your squad, pick a ridiculous project idea, and get ready to vibe code your way to victory!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form & Idea Generator */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TeamForm onSubmit={handleCreateTeam} selectedIdea={selectedIdea} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <IdeaGenerator
                onSelectIdea={setSelectedIdea}
                selectedIdea={selectedIdea}
              />
            </motion.div>
          </div>

          {/* Right Column - Created Teams */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Teams ({teams.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={loadTeams}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-secondary/30 animate-pulse"
                  />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-8 rounded-xl border-2 border-dashed border-border"
              >
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                <p className="text-muted-foreground text-sm">
                  Create the first team to get the games started!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <TeamCard key={team.id} team={team} index={index} />
                ))}
              </div>
            )}

            {/* Proceed to Voting CTA */}
            {teams.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 border-t border-border"
              >
                <Link href="/voting">
                  <Button size="lg" className="w-full group">
                    Proceed to Voting
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  <Trophy className="w-4 h-4 inline mr-1" />
                  Ready to present and vote on projects!
                </p>
              </motion.div>
            )}

            {/* Local Storage Notice */}
            {useLocalStorage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm"
              >
                <p className="text-yellow-500">
                  Running in demo mode (localStorage). Configure Supabase for full functionality.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
