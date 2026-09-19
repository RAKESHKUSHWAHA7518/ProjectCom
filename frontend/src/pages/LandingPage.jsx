import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Video, Award, Users, BookOpen, Zap, Globe, Shield, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Sparkles,
      title: t('Barter Skills'),
      desc: t('Barter Desc'),
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: Video,
      title: t('Live Video'),
      desc: t('Video Desc'),
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      icon: Award,
      title: t('Earn Grow'),
      desc: t('Earn Desc'),
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      icon: Users,
      title: 'Community Driven',
      desc: 'Join communities, share knowledge, and grow together with learners worldwide.',
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950/40',
    },
    {
      icon: Shield,
      title: 'Safe & Verified',
      desc: 'Email verification, user reviews, and moderation keep the platform trustworthy.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      icon: Globe,
      title: 'Global Reach',
      desc: 'Connect with mentors and learners across timezones and languages.',
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-950/40',
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10,000+', icon: Users },
    { label: 'Skills Listed', value: '500+', icon: BookOpen },
    { label: 'Sessions Done', value: '25,000+', icon: Zap },
    { label: 'Countries', value: '50+', icon: Globe },
  ];

  const testimonials = [
    {
      quote: '"SkillSwap helped me learn React from a senior developer in just 3 sessions. The credit system makes it fair for everyone."',
      author: 'Sarah Chen',
      role: 'Frontend Developer',
    },
    {
      quote: '"Teaching photography on weekends earns me credits to learn Spanish. It\'s a brilliant exchange model."',
      author: 'Marcus Johnson',
      role: 'Photographer',
    },
    {
      quote: '"The community aspect is amazing. I\'ve made friends and learned skills I never thought I\'d pick up."',
      author: 'Aisha Patel',
      role: 'Data Analyst',
    },
  ];

  return (
    <>
      <Helmet>
        <title>SkillSwap - Exchange Skills, Grow Together</title>
        <meta name="description" content="A peer-to-peer ecosystem where you teach what you know and learn what you don't. Barter skills, earn credits, build community." />
        <meta property="og:title" content="SkillSwap - Exchange Skills, Grow Together" />
        <meta property="og:description" content="A peer-to-peer ecosystem where you teach what you know and learn what you don't. Barter skills, earn credits, build community." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SkillSwap - Exchange Skills, Grow Together" />
        <meta name="twitter:description" content="A peer-to-peer ecosystem where you teach what you know and learn what you don't." />
        <link rel="canonical" href="https://skillexchange.fun" />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent">
                SkillSwap
              </Link>
              <div className="hidden lg:flex items-center gap-8">
                <Link to="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Features</Link>
                <Link to="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">How It Works</Link>
                <Link to="#testimonials" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Testimonials</Link>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300">Get Started Free</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 pt-12 pb-20 text-center overflow-hidden">
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-primary-400/25 to-indigo-400/20 rounded-full blur-3xl animate-float" />
            <div className="absolute top-1/3 -right-24 w-80 h-80 bg-gradient-to-br from-accent-400/20 to-purple-400/15 rounded-full blur-3xl animate-float-reverse" />
            <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-400/15 to-blue-400/10 rounded-full blur-3xl animate-float-slow" />
          </div>

          <div className="relative max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
              <span className="text-gray-900 dark:text-white">{t('Exchange Skills')}</span>{' '}
              <span className="bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent">
                {t('Grow Together')}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-10">
              {t('Hero Description')}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-white rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                {t('Start Learning Free')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {t('Explore Skills')}
              </Link>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
              {stats.map((s, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-5 text-center shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                  <s.icon className="w-5 h-5 mx-auto mb-2 text-primary-500 dark:text-primary-400" />
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Everything you need to <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">skill swap</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A complete peer-to-peer learning ecosystem built for modern skill exchange.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="group bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} strokeWidth={2} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                How it works in <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">3 steps</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Simple, fair, and designed for busy people who value learning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="relative text-center">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold mb-8">
                  1
                </div>
                <div className="pt-12">
                  <div className="w-16 h-16 mx-auto mb-5 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Create Your Profile</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    List skills you can teach and skills you want to learn. Set your availability and preferences.
                  </p>
                </div>
              </div>

              <div className="relative text-center">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold mb-8">
                  2
                </div>
                <div className="pt-12">
                  <div className="w-16 h-16 mx-auto mb-5 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Video className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Book a Session</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Browse mentors, check availability, and book a 1-on-1 video session using your skill credits.
                  </p>
                </div>
              </div>

              <div className="relative text-center">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold mb-8">
                  3
                </div>
                <div className="pt-12">
                  <div className="w-16 h-16 mx-auto mb-5 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Earn & Grow</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete sessions to earn credits. Teach what you know, learn what you don't. Build your reputation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Trusted by learners worldwide
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                See what our community members have to say about their SkillSwap experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{t.quote}</p>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{t.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 rounded-3xl p-10 md:p-16 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to start your learning journey?
              </h2>
              <p className="text-lg text-primary-100 mb-8 max-w-xl mx-auto">
                Join thousands of learners and mentors. Your first 10 skill credits are free.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-primary-600 bg-white rounded-2xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5" />
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-2">
                <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary-400 via-indigo-400 to-accent-400 bg-clip-text text-transparent">
                  SkillSwap
                </Link>
                <p className="mt-4 text-sm max-w-xs">
                  A peer-to-peer ecosystem where you teach what you know and learn what you don't.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/explore" className="hover:text-white transition-colors">Explore Skills</Link></li>
                  <li><Link to="/community" className="hover:text-white transition-colors">Communities</Link></li>
                  <li><Link to="/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                  <li><Link to="/challenges" className="hover:text-white transition-colors">Weekly Challenges</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">
                &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
              </p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">Twitter</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">GitHub</a>
                <a href="#" className="hover:text-white transition-colors" aria-label="Discord">Discord</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}