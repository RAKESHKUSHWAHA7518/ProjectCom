import React, { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, LayoutDashboard, CalendarDays, MessageCircle, Trophy, Globe,
  Bell, User, LogOut, Menu, X, ArrowRight, Sparkles, Video, Award,
  RefreshCw, Sun, Moon, Users, BookOpen, Zap,
} from 'lucide-react'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
import { useThemeStore } from './store/themeStore'
import { connectSocket, disconnectSocket } from './utils/socket'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import Sessions from './pages/Sessions'
import Chat from './pages/Chat'
import VideoCall from './pages/VideoCall'
import Leaderboard from './pages/Leaderboard'
import Community from './pages/Community'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
}

const slideDown = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
}

/* ============================================================
   HOME / HERO SECTION
   ============================================================ */
function Home() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => { })
  }, [])

  const features = [
    {
      icon: RefreshCw,
      title: 'Barter Skills',
      desc: 'Teach coding, learn guitar. Exchange what you know for what you need.',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: Video,
      title: 'Live Video Sessions',
      desc: 'Real-time video calls with screen sharing and in-app chat.',
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      icon: Award,
      title: 'Earn & Grow',
      desc: 'Earn credits, badges, and climb the leaderboard as you help others.',
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ]

  const statItems = stats
    ? [
      { label: 'Active Users', value: stats.totalUsers, icon: Users },
      { label: 'Skills Listed', value: stats.totalSkills, icon: BookOpen },
      { label: 'Sessions Done', value: stats.totalSessions, icon: Zap },
      { label: 'Communities', value: stats.totalCommunities, icon: Globe },
    ]
    : []

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 pt-12 pb-20 text-center relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-primary-400/25 to-indigo-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-gradient-to-br from-accent-400/20 to-purple-400/15 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/15 to-blue-400/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Hero heading */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative max-w-4xl"
      >
        <motion.h1
          variants={fadeInUp}
          custom={0}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
        >
          <span className="text-gray-900 dark:text-white">Exchange Skills.</span>{' '}
          <span className="bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent">
            Grow Together.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          custom={1}
          className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
        >
          A peer-to-peer ecosystem where you teach what you know and learn what you don't.
          Connect with mentors globally, earn credits, and level up your skills!
        </motion.p>

        {/* CTA buttons */}
        <motion.div variants={fadeInUp} custom={2} className="flex flex-wrap justify-center gap-4 mt-10">
          <Link
            to="/explore"
            className="group inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-white rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5" />
            Explore Skills
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm hover:shadow-md transition-all duration-300"
          >
            Join the Community
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats strip */}
      {stats && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mt-20 w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {statItems.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeInUp}
              custom={i}
              className="glass-card rounded-2xl px-5 py-5 text-center hover:shadow-elevated transition-all duration-300"
            >
              <s.icon className="w-5 h-5 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {s.value.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full max-w-4xl"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            custom={i}
            className="group glass-card rounded-2xl p-7 text-left hover:shadow-float hover:-translate-y-1.5 transition-all duration-300 cursor-default"
          >
            <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
              <f.icon className={`w-6 h-6 ${f.color}`} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

/* ============================================================
   NOTIFICATION BELL
   ============================================================ */
function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 top-full mt-3 w-[340px] glass-card rounded-2xl shadow-float z-50 overflow-hidden origin-top-right"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n._id}
                      onClick={() => { markAsRead(n._id); setIsOpen(false) }}
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 ${!n.read ? 'bg-primary-50/60 dark:bg-primary-950/30' : ''
                        }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = () => {
    disconnectSocket()
    logout()
  }

  const navLinks = [
    { to: '/explore', label: 'Explore', icon: Search },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/sessions', label: 'Sessions', icon: CalendarDays },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/leaderboard', label: 'Rankings', icon: Trophy },
    { to: '/community', label: 'Community', icon: Globe },
  ]

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-gray-800/60 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent">
              SkillSwap
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.to)
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${active
                        ? 'nav-active font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                      {link.label}
                    </Link>
                  )
                })}

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                <ThemeToggle />
                <NotificationBell />

                <Link
                  to="/profile"
                  className="ml-1 w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white dark:ring-gray-900 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200"
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-1 p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200"
                  aria-label="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              variants={slideDown}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 border-t border-gray-100 dark:border-gray-800 mt-2 pt-3 space-y-1">
                {user ? (
                  <>
                    {navLinks.map((link) => {
                      const Icon = link.icon
                      const active = isActive(link.to)
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${active
                            ? 'nav-active font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                          {link.label}
                        </Link>
                      )
                    })}
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive('/profile')
                        ? 'nav-active font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block mx-4 px-5 py-3 text-center text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-lg"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

/* ============================================================
   SOCKET MANAGER
   ============================================================ */
function SocketManager() {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user._id)

      socket.on('new-notification', (data) => {
        addNotification(data)
      })

      return () => {
        socket.off('new-notification')
      }
    } else {
      disconnectSocket()
    }
  }, [user])

  return null
}

/* ============================================================
   APP ROOT
   ============================================================ */
function App() {
  const { user } = useAuthStore()
  const { initTheme } = useThemeStore()

  useEffect(() => {
    initTheme()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans selection:bg-primary-100 dark:selection:bg-primary-900 selection:text-primary-900 dark:selection:text-primary-100 transition-colors duration-300">
        <Toaster position="top-right" toastOptions={{ className: 'dark:!bg-gray-800 dark:!text-white dark:!border-gray-700', style: { borderRadius: '12px', fontSize: '14px' } }} />
        <SocketManager />
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/sessions" element={user ? <Sessions /> : <Navigate to="/login" />} />
            <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/chat/:id" element={user ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/video/:roomId" element={user ? <VideoCall /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/community" element={user ? <Community /> : <Navigate to="/login" />} />
            <Route path="/community/:id" element={user ? <Community /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
