'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown, Globe, PieChart, Layers } from 'lucide-react'

interface MarketData {
  btc_price: number
  btc_24h_change: number
  eth_price?: number
  eth_24h_change?: number
  fear_greed_index: number | null
  fear_greed_label: string | null
  btc_dominance?: number | null
  eth_dominance?: number | null
  total_market_cap?: number | null
  total_volume_24h?: number | null
  market_cap_change_24h?: number | null
  defi_market_cap?: number | null
  defi_dominance?: number | null
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

function formatLargeNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A'
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
  return `$${num.toLocaleString()}`
}

// Component to show current system time
function MarketTimestamp({ dataTimestamp }: { dataTimestamp: string }) {
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString())

    // Update every second
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!currentTime) return null

  return <span>{currentTime}</span>
}

export function MarketCard({ market }: MarketCardProps) {
  if (!market) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const isBtcPositive = market.btc_24h_change >= 0
  const isMcapPositive = (market.market_cap_change_24h ?? 0) >= 0
  const altDominance = market.btc_dominance && market.eth_dominance
    ? 100 - market.btc_dominance - market.eth_dominance
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: BTC Price & Total Market Cap */}
        <div className="grid grid-cols-2 gap-4">
          {/* BTC Price */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                ${market.btc_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              <span className={`flex items-center text-xs ${isBtcPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isBtcPositive ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {isBtcPositive ? '+' : ''}{market.btc_24h_change?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">BTC Price</p>
          </div>

          {/* Total Market Cap */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {formatLargeNumber(market.total_market_cap)}
              </span>
              {market.market_cap_change_24h !== null && market.market_cap_change_24h !== undefined && (
                <span className={`flex items-center text-xs ${isMcapPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isMcapPositive ? '+' : ''}{market.market_cap_change_24h.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Total Market Cap</p>
          </div>
        </div>

        {/* Row 2: Dominance Metrics */}
        <div className="grid grid-cols-4 gap-2">
          {/* BTC Dominance */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <PieChart className="h-3 w-3 text-orange-500" />
              <span className="text-sm font-semibold">
                {market.btc_dominance?.toFixed(1) ?? 'N/A'}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">BTC Dom</p>
          </div>

          {/* ETH Dominance */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <PieChart className="h-3 w-3 text-blue-500" />
              <span className="text-sm font-semibold">
                {market.eth_dominance?.toFixed(1) ?? 'N/A'}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">ETH Dom</p>
          </div>

          {/* Alt Dominance */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <PieChart className="h-3 w-3 text-purple-500" />
              <span className="text-sm font-semibold">
                {altDominance?.toFixed(1) ?? 'N/A'}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Alt Dom</p>
          </div>

          {/* Fear & Greed */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Activity className="h-3 w-3" />
              <span className="text-sm font-semibold">
                {market.fear_greed_index ?? 'N/A'}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {market.fear_greed_label || 'F&G'}
            </p>
          </div>
        </div>

        {/* Row 3: Volume & DeFi */}
        <div className="grid grid-cols-2 gap-4">
          {/* 24h Volume */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {formatLargeNumber(market.total_volume_24h)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">24h Volume</p>
          </div>

          {/* DeFi Market Cap */}
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-green-500" />
              <span className="text-lg font-semibold">
                {formatLargeNumber(market.defi_market_cap)}
              </span>
              {market.defi_dominance !== null && market.defi_dominance !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({market.defi_dominance.toFixed(1)}%)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">DeFi Market Cap</p>
          </div>
        </div>

        {/* Last Update - show current system time */}
        <div className="text-[10px] text-muted-foreground text-right">
          <MarketTimestamp dataTimestamp={market.timestamp} />
        </div>
      </CardContent>
    </Card>
  )
}
