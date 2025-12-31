# Darth's Dash

A fun, kid-friendly side-scrolling platformer game where cartoon Darth Vader dodges Baby Yodas in flying cars!

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript
- **Game Engine**: Phaser.js 3
- **Styling**: Tailwind CSS
- **Database**: Supabase (leaderboards)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd darths-dash
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the contents of `supabase-schema.sql`
   - Go to Settings > API and copy your project URL and anon key

4. Create environment file:
```bash
cp .env.local.example .env.local
```

5. Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Game Controls

- **Arrow Keys**: Move left/right
- **Up Arrow / Space**: Jump
- **ESC**: Pause game

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## Project Structure

```
darths-dash/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── game/               # Phaser game code
│   │   ├── config/         # Game configuration
│   │   ├── scenes/         # Game scenes
│   │   └── sprites/        # Sprite classes
│   └── lib/                # Utilities (Supabase client)
├── public/
│   └── assets/             # Game assets
└── supabase-schema.sql     # Database schema
```

## Features

- Side-scrolling platformer gameplay
- Cartoon Darth Vader character
- Baby Yodas in hover cars as enemies
- Crystal collectibles for points
- Global leaderboard
- Pause functionality
- Increasing difficulty over time

## License

MIT
