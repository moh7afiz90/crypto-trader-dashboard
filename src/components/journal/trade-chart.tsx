'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  Time,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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

type Timeframe = '1h' | '4h' | '1d'

const timeframeOptions: { value: Timeframe; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
]

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
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('4h')

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#374151',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#374151',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#6b7280',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    // Configure volume price scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
      borderVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  // Fetch and update data when timeframe changes
  useEffect(() => {
    const chart = chartRef.current
    const candleSeries = seriesRef.current
    const volumeSeries = volumeSeriesRef.current
    if (!chart || !candleSeries || !volumeSeries) return

    const fetchCandles = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/candles?symbol=${symbol}&timeframe=${timeframe}&limit=200`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch candles')
        }

        const candles: CandleData[] = await response.json()

        if (candles.length === 0) {
          setError('No chart data available')
          setLoading(false)
          return
        }

        // Clear existing price lines
        const existingPriceLines = (candleSeries as any)._priceLines || []
        existingPriceLines.forEach((line: any) => {
          try {
            candleSeries.removePriceLine(line)
          } catch {
            // Ignore errors
          }
        })

        // Set candle data
        const formattedCandles = candles.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))

        candleSeries.setData(formattedCandles)

        // Set volume data with colors based on candle direction
        const volumeData = candles.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        }))

        volumeSeries.setData(volumeData)

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

        // Fit content with padding
        chart.timeScale().fitContent()

        setLoading(false)
      } catch (err) {
        console.error('Error fetching candles:', err)
        setError('Failed to load chart data')
        setLoading(false)
      }
    }

    fetchCandles()
  }, [
    symbol,
    timeframe,
    entryPrice,
    entryTimestamp,
    exitPrice,
    exitTimestamp,
    stopLoss,
    takeProfit1,
    takeProfit2,
    currentPrice,
    isOpen,
  ])

  if (error) {
    return (
      <div className="h-[450px] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeframe selector */}
      <div className="absolute top-2 left-2 z-20 flex gap-1">
        {timeframeOptions.map((tf) => (
          <Button
            key={tf.value}
            variant={timeframe === tf.value ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setTimeframe(tf.value)}
          >
            {tf.label}
          </Button>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading chart...</span>
          </div>
        </div>
      )}

      {/* Chart container */}
      <div ref={chartContainerRef} className="h-[450px] w-full" />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 px-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 rounded"></div>
          <span>Entry</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-red-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #ef4444, #ef4444 4px, transparent 4px, transparent 8px)' }}></div>
          <span>Stop Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-green-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e, #22c55e 4px, transparent 4px, transparent 8px)' }}></div>
          <span>Take Profit</span>
        </div>
        {!isOpen && exitPrice && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-orange-500 rounded"></div>
            <span>Exit</span>
          </div>
        )}
        {isOpen && currentPrice && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-cyan-500 rounded"></div>
            <span>Current</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-3 bg-green-500/50 rounded-sm"></div>
          <div className="w-3 h-3 bg-red-500/50 rounded-sm"></div>
          <span>Volume</span>
        </div>
      </div>
    </div>
  )
}
