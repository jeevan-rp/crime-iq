'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

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
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }])
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
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center gap-3 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">AI Crime Intelligence Assistant</h2>
          <p className="text-xs text-muted-foreground">Powered by Karnataka Police Intelligence Bureau</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="text-center">
                <Bot className="h-12 w-12 mx-auto mb-3 text-orange-500/40" />
                <p className="font-medium">Ask me anything about crime data</p>
                <p className="text-xs mt-1">I can help with FIRs, trends, predictions, and more.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-message flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-orange-600">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-message flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="typing-dot h-2 w-2 rounded-full bg-orange-500 inline-block" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-orange-500 inline-block" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-orange-500 inline-block" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="text-xs px-3 py-1.5 rounded-full border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about crime data, trends, FIRs..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="shrink-0 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
