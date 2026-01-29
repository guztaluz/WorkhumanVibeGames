"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Lightbulb } from "lucide-react"
import { Team } from "@/types/database"

interface TeamCardProps {
  team: Team
  index?: number
}

export function TeamCard({ team, index = 0 }: TeamCardProps) {
  const initials = team.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="glass border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage src={team.avatar_url || undefined} alt={team.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-grow min-w-0">
              <h3 className="font-bold text-lg mb-2 truncate">{team.name}</h3>
              
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                <Users className="w-4 h-4" />
                <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {team.members.slice(0, 4).map((member, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {member}
                  </Badge>
                ))}
                {team.members.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{team.members.length - 4} more
                  </Badge>
                )}
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
