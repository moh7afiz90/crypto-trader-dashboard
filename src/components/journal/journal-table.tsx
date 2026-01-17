'use client'

import { formatDistanceStrict, formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldX,
  Hand,
  ArrowRightLeft,
  Clock,
} from 'lucide-react'
import type { JournalEntry } from '@/app/(dashboard)/journal/page'

interface JournalTableProps {
  entries: JournalEntry[]
  loading: boolean
  onTradeClick: (trade: JournalEntry) => void
}

const exitReasonIcons: Record<string, React.ReactNode> = {
  STOP_LOSS: <ShieldX className="h-3 w-3" />,
  TAKE_PROFIT_1: <Target className="h-3 w-3" />,
  TAKE_PROFIT_2: <Target className="h-3 w-3" />,
  BREAKEVEN: <ArrowRightLeft className="h-3 w-3" />,
  TIME_EXPIRY: <Clock className="h-3 w-3" />,
  MANUAL: <Hand className="h-3 w-3" />,
  TRAILING_STOP: <ArrowRightLeft className="h-3 w-3" />,
}

const exitReasonLabels: Record<string, string> = {
  STOP_LOSS: 'Stop Loss',
  TAKE_PROFIT_1: 'TP1',
  TAKE_PROFIT_2: 'TP2',
  BREAKEVEN: 'Breakeven',
  TIME_EXPIRY: 'Time Expiry',
  MANUAL: 'Manual',
  TRAILING_STOP: 'Trailing',
}

const confidenceBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline',
}

export function JournalTable({ entries, loading, onTradeClick }: JournalTableProps) {
  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground px-4 sm:px-0">
        Loading trades...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground px-4 sm:px-0">
        No trades found
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit/Current</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="hidden md:table-cell">Duration</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Exit Reason</TableHead>
            <TableHead className="hidden lg:table-cell text-right">R:R</TableHead>
            <TableHead className="hidden xl:table-cell">Confidence</TableHead>
            <TableHead className="hidden xl:table-cell">Setup</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isOpen = entry.status === 'OPEN'
            const pnl = isOpen ? (entry.unrealized_pnl ?? 0) : (entry.realized_pnl ?? 0)
            const pnlPct = isOpen ? (entry.unrealized_pnl_pct ?? 0) : (entry.realized_pnl_pct ?? 0)
            const isPositive = pnl > 0
            const currentOrExitPrice = isOpen ? entry.current_price : entry.exit_price

            const entryDate = new Date(entry.entry_timestamp)
            const displayDate = isOpen ? entryDate : (entry.exit_timestamp ? new Date(entry.exit_timestamp) : entryDate)

            // Duration calculation
            let duration: string
            if (isOpen) {
              duration = formatDistanceToNow(entryDate, { addSuffix: false })
            } else if (entry.exit_timestamp) {
              duration = formatDistanceStrict(entryDate, new Date(entry.exit_timestamp), { addSuffix: false })
            } else {
              duration = '-'
            }

            return (
              <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onTradeClick(entry)}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {displayDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{entry.symbol.replace('/USDT', '')}</span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  ${entry.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {currentOrExitPrice
                    ? `$${currentOrExitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className={`font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs ${isPositive ? 'text-green-500/70' : 'text-red-500/70'}`}>
                      {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {duration}
                </TableCell>
                <TableCell className="hidden md:table-cell">
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
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {isOpen ? (
                    <span className="text-muted-foreground">-</span>
                  ) : entry.exit_reason ? (
                    <Badge variant="outline" className="gap-1">
                      {exitReasonIcons[entry.exit_reason]}
                      {exitReasonLabels[entry.exit_reason] || entry.exit_reason}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right font-mono text-sm">
                  {entry.analysis?.risk_reward
                    ? `${entry.analysis.risk_reward.toFixed(1)}:1`
                    : '-'}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {entry.analysis?.confidence ? (
                    <Badge variant={confidenceBadgeVariant[entry.analysis.confidence]}>
                      {entry.analysis.confidence}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm capitalize">
                  {entry.analysis?.setup_type || '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTradeClick(entry)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
