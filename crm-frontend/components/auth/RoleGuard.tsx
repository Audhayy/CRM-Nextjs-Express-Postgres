'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuth()

  if (!user) {
    return fallback || <div>Please log in to access this feature.</div>
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to access this feature.</p>
      </div>
    )
  }

  return <>{children}</>
} 