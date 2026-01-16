'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface PortfolioData {
  total_equity: number
  available_funds: number
  reserved_funds: number
  total_pnl: number
  total_trades: number
  winning_trades: number
  losing_trades: number
}

interface PortfolioCardProps {
  portfolio: PortfolioData | null
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  if (!portfolio) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const winRate = portfolio.total_trades > 0
    ? ((portfolio.winning_trades / portfolio.total_trades) * 100).toFixed(1)
    : '0.0'

  const isPnlPositive = portfolio.total_pnl >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Equity */}
        <div>
          <div className="text-2xl font-bold">
            ${portfolio.total_equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Total Equity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">
                ${portfolio.available_funds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>

          <div>
            <div className={`flex items-center gap-1 ${isPnlPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPnlPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-sm font-medium">
                {isPnlPositive ? '+' : ''}${portfolio.total_pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Total P&L</p>
          </div>

          <div>
            <div className="text-sm font-medium">{portfolio.total_trades}</div>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>

          <div>
            <div className="text-sm font-medium">{winRate}%</div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
