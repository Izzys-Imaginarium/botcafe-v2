'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Trash2 } from 'lucide-react'

export const DataManagement = () => {
  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display">Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="ornate-border h-20 flex-col">
            <Database className="w-6 h-6 mb-2" />
            Export My Data
          </Button>
          <Button
            variant="outline"
            className="ornate-border h-20 flex-col hover:bg-red-900/20 hover:border-red-500/50"
          >
            <Trash2 className="w-6 h-6 mb-2 text-red-400" />
            Delete Account
          </Button>
        </div>
        <div className="text-xs text-parchment-dim font-lore space-y-2">
          <p>• Your data is encrypted and stored securely</p>
          <p>• Export includes all your bots, conversations, and memories</p>
          <p>• Deletion is permanent and cannot be undone</p>
        </div>
      </CardContent>
    </Card>
  )
}
