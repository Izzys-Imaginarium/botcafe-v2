'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Key, Plus, Trash2 } from 'lucide-react'

// Mock API keys data
const mockApiKeys = [
  { id: '1', name: 'OpenAI Primary', service: 'openai', status: 'active', created: '2024-01-15' },
  { id: '2', name: 'Claude Backup', service: 'anthropic', status: 'active', created: '2024-02-01' },
  {
    id: '3',
    name: 'Development Key',
    service: 'deepseek',
    status: 'inactive',
    created: '2024-03-10',
  },
]

export const ApiKeyManagement = () => {
  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Management
          </span>
          <Button
            size="sm"
            className="ornate-border bg-gold-ancient/20 hover:bg-gold-ancient/30 text-gold-rich"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Key
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockApiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 border border-gold-ancient/30 rounded-lg bg-[#0a140a]/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold-ancient/20 rounded-full flex items-center justify-center">
                  <Key className="w-4 h-4 text-gold-rich" />
                </div>
                <div>
                  <h4 className="text-parchment font-display">{key.name}</h4>
                  <p className="text-xs text-parchment-dim font-lore capitalize">
                    {key.service} • Created {key.created}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`${
                    key.status === 'active'
                      ? 'bg-magic-glow/20 text-magic-glow border-magic-glow/30'
                      : 'bg-parchment-dim/20 text-parchment-dim border-parchment-dim/30'
                  }`}
                >
                  {key.status}
                </Badge>
                <Button variant="ghost" size="sm" className="text-parchment-dim hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
