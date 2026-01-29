"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Check, Sparkles, Lightbulb } from "lucide-react"
import { PROJECT_IDEAS } from "@/lib/project-ideas"

interface IdeaGeneratorProps {
  onSelectIdea: (idea: string) => void
  selectedIdea: string | null
}

export function IdeaGenerator({ onSelectIdea, selectedIdea }: IdeaGeneratorProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [displayedIdea, setDisplayedIdea] = useState<typeof PROJECT_IDEAS[0] | null>(null)
  const [spinIndex, setSpinIndex] = useState(0)

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setSpinIndex(prev => (prev + 1) % PROJECT_IDEAS.length)
      }, 80)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        setIsSpinning(false)
        const randomIdea = PROJECT_IDEAS[Math.floor(Math.random() * PROJECT_IDEAS.length)]
        setDisplayedIdea(randomIdea)
      }, 2000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isSpinning])

  const handleSpin = () => {
    setIsSpinning(true)
    setDisplayedIdea(null)
  }

  const currentSpinIdea = PROJECT_IDEAS[spinIndex]

  return (
    <div className="space-y-6">
      {/* Random Idea Generator */}
      <Card className="glass border-primary/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shuffle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Random Idea Generator</h3>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4">
            Can&apos;t decide? Let fate choose your destiny!
          </p>

          <div className="min-h-[120px] mb-4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {isSpinning ? (
                <motion.div
                  key="spinning"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 animate-shimmer">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                    </motion.div>
                    <p className="font-medium text-sm">{currentSpinIdea.title}</p>
                  </div>
                </motion.div>
              ) : displayedIdea ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  className="w-full"
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-bold mb-1">{displayedIdea.title}</h4>
                        <p className="text-sm text-muted-foreground">{displayedIdea.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => onSelectIdea(`${displayedIdea.title}: ${displayedIdea.description}`)}
                      disabled={selectedIdea === `${displayedIdea.title}: ${displayedIdea.description}`}
                    >
                      {selectedIdea === `${displayedIdea.title}: ${displayedIdea.description}` ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Selected!
                        </>
                      ) : (
                        "Select This Idea"
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-muted-foreground text-center"
                >
                  Click the button to generate a random idea!
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full"
            variant="outline"
          >
            <Shuffle className={`w-4 h-4 mr-2 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
          </Button>
        </CardContent>
      </Card>

      {/* Pre-defined Ideas Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Or Pick From These Ideas</h3>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2">
          {PROJECT_IDEAS.slice(0, 8).map((idea) => {
            const fullIdea = `${idea.title}: ${idea.description}`
            const isSelected = selectedIdea === fullIdea
            
            return (
              <motion.div
                key={idea.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                  onClick={() => onSelectIdea(fullIdea)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm mb-1 truncate">{idea.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {idea.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Badge className="flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Selected Idea Display */}
      {selectedIdea && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="font-semibold">Selected Idea</span>
          </div>
          <p className="text-sm text-muted-foreground">{selectedIdea}</p>
        </motion.div>
      )}
    </div>
  )
}
