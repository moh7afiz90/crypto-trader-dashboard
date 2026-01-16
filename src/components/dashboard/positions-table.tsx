'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LineChart, TrendingUp, TrendingDown } from 'lucide-react'

interface Position {
  id: number
  symbol: string
  entry_price: number
  quantity: number
  entry_value: number
  stop_loss: number
  take_profit_1: number
  take_profit_2: number | null
  current_price: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null
  entry_timestamp: string
  status: string
  signal_id: number | null
}

interface PositionsTableProps {
  initialPositions: Position[]
}

export function PositionsTable({ initialPositions }: PositionsTableProps) {
  const [positions, setPositions] = useState(initialPositions)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to position changes
    const channel = supabase
      .channel('positions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: 'status=eq.OPEN',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPositions((prev) => [payload.new as Position, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPositions((prev) =>
              prev.map((p) =>
                p.id === (payload.new as Position).id ? (payload.new as Position) : p
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPositions((prev) =>
              prev.filter((p) => p.id !== (payload.old as { id: number }).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Open Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No open positions
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Open Positions ({positions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="text-right">SL</TableHead>
                <TableHead className="text-right">TP</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                const pnlPositive = (position.unrealized_pnl ?? 0) >= 0
                return (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{position.symbol.replace('USDT', '')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${position.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {position.current_price
                        ? `$${position.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                        : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${pnlPositive ? 'text-green-500' : 'text-red-500'}`}>
                      <div className="flex items-center justify-end gap-1">
                        {pnlPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {position.unrealized_pnl_pct !== null
                            ? `${pnlPositive ? '+' : ''}${position.unrealized_pnl_pct.toFixed(2)}%`
                            : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-500">
                      ${position.stop_loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-500">
                      ${position.take_profit_1.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {new Date(position.entry_timestamp).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
