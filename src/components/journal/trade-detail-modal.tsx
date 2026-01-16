'use client'

import { useMemo } from 'react'
import { formatDistanceStrict, formatDistanceToNow, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Target,
  ShieldX,
  Hand,
  ArrowRightLeft,
  Clock,
  Brain,
  Calendar,
  BarChart3,
  Layers,
  CalendarDays,
  Timer,
  Activity,
  Crosshair,
} from 'lucide-react'
import { TradeChart } from './trade-chart'
import type { JournalEntry } from '@/app/(dashboard)/journal/page'

interface TradeDetailModalProps {
  trade: JournalEntry | null
  open: boolean
  onClose: () => void
}

interface ParsedAnalysis {
  analysis?: {
    monthly?: string
    weekly?: string
    three_day?: string
    daily?: string
    four_hour?: string
  }
  reasoning?: string
}

const exitReasonConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  STOP_LOSS: { icon: <ShieldX className="h-3.5 w-3.5" />, label: 'Stop Loss', color: 'text-red-400' },
  TAKE_PROFIT_1: { icon: <Target className="h-3.5 w-3.5" />, label: 'TP1 Hit', color: 'text-green-400' },
  TAKE_PROFIT_2: { icon: <Target className="h-3.5 w-3.5" />, label: 'TP2 Hit', color: 'text-green-400' },
  MANUAL: { icon: <Hand className="h-3.5 w-3.5" />, label: 'Manual', color: 'text-yellow-400' },
  TRAILING_STOP: { icon: <ArrowRightLeft className="h-3.5 w-3.5" />, label: 'Trailing', color: 'text-orange-400' },
}

const timeframeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  monthly: { icon: <Calendar className="h-3.5 w-3.5" />, label: '1M' },
  weekly: { icon: <CalendarDays className="h-3.5 w-3.5" />, label: '1W' },
  three_day: { icon: <Layers className="h-3.5 w-3.5" />, label: '3D' },
  daily: { icon: <BarChart3 className="h-3.5 w-3.5" />, label: '1D' },
  four_hour: { icon: <Timer className="h-3.5 w-3.5" />, label: '4H' },
}

