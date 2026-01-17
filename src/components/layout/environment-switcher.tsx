'use client'

import { useEnvironment, type Environment } from '@/contexts/environment-context'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Server, FlaskConical, ChevronDown, Check } from 'lucide-react'
import { useState } from 'react'

const environments: { value: Environment; label: string; icon: typeof Server; description: string }[] = [
  {
    value: 'staging',
    label: 'Staging',
    icon: FlaskConical,
    description: 'Testnet - Fake money',
  },
  {
    value: 'production',
    label: 'Production',
    icon: Server,
    description: 'Mainnet - Real money',
  },
]

export function EnvironmentSwitcher() {
  const { environment, setEnvironment } = useEnvironment()
  const [open, setOpen] = useState(false)

  const currentEnv = environments.find(e => e.value === environment) || environments[0]
  const Icon = currentEnv.icon

  const handleSelect = (env: Environment) => {
    if (env !== environment) {
      setEnvironment(env)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 gap-2 ${
            environment === 'production'
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 hover:text-orange-500'
              : 'border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-500'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentEnv.label}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="end">
        <div className="space-y-1">
          {environments.map((env) => {
            const EnvIcon = env.icon
            const isSelected = environment === env.value

            return (
              <button
                key={env.value}
                onClick={() => handleSelect(env.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
              >
                <EnvIcon
                  className={`h-4 w-4 ${
                    env.value === 'production' ? 'text-orange-500' : 'text-blue-500'
                  }`}
                />
                <div className="flex-1 text-left">
                  <div className="font-medium">{env.label}</div>
                  <div className="text-xs text-muted-foreground">{env.description}</div>
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            )
          })}
        </div>
        {environment === 'production' && (
          <div className="mt-2 px-3 py-2 bg-orange-500/10 rounded-md">
            <p className="text-xs text-orange-500">
              You are viewing <strong>production</strong> data with real trades.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
