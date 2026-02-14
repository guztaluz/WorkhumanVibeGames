"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Lightbulb } from "lucide-react"
import { Team } from "@/types/database"
import { Profile } from "@/types/database"
import { getEmojiFromAvatar, getEmojiBgFromAvatar, isEmojiAvatar } from "@/components/profile-avatar"
import { cn } from "@/lib/utils"

interface TeamCardProps {
  team: Team
  index?: number
  /** Profiles to resolve member names to avatars (optional) */
  profiles?: Profile[]
}

export function TeamCard({ team, index = 0, profiles = [] }: TeamCardProps) {
  const initials = team.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Resolve member names to profiles (keep order from team.members)
  const memberProfiles = team.members
    .map((name) => profiles.find((p) => p.name === name))
    .filter((p): p is Profile => !!p)

  const memberLabel =
    team.members.length === 2
      ? `${team.members[0]} with ${team.members[1]}`
      : team.members.length === 3
        ? `${team.members[0]}, ${team.members[1]} & ${team.members[2]}`
        : team.members.join(", ")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="glass border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20 shrink-0">
              <AvatarImage src={team.avatar_url || undefined} alt={team.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow min-w-0">
              <h3 className="font-bold text-xl mb-2 truncate">{team.name}</h3>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
              </div>
              
              {/* Stacked avatars + names - same style as pairing groups */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2 shrink-0">
                  {(memberProfiles.length > 0 ? memberProfiles : team.members).map((pOrName, i) => {
                    const p = typeof pOrName === "string" ? null : pOrName
                    const name = typeof pOrName === "string" ? pOrName : pOrName.name
                    const emoji = p ? getEmojiFromAvatar(p.avatar_url) : null
                    const emojiBg = p ? getEmojiBgFromAvatar(p.avatar_url) : null
                    const imageSrc = p && p.avatar_url && !isEmojiAvatar(p.avatar_url) ? p.avatar_url : undefined
                    return emoji ? (
                      <div
                        key={i}
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border text-lg",
                          !emojiBg && "bg-card"
                        )}
                        style={emojiBg ? { backgroundColor: `#${emojiBg}` } : undefined}
                      >
                        {emoji}
                      </div>
                    ) : (
                      <Avatar key={i} className="size-10 border-2 border-border shrink-0">
                        <AvatarImage src={imageSrc} alt={name} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
                <span className="font-medium text-sm truncate">{memberLabel}</span>
              </div>
              
              {team.selected_idea && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                  <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {team.selected_idea}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
