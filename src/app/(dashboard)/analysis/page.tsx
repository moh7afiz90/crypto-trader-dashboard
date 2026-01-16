import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Brain, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

function getConfidenceBadgeVariant(confidence: string | null): "default" | "secondary" | "destructive" {
  switch (confidence) {
    case 'HIGH':
      return 'default'
    case 'MEDIUM':
      return 'secondary'
    case 'LOW':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export default async function AnalysisPage() {
  const supabase = await createClient()

  const { data: analyses, error } = await supabase
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
      risk_reward,
      tokens_used,
      cost_usd
    `)
    .order('timestamp', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching analyses:', error)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Analysis</h1>
        <p className="text-muted-foreground">
          Recent trading analyses from GPT-4o
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Recent Analyses ({analyses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {!analyses || analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No analyses found
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Setup</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">R:R</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">
                          {analysis.symbol.replace('USDT', '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {analysis.setup_found ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {analysis.setup_found
                              ? analysis.setup_type || 'Found'
                              : 'No Setup'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {analysis.confidence ? (
                          <Badge variant={getConfidenceBadgeVariant(analysis.confidence)}>
                            {analysis.confidence}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {analysis.entry_price
                          ? `$${analysis.entry_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {analysis.risk_reward
                          ? `${analysis.risk_reward.toFixed(1)}:1`
                          : '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/analysis/${analysis.id}`}
                          className="flex items-center text-primary hover:underline"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
