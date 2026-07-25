'use client'

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { 
  Shield, Moon, Sun, Mic, MicOff, Volume2, VolumeX, 
  Activity, Search, Bell, Clock, Cpu, LayoutDashboard, 
  Map, Network, ListTodo, TrendingUp, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore, type ViewType } from '@/store/use-app-store'
import { useTheme } from 'next-themes'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardView } from '@/components/dashboard-view'
import { ChatView } from '@/components/chat-view'
import { SearchView } from '@/components/search-view'
import { PredictionsView } from '@/components/predictions-view'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginView } from '@/components/login-view'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamic imports for components that use browser-only libraries
const MapView = dynamic(() => import('@/components/map-view').then((m) => ({ default: m.MapView })), {
  loading: () => <MapSkeleton />,
  ssr: false,
})

const NetworkView = dynamic(() => import('@/components/network-view').then((m) => ({ default: m.NetworkView })), {
  loading: () => <NetworkSkeleton />,
  ssr: false,
})

function MapSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 bg-slate-900/60" />
      <Skeleton className="w-full h-[520px] rounded-2xl bg-slate-900/60" />
    </div>
  )
}

function NetworkSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64 bg-slate-900/60" />
      <Skeleton className="w-full h-[520px] rounded-2xl bg-slate-900/60" />
    </div>
  )
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function ViewSwitcher() {
  const { activeView } = useAppStore()

  switch (activeView) {
    case 'dashboard': return <DashboardView />
    case 'chat': return <ChatView />
    case 'map': return <MapView />
    case 'network': return <NetworkView />
    case 'search': return <SearchView />
    case 'predictions': return <PredictionsView />
    default: return <DashboardView />
  }
}

