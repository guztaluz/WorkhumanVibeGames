"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shuffle, Check, Sparkles, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react"
import { PROJECT_IDEAS } from "@/lib/project-ideas"

const CARD_GAP = 12

interface IdeaGeneratorProps {
  onSelectIdea: (idea: string | null) => void
  selectedIdea: string | null
}

export function IdeaGenerator({ onSelectIdea, selectedIdea }: IdeaGeneratorProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const galleryScrollRef = useRef<HTMLDivElement>(null)
  const [galleryPage, setGalleryPage] = useState(0)
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

  const totalGalleryPages = PROJECT_IDEAS.length

  const getScrollAmount = () => {
    const el = galleryScrollRef.current
    return el ? el.clientWidth + CARD_GAP : 0
  }

  const scrollGallery = (direction: "left" | "right") => {
    const el = galleryScrollRef.current
    if (!el) return
    const scrollAmount = getScrollAmount()
    const delta = direction === "right" ? scrollAmount : -scrollAmount
    const newScroll = Math.min(
      Math.max(0, el.scrollLeft + delta),
      el.scrollWidth - el.clientWidth
    )
    const newPage = Math.round(newScroll / scrollAmount)
    el.scrollTo({ left: newScroll, behavior: "smooth" })
    setGalleryPage(Math.min(newPage, totalGalleryPages - 1))
  }

  const handleGalleryScroll = () => {
    const el = galleryScrollRef.current
    if (!el) return
    const scrollAmount = getScrollAmount()
    const page = Math.min(
      Math.round(el.scrollLeft / scrollAmount),
      totalGalleryPages - 1
    )
    setGalleryPage(Math.max(0, page))
  }

  const goToPage = (page: number) => {
    const el = galleryScrollRef.current
    if (!el) return
    const scrollAmount = getScrollAmount()
    const maxScroll = el.scrollWidth - el.clientWidth
    const newScroll = Math.min(page * scrollAmount, maxScroll)
    el.scrollTo({ left: newScroll, behavior: "smooth" })
    setGalleryPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Random Idea Generator */}
      <Card className="glass border-primary/30 overflow-hidden !py-3">
        <CardContent className="px-5 py-2">
          <div className="flex items-center gap-2 mb-2">
            <Shuffle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Random Idea Generator</h3>
          </div>
          
          <p className="text-muted-foreground text-sm mb-2">
            Can&apos;t decide? Let fate choose your destiny!
          </p>

          <div className="min-h-[120px] mb-2 flex items-center justify-center">
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
                    <p className="font-medium text-sm">
                      <span className="mr-2">{currentSpinIdea.emoji ?? "💡"}</span>
                      {currentSpinIdea.title}
                    </p>
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
                      <span className="text-2xl flex-shrink-0">{displayedIdea.emoji ?? "💡"}</span>
                      <div>
                        <h4 className="font-bold mb-1">{displayedIdea.title}</h4>
                        <p className="text-sm text-muted-foreground">{displayedIdea.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        const fullIdea = `${displayedIdea.title}: ${displayedIdea.description}`
                        onSelectIdea(selectedIdea === fullIdea ? null : fullIdea)
                      }}
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
            className="w-full mt-1"
            variant="outline"
          >
            <Shuffle className={`w-4 h-4 mr-2 ${isSpinning ? 'animate-spin' : ''}`} />
            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
          </Button>
        </CardContent>
      </Card>

      {/* Ideas gallery - scroll by 3 with arrows + page dots */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground">Or pick from these ideas</span>
        </div>

        <div
          ref={galleryScrollRef}
          onScroll={handleGalleryScroll}
          className="flex overflow-x-auto w-full py-6 px-2 gap-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            {PROJECT_IDEAS.map((idea) => {
              const fullIdea = `${idea.title}: ${idea.description}`
              const isSelected = selectedIdea === fullIdea

              return (
                <motion.div
                  key={idea.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="shrink-0 min-w-full w-full min-h-[220px] snap-start py-1"
                >
                  <Card
                    className={`cursor-pointer transition-all h-full border-2 border-border ${
                      isSelected
                        ? "!border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "hover:!border-primary/60"
                    }`}
                    onClick={() => onSelectIdea(isSelected ? null : fullIdea)}
                  >
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="flex flex-col items-center text-center">
                        <span className="text-4xl mb-3" aria-hidden>
                          {idea.emoji ?? "💡"}
                        </span>
                        <h4 className="font-semibold text-lg mb-2">{idea.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {idea.description}
                        </p>
                        {isSelected && (
                          <Badge className="mt-4 gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
        </div>

        {/* Arrows + page indicator dots */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => scrollGallery("left")}
            disabled={galleryPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[min(100%,320px)] py-1">
            {Array.from({ length: totalGalleryPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                className={`h-2 shrink-0 rounded-full transition-all ${
                  i === galleryPage
                    ? "w-6 bg-primary"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Go to page ${i + 1} of ${totalGalleryPages}`}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => scrollGallery("right")}
            disabled={galleryPage >= totalGalleryPages - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
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
