"use client"

import { useState } from "react"
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useResumeStatus } from "@/hooks/useResumeStatus"
import { uploadResume } from "@/services/resumeApi"

export default function DashboardResumePage() {
  const { status, loading, refresh } = useResumeStatus()
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleFile(file?: File) {
    if (!file) return
    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "请上传 PDF 简历文件。" })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      await uploadResume(file)
      await refresh()
      setMessage({ type: "success", text: "简历上传成功，前台下载按钮已经可用。" })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "上传失败" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071111] text-gray-100 p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-accentColor mb-2">简历管理</p>
          <h1 className="text-2xl font-semibold text-white">简历上传</h1>
          <p className="text-sm text-gray-400 mt-2">
            只有后台登录后可以上传。访客只能在前台下载，不能修改简历。
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accentColor/15 text-accentColor flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {loading ? "检查简历状态中..." : status.uploaded ? "当前已有简历" : "当前暂未上传简历"}
              </p>
              {status.uploaded && (
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accentColor hover:underline"
                >
                  打开当前简历
                </a>
              )}
            </div>
          </div>

          <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-8 text-center hover:border-accentColor/60 transition-colors">
            {uploading ? (
              <Loader2 size={28} className="animate-spin text-accentColor" />
            ) : (
              <Upload size={28} className="text-accentColor" />
            )}
            <span className="mt-3 text-sm font-medium text-white">
              {uploading ? "上传中..." : "点击选择 PDF 简历"}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              上传后会覆盖旧简历，文件名固定为 resume.pdf
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.currentTarget.value = ""
              }}
            />
          </label>

          {message && (
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              message.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/25 bg-red-500/10 text-red-300"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
