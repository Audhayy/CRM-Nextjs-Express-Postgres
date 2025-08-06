'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [debugInfo, setDebugInfo] = useState('Initializing...')

  useEffect(() => {
    setDebugInfo(`Loading: ${loading}, User: ${user ? 'Logged in' : 'Not logged in'}`)
    
    if (!loading) {
      if (user) {
        setDebugInfo('Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        setDebugInfo('Redirecting to login...')
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Show debug information for a few seconds
  if (loading || debugInfo.includes('Initializing') || debugInfo.includes('Loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 mb-2">Loading L2 CRM...</p>
          <p className="text-sm text-gray-500">{debugInfo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">L2 CRM</h1>
        <p className="text-gray-600 mb-4">Redirecting...</p>
        <p className="text-sm text-gray-500">{debugInfo}</p>
        <div className="mt-4 space-x-4">
          <button 
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
} 