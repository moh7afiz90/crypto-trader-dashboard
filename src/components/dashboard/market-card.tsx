'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown } from 'lucide-react'

interface MarketData {
  btc_price: number
  btc_24h_change: number
  fear_greed_index: number | null
  fear_greed_label: string | null
  timestamp: string
}

interface MarketCardProps {
  market: MarketData | null
}

function getFearGreedColor(value: number | null): string {
  if (value === null) return 'secondary'
  if (value <= 25) return 'destructive'
  if (value <= 45) return 'default'
  if (value <= 55) return 'secondary'
  if (value <= 75) return 'default'
  return 'destructive'
}

export function MarketCard({ market }: MarketCardProps) {
  if (!market) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const isBtcPositive = market.btc_24h_change >= 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Market
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BTC Price */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ${market.btc_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className={`flex items-center text-sm ${isBtcPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isBtcPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {isBtcPositive ? '+' : ''}{market.btc_24h_change?.toFixed(2) || '0.00'}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">BTC/USDT</p>
        </div>

        {/* Fear & Greed */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {market.fear_greed_index ?? 'N/A'}
            </span>
            {market.fear_greed_label && (
              <Badge variant={getFearGreedColor(market.fear_greed_index) as "default" | "secondary" | "destructive"}>
                {market.fear_greed_label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Fear & Greed Index</p>
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground">
          Updated: {new Date(market.timestamp).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
