import { createClient } from '@/lib/supabase/server'
import { PositionsTable } from '@/components/dashboard/positions-table'

export default async function PositionsPage() {
  const supabase = await createClient()

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('status', 'OPEN')
    .order('entry_timestamp', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Positions</h1>
        <p className="text-muted-foreground">
          Your active trading positions
        </p>
      </div>

      <PositionsTable initialPositions={positions || []} />
    </div>
  )
}
