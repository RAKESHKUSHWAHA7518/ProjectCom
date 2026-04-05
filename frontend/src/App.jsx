import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
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

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 text-center">
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary-400/20 via-indigo-400/20 to-purple-400/20 blur-3xl rounded-full" />
        <h1 className="relative text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
          Exchange Skills.{' '}
          <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Grow Together.
          </span>
        </h1>
      </div>
      <p className="max-w-2xl text-lg text-gray-600 leading-relaxed">
        A peer-to-peer ecosystem where you teach what you know and learn what you don't. 
        Connect with mentors globally, earn credits, and level up your skills!
      </p>
      <div className="flex gap-4">
        <Link
          to="/explore"
          className="px-8 py-3.5 font-semibold text-white transition-all rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5"
        >
          Explore Skills
        </Link>
        <Link
          to="/register"
          className="px-8 py-3.5 font-semibold text-gray-700 transition-all bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md"
        >
          Join the Community
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
        {[
          { icon: '🔄', title: 'Barter Skills', desc: 'Teach coding, learn guitar. Exchange what you know for what you need.' },
          { icon: '🎥', title: 'Live Video Sessions', desc: 'Real-time video calls with screen sharing and in-app chat.' },
          { icon: '🏆', title: 'Earn & Grow', desc: 'Earn credits, badges, and climb the leaderboard as you help others.' },
        ].map((f, i) => (
          <div key={i} className="p-6 bg-white/60 backdrop-blur border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <button
                    key={n._id}
                    onClick={() => { markAsRead(n._id); setIsOpen(false); }}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition border-b border-gray-50 ${
                      !n.read ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    disconnectSocket();
    logout();
  };

  const navLinks = [
    { to: '/explore', label: 'Explore', icon: '🔍' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/sessions', label: 'Sessions', icon: '📅' },
    { to: '/chat', label: 'Chat', icon: '💬' },
    { to: '/leaderboard', label: 'Rankings', icon: '🏆' },
    { to: '/community', label: 'Community', icon: '🌐' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SkillSwap
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <span className="mr-1">{link.icon}</span>{link.label}
                  </Link>
                ))}
                <NotificationBell />
                <Link
                  to="/profile"
                  className="ml-2 w-8 h-8 bg-gradient-to-br from-primary-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold hover:shadow-lg transition"
                >
                  {user.name?.charAt(0)}
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-indigo-600 rounded-lg hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-3 space-y-1">
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <span className="mr-2">{link.icon}</span>{link.label}
                  </Link>
                ))}
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  👤 Profile
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg text-center">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function SocketManager() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user._id);

      socket.on('new-notification', (data) => {
        addNotification(data);
      });

      return () => {
        socket.off('new-notification');
      };
    } else {
      disconnectSocket();
    }
  }, [user]);

  return null;
}

function App() {
  const { user } = useAuthStore();
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans selection:bg-primary-100 selection:text-primary-900">
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
