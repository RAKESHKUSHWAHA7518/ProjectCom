import React, { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Users, BarChart3, Flag, Search, RefreshCw, CheckCircle, XCircle,
  UserX, UserCheck, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, TrendingUp, TrendingDown,
  Activity, Shield, Award, Globe, Settings, MoreHorizontal, Eye, Edit,
  Download, Filter, AlertTriangle, Bell, Mail, Phone, Link, Camera
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

/* ── Stat Card Component ─────────────────────────────────────────── */
function StatCard({ label, value, icon: IconComponent, gradient, trend, trendIcon: TrendIconComponent, color }) {
  const Icon = IconComponent
  const TrendIcon = TrendIconComponent
  return (
    <div className="card-hover-interactive p-5 lg:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity duration-300" style={{ background: gradient }} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 hover:scale-110 transition-transform duration-300`}>
            <IconComponent className="w-6 h-6 text-gray-900 dark:text-white" strokeWidth={2} />
          </div>
          <div className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        </div>
        {trend && (
          <div className="flex items-end gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            <TrendIconComponent className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Stats Section ─────────────────────────────────────────── */
function StatsSection() {
  const { data, loading, error } = useAdminFetch('/admin/stats')

  if (loading) return <SectionSkeleton label="Platform Stats" count={5} />
  if (error) return <SectionError label="Platform Stats" message={error} />

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: Users, gradient: 'from-primary-500 to-indigo-500', color: 'bg-primary-50 dark:bg-primary-950/30', trend: '+12%', trendIcon: TrendingUp },
    { label: 'Total Skills', value: data.totalSkills, icon: Award, gradient: 'from-amber-500 to-orange-500', color: 'bg-amber-50 dark:bg-amber-950/30', trend: '+8%', trendIcon: TrendingUp },
    { label: 'Total Sessions', value: data.totalSessions, icon: Activity, gradient: 'from-emerald-500 to-teal-600', color: 'bg-emerald-50 dark:bg-emerald-950/30', trend: '+15%', trendIcon: TrendingUp },
    { label: 'Communities', value: data.totalCommunities, icon: Globe, gradient: 'from-purple-500 to-pink-600', color: 'bg-purple-50 dark:bg-purple-950/30', trend: '+5%', trendIcon: TrendingUp },
    { label: 'New (30d)', value: data.newUsersLast30Days, icon: TrendingUp, gradient: 'from-rose-500 to-pink-500', color: 'bg-rose-50 dark:bg-rose-950/30', trend: '+23%', trendIcon: TrendingUp },
  ]

  return (
    <Section title="Platform Statistics" icon={BarChart3} subtitle="Key metrics at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {stats.map((s, i) => (
          <StatCard key={s.label} {...s} style={{ animationDelay: `${i * 80}ms` }} />
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
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

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

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

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
    <Section title="User Management" icon={Users} subtitle="Manage platform users and their status">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-stretch lg:items-end">
        <div className="flex-1 min-w-0">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="user-search"
              type="text"
              placeholder="Search by name or email..."
              className="input-field pl-12 w-full"
              value={filters.name}
              onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="input-field appearance-none bg-white dark:bg-gray-900 w-auto"
            value={filters.role}
            onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <button onClick={applyFilters} className="btn-primary">
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h}><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: h === 'Actions' ? '120px' : '100%' }} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(() => (
                    <td key={Math.random()}><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table" role="grid">
              <thead>
                <tr>
                  {[
                    { key: 'name', label: 'Name', sortable: true },
                    { key: 'email', label: 'Email', sortable: true },
                    { key: 'role', label: 'Role', sortable: true },
                    { key: 'emailVerified', label: 'Verified', sortable: true },
                    { key: 'isActive', label: 'Status', sortable: true },
                    { key: 'createdAt', label: 'Joined', sortable: true },
                    { key: 'actions', label: 'Actions', sortable: false },
                  ].map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{ width: col.key === 'actions' ? '140px' : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable && sortConfig.key === col.key && (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.users?.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-gray'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {u.emailVerified ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {u.emailVerified ? 'Email' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-emerald' : 'badge-rose'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(u._id, u.isActive)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          u.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}
                        aria-label={u.isActive ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.users?.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No users found matching your criteria</p>
            </div>
          )}

          {/* Pagination */}
          {data && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500 dark:text-gray-400">
              <span>Showing {data.users?.length} of {data.total} users</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost p-2 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-medium">Page {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={data.users?.length < 10}
                  className="btn-ghost p-2 disabled:opacity-40"
                  aria-label="Next page"
                >
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

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam',
      harassment: 'Harassment',
      inappropriate: 'Inappropriate Content',
      fraud: 'Fraud/Scam',
      other: 'Other'
    }
    return labels[reason] || reason
  }

  const getReasonColor = (reason) => {
    const colors = {
      spam: 'badge-amber',
      harassment: 'badge-rose',
      inappropriate: 'badge-purple',
      fraud: 'badge-red',
      other: 'badge-gray'
    }
    return colors[reason] || 'badge-gray'
  }

  if (error) return <SectionError label="Reports" message={error} />

  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Open Reports
          {data?.openCount != null && (
            <span className="badge badge-rose">{data.openCount}</span>
          )}
        </span>
      }
      icon={Flag}
      subtitle="Review and moderate user reports"
    >
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2" />
            </div>
          ))}
        </div>
      ) : data?.reports?.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No open reports 🎉</p>
          <p className="text-gray-500 dark:text-gray-400">All caught up! No reports requiring attention.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.reports.map((r) => (
              <div
                key={r._id}
                className="card-hover p-5 border border-gray-100 dark:border-gray-800 rounded-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`badge ${getReasonColor(r.reason)}`}>
                        {getReasonLabel(r.reason)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {r.reporterId?.isActive === false && (
                        <span className="badge badge-rose">Reporter Deactivated</span>
                      )}
                    </div>
                    {r.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">{r.details}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Reporter: <span className="font-medium text-gray-600 dark:text-gray-300">{r.reporterId?.name || r.reporterId}</span>{' '}
                      → Reported: <span className="font-medium text-gray-600 dark:text-gray-300">{r.reportedUserId?.name || r.reportedUserId}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => resolveReport(r._id, 'resolved')}
                      className="btn-secondary text-xs px-3 py-1.5 gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                    <button
                      onClick={() => resolveReport(r._id, 'dismissed')}
                      className="btn-ghost text-xs px-3 py-1.5 gap-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 mt-6 text-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-ghost p-2 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-500 dark:text-gray-400 px-2">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={data?.reports?.length < 10}
              className="btn-ghost p-2 disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </Section>
  )
}

/* ── Shared UI helpers ─────────────────────────────────────── */
function Section({ title, icon: IconComponent, subtitle, children }) {
  const Icon = IconComponent
  return (
    <div className="card-elevated p-6 lg:p-8 mb-6 lg:mb-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
            <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-primary-500" />
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function SectionSkeleton({ label, count = 3 }) {
  return (
    <Section title={label} icon={BarChart3}>
      <div className="animate-pulse grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="card-elevated p-6">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        ))}
      </div>
    </Section>
  )
}

function SectionError({ label, message }) {
  return (
    <Section title={label} icon={AlertTriangle}>
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-red-700 dark:text-red-400">Failed to load {label}: {message}</p>
      </div>
    </Section>
  )
}

/* ── Page root ─────────────────────────────────────────────── */
export default function AdminDashboard() {
  return (
    <div className="py-8 lg:py-10 w-full">
      <div className="container-page">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl">
                Manage users, view stats and moderate reports.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-end">
              <button className="btn-secondary">
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button className="btn-secondary">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        <StatsSection />
        <UsersSection />
        <ReportsSection />
      </div>
    </div>
  )
}