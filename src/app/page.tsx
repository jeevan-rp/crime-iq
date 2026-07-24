'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { Menu, Moon, Sun, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
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
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [isListening, setIsListening] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const mounted = useMounted()

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

              {useMounted() && (
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