function parseAIResponse(responseText: string | undefined): ParsedAnalysis | null {
  if (!responseText) return null

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        analysis: parsed.analysis,
        reasoning: parsed.reasoning,
      }
    }
  } catch {
    // If JSON parsing fails, return null
  }

  return null
}

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  const parsedAnalysis = useMemo(() => {
    if (!trade?.analysis?.response_received) return null
    return parseAIResponse(trade.analysis.response_received)
  }, [trade?.analysis?.response_received])

  if (!trade) return null

  const isOpen = trade.status === 'OPEN'
  const pnl = isOpen ? (trade.unrealized_pnl ?? 0) : (trade.realized_pnl ?? 0)
  const pnlPct = isOpen ? (trade.unrealized_pnl_pct ?? 0) : (trade.realized_pnl_pct ?? 0)
  const isPositive = pnl > 0

  const entryDate = new Date(trade.entry_timestamp)
  const exitDate = trade.exit_timestamp ? new Date(trade.exit_timestamp) : null

  let duration: string
  if (isOpen) {
    duration = formatDistanceToNow(entryDate, { addSuffix: false })
  } else if (exitDate) {
    duration = formatDistanceStrict(entryDate, exitDate, { addSuffix: false })
  } else {
    duration = '-'
  }

  const hasTimeframeAnalysis = parsedAnalysis?.analysis && Object.values(parsedAnalysis.analysis).some(Boolean)
  const exitConfig = trade.exit_reason ? exitReasonConfig[trade.exit_reason] : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!w-[95vw] !max-w-[1600px] max-h-[95vh] overflow-y-auto p-0 bg-zinc-950 border-zinc-800">
        {/* Header */}
        <DialogHeader className="sticky top-0 z-10 p-4 border-b border-zinc-800 bg-zinc-950">
          <DialogTitle className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-zinc-100">{trade.symbol.replace('/USDT', '')}</span>
                <span className="text-zinc-500 text-lg font-normal">/USDT</span>
              </div>
              {isOpen ? (
                <Badge variant="outline" className="gap-1 bg-blue-500/10 border-blue-500/30 text-blue-400">
                  <Activity className="h-3 w-3 animate-pulse" />
                  LIVE
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    isPositive
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? 'WIN' : 'LOSS'}
                </Badge>
              )}
              {exitConfig && (
                <Badge variant="outline" className={`gap-1 bg-zinc-800 border-zinc-700 ${exitConfig.color}`}>
                  {exitConfig.icon}
                  {exitConfig.label}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
              </div>
              <div className={`text-sm font-mono ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Chart and Stats Row */}
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Chart - Takes most space */}
            <div className="flex-1 min-w-0">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <TradeChart
                  symbol={trade.symbol}
                  entryPrice={trade.entry_price}
                  entryTimestamp={trade.entry_timestamp}
                  exitPrice={trade.exit_price}
                  exitTimestamp={trade.exit_timestamp}
                  stopLoss={trade.stop_loss}
                  takeProfit1={trade.take_profit_1}
                  takeProfit2={trade.take_profit_2}
                  currentPrice={trade.current_price}
                  isOpen={isOpen}
                />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="xl:w-80 flex-shrink-0 space-y-4">
              {/* Trade Info */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Trade Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Duration</span>
                    <span className="text-sm font-mono text-zinc-100">{duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">R:R Ratio</span>
                    <span className="text-sm font-mono text-zinc-100">
                      {trade.analysis?.risk_reward ? `${trade.analysis.risk_reward.toFixed(1)}:1` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Position Size</span>
                    <span className="text-sm font-mono text-zinc-100">
                      ${trade.entry_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Setup Type</span>
                    <span className="text-sm font-mono text-zinc-100 capitalize">
                      {trade.analysis?.setup_type || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Confidence</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        trade.analysis?.confidence === 'HIGH'
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : trade.analysis?.confidence === 'MEDIUM'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'
                      }`}
                    >
                      {trade.analysis?.confidence || '-'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Price Levels */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Price Levels</h3>
                <div className="space-y-2">
                  {trade.take_profit_2 && (
                    <div className="flex justify-between items-center py-1.5 px-2 rounded bg-green-500/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-zinc-400">TP2</span>
                      </div>
                      <span className="text-sm font-mono text-zinc-200">
                        ${trade.take_profit_2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5 px-2 rounded bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-zinc-400">TP1</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-200">
                      ${trade.take_profit_1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                  {isOpen && trade.current_price && (
                    <div className="flex justify-between items-center py-1.5 px-2 rounded bg-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="text-xs text-zinc-400">Current</span>
                      </div>
                      <span className="text-sm font-mono text-cyan-400">
                        ${trade.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </div>
                  )}
                  {!isOpen && trade.exit_price && (
                    <div className="flex justify-between items-center py-1.5 px-2 rounded bg-orange-500/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-xs text-zinc-400">Exit</span>
                      </div>
                      <span className="text-sm font-mono text-orange-400">
                        ${trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1.5 px-2 rounded bg-blue-500/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-zinc-400">Entry</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-200">
                      ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 px-2 rounded bg-red-500/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-zinc-400">Stop Loss</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-200">
                      ${trade.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-zinc-400">Entry</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-200">{format(entryDate, 'MMM d, HH:mm')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-cyan-500 animate-pulse' : 'bg-orange-500'}`}></div>
                      <span className="text-sm text-zinc-400">{isOpen ? 'Now' : 'Exit'}</span>
                    </div>
                    <span className="text-sm font-mono text-zinc-200">
                      {isOpen ? 'Active' : exitDate ? format(exitDate, 'MMM d, HH:mm') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          {trade.analysis && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </h3>
                <div className="flex items-center gap-2">
                  {trade.analysis.setup_type && (
                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300 capitalize">
                      <Crosshair className="h-3 w-3 mr-1" />
                      {trade.analysis.setup_type}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Trade Thesis */}
              {parsedAnalysis?.reasoning && (
                <div className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Trade Thesis</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{parsedAnalysis.reasoning}</p>
                </div>
              )}

              {/* Multi-Timeframe Analysis */}
              {hasTimeframeAnalysis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {(['monthly', 'weekly', 'three_day', 'daily', 'four_hour'] as const).map((timeframe) => {
                    const content = parsedAnalysis?.analysis?.[timeframe]
                    if (!content) return null

                    const config = timeframeConfig[timeframe]

                    return (
                      <div key={timeframe} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-zinc-400">{config.icon}</span>
                          <span className="text-xs font-medium text-zinc-400">{config.label}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {content}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Fallback */}
              {!parsedAnalysis && trade.analysis.response_received && (
                <div className="bg-zinc-800/50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {trade.analysis.response_received}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
