import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Video, Award, Users, BookOpen, Zap, Globe, Shield,
  Star, CheckCircle, TrendingUp, Lock, ArrowUpRight, Check, MessageSquare,
  ChevronDown, ChevronUp, Calculator, HelpCircle, Mic, PhoneOff, Share2,
  Clock, Coins, ShieldCheck, Play, Layers, Code, Laptop, Sparkle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const features = [
  {
    icon: Sparkles,
    titleKey: 'Barter Skills',
    descKey: 'Barter Desc',
    gradient: 'from-primary-500 to-indigo-500',
    bg: 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400',
  },
  {
    icon: Video,
    titleKey: 'Live Video',
    descKey: 'Video Desc',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
  },
  {
    icon: Award,
    titleKey: 'Earn Grow',
    descKey: 'Earn Desc',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Users,
    titleKey: 'Community Driven',
    descKey: 'Join thriving communities, share knowledge, and collaborate with passionate learners worldwide.',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Shield,
    titleKey: 'Safe & Verified',
    descKey: 'Multi-step verification, transparent ratings, and escrow-backed credits protect every session.',
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: Globe,
    titleKey: 'Global Reach',
    descKey: 'Connect with mentors and learners across time zones, cultures, and languages without borders.',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
  },
];

const stats = [
  { label: 'Active Learners & Mentors', value: '10,000+', icon: Users, trend: '+12% this month' },
  { label: 'Skills Available to Swap', value: '500+', icon: BookOpen, trend: '+45 new this week' },
  { label: 'Sessions Completed', value: '25,000+', icon: Zap, trend: '+2,300 this month' },
  { label: 'Countries Represented', value: '50+', icon: Globe, trend: 'Global community' },
];

const trustSignals = [
  { icon: CheckCircle, label: 'Verified Mentors', desc: 'Identity, skill verification, and real community feedback.' },
  { icon: Shield, label: 'Escrow Protection', desc: 'Credits are held safely in escrow until your session is completed.' },
  { icon: Star, label: '4.9/5 Average Rating', desc: 'Thousands of transparent 5-star reviews from verified exchanges.' },
  { icon: Lock, label: 'Data Privacy & Safety', desc: 'Encrypted calls, protected credentials, and strict privacy standards.' },
];

const testimonials = [
  {
    quote: 'SkillSwap helped me learn React from a senior developer in just 3 sessions. The credit system makes it fair for everyone.',
    author: 'Sarah Chen',
    role: 'Frontend Developer',
    avatar: 'SC',
    company: 'TechCorp',
    rating: 5,
  },
  {
    quote: 'Teaching photography on weekends earns me credits to learn Spanish. It\'s a brilliant exchange model that actually works.',
    author: 'Marcus Johnson',
    role: 'Photographer',
    avatar: 'MJ',
    company: 'Freelance Studio',
    rating: 5,
  },
  {
    quote: 'The community aspect is amazing. I\'ve made friends and learned skills I never thought I\'d pick up. Best learning platform I\'ve used.',
    author: 'Aisha Patel',
    role: 'Data Analyst',
    avatar: 'AP',
    company: 'DataFlow',
    rating: 5,
  },
];

const trendingSkills = [
  'React', 'Python', 'Spanish', 'UI/UX Design', 'Guitar', 'Photography', 'Public Speaking', 'Data Science', 'Machine Learning'
];

