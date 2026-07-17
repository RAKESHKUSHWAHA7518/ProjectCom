import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function AdminRoute({ children }) {
  const { user } = useAuthStore()

  // Unauthenticated → redirect to login
  if (!user) return <Navigate to="/login" replace />

  // Authenticated but not admin → show access denied (NO redirect)
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="glass-card rounded-2xl p-10 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-500 dark:text-gray-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return children
}
