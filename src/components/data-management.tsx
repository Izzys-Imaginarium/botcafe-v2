'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export const DataManagement = () => {
  const [isExporting, setIsExporting] = useState(false)
  const { openUserProfile } = useClerk()

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/account/export')

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `botcafe-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = () => {
    // Open Clerk's user profile to the account deletion section
    openUserProfile()
    toast.info('To delete your account, navigate to the "Security" section in your profile settings.')
  }

  return (
    <Card className="glass-rune">
      <CardHeader>
        <CardTitle className="text-parchment font-display">Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="ornate-border h-20 flex-col"
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-6 h-6 mb-2 animate-spin" />
            ) : (
              <Database className="w-6 h-6 mb-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export My Data'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="ornate-border h-20 flex-col hover:bg-red-900/20 hover:border-red-500/50"
              >
                <Trash2 className="w-6 h-6 mb-2 text-red-400" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-rune border-gold-ancient/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gold-rich font-display flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription className="text-parchment-dim font-lore">
                  This action cannot be undone. All your bots, conversations, memories, and other
                  data will be permanently deleted. We recommend exporting your data first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="ornate-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-900/80 hover:bg-red-800 text-parchment"
                >
                  Continue to Account Settings
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
