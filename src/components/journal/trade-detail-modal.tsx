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
  DollarSign,
  Percent,
  Calendar,
  BarChart3,
  Layers,
  CalendarDays,
  Timer,
} from 'lucide-react'
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

const exitReasonIcons: Record<string, React.ReactNode> = {
  STOP_LOSS: <ShieldX className="h-4 w-4" />,
  TAKE_PROFIT_1: <Target className="h-4 w-4" />,
  TAKE_PROFIT_2: <Target className="h-4 w-4" />,
  MANUAL: <Hand className="h-4 w-4" />,
  TRAILING_STOP: <ArrowRightLeft className="h-4 w-4" />,
}

const exitReasonLabels: Record<string, string> = {
  STOP_LOSS: 'Stop Loss Hit',
  TAKE_PROFIT_1: 'Take Profit 1 Hit',
  TAKE_PROFIT_2: 'Take Profit 2 Hit',
  MANUAL: 'Manual Close',
  TRAILING_STOP: 'Trailing Stop Hit',
}

const timeframeIcons: Record<string, React.ReactNode> = {
  monthly: <Calendar className="h-4 w-4" />,
  weekly: <CalendarDays className="h-4 w-4" />,
  three_day: <Layers className="h-4 w-4" />,
  daily: <BarChart3 className="h-4 w-4" />,
  four_hour: <Timer className="h-4 w-4" />,
}

const timeframeLabels: Record<string, string> = {
  monthly: 'Monthly (1M)',
  weekly: 'Weekly (1W)',
  three_day: '3-Day (3D)',
  daily: 'Daily (1D)',
  four_hour: '4-Hour (4H)',
}

function parseAIResponse(responseText: string | undefined): ParsedAnalysis | null {
  if (!responseText) return null

  try {
    // Try to extract JSON from the response
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

  // Duration calculation
  let duration: string
  if (isOpen) {
    duration = formatDistanceToNow(entryDate, { addSuffix: false })
  } else if (exitDate) {
    duration = formatDistanceStrict(entryDate, exitDate, { addSuffix: false })
  } else {
    duration = '-'
  }

  const hasTimeframeAnalysis = parsedAnalysis?.analysis && Object.values(parsedAnalysis.analysis).some(Boolean)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-bold">{trade.symbol.replace('/USDT', '')}</span>
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
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Trade Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Percent className="h-3 w-3" />
                  P&L %
                </div>
                <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </div>
                <div className="text-lg font-bold">{duration}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Target className="h-3 w-3" />
                  R:R Ratio
                </div>
                <div className="text-lg font-bold">
                  {trade.analysis?.risk_reward
                    ? `${trade.analysis.risk_reward.toFixed(1)}:1`
                    : '-'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <DollarSign className="h-3 w-3" />
                  Position Size
                </div>
                <div className="text-lg font-bold">
                  ${trade.entry_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entry/Exit Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trade Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Entry</p>
                  <p className="font-mono font-medium">
                    ${trade.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(entryDate, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {isOpen ? 'Current Price' : 'Exit'}
                  </p>
                  <p className="font-mono font-medium">
                    {isOpen && trade.current_price
                      ? `$${trade.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                      : trade.exit_price
                      ? `$${trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                      : '-'}
                  </p>
                  {!isOpen && exitDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(exitDate, 'MMM d, yyyy HH:mm')}
                    </p>
                  )}
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Live price
                    </p>
                  )}
                </div>
              </div>

              {!isOpen && trade.exit_reason && (
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Exit Reason</p>
                  <Badge variant="outline" className="gap-2">
                    {exitReasonIcons[trade.exit_reason]}
                    {exitReasonLabels[trade.exit_reason] || trade.exit_reason}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                  <p className="font-mono text-red-500 font-medium">
                    ${trade.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Take Profit 1</p>
                  <p className="font-mono text-green-500 font-medium">
                    ${trade.take_profit_1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Take Profit 2</p>
                  <p className="font-mono text-green-500 font-medium">
                    {trade.take_profit_2
                      ? `$${trade.take_profit_2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {trade.analysis && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Setup badges */}
                <div className="flex flex-wrap gap-2">
                  {trade.analysis.setup_type && (
                    <Badge variant="secondary" className="capitalize">
                      {trade.analysis.setup_type}
                    </Badge>
                  )}
                  {trade.analysis.confidence && (
                    <Badge
                      variant={
                        trade.analysis.confidence === 'HIGH'
                          ? 'default'
                          : trade.analysis.confidence === 'MEDIUM'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {trade.analysis.confidence} Confidence
                    </Badge>
                  )}
                </div>

                {/* Trade Thesis / Reasoning */}
                {parsedAnalysis?.reasoning && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Trade Thesis</p>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-sm leading-relaxed">{parsedAnalysis.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Multi-Timeframe Analysis */}
                {hasTimeframeAnalysis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-medium">Multi-Timeframe Breakdown</p>
                    <div className="space-y-3">
                      {(['monthly', 'weekly', 'three_day', 'daily', 'four_hour'] as const).map((timeframe) => {
                        const content = parsedAnalysis?.analysis?.[timeframe]
                        if (!content) return null

                        return (
                          <div key={timeframe} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              {timeframeIcons[timeframe]}
                              <span className="text-xs font-medium">{timeframeLabels[timeframe]}</span>
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

                {/* Fallback: Raw response if parsing failed */}
                {!parsedAnalysis && trade.analysis.response_received && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">AI Response</p>
                    <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                        {trade.analysis.response_received}
                      </pre>
                    </div>
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
