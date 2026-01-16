import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching portfolio:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in portfolio API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
