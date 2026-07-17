import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendSent, setResendSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMsg('No verification token found in the link.')
      return
    }

    fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus('success')
          setTimeout(() => navigate('/login'), 2000)
        } else {
          const data = await res.json()
          setStatus('error')
          setErrorMsg(data.message || 'Verification link expired or already used.')
        }
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg('Network error. Please try again.')
      })
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    setResendLoading(true)
    try {
      await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
      setResendSent(true)
    } catch {
      // Still show sent — no info leak
      setResendSent(true)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">

        {status === 'loading' && (
          <>
            <Loader2 className="w-14 h-14 text-primary-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verifying your email...</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email verified!</h1>
            <p className="text-gray-500 dark:text-gray-400">Redirecting you to the login page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification failed</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{errorMsg}</p>

            {!resendSent ? (
              <form onSubmit={handleResend} className="space-y-3 text-left mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resend verification email:
                </p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-2.5 font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
                >
                  {resendLoading ? 'Sending...' : 'Resend Email'}
                </button>
              </form>
            ) : (
              <p className="text-green-600 dark:text-green-400 text-sm mb-4">
                Verification email sent if account exists.
              </p>
            )}

            <Link
              to="/login"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
