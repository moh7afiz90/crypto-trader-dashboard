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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowUpRight,
  ArrowDownRight,
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
  STOP_LOSS: { icon: <ShieldX className="h-4 w-4" />, label: 'Stop Loss Hit', color: 'text-red-500' },
  TAKE_PROFIT_1: { icon: <Target className="h-4 w-4" />, label: 'Take Profit 1', color: 'text-green-500' },
  TAKE_PROFIT_2: { icon: <Target className="h-4 w-4" />, label: 'Take Profit 2', color: 'text-green-500' },
  MANUAL: { icon: <Hand className="h-4 w-4" />, label: 'Manual Close', color: 'text-orange-500' },
  TRAILING_STOP: { icon: <ArrowRightLeft className="h-4 w-4" />, label: 'Trailing Stop', color: 'text-yellow-500' },
}

const timeframeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  monthly: { icon: <Calendar className="h-4 w-4" />, label: 'Monthly (1M)' },
  weekly: { icon: <CalendarDays className="h-4 w-4" />, label: 'Weekly (1W)' },
  three_day: { icon: <Layers className="h-4 w-4" />, label: '3-Day (3D)' },
  daily: { icon: <BarChart3 className="h-4 w-4" />, label: 'Daily (1D)' },
  four_hour: { icon: <Timer className="h-4 w-4" />, label: '4-Hour (4H)' },
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
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{trade.symbol.replace('/USDT', '')}</span>
              {isOpen ? (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Open
                </Badge>
              ) : (
                <Badge variant={isPositive ? 'default' : 'destructive'} className="gap-1">
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive ? 'Win' : 'Loss'}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${isPositive ? 'text-green-500/70' : 'text-red-500/70'}`}>
                {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Chart Section */}
          <Card>
            <CardContent className="p-3">
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
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Duration</div>
              <div className="font-semibold">{duration}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">R:R</div>
              <div className="font-semibold">
                {trade.analysis?.risk_reward ? `${trade.analysis.risk_reward.toFixed(1)}:1` : '-'}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Size</div>
              <div className="font-semibold">${trade.entry_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Setup</div>
              <div className="font-semibold capitalize">{trade.analysis?.setup_type || '-'}</div>
            </div>
          </div>

          {/* Trade Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Entry */}
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Entry</span>
                </div>
                <div className="font-mono text-lg font-semibold">
                  ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(entryDate, 'MMM d, yyyy HH:mm')}
                </div>
              </CardContent>
            </Card>

            {/* Exit / Current */}
            <Card className={isOpen ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-orange-500/5 border-orange-500/20'}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className={`h-4 w-4 ${isOpen ? 'text-cyan-500' : 'text-orange-500'}`} />
                  <span className="text-sm font-medium">{isOpen ? 'Current' : 'Exit'}</span>
                  {exitConfig && (
                    <Badge variant="outline" className={`text-xs ${exitConfig.color}`}>
                      {exitConfig.label}
                    </Badge>
                  )}
                </div>
                <div className="font-mono text-lg font-semibold">
                  {isOpen && trade.current_price
                    ? `$${trade.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                    : trade.exit_price
                    ? `$${trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                    : '-'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isOpen ? 'Live price' : exitDate ? format(exitDate, 'MMM d, yyyy HH:mm') : '-'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Management */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Stop Loss</div>
              <div className="font-mono text-red-500 font-semibold">
                ${trade.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Take Profit 1</div>
              <div className="font-mono text-green-500 font-semibold">
                ${trade.take_profit_1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </div>
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Take Profit 2</div>
              <div className="font-mono text-green-500 font-semibold">
                {trade.take_profit_2
                  ? `$${trade.take_profit_2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                  : '-'}
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          {trade.analysis && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                  {trade.analysis.confidence && (
                    <Badge
                      variant={
                        trade.analysis.confidence === 'HIGH'
                          ? 'default'
                          : trade.analysis.confidence === 'MEDIUM'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="ml-auto"
                    >
                      {trade.analysis.confidence}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Trade Thesis */}
                {parsedAnalysis?.reasoning && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">Trade Thesis</div>
                    <p className="text-sm leading-relaxed">{parsedAnalysis.reasoning}</p>
                  </div>
                )}

                {/* Multi-Timeframe Analysis */}
                {hasTimeframeAnalysis && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">Timeframe Analysis</div>
                    <div className="grid gap-2">
                      {(['monthly', 'weekly', 'three_day', 'daily', 'four_hour'] as const).map((timeframe) => {
                        const content = parsedAnalysis?.analysis?.[timeframe]
                        if (!content) return null

                        const config = timeframeConfig[timeframe]

                        return (
                          <div key={timeframe} className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              {config.icon}
                              <span className="text-xs font-medium">{config.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {content}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Fallback */}
                {!parsedAnalysis && trade.analysis.response_received && (
                  <div className="bg-muted/50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {trade.analysis.response_received}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
