import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_stats')
      .select('date, pnl, pnl_pct, ending_equity, wins, losses, trades_taken')
      .order('date', { ascending: false })
      .limit(days)

    if (error) {
      console.error('Error fetching performance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Reverse to get chronological order for charts
    return NextResponse.json((data || []).reverse())
  } catch (error) {
    console.error('Error in performance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
