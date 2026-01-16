import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('positions')
      .select(`
        id,
        symbol,
        entry_price,
        quantity,
        entry_value,
        stop_loss,
        take_profit_1,
        take_profit_2,
        current_price,
        unrealized_pnl,
        unrealized_pnl_pct,
        entry_timestamp,
        status,
        signal_id
      `)
      .eq('status', 'OPEN')
      .order('entry_timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching positions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in positions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
