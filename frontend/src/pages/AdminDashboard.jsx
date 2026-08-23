import React, { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Users, BarChart3, Flag, Search, RefreshCw, CheckCircle, XCircle,
  UserX, UserCheck, ChevronLeft, ChevronRight,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function useAdminFetch(path, deps = []) {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (_e) {
      setError(_e.message)
    } finally {
      setLoading(false)
    }
  }, [path, user?.token])

  useEffect(() => { load() }, [...deps, load])

  return { data, loading, error, reload: load }
}

/* ── Stats Section ─────────────────────────────────────────── */
function StatsSection() {
  const { data, loading, error } = useAdminFetch('/admin/stats')

  if (loading) return <SectionSkeleton label="Platform Stats" />
  if (error) return <SectionError label="Platform Stats" message={error} />

  const items = [
    { label: 'Total Users', value: data.totalUsers },
    { label: 'Total Skills', value: data.totalSkills },
    { label: 'Total Sessions', value: data.totalSessions },
    { label: 'Communities', value: data.totalCommunities },
    { label: 'New (30d)', value: data.newUsersLast30Days },
  ]

  return (
    <Section title="Platform Stats" icon={BarChart3}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {s.value?.toLocaleString() ?? '—'}
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ── Users Section ─────────────────────────────────────────── */
function UsersSection() {
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ name: '', email: '', role: '' })
  const [appliedFilters, setAppliedFilters] = useState({ name: '', email: '', role: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page, pageSize: 10, ...appliedFilters })
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (_e) {
      setError(_e.message)
    } finally {
      setLoading(false)
    }
  }, [page, appliedFilters, user?.token])

  useEffect(() => { load() }, [load])

  const toggleStatus = async (userId, currentActive) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(`User ${currentActive ? 'deactivated' : 'activated'}`)
      load()
    } catch (_e) {
      toast.error(_e.message)
    }
  }

  const applyFilters = () => { setPage(1); setAppliedFilters({ ...filters }) }

  if (error) return <SectionError label="Users" message={error} />

  return (
    <Section title="Users" icon={Users}>
      {/* Filter row */}
      <div className="flex flex-wrap gap-3 mb-4">
        {['name', 'email', 'role'].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={`Filter by ${field}`}
            value={filters[field]}
            onChange={(e) => setFilters((f) => ({ ...f, [field]: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        ))}
        <button
          onClick={applyFilters}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition flex items-center gap-1"
        >
          <Search className="w-3.5 h-3.5" /> Search
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data?.users?.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.emailVerified
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(u._id, u.isActive)}
                        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg transition ${u.isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400'}`}
                      >
                        {u.isActive ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Showing {data.users?.length} of {data.total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 py-1 font-medium">Page {page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={data.users?.length < 10}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  )
}

/* ── Reports Section ───────────────────────────────────────── */
function ReportsSection() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/reports?page=${page}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (_e) {
      setError(_e.message)
    } finally {
      setLoading(false)
    }
  }, [page, user?.token])

  useEffect(() => { load() }, [load])

  const resolveReport = async (reportId, status) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update report')
      toast.success(`Report ${status}`)
      load()
    } catch (_e) {
      toast.error(_e.message)
    }
  }

  if (error) return <SectionError label="Reports" message={error} />

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          Open Reports
          {data?.openCount != null && (
            <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded-full">
              {data.openCount}
            </span>
          )}
        </span>
      }
      icon={Flag}
    >
      {loading ? (
        <div className="text-center py-8 text-gray-400"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : data?.reports?.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No open reports 🎉</p>
      ) : (
        <>
          <div className="space-y-3">
            {data.reports.map((r) => (
              <div key={r._id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full">{r.reason}</span>
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">{r.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Reporter: {r.reporterId?.name || r.reporterId} → Reported: {r.reportedUserId?.name || r.reportedUserId}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => resolveReport(r._id, 'resolved')}
                      className="px-3 py-1 text-xs font-semibold bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 rounded-lg flex items-center gap-1 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                    <button
                      onClick={() => resolveReport(r._id, 'dismissed')}
                      className="px-3 py-1 text-xs font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded-lg flex items-center gap-1 transition"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 text-sm">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-500 dark:text-gray-400 px-2">Page {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={data?.reports?.length < 10}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </Section>
  )
}

/* ── Shared UI helpers ─────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white mb-5">
        <Icon className="w-5 h-5 text-primary-500" />
        {title}
      </h2>
      {children}
    </div>
  )
}

function SectionSkeleton({ label }) {
  return (
    <Section title={label} icon={BarChart3}>
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </Section>
  )
}

function SectionError({ label, message }) {
  return (
    <Section title={label} icon={XCircle}>
      <p className="text-red-500 text-sm">Failed to load {label}: {message}</p>
    </Section>
  )
}

/* ── Page root ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage users, view stats and moderate reports.</p>
      </div>
      <StatsSection />
      <UsersSection />
      <ReportsSection />
    </div>
  )
}
