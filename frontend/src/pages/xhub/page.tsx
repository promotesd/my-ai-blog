"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Terminal, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/services/apiClient"

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setToast(null)

    startTransition(async () => {
      try {
        const data = await apiRequest<{ token: string }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: username.trim(), password }),
        })

        localStorage.setItem("portfolio-admin-token", data.token)
        setToast({ type: 'success', message: "登录成功，正在进入后台..." })
        setTimeout(() => {
          router.push("/dashboard")
          router.refresh()
        }, 1000)
      } catch (error) {
        setToast({ type: 'error', message: error instanceof Error ? error.message : "登录失败，请稍后重试" })
      }
    })
  }

  return (
    <div className="dark min-h-screen bg-[#070e0e] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(157 87% 41% / 0.06) 0%, transparent 70%)",
        }}
      />
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(157 87% 41%) 1px, transparent 1px), linear-gradient(90deg, hsl(157 87% 41%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300",
          toast.type === 'error' 
            ? "bg-red-500/10 border-red-500/20 text-red-400" 
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        )}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[380px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="relative mb-5">
            {/* Glow behind icon */}
            <div className="absolute inset-0 rounded-2xl bg-accentColor/20 blur-xl scale-150" />
            <div className="relative w-14 h-14 rounded-2xl bg-[#0d1a1a] border border-accentColor/30 flex items-center justify-center shadow-[0_0_24px_hsl(157_87%_41%/0.18)]">
              <Terminal size={22} className="text-accentColor" />
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            小嘟嘟后台
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 text-center leading-relaxed">
            输入后台账号和密码后继续
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1a1a] border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-accentColor/40 to-transparent" />

          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  账号
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  disabled={isPending}
                  className="
                    w-full bg-white/[0.03] border border-white/[0.08] rounded-xl
                    px-4 py-3 text-sm text-white placeholder-gray-600
                    outline-none
                    focus:border-accentColor/50 focus:bg-white/[0.05]
                    focus:ring-2 focus:ring-accentColor/10
                    hover:border-white/[0.14] hover:bg-white/[0.04]
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  placeholder="请输入后台账号"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={isPending}
                    className="
                      w-full bg-white/[0.03] border border-white/[0.08] rounded-xl
                      px-4 py-3 pr-12 text-sm text-white placeholder-gray-600
                      outline-none
                      focus:border-accentColor/50 focus:bg-white/[0.05]
                      focus:ring-2 focus:ring-accentColor/10
                      hover:border-white/[0.14] hover:bg-white/[0.04]
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-all duration-150"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || !username || !password}
                className="
                  w-full bg-accentColor text-[#070e0e] font-semibold text-sm
                  py-3 rounded-xl mt-1
                  flex items-center justify-center gap-2
                  hover:brightness-110 active:scale-[0.98] active:brightness-95
                  transition-all duration-150
                  disabled:opacity-40 disabled:cursor-not-allowed
                  disabled:hover:brightness-100 disabled:active:scale-100
                  shadow-[0_4px_20px_hsl(157_87%_41%/0.25)]
                  disabled:shadow-none
                "
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>正在登录...</span>
                  </>
                ) : (
                  "登录"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-700 text-[11px] mt-5 tracking-wide">
          仅限站点管理员访问
        </p>
      </div>
    </div>
  )
}
