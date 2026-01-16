# Crypto Trader Dashboard

A real-time dashboard for monitoring crypto trading positions and AI-powered analysis.

## Features

- **Portfolio Overview**: Track total equity, available funds, and P&L
- **Market Context**: BTC price, 24h change, and Fear & Greed Index
- **Active Positions**: Real-time position tracking with P&L updates
- **AI Analysis**: View detailed AI trading analysis and reasoning
- **Equity Curve**: Visualize portfolio performance over time
- **Dark Mode**: Full dark/light mode support
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Deployment**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crypto-trader-dashboard.git
   cd crypto-trader-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy!

## License

MIT
