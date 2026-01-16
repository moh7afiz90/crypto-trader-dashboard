import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Brain,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
} from 'lucide-react'

interface AnalysisPageProps {
  params: Promise<{ id: string }>
}

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

export default async function AnalysisDetailPage({ params }: AnalysisPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: analysis, error } = await supabase
    .from('ai_analysis_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !analysis) {
    notFound()
  }

  // Parse the response to extract the JSON analysis
  let parsedAnalysis = null
  try {
    const jsonMatch = analysis.response_received?.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      parsedAnalysis = JSON.parse(jsonMatch[0])
    }
  } catch {
    // Could not parse JSON
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/analysis">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg">
              {analysis.symbol.replace('USDT', '')}
            </Badge>
            {analysis.setup_found ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Setup Found
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                No Setup
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(analysis.timestamp).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Trade Details (if setup found) */}
      {analysis.setup_found && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Entry</span>
              </div>
              <div className="text-xl font-bold">
                ${analysis.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Stop Loss</span>
              </div>
              <div className="text-xl font-bold text-red-500">
                ${analysis.stop_loss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-500 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-sm">Take Profit</span>
              </div>
              <div className="text-xl font-bold text-green-500">
                ${analysis.take_profit_1?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Risk:Reward</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {analysis.risk_reward?.toFixed(1)}:1
                </span>
                {analysis.confidence && (
                  <Badge variant={getConfidenceBadgeVariant(analysis.confidence)}>
                    {analysis.confidence}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Multi-Timeframe Analysis */}
      {parsedAnalysis?.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Multi-Timeframe Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(parsedAnalysis.analysis).map(([timeframe, text]) => (
              <div key={timeframe}>
                <h4 className="font-medium capitalize mb-1">
                  {timeframe.replace('_', ' ')}
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {text as string}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reasoning */}
      {parsedAnalysis?.reasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Trade Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{parsedAnalysis.reasoning}</p>
          </CardContent>
        </Card>
      )}

      {/* Raw Response (collapsed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Full AI Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-w-full">
            {analysis.response_received}
          </pre>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tokens Used</span>
              <p className="font-medium">{analysis.tokens_used?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cost</span>
              <p className="font-medium">${analysis.cost_usd?.toFixed(4) || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Latency</span>
              <p className="font-medium">{analysis.latency_ms ? `${analysis.latency_ms}ms` : 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Prompt Version</span>
              <p className="font-medium">{analysis.prompt_version || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
