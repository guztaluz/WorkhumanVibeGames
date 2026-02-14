"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ToolLogo } from "@/components/tool-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Users, Trophy, Zap, Target, Palette, ArrowRight, UserPlus, Lightbulb } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const AI_TOOLS = [
  { name: "Cursor", domain: "cursor.com" },
  { name: "Claude Code", domain: "anthropic.com" },
  { name: "Google AI Studio", domain: "google.com" },
  { name: "Lovable", domain: "lovable.dev" },
  { name: "Figma", domain: "figma.com" },
  { name: "Replit", domain: "replit.com" },
  { name: "V0", domain: "vercel.com" },
  { name: "Cline", domain: "cline.dev" },
  { name: "Bolt", domain: "bolt.new" },
  { name: "Codeium", domain: "codeium.com" },
]

const rules = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Add your name, pick an avatar, and choose your vibe coding level. The host pairs you with a teammate.",
  },
  {
    icon: Users,
    title: "Form Your Team",
    description: "With your pair, create a team and give it a fun name.",
  },
  {
    icon: Lightbulb,
    title: "Select an Idea",
    description: "Pick from our gallery of absurd ideas or spin the wheel for a random one!",
  },
  {
    icon: Palette,
    title: "Build with Vibe Coding",
    description: "Use AI-assisted vibe coding to bring your ridiculous product idea to life.",
  },
  {
    icon: Target,
    title: "Present Your Creation in 2 Min",
    description: "Show off your masterpiece to the group. Make us laugh, make us think!",
  },
  {
    icon: Trophy,
    title: "Vote & Win",
    description: "Rate other teams on design, UX, innovation, and more. May the best vibes win!",
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const statueLeftY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const statueRightY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full viewport height with floating nav */}
      <section
        ref={heroRef}
        className="relative overflow-hidden min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 -mt-16 pt-24"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/hero-bg.png)" }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/65" aria-hidden />
        {/* Gradient overlay: black 0% to black 50% */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/0"
          aria-hidden
        />

        {/* Decorative statues with parallax - absolute positioned, don't affect layout */}
        <motion.div
          style={{ y: statueLeftY }}
          className="absolute left-0 bottom-0 top-0 w-[min(32vw,420px)] flex items-end justify-center pointer-events-none z-[5]"
          aria-hidden
        >
          <img
            src="/statue-left.png"
            alt=""
            className="h-[95vh] w-auto object-contain object-bottom"
          />
        </motion.div>
        <motion.div
          style={{ y: statueRightY }}
          className="absolute right-0 bottom-0 top-0 w-[min(32vw,420px)] flex items-end justify-center pointer-events-none z-[5]"
          aria-hidden
        >
          <img
            src="/statue-right.png"
            alt=""
            className="h-[95vh] w-auto object-contain object-bottom"
          />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto text-center hero-content">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Product Design Challenge</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-[25px] mb-6 font-thin tracking-wide uppercase"
            style={{ fontFamily: "Times, serif", color: "rgba(228, 214, 205, 1)" }}
          >
            Welcome to the Workhuman
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-bold mb-6"
          >
            <span className="gradient-text font-thin text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[120px] 2xl:text-[140px]">Vibe Games</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto"
            style={{ fontFamily: '"Times New Roman", serif', color: "rgba(228, 214, 205, 1)" }}
          >
            Where ridiculous ideas meet AI-powered creativity. Build absurd products, vote on the best designs, and have fun doing it!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/pairing">
              <Button size="lg" className="group animate-pulse-glow">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/voting">
              <Button size="lg" variant="outline">
                View Leaderboard
                <Trophy className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What is Vibe Games Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-[55px] font-thin mb-4">What are the Vibe Games?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vibe Games is a fun team activity where product designers compete to create 
              the most creative (and ridiculous) vibe-coded projects. Think hackathon meets 
              improv comedy meets design challenge!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass border-primary/20">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Vibe Coding</h3>
                    <p className="text-muted-foreground text-sm">
                      Use AI tools to rapidly prototype your wild ideas
                    </p>
                  </div>
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center">
                      <Palette className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Product Design</h3>
                    <p className="text-muted-foreground text-sm">
                      Focus on UX, UI, accessibility, and user flows
                    </p>
                  </div>
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-chart-3/20 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-chart-3" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Competition</h3>
                    <p className="text-muted-foreground text-sm">
                      Vote on multiple criteria and crown the champions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-[56px] font-thin mb-4">How It Works</h2>
            <p className="text-2xl text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "Times, serif" }}>
              Follow these simple steps to participate in the Vibe Games
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {rules.map((rule, index) => (
              <motion.div key={rule.title} variants={item}>
                <Card className="glass border-border/50 hover:border-primary/50 transition-colors h-full relative">
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg z-10">
                    {index + 1}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center">
                      <rule.icon className="w-6 h-6 text-primary mb-2" />
                      <h3 className="font-semibold text-base mb-1">{rule.title}</h3>
                      <p className="text-muted-foreground text-sm">{rule.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Tools - Collaborate and learn together */}
      <section className="py-20 overflow-hidden">
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 px-4 sm:px-6"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-thin mb-4">Build with Your Favorite AI Tools</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use Cursor, Claude, Replit, V0, Lovable, or any tool you&apos;re comfortable with. The idea is to work together, collaborate, and learn from each other—no restrictions, just vibes.
            </p>
          </motion.div>

          <div className="relative overflow-hidden w-screen left-1/2 -translate-x-1/2">
            <div className="flex gap-10 animate-marquee w-fit py-4">
              {[...AI_TOOLS, ...AI_TOOLS].map((tool, i) => (
                <a
                  key={`${tool.name}-${i}`}
                  href={`https://${tool.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 shrink-0 px-6 py-4 rounded-xl border border-border/50 bg-card/80 hover:border-primary/50 hover:bg-card transition-colors"
                >
                  <ToolLogo name={tool.name} domain={tool.domain} size="lg" />
                  <span className="font-medium text-base whitespace-nowrap">{tool.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Be Ruthless - Voting Section */}
      <section className="relative min-h-[600px] sm:min-h-[700px] flex items-center justify-center overflow-hidden">
        <Image
          src="/be-ruthless.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="font-display text-6xl sm:text-8xl md:text-9xl font-thin mb-8 text-white drop-shadow-lg">
              Be Ruthless
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-6">
              After each team presents in 2 minutes, everyone votes. No mercy, no participation trophies—just honest feedback.
            </p>
            <p className="text-white/80 max-w-2xl mx-auto">
              Rate each project on UI Design, UX Flow, Innovation, Viability, Accessibility, and Fun Factor. 
              Give 1–5 stars per category. You can&apos;t vote for your own team. Only the best ideas rise to the top.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Card className="glass border-primary/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-chart-3/10 animate-gradient" />
            <CardContent className="relative p-12">
              <h2 className="font-display text-3xl font-bold mb-4">Ready to Vibe?</h2>
              <p className="text-muted-foreground mb-8">
                Create your profile, form your team, pick an idea, and let the games begin!
              </p>
              <Link href="/pairing">
                <Button size="lg" className="group">
                  Join & Create Pairs
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
