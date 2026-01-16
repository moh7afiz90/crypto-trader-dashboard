import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe') || '4h'
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Get asset_id for the symbol
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id')
      .eq('symbol', symbol)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Determine which table to query based on timeframe
    const tableMap: Record<string, string> = {
      '1h': 'candles_1h',
      '4h': 'candles_4h',
      '1d': 'candles_1d',
    }

    const tableName = tableMap[timeframe] || 'candles_4h'

    // Fetch candles
    const { data: candles, error: candlesError } = await supabase
      .from(tableName)
      .select('timestamp, open, high, low, close, volume')
      .eq('asset_id', asset.id)
      .order('timestamp', { ascending: true })
      .limit(limit)

    if (candlesError) {
      console.error('Error fetching candles:', candlesError)
      return NextResponse.json({ error: candlesError.message }, { status: 500 })
    }

    // Format for lightweight-charts (expects time in seconds)
    const formattedCandles = (candles || []).map((c) => ({
      time: Math.floor(new Date(c.timestamp).getTime() / 1000),
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseFloat(c.volume),
    }))

    return NextResponse.json(formattedCandles)
  } catch (error) {
    console.error('Error in candles API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
