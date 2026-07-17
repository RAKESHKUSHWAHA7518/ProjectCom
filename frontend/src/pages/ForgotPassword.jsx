import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success — no info leak
      setSubmitted(true)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            If that email exists, a reset link has been sent.
          </p>
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="glass-card rounded-2xl p-10 max-w-md w-full">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center mb-5">
          <Mail className="w-6 h-6 text-primary-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot password?</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl hover:opacity-90 disabled:opacity-60 transition"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  )
}
