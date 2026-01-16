import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_analysis_logs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching analysis detail:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in analysis detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
