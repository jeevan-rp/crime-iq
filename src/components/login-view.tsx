'use client'

import { useState } from 'react'
import { Shield, Lock, Mail, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface LoginViewProps {
  onLoginSuccess: (user: any) => void
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submittingLogin, setSubmittingLogin] = useState(false)

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
        onLoginSuccess(data.user)
        toast.success(`Access decrypted. Welcome, ${data.user.name}`)
      } else {
        toast.error(data?.error || 'Authentication key rejected')
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

  return (
    <div className="min-h-screen w-full bg-[#08090B] relative overflow-hidden flex items-center justify-center p-4 cyber-grid noise-overlay">
      {/* Glow Effects */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#0D0F14]/75 border border-white/5 rounded-[24px] backdrop-blur-xl p-8 shadow-2xl relative z-10 glass-panel-glow"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="h-16 w-16 rounded-[20px] bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            CRIME IQ 
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-cyan-400 border border-cyan-500/30 tracking-widest">
              SECURE
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider text-center">
            Karnataka State Police Intelligence Bureau
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">Bureau Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kp.gov.in"
                className="w-full bg-[#08090B]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pl-1">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#08090B]/60 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={submittingLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            {submittingLogin ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Decrypt & Enter'}
          </Button>
        </form>

        {/* Quick Evaluation Logins */}
        <div className="border-t border-white/5 pt-5">
          <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-cyan-400" /> Bureau Quick Access
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('Admin')}
              disabled={submittingLogin}
              className="bg-[#08090B]/40 hover:bg-white/5 border border-white/5 hover:border-red-500/30 rounded-xl p-3 text-left transition-all cursor-pointer group"
            >
              <p className="text-[11px] font-black text-red-400 group-hover:text-red-300">DSP / Admin</p>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">DSP Raghavendra</p>
            </button>
            <button
              onClick={() => handleQuickLogin('Officer')}
              disabled={submittingLogin}
              className="bg-[#08090B]/40 hover:bg-white/5 border border-white/5 hover:border-blue-500/30 rounded-xl p-3 text-left transition-all cursor-pointer group"
            >
              <p className="text-[11px] font-black text-blue-400 group-hover:text-blue-300">Inspector</p>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">Inspector Kavitha</p>
            </button>
            <button
              onClick={() => handleQuickLogin('Analyst')}
              disabled={submittingLogin}
              className="bg-[#08090B]/40 hover:bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl p-3 text-left transition-all cursor-pointer group"
            >
              <p className="text-[11px] font-black text-purple-400 group-hover:text-purple-300">SI / Analyst</p>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">SI Vikram</p>
            </button>
            <button
              onClick={() => handleQuickLogin('Investigator')}
              disabled={submittingLogin}
              className="bg-[#08090B]/40 hover:bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-xl p-3 text-left transition-all cursor-pointer group"
            >
              <p className="text-[11px] font-black text-emerald-400 group-hover:text-emerald-300">Investigator</p>
              <p className="text-[9px] text-slate-500 truncate mt-0.5">CPI Meera</p>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
