'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterState {
  symbol: string
  status: string
  winOnly: string
  exitReason: string
  confidence: string
  from: Date | undefined
  to: Date | undefined
}

interface JournalFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export function JournalFilters({ filters, onFilterChange }: JournalFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFilterChange({
      symbol: '',
      status: 'all',
      winOnly: 'all',
      exitReason: 'all',
      confidence: 'all',
      from: undefined,
      to: undefined,
    })
  }

  const hasActiveFilters =
    filters.symbol ||
    filters.status !== 'all' ||
    filters.winOnly !== 'all' ||
    filters.exitReason !== 'all' ||
    filters.confidence !== 'all' ||
    filters.from ||
    filters.to

  return (
    <div className="space-y-4">
      {/* Mobile filter toggle */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search symbol..."
            value={filters.symbol}
            onChange={(e) => updateFilter('symbol', e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop filters - always visible, Mobile - toggle */}
      <div className={cn(
        'flex flex-col md:flex-row flex-wrap gap-3',
        !showFilters && 'hidden md:flex'
      )}>
        {/* Symbol search - desktop */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search symbol..."
            value={filters.symbol}
            onChange={(e) => updateFilter('symbol', e.target.value)}
            className="pl-9 w-[180px]"
          />
        </div>

        {/* Status filter */}
        <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-full md:w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Win/Loss filter */}
        <Select value={filters.winOnly} onValueChange={(v) => updateFilter('winOnly', v)}>
          <SelectTrigger className="w-full md:w-[130px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="wins">Wins Only</SelectItem>
            <SelectItem value="losses">Losses Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Exit Reason filter */}
        <Select value={filters.exitReason} onValueChange={(v) => updateFilter('exitReason', v)}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Exit Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exits</SelectItem>
            <SelectItem value="STOP_LOSS">Stop Loss</SelectItem>
            <SelectItem value="TAKE_PROFIT_1">Take Profit 1</SelectItem>
            <SelectItem value="TAKE_PROFIT_2">Take Profit 2</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
            <SelectItem value="TRAILING_STOP">Trailing Stop</SelectItem>
          </SelectContent>
        </Select>

        {/* Confidence filter */}
        <Select value={filters.confidence} onValueChange={(v) => updateFilter('confidence', v)}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Confidence</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[150px] justify-start text-left font-normal',
                !filters.from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.from ? format(filters.from, 'MMM d, yyyy') : 'From date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.from}
              onSelect={(date) => updateFilter('from', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[150px] justify-start text-left font-normal',
                !filters.to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.to ? format(filters.to, 'MMM d, yyyy') : 'To date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.to}
              onSelect={(date) => updateFilter('to', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