const calculatorOptions = [
  {
    skill: 'React & Frontend',
    creditsPerHour: 1,
    popularPair: 'UI/UX Design in Figma',
    mentorExample: 'Senior Frontend Dev',
    savingsEstimate: '$240',
  },
  {
    skill: 'Python & AI Engineering',
    creditsPerHour: 1,
    popularPair: 'Data Structures & Algorithms',
    mentorExample: 'Staff ML Engineer',
    savingsEstimate: '$300',
  },
  {
    skill: 'Spanish Conversation',
    creditsPerHour: 1,
    popularPair: 'Acoustic Guitar & Vocals',
    mentorExample: 'Native Language Coach',
    savingsEstimate: '$180',
  },
  {
    skill: 'UI/UX Design',
    creditsPerHour: 1,
    popularPair: 'Full-Stack Web Dev',
    mentorExample: 'Lead Product Designer',
    savingsEstimate: '$260',
  },
  {
    skill: 'SEO & Growth Marketing',
    creditsPerHour: 1,
    popularPair: 'Copywriting & Content Strategy',
    mentorExample: 'Growth Lead',
    savingsEstimate: '$210',
  },
];

const faqs = [
  {
    q: 'How does the SkillSwap barter credit system work?',
    a: 'SkillSwap operates on a pure reciprocity model. When you register, you instantly receive 10 complimentary welcome credits. When you teach a peer for 1 hour, you earn 1 credit. When you book a mentor to learn, you spend 1 credit. All credits are held securely in escrow during the session and released once both participants confirm completion.',
  },
  {
    q: 'Is SkillSwap completely free or are there hidden fees?',
    a: 'SkillSwap peer-to-peer exchanges are 100% free with no subscription or mandatory payment required. You exchange your expertise for someone else’s expertise. No credit card is needed to get started or use the platform.',
  },
  {
    q: 'How are mentors and skill levels verified?',
    a: 'Mentors build a verifiable track record consisting of completed session counts, peer reviews, badges, and skill tag endorsements. You can review detailed testimonials and ratings before sending an exchange request.',
  },
  {
    q: 'What happens if a mentor does not show up or cancels?',
    a: 'Our Escrow Protection automatically refunds your credit back to your account immediately if a session is cancelled or if the other party fails to attend. You never lose credits for cancelled sessions.',
  },
  {
    q: 'How are live video sessions conducted?',
    a: 'SkillSwap includes built-in browser-based WebRTC HD video calling with low latency, screen sharing, live chat, and collaborative notes. No Zoom or third-party meeting links required.',
  },
  {
    q: 'Can I start learning even if I am a beginner with nothing to teach?',
    a: 'Yes! Every new user receives 10 free starting credits upon creating an account. You can begin learning immediately while discovering everyday skills you can offer in return—such as conversational language practice, study habits, or productivity software.',
  },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(0);
  const [teachCategory, setTeachCategory] = useState(0);
  const [teachHours, setTeachHours] = useState(3);

  return (
    <>
      <Helmet>
        <title>SkillSwap - Exchange Skills, Grow Together</title>
        <meta name="description" content="A peer-to-peer ecosystem where you teach what you know and learn what you don't. Barter skills, earn credits, build community." />
        <meta property="og:title" content="SkillSwap - Exchange Skills, Grow Together" />
        <meta property="og:description" content="A peer-to-peer ecosystem where you teach what you know and learn what you don't. Barter skills, earn credits, build community." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://skillexchange.fun" />
      </Helmet>

      <div className="min-h-screen bg-transparent font-sans text-gray-900 dark:text-gray-100">
        {/* HERO SECTION */}
        <section className="relative pt-12 sm:pt-16 pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Subtle background glow orbs */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-primary-400/15 via-indigo-400/10 to-accent-400/15 rounded-full blur-3xl" />
            <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-gradient-to-br from-emerald-400/10 to-teal-400/5 rounded-full blur-3xl" />
            <div className="absolute top-60 left-10 w-[280px] h-[280px] bg-gradient-to-br from-purple-400/10 to-pink-400/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            {/* Top Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/80 shadow-xs mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-primary-900 dark:text-primary-200">
                AI-Powered Matchmaking Now Live
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-gray-950 dark:text-white">
              Exchange Skills. <br />
              <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-accent-600 bg-clip-text text-transparent">
                Grow Together.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              The premier peer-to-peer barter platform where knowledge is currency. Swap skills 1-on-1 via live video, earn credits teaching, and unlock unlimited learning.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 mb-8">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-xl shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                Start Learning Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xs hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
              >
                Explore 500+ Skills
              </Link>
            </div>

            {/* Popular Skills Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-2xl mx-auto">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 uppercase tracking-wider">Trending:</span>
              {trendingSkills.map(skill => (
                <Link
                  key={skill}
                  to={`/explore?search=${encodeURIComponent(skill)}`}
                  className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/30 transition-all shadow-2xs"
                >
                  {skill}
                </Link>
              ))}
            </div>

            {/* Trust Pill / Social Proof */}
            <div className="inline-flex flex-wrap items-center justify-center gap-4 p-2.5 px-5 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md shadow-xs">
              <div className="flex -space-x-2">
                {['SC', 'MJ', 'AP', 'EL', 'DK'].map((initials, idx) => (
                  <div key={idx} className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gradient-to-tr from-primary-500 to-accent-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {initials}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-gray-900 dark:text-white">4.9/5</span>
                <span>• 25,000+ completed sessions</span>
              </div>
              <span className="hidden sm:inline h-3.5 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>10 free credits on sign up</span>
              </div>
            </div>

            {/* HERO PRODUCT PREVIEW SHOWCASE */}
            <div className="mt-14 max-w-5xl mx-auto text-left">
              <div className="rounded-3xl border border-gray-200/90 dark:border-gray-800/90 bg-white/95 dark:bg-gray-900/95 shadow-2xl shadow-primary-500/10 backdrop-blur-xl overflow-hidden">
                {/* Browser/Window Header */}
                <div className="px-4 py-3 bg-gray-100/90 dark:bg-gray-800/90 border-b border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400/90" />
                    <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
                    <span className="ml-3 hidden sm:inline-block px-3 py-1 rounded-md bg-white/80 dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-700/60 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      https://skillswap.io/room/react-live-barter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live 1-on-1 Session (38:12)
                    </span>
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                      <ShieldCheck className="w-3 h-3" /> Escrow Protected
                    </span>
                  </div>
                </div>

                {/* Workspace Interior */}
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
                  {/* Video Stage (7 cols) */}
                  <div className="lg:col-span-7 p-4 sm:p-5 bg-gradient-to-br from-gray-900 via-gray-950 to-slate-900 flex flex-col justify-between relative rounded-b-2xl lg:rounded-none">
                    {/* Mentor Badge & Audio wave */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-white text-xs font-semibold">Sarah Chen (Mentor)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/30 text-primary-300 font-mono">React Lead</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-white text-[11px]">
                        <span className="text-emerald-400 font-mono">HD 1080p</span>
                      </div>
                    </div>

                    {/* Central Simulated Video Stream Avatar */}
                    <div className="my-8 sm:my-10 flex flex-col items-center justify-center text-center">
                      <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary-600 via-indigo-500 to-purple-600 p-1 shadow-xl">
                          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                            SC
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center text-white">
                          <Mic className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <h4 className="mt-3 text-white font-bold text-sm sm:text-base">Sarah Chen</h4>
                      <p className="text-gray-400 text-xs mt-0.5">Explaining React Server Components & Memoization</p>

                      {/* Waveform graphic */}
                      <div className="flex items-center gap-1 mt-3">
                        {[40, 70, 30, 85, 95, 60, 45, 90, 65, 35, 75, 40].map((h, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${h * 0.22}px` }}
                            className="w-1 bg-primary-400 rounded-full animate-pulse"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bottom Controls Bar & PIP */}
                    <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors">
                          <Mic className="w-4 h-4 text-emerald-400" />
                        </span>
                        <span className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors">
                          <Video className="w-4 h-4 text-emerald-400" />
                        </span>
                        <span className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors hidden sm:inline-block">
                          <Share2 className="w-4 h-4 text-gray-300" />
                        </span>
                        <span className="p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white cursor-pointer transition-colors">
                          <PhoneOff className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                        <div className="w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                          AR
                        </div>
                        <span className="text-gray-300 text-xs font-medium">You (Learner)</span>
                      </div>
                    </div>
                  </div>

                  {/* Collaborative Notes & Exchange Ledger (5 cols) */}
                  <div className="lg:col-span-5 p-5 bg-white dark:bg-gray-900 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800">
                    <div>
                      {/* Barter Status Badge */}
                      <div className="p-3 rounded-xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200/70 dark:border-primary-800/70 mb-4">
                        <div className="flex items-center justify-between text-xs font-bold text-primary-900 dark:text-primary-200 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            Credit Escrow Active
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">1.0 Credit</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          Held securely in escrow. Released upon session finish.
                        </p>
                      </div>

                      {/* Reciprocal Trade Info */}
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mutual Exchange</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">Sarah teaches:</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">React State & Context</span>
                          </div>
                          <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">You teach next:</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">Spanish Conversation</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Code / Notes Scratchpad Preview */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          <span>Collaborative Scratchpad</span>
                          <span className="text-[10px] text-emerald-500 font-mono">Auto-saving...</span>
                        </div>
                        <div className="p-3 rounded-xl bg-gray-900 text-gray-200 font-mono text-xs overflow-hidden border border-gray-800">
                          <div className="text-gray-500">// Custom Hook for Escrow Listener</div>
                          <div><span className="text-purple-400">const</span> useSessionEscrow = () =&gt; &#123;</div>
                          <div className="pl-4 text-emerald-400">const [status, setStatus] = useState('escrow');</div>
                          <div className="pl-4 text-blue-300">return &#123; status, releaseCredit &#125;;</div>
                          <div>&#125;;</div>
                        </div>
                      </div>
                    </div>

                    {/* Chat Input Simulation */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-gray-700/60">
                          Sarah: "Check line 2—notice how state stays immutable!"
                        </div>
                        <span className="p-2 rounded-xl bg-primary-600 text-white shadow-xs">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS COUNTER BAR */}
        <section className="py-10      ">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {stats.map((s, i) => (
                <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {s.value}
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                    {s.label}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {s.trend}
                  </div>
                </div>
              ))}
            </div>

            {/* Partners pill bar */}
            {/* <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Trusted by learners from:</span>
              {partners.map((p, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  {p.name}
                  <span className="text-[10px] text-gray-400 font-normal">({p.tag})</span>
                </div>
              ))}
            </div> */}
          </div>
        </section>

        {/* INTERACTIVE BARTER CALCULATOR SECTION */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8  ">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Calculator className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                Interactive Exchange Calculator
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
                See How Much Value You Can Unlock
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Select what you can teach and how many hours you want to share. See the credits you earn and high-value skills you can learn in return without paying a single dollar.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl p-6 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Inputs Column (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                      1. Select What You Can Teach:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {calculatorOptions.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTeachCategory(idx)}
                          className={`p-3 text-left rounded-xl text-xs font-semibold border transition-all ${teachCategory === idx
                            ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-700 dark:text-primary-300 shadow-xs'
                            : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          {opt.skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        2. Hours You Want to Teach Per Month:
                      </label>
                      <span className="text-sm font-extrabold text-primary-600 dark:text-primary-400">
                        {teachHours} Hours / Month
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {[1, 2, 4, 8, 12].map(hrs => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setTeachHours(hrs)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${teachHours === hrs
                            ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          {hrs}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-400 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">Fair Reciprocal Ratio: </span>
                      Every 1 hour taught gives you 1 hour of personalized 1-on-1 instruction with another verified expert in the community.
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Card (5 cols) */}
                <div className="lg:col-span-5 bg-gradient-to-br from-primary-600 via-indigo-600 to-accent-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
                      Your Monthly Yield
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black">+{teachHours}</span>
                      <span className="text-xl font-bold text-primary-100">Credits Earned</span>
                    </div>
                    <p className="text-xs text-primary-100/90 mt-1">
                      Equivalent to <strong className="text-white">{teachHours} hours</strong> of free 1-on-1 expert coaching.
                    </p>

                    <div className="my-6 pt-5 border-t border-white/20 space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-primary-100">Bootcamp Value Saved:</span>
                        <span className="font-bold text-base text-emerald-300">
                          ${parseInt(calculatorOptions[teachCategory].savingsEstimate.replace('$', '')) * (teachHours / 2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-primary-100">Recommended Exchange:</span>
                        <span className="font-semibold text-white">
                          {calculatorOptions[teachCategory].popularPair}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-primary-100">Starting Balance:</span>
                        <span className="font-bold text-amber-300">+10 Free Credits</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="w-full py-3.5 px-4 rounded-xl bg-white text-primary-700 font-bold text-sm text-center shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Claim 10 Free Starting Credits</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                3 Simple Steps
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
                How SkillSwap Works
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                No subscription fees, no credit card required. Pure knowledge exchange built on reciprocity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: 'Step 01',
                  icon: Sparkles,
                  gradient: 'from-blue-500 to-indigo-600',
                  title: 'Create Your Profile',
                  desc: 'List the skills you can teach and what you want to learn. Our matchmaking engine pairs you with verified peers.',
                  chips: ['2 min setup', '50+ categories', 'Smart matching'],
                },
                {
                  step: 'Step 02',
                  icon: Video,
                  gradient: 'from-violet-500 to-purple-600',
                  title: 'Book a 1-on-1 Session',
                  desc: 'Browse mentors, check availability, and schedule live video calls. Enjoy screen sharing, chat, and collaborative notes.',
                  chips: ['Instant booking', 'Live HD video', 'Built-in chat'],
                },
                {
                  step: 'Step 03',
                  icon: Award,
                  gradient: 'from-amber-500 to-orange-500',
                  title: 'Earn & Level Up',
                  desc: 'Earn credits every time you teach. Spend credits whenever you want to learn. Earn verified badges and climb the ranks.',
                  chips: ['1 hr = 1 credit', 'Unlock badges', 'Global leaderboard'],
                },
              ].map((stepItem, i) => (
                <div
                  key={i}
                  className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                        {stepItem.step}
                      </span>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stepItem.gradient} flex items-center justify-center text-white shadow-md`}>
                        <stepItem.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {stepItem.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                      {stepItem.desc}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {stepItem.chips.map((chip, j) => (
                      <span key={j} className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8  ">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                Comprehensive Platform
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Everything You Need for Skill Swapping
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Purpose-built tools for friction-free learning, scheduling, and peer-to-peer mentoring.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((f, i) => (
                <Link
                  key={i}
                  to="/explore"
                  className="group p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300`}>
                      <f.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {t(f.titleKey)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      {t(f.descKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                    <span>Explore mentors</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="testimonials" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Community Stories
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Loved by 10,000+ Lifelong Learners
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Discover how learners are gaining real-world skills and unlocking career growth on SkillSwap.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {testimonials.map((item, i) => (
                <div
                  key={i}
                  className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Clean stars row without absolute positioning overlap */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(item.rating)].map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full">
                        <Check className="w-3 h-3" /> Verified Session
                      </span>
                    </div>

                    {/* Quote text */}
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-6 italic">
                      "{item.quote}"
                    </p>
                  </div>

                  {/* Author footer */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {item.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{item.author}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.role} • {item.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS SECTION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8  ">
          {/* bg-white dark:bg-gray-900/40 border-t border-gray-200/60 dark:border-gray-800/60 */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustSignals.map((signal, i) => (
                <div key={i} className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
                    <signal.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1.5">{signal.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{signal.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS SECTION */}
        <section id="faq" className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8   border-gray-200/60 dark:border-gray-800/60">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-4">
                <HelpCircle className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                Got Questions?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything you need to know about SkillSwap credits, mentor verification, and booking sessions.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                        {faq.q}
                      </span>
                      <span className={`p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-6 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/60 pt-4">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary-600 via-indigo-600 to-accent-600 p-8 sm:p-12 lg:p-16 text-center text-white shadow-2xl shadow-primary-500/20 border border-white/10">
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-sm font-semibold text-white mb-8 animate-slide-up-fade">
                <Sparkles className="w-4 h-4 text-amber-300" />
                New users receive 10 free credits — no card required
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1] animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                Ready to Barter Your Skills?
              </h2>
              <p className="text-primary-100 text-lg sm:text-xl mb-10 leading-relaxed max-w-2xl mx-auto animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                Join our vibrant global community today. Start learning from experts while sharing what makes you unique.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold text-base rounded-xl shadow-xl hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <Sparkles className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/explore"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-base rounded-xl backdrop-blur-sm transition-all duration-300 hover:border-white/40"
                >
                  Explore Skills First
                </Link>
              </div>
              <p className="text-xs text-primary-200 animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
                By joining, you agree to our{' '}
                <Link to="/terms" className="text-white underline font-semibold hover:text-primary-100">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-white underline font-semibold hover:text-primary-100">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full bg-white/95 dark:bg-gray-950/95 text-gray-600 dark:text-gray-400 py-12 lg:py-16 border-t border-gray-200/80 dark:border-gray-800/80 backdrop-blur-md relative overflow-hidden">
          <div className="container-page">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-8">
              {/* Brand & Mission */}
              <div className="col-span-2 sm:col-span-1">
                <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500 bg-clip-text text-transparent">
                  SkillSwap
                </Link>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                  A peer-to-peer barter ecosystem where you teach what you know and learn what you don't.
                </p>
                <div className="mt-5 flex items-center gap-2.5">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-gray-200/70 dark:border-gray-800 group" aria-label="Twitter">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.724h-3.304l-7.15-8.26-8.502 9.724h-3.308l7.15-8.26-8.502-9.724h3.308l7.15 8.26 8.502-9.724z" /></svg>
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-gray-200/70 dark:border-gray-800 group" aria-label="GitHub">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.579v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
                  </a>
                  <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all border border-gray-200/70 dark:border-gray-800 group" aria-label="Discord">
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.675 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.083.083 0 0 0 .031.057 19.9 19.9 0 0 0 5.992 4.783.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 1 .077-.077h.008a.08.08 0 0 1 .078.056 11.106 11.106 0 0 0 .565 1.429.076.076 0 0 0 .12.017c3.904-.528 7.135-2.747 7.135-6.652 0-2.982-1.447-5.465-3.795-7.05a.077.077 0 0 1-.006-.133 13.107 13.107 0 0 1 1.842-3.485.07.07 0 0 0 .027-.081 19.839 19.839 0 0 0-1.573-6.912.07.07 0 0 0 .031-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                  </a>
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm tracking-wide">Platform</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/explore" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Explore Skills</Link></li>
                  <li><Link to="/community" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Communities</Link></li>
                  <li><Link to="/leaderboard" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Leaderboard</Link></li>
                  <li><Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Earn Credits</Link></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm tracking-wide">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="/#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a></li>
                  <li><a href="/#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">How It Works</a></li>
                  <li><a href="/#testimonials" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Testimonials</a></li>
                  <li><a href="/#faq" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">FAQ</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm tracking-wide">Legal</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Escrow Protection</Link></li>
                  <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Community Guidelines</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="border-t border-gray-200/80 dark:border-gray-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <p className="text-center sm:text-left">
                &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                <Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms</Link>
                <span>•</span>
                <Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy</Link>
                <span>•</span>
                <span className="text-gray-500 dark:text-gray-400">Made with care for learners everywhere</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}