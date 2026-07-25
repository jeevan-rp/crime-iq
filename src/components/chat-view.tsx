'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const quickActions = [
  'Show crime trends',
  'High risk areas',
  'Recent burglaries',
  'Network analysis',
]

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function handleSend(text?: string) {
    const message = text || input.trim()
    if (!message || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: message }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'No response received.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, an intelligence feed error occurred.' }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* View Header */}
      <div className="flex items-center gap-3 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/10">
          <Bot className="h-5.5 w-5.5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Intelligence Assistant</h2>
          <p className="text-xs text-slate-400 mt-0.5">Powered by Karnataka Police Intelligence Bureau AI</p>
        </div>
      </div>

      {/* Main Glass Chat Panel */}
      <Card className="flex-1 flex flex-col overflow-hidden glass-panel border-white/5 bg-[#0D0F14]/75 rounded-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center max-w-sm">
                <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-7 w-7 text-cyan-400/60" />
                </div>
                <p className="font-bold text-sm text-slate-300">Ask me anything about crime data</p>
                <p className="text-[11px] mt-1.5 leading-relaxed">
                  I can analyze FIR registries, extract regional crime hotspots, query criminal networks, and generate prediction charts.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`chat-message flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-blue-600/10 border-blue-500/25 text-slate-100 shadow-lg shadow-blue-500/5'
                    : 'bg-[#08090B]/60 border-white/5 text-slate-200'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-cyan-400 font-medium">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="font-semibold">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="chat-message flex justify-start">
              <div className="bg-[#08090B]/60 border border-white/5 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 p-4 bg-[#08090B]/25">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="text-[10px] uppercase font-bold tracking-widest px-3.5 py-2 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  {action}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query intelligence indices, FIR datasets..."
              className="min-h-[44px] max-h-32 resize-none bg-slate-950 border-white/5 text-white placeholder-slate-700 focus:border-cyan-500 rounded-xl custom-scrollbar py-3"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-[44px] w-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/10 cursor-pointer"
              size="icon"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
