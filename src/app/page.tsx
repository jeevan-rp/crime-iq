'use client'

import { useState, useCallback, useSyncExternalStore, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Menu, Moon, Sun, Mic, MicOff, Volume2, VolumeX, Shield, Lock, Mail, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/use-app-store'
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

// Dynamic imports for components that use browser-only libraries (Leaflet, Cytoscape)
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
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Skeleton className="lg:col-span-3 h-[520px] rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function NetworkSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Skeleton className="lg:col-span-3 h-[520px] rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
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
  const { sidebarCollapsed, toggleSidebar, user, setUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  
  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submittingLogin, setSubmittingLogin] = useState(false)

  const mounted = useMounted()

  // Fetch current session details on mount
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

  const handleLoginSubmit = async (e?: React.FormEvent, customCredentials?: { e: string; p: string }) => {
    if (e) e.preventDefault()
    
    const loginEmail = customCredentials ? customCredentials.e : email
    const loginPassword = customCredentials ? customCredentials.p : password

    if (!loginEmail || !loginPassword) {
      toast.error('Please enter both email and password')
      return
    }

    setSubmittingLogin(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await res.json()
      if (res.ok && data?.success) {
        setUser(data.user)
        toast.success(`Welcome back, ${data.user.name}`)
      } else {
        toast.error(data?.error || 'Authentication failed')
      }
    } catch {
      toast.error('Network connection failed')
    } finally {
      setSubmittingLogin(false)
    }
  }

  const handleQuickLogin = (role: string) => {
    let e = ''
    let p = ''
    switch (role) {
      case 'Admin':
        e = 'admin@kp.gov.in'
        p = 'Admin@123'
        break
      case 'Officer':
        e = 'officer@kp.gov.in'
        p = 'Officer@123'
        break
      case 'Analyst':
        e = 'analyst@kp.gov.in'
        p = 'Analyst@123'
        break
      case 'Investigator':
        e = 'investigator@kp.gov.in'
        p = 'Investigator@123'
        break
    }
    handleLoginSubmit(undefined, { e, p })
  }

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

  // Render loading skeleton during initial session validation
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="text-slate-400 text-sm tracking-wider font-semibold animate-pulse uppercase">Verifying Bureau Credentials...</p>
      </div>
    )
  }

  // Render Premium Login Card if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 border border-white/10 rounded-2xl backdrop-blur-xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 mb-3">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              CRIME IQ <span className="text-orange-500 text-xs px-2 py-0.5 rounded-full bg-orange-500/10 font-bold border border-orange-500/20">PORTAL</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider text-center">Karnataka State Police Intelligence Bureau</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Bureau Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kp.gov.in"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submittingLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              {submittingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decrypt & Enter'}
            </Button>
          </form>

          {/* Quick Evaluation Logins */}
          <div className="border-t border-white/10 pt-4">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1.5 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" /> Quick-Access Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('Admin')}
                disabled={submittingLogin}
                className="bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-red-500/30 rounded-lg p-2.5 text-left transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-bold text-red-400 group-hover:text-red-300">Admin Portal</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">DSP Raghavendra</p>
              </button>
              <button
                onClick={() => handleQuickLogin('Officer')}
                disabled={submittingLogin}
                className="bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-lg p-2.5 text-left transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-bold text-blue-400 group-hover:text-blue-300">Officer View</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">Inspector Kavitha</p>
              </button>
              <button
                onClick={() => handleQuickLogin('Analyst')}
                disabled={submittingLogin}
                className="bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-purple-500/30 rounded-lg p-2.5 text-left transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-bold text-purple-400 group-hover:text-purple-300">Analyst Tools</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">SI Vikram</p>
              </button>
              <button
                onClick={() => handleQuickLogin('Investigator')}
                disabled={submittingLogin}
                className="bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 rounded-lg p-2.5 text-left transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300">Investigator</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">CPI Meera</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render normal platform UI once authenticated
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex bg-background">
        <AppSidebar />

        <main
          className={cn(
            'flex-1 transition-all duration-300 flex flex-col',
            sidebarCollapsed ? 'ml-0' : 'ml-64'
          )}
        >
          <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={toggleSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isListening ? 'destructive' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={toggleListening}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isListening ? 'Stop listening' : 'Voice input'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={ttsEnabled ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={ttsEnabled ? stopSpeaking : speakLastResponse}
                  >
                    {ttsEnabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {ttsEnabled ? 'Stop speaking' : 'Read last response'}
                </TooltipContent>
              </Tooltip>

              {mounted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </header>

          <div className="flex-1 p-6 overflow-y-auto">
            <ViewSwitcher />
          </div>

          <footer className="border-t py-3 px-4 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>CRIME IQ v1.0 — Karnataka Police Intelligence Bureau</span>
            <span>AI-Powered Crime Intelligence Platform</span>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  )
}
