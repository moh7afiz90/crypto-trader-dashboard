import { createClient } from '@/lib/supabase/server'
import { PortfolioCard } from '@/components/dashboard/portfolio-card'
import { MarketCard } from '@/components/dashboard/market-card'
import { PositionsTable } from '@/components/dashboard/positions-table'
import { EquityCurve } from '@/components/charts/equity-curve'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch data in parallel
  const [portfolioRes, marketRes, positionsRes, performanceRes] = await Promise.all([
    supabase.from('portfolio').select('*').single(),
    supabase.from('market_snapshots').select('*').order('timestamp', { ascending: false }).limit(1).single(),
    supabase.from('positions').select('*').eq('status', 'OPEN').order('entry_timestamp', { ascending: false }),
    supabase.from('daily_stats').select('date, ending_equity, pnl, pnl_pct').order('date', { ascending: false }).limit(30),
  ])

  return (
    <div className="space-y-6">
      {/* Top Row: Portfolio + Market */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PortfolioCard portfolio={portfolioRes.data} />
        <MarketCard market={marketRes.data} />
      </div>

      {/* Positions Table */}
      <PositionsTable initialPositions={positionsRes.data || []} />

      {/* Equity Curve */}
      <EquityCurve data={(performanceRes.data || []).reverse()} />
    </div>
  )
}
