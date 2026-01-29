# Vibe Games

A fun, modern web application for product design team activities where teams compete to create the best vibe-coded projects!

## Features

- **Team Creation**: Form teams with custom names, avatars, and member lists
- **Random Idea Generator**: Spin the wheel for hilarious project ideas or pick from curated suggestions
- **Live Voting**: Rate projects across 6 categories (UI Design, UX Flow, Innovation, Viability, Accessibility, Fun Factor)
- **Real-time Leaderboard**: Watch rankings update live as votes come in
- **Modern UI**: Dark theme with glassmorphism effects, smooth animations, and responsive design

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Framer Motion** for animations
- **Supabase** for database and real-time subscriptions

## Getting Started

### 1. Clone and Install

```bash
cd vibe-games
npm install
```

### 2. Set Up Supabase

1. Create a free Supabase project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor and run the contents of `supabase-schema.sql` to create the tables
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file (or update the existing one):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Demo Mode

The app works without Supabase configuration! It will automatically fall back to localStorage for data storage. This is great for testing, but note that:
- Data won't persist across browsers/devices
- Real-time sync won't work
- Data is stored only in your browser

## Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Voting Categories

| Category | Description |
|----------|-------------|
| UI Design | Visual aesthetics, polish, and consistency |
| UX Flow | Intuitive navigation and user journey |
| Innovation | Creativity and uniqueness of the concept |
| Viability | Feasibility and real-world potential |
| Accessibility | Inclusivity and usability for all users |
| Fun Factor | How enjoyable and engaging the experience is |

## Project Structure

```
vibe-games/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home/Intro page
│   │   ├── teams/page.tsx    # Team creation page
│   │   ├── voting/page.tsx   # Voting & leaderboard page
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── navigation.tsx    # Top navigation bar
│   │   ├── team-card.tsx     # Team display card
│   │   ├── team-form.tsx     # Team creation form
│   │   ├── idea-generator.tsx # Random idea generator
│   │   ├── voting-card.tsx   # Voting interface
│   │   ├── leaderboard.tsx   # Live leaderboard
│   │   └── ui/               # shadcn components
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   ├── project-ideas.ts  # Pre-seeded ideas
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── database.ts       # TypeScript types
├── supabase-schema.sql       # Database schema
└── .env.local.example        # Environment template
```

## License

MIT
