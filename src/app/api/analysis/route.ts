import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const setupFound = searchParams.get('setup_found')

    const supabase = await createClient()

    let query = supabase
      .from('ai_analysis_logs')
      .select(`
        id,
        symbol,
        timestamp,
        setup_found,
        setup_type,
        bias,
        confidence,
        entry_price,
        stop_loss,
        take_profit_1,
        take_profit_2,
        risk_reward,
        tokens_used,
        cost_usd
      `)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (setupFound !== null) {
      query = query.eq('setup_found', setupFound === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching analysis:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