export default function Home() {
  const { activeView, setActiveView, sidebarCollapsed, user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [currentTime, setCurrentTime] = useState('')
  const [simulatedLatency, setSimulatedLatency] = useState(12)

  const mounted = useMounted()

  // Live ticking clock for mission control header
  useEffect(() => {
    const updateTime = () => {
      const date = new Date()
      setCurrentTime(date.toLocaleTimeString('en-US', { hour12: false }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Simulating small network latency fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedLatency(Math.floor(Math.random() * 8) + 10)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Validate active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data?.user) {
            setUser(data.user)
          }
        }
      } catch (err) {
        console.error('Session validation error:', err)
      } finally {
        setLoadingSession(false)
      }
    }
    checkSession()
  }, [setUser])

  const speakLastResponse = useCallback(() => {
    if (ttsEnabled) return
    setTtsEnabled(true)
    const messages = document.querySelectorAll('.chat-message')
    const lastAi = Array.from(messages).filter((m) => m.querySelector('.prose'))
    if (lastAi.length > 0) {
      const text = lastAi[lastAi.length - 1]?.textContent || ''
      if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1
        utterance.pitch = 1
        utterance.onend = () => setTtsEnabled(false)
        utterance.onerror = () => setTtsEnabled(false)
        window.speechSynthesis.speak(utterance)
        toast.success('Speaking response...')
      } else {
        setTtsEnabled(false)
        toast.error('Speech synthesis not available')
      }
    } else {
      setTtsEnabled(false)
      toast.info('Switch to AI Chat and ask a question first')
    }
  }, [ttsEnabled])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setTtsEnabled(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false)
      return
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      toast.success('Listening... Speak now')
    }

    recognition.onresult = (event: { results: { 0: { transcript: string } }[] }) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      toast.success(`Heard: "${transcript}"`)

      const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null
      if (textarea) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(textarea, transcript)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        const sendBtn = document.querySelector('button.bg-gradient-to-r') as HTMLButtonElement | null
        sendBtn?.click()
      } else {
        const { setActiveView } = useAppStore.getState()
        setActiveView('chat')
        setTimeout(() => {
          const ta = document.querySelector('textarea') as HTMLTextAreaElement | null
          if (ta) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
            setter?.call(ta, transcript)
            ta.dispatchEvent(new Event('input', { bubbles: true }))
            setTimeout(() => {
              const btn = document.querySelector('button.bg-gradient-to-r') as HTMLButtonElement | null
              btn?.click()
            }, 100)
          }
        }, 300)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Could not recognize speech. Try again.')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [isListening])

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#08090B] flex flex-col items-center justify-center gap-4">
        <Activity className="h-8 w-8 text-cyan-400 animate-pulse" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Initializing Secure Tunnel...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />
  }

  // Define dock buttons matching Figma/Apple-style floating dock
  const dockItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Console', icon: LayoutDashboard },
    { view: 'map', label: 'Telemetry Map', icon: Map },
    { view: 'chat', label: 'AI Intel', icon: Cpu },
    { view: 'network', label: 'Entity Vector', icon: Network },
    { view: 'search', label: 'Data Logs', icon: ListTodo },
    { view: 'predictions', label: 'Threat matrix', icon: TrendingUp },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-[#08090B] text-foreground flex relative overflow-hidden aurora-bg cyber-grid">
        
        {/* Sidebar Nav */}
        <AppSidebar />

        {/* Content Shell */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 flex flex-col min-h-screen relative z-10',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          {/* Futuristic Floating Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/5 bg-[#08090B]/60 backdrop-blur-md">
            <div className="flex items-center gap-6">
              {/* Logo / Badge */}
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-black tracking-widest text-white font-mono">CRIME IQ</span>
              </div>
            </div>

            {/* Middle Search Bar */}
            <div className="hidden md:flex items-center w-80 relative">
              <Search className="absolute left-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search telemetry ID, coordinate..."
                className="w-full bg-[#0d0f14]/50 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              />
            </div>

            {/* Right Command indicators */}
            <div className="flex items-center gap-4">
              {/* Live Ticking Clock */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{currentTime}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isListening ? 'destructive' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-slate-400 hover:text-white"
                      onClick={toggleListening}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voice input</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={ttsEnabled ? 'default' : 'ghost'}
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-slate-400 hover:text-white"
                      onClick={ttsEnabled ? stopSpeaking : speakLastResponse}
                    >
                      {ttsEnabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Speech feedback</TooltipContent>
                </Tooltip>

                {mounted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer text-slate-400 hover:text-white"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main content body */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar pb-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <ViewSwitcher />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mission Control Status Footer */}
          <footer className="border-t border-white/5 py-4 px-6 flex items-center justify-between text-[10px] font-mono text-slate-500 bg-[#08090B]/60 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                SYSTEMS OPERATIONAL
              </span>
              <span className="hidden sm:inline border-l border-white/10 h-3" />
              <span className="hidden sm:inline">LATENCY: {simulatedLatency}ms</span>
              <span className="hidden sm:inline border-l border-white/10 h-3" />
              <span className="hidden sm:inline">FEED: SECURE-KA-POLICE-DB</span>
            </div>
            <div>
              <span>CRIME IQ v1.2 — ENCRYPTED NODE</span>
            </div>
          </footer>

          {/* Floating Dock Navigation (macOS/Figma-style) */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto">
            <div className="glass-panel rounded-2xl px-4 py-3 bg-[#0d0f14]/80 flex items-center gap-1.5 shadow-2xl border-white/5 shadow-cyan-500/5">
              {dockItems.map((item) => {
                const isActive = activeView === item.view
                const Icon = item.icon
                return (
                  <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveView(item.view)}
                        className={cn(
                          "relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer border",
                          isActive 
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-lg shadow-cyan-500/10" 
                            : "text-slate-400 hover:text-white bg-slate-900/40 border-transparent hover:bg-slate-900"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {isActive && (
                          <motion.div 
                            layoutId="activeDockDot"
                            className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-cyan-400"
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-slate-950 text-white border-white/5 font-mono text-[10px]">
                      {item.label.toUpperCase()}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>

        </main>
      </div>
    </TooltipProvider>
  )
}
