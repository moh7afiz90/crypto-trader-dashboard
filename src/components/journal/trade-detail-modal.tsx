'use client'

import { formatDistanceStrict, format } from 'date-fns'
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
} from 'lucide-react'
import type { JournalEntry } from '@/app/(dashboard)/journal/page'

interface TradeDetailModalProps {
  trade: JournalEntry | null
  open: boolean
  onClose: () => void
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

export function TradeDetailModal({ trade, open, onClose }: TradeDetailModalProps) {
  if (!trade) return null

  const isWin = trade.realized_pnl > 0
  const entryDate = new Date(trade.entry_timestamp)
  const exitDate = new Date(trade.exit_timestamp)
  const duration = formatDistanceStrict(entryDate, exitDate, { addSuffix: false })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-xl font-bold">{trade.symbol.replace('/USDT', '')}</span>
            <Badge variant={isWin ? 'default' : 'destructive'} className="gap-1">
              {isWin ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isWin ? 'Win' : 'Loss'}
            </Badge>
            <span className={`text-lg font-semibold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
              {isWin ? '+' : ''}${trade.realized_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div className={`text-lg font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                  {isWin ? '+' : ''}{trade.realized_pnl_pct.toFixed(2)}%
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
                  <p className="text-xs text-muted-foreground mb-1">Exit</p>
                  <p className="font-mono font-medium">
                    ${trade.exit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(exitDate, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Exit Reason</p>
                <Badge variant="outline" className="gap-2">
                  {exitReasonIcons[trade.exit_reason]}
                  {exitReasonLabels[trade.exit_reason] || trade.exit_reason}
                </Badge>
              </div>
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
              <CardContent className="space-y-3">
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

                {trade.analysis.response_received && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">AI Reasoning</p>
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
