"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  rotation: number
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    const colors = [
      '#FFD700', // Gold
      '#FFA500', // Orange
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#A855F7', // Purple
      '#3B82F6', // Blue
      '#22C55E', // Green
      '#F472B6', // Pink
    ]

    const newPieces: ConfettiPiece[] = []
    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        rotation: Math.random() * 360,
      })
    }
    setPieces(newPieces)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ 
            y: -20, 
            x: `${piece.x}vw`,
            rotate: 0,
            opacity: 1 
          }}
          animate={{ 
            y: '100vh',
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeIn"
          }}
          style={{ backgroundColor: piece.color }}
          className="absolute w-3 h-3 rounded-sm"
        />
      ))}
    </div>
  )
}
