import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get filter params
    const symbol = searchParams.get('symbol')
    const winOnly = searchParams.get('winOnly')
    const exitReason = searchParams.get('exitReason')
    const confidence = searchParams.get('confidence')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build query
    let query = supabase
      .from('positions')
      .select(`
        id,
        symbol,
        entry_price,
        exit_price,
        quantity,
        entry_value,
        stop_loss,
        take_profit_1,
        take_profit_2,
        entry_timestamp,
        exit_timestamp,
        exit_reason,
        realized_pnl,
        realized_pnl_pct,
        status,
        signal_id
      `)
      .eq('status', 'CLOSED')
      .order('exit_timestamp', { ascending: false })

    // Apply filters
    if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`)
    }

    if (winOnly === 'wins') {
      query = query.gt('realized_pnl', 0)
    } else if (winOnly === 'losses') {
      query = query.lt('realized_pnl', 0)
    }

    if (exitReason && exitReason !== 'all') {
      query = query.eq('exit_reason', exitReason)
    }

    if (from) {
      query = query.gte('exit_timestamp', from)
    }

    if (to) {
      query = query.lte('exit_timestamp', to)
    }

    const { data: positions, error: positionsError } = await query

    if (positionsError) {
      console.error('Error fetching journal positions:', positionsError)
      return NextResponse.json({ error: positionsError.message }, { status: 500 })
    }

    // Fetch AI analysis for each position with a signal_id
    const signalIds = positions
      ?.filter((p) => p.signal_id)
      .map((p) => p.signal_id) || []

    let analysisMap: Record<string, {
      setup_type: string
      confidence: string
      risk_reward: number
      response_received: string
    }> = {}

    if (signalIds.length > 0) {
      const { data: analysisData, error: analysisError } = await supabase
        .from('ai_analysis_logs')
        .select('id, setup_type, confidence, risk_reward, response_received')
        .in('id', signalIds)

      if (!analysisError && analysisData) {
        analysisMap = analysisData.reduce((acc, item) => {
          acc[item.id] = {
            setup_type: item.setup_type,
            confidence: item.confidence,
            risk_reward: item.risk_reward,
            response_received: item.response_received,
          }
          return acc
        }, {} as typeof analysisMap)
      }
    }

    // Combine positions with analysis data and apply confidence filter
    let journalEntries = (positions || []).map((position) => ({
      ...position,
      analysis: position.signal_id ? analysisMap[position.signal_id] : null,
    }))

    // Apply confidence filter after joining
    if (confidence && confidence !== 'all') {
      journalEntries = journalEntries.filter(
        (entry) => entry.analysis?.confidence === confidence.toUpperCase()
      )
    }

    return NextResponse.json(journalEntries)
  } catch (error) {
    console.error('Error in journal API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
