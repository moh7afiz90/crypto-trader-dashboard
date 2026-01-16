'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import { JournalTable } from '@/components/journal/journal-table'
import { JournalFilters, FilterState } from '@/components/journal/journal-filters'
import { TradeDetailModal } from '@/components/journal/trade-detail-modal'

export interface JournalEntry {
  id: string
  symbol: string
  entry_price: number
  exit_price: number | null
  current_price: number | null
  quantity: number
  entry_value: number
  stop_loss: number
  take_profit_1: number
  take_profit_2: number | null
  entry_timestamp: string
  exit_timestamp: string | null
  exit_reason: string | null
  realized_pnl: number | null
  realized_pnl_pct: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null
  status: 'OPEN' | 'CLOSED'
  signal_id: string | null
  analysis: {
    setup_type: string
    confidence: string
    risk_reward: number
    response_received: string
  } | null
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrade, setSelectedTrade] = useState<JournalEntry | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    symbol: '',
    status: 'all',
    winOnly: 'all',
    exitReason: 'all',
    confidence: 'all',
    from: undefined,
    to: undefined,
  })

  const fetchJournal = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.symbol) params.set('symbol', filters.symbol)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.winOnly !== 'all') params.set('winOnly', filters.winOnly)
      if (filters.exitReason !== 'all') params.set('exitReason', filters.exitReason)
      if (filters.confidence !== 'all') params.set('confidence', filters.confidence)
      if (filters.from) params.set('from', filters.from.toISOString())
      if (filters.to) params.set('to', filters.to.toISOString())

      const response = await fetch(`/api/journal?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch journal')
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching journal:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchJournal()
  }, [fetchJournal])

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleTradeClick = (trade: JournalEntry) => {
    setSelectedTrade(trade)
  }

  const handleCloseModal = () => {
    setSelectedTrade(null)
  }

  // Calculate summary stats
  const totalTrades = entries.length
  const openTrades = entries.filter((e) => e.status === 'OPEN').length
  const closedTrades = entries.filter((e) => e.status === 'CLOSED')
  const wins = closedTrades.filter((e) => (e.realized_pnl ?? 0) > 0).length
  const losses = closedTrades.filter((e) => (e.realized_pnl ?? 0) < 0).length
  const winRate = closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(1) : '0'

  // Calculate total P&L (realized for closed, unrealized for open)
  const realizedPnl = closedTrades.reduce((sum, e) => sum + (e.realized_pnl ?? 0), 0)
  const unrealizedPnl = entries
    .filter((e) => e.status === 'OPEN')
    .reduce((sum, e) => sum + (e.unrealized_pnl ?? 0), 0)
  const totalPnl = realizedPnl + unrealizedPnl

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading Journal</h1>
        <p className="text-muted-foreground">
          Track your active and closed trades
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{openTrades}</div>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{wins}</div>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{losses}</div>
            <p className="text-xs text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total P&L ({winRate}% WR)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <JournalFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Journal Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Trade History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JournalTable
            entries={entries}
            loading={loading}
            onTradeClick={handleTradeClick}
          />
        </CardContent>
      </Card>

      {/* Trade Detail Modal */}
      <TradeDetailModal
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={handleCloseModal}
      />
    </div>
  )
}
