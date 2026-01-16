'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  Time,
} from 'lightweight-charts'

interface TradeChartProps {
  symbol: string
  entryPrice: number
  entryTimestamp: string
  exitPrice?: number | null
  exitTimestamp?: string | null
  stopLoss: number
  takeProfit1: number
  takeProfit2?: number | null
  currentPrice?: number | null
  isOpen: boolean
}

interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function TradeChart({
  symbol,
  entryPrice,
  entryTimestamp,
  exitPrice,
  exitTimestamp,
  stopLoss,
  takeProfit1,
  takeProfit2,
  currentPrice,
  isOpen,
}: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          width: 1,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
    })

    // Create candlestick series using v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    // Fetch candle data
    const fetchCandles = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/candles?symbol=${symbol}&timeframe=4h&limit=100`)

        if (!response.ok) {
          throw new Error('Failed to fetch candles')
        }

        const candles: CandleData[] = await response.json()

        if (candles.length === 0) {
          setError('No chart data available')
          setLoading(false)
          return
        }

        // Set candle data - convert time to proper format
        const formattedCandles = candles.map(c => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))

        candleSeries.setData(formattedCandles)

        // Add price lines for entry, SL, TP
        // Entry price line (blue)
        candleSeries.createPriceLine({
          price: entryPrice,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: 'Entry',
        })

        // Stop loss line (red dashed)
        candleSeries.createPriceLine({
          price: stopLoss,
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'SL',
        })

        // Take profit 1 line (green dashed)
        candleSeries.createPriceLine({
          price: takeProfit1,
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'TP1',
        })

        // Take profit 2 line (green dashed) if exists
        if (takeProfit2) {
          candleSeries.createPriceLine({
            price: takeProfit2,
            color: '#22c55e',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'TP2',
          })
        }

        // Exit price line (orange) if trade is closed
        if (!isOpen && exitPrice) {
          candleSeries.createPriceLine({
            price: exitPrice,
            color: '#f97316',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Exit',
          })
        }

        // Current price line (cyan) if trade is open
        if (isOpen && currentPrice) {
          candleSeries.createPriceLine({
            price: currentPrice,
            color: '#06b6d4',
            lineWidth: 1,
            lineStyle: 1,
            axisLabelVisible: true,
            title: 'Current',
          })
        }

        // Fit content
        chart.timeScale().fitContent()

        setLoading(false)
      } catch (err) {
        console.error('Error fetching candles:', err)
        setError('Failed to load chart data')
        setLoading(false)
      }
    }

    fetchCandles()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol, entryPrice, entryTimestamp, exitPrice, exitTimestamp, stopLoss, takeProfit1, takeProfit2, currentPrice, isOpen])

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      )}
      <div ref={chartContainerRef} className="h-[300px] w-full" />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500"></div>
          <span>Entry</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500 border-dashed"></div>
          <span>Stop Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
          <span>Take Profit</span>
        </div>
        {!isOpen && exitPrice && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-orange-500"></div>
            <span>Exit</span>
          </div>
        )}
        {isOpen && currentPrice && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-cyan-500"></div>
            <span>Current</span>
          </div>
        )}
      </div>
    </div>
  )
}
