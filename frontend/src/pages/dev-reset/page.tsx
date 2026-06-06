"use client"

import { useEffect, useState } from "react"
import { generateFingerprint } from "@/lib/fingerprint"

type Scope = "banner" | "welcome_popup" | "guestbook" | "gallery" | "all"

type ResetResult = {
  success: boolean
  message?: string
  error?: string
  deleted?: { visitorLogs: number; guestbookEntries: number; galleryGuestEntries: number }
}

const SCOPE_LABELS: Record<Scope, string> = {
  banner: "Banner Dismissed",
  welcome_popup: "Welcome Popup",
  guestbook: "Guestbook Submitted",
  gallery: "Gallery Guest",
  all: "Semua (All)",
}

/**
 * DEV RESET PAGE — /dev-reset
 *
 * Halaman khusus developer untuk mereset visitor records di database.
 * Gunakan ini saat testing agar bisa melihat banner, welcome popup,
 * dan mengisi guestbook ulang tanpa harus ubah kode.
 *
 * Butuh: DEV_RESET_SECRET di .env.local
 */
export default function DevResetPage() {
  const [fingerprint, setFingerprint] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [scope, setScope] = useState<Scope>("all")
  const [includeGuestbook, setIncludeGuestbook] = useState(false)
  const [includeGalleryGuests, setIncludeGalleryGuests] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResetResult | null>(null)

  useEffect(() => {
    generateFingerprint().then(setFingerprint)
  }, [])

  async function handleReset() {
    if (!secret.trim()) {
      setResult({ success: false, error: "Masukkan DEV_RESET_SECRET terlebih dahulu." })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/reset-visitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reset-secret": secret.trim(),
        },
        body: JSON.stringify({
          fingerprint, // Backend kemungkinan besar mengharapkan 'fingerprint' (sesuai POST visitor-check)
          fp: fingerprint, // Fallback jika backend masih pakai 'fp'
          scope,
          includeGuestbook: includeGuestbook && (scope === "guestbook" || scope === "all"),
          includeGalleryGuests: includeGalleryGuests && (scope === "gallery" || scope === "all"),
        }),
      })

      const data = await res.json()
      setResult(data)

      // Clear localStorage flags yang relevan
      if (data.success) {
        if (scope === "guestbook" || scope === "all") {
          localStorage.removeItem("guestbook_submitted")
        }
        if (scope === "gallery" || scope === "all") {
          localStorage.removeItem("gallery_guest_profile")
          // Clear cookie gallery_guest_id
          document.cookie = "gallery_guest_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax"
        }
        if (scope === "all") {
          // Reset semua flags visitor
          localStorage.removeItem("banner_dismissed")
          localStorage.removeItem("welcome_popup_hidden")
        }
      }
    } catch {
      setResult({ success: false, error: "Gagal konek ke server." })
    } finally {
      setLoading(false)
    }
  }

  function copyFingerprint() {
    if (fingerprint) navigator.clipboard.writeText(fingerprint)
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dev Reset Utility</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Reset visitor records di database untuk testing. Tidak menghapus data asli pengguna lain.
          </p>
        </div>

        {/* Fingerprint info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
            Browser Fingerprint Kamu
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm text-emerald-400 flex-1 break-all font-mono bg-zinc-950 px-3 py-2 rounded">
              {fingerprint || "Loading..."}
            </code>
            <button
              onClick={copyFingerprint}
              disabled={!fingerprint}
              className="px-3 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 rounded transition-colors disabled:opacity-40"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Regenerasi otomatis setiap kali halaman dibuka. Sama selama localStorage & cookies tidak dihapus.
          </p>
        </div>

        {/* Secret input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            DEV_RESET_SECRET
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Masukkan nilai DEV_RESET_SECRET dari .env.local"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Scope selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Reset Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(SCOPE_LABELS) as [Scope, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setScope(val)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors text-left ${
                  scope === val
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            {scope === "banner" && "Reset: banner_dismissed"}
            {scope === "welcome_popup" && "Reset: welcome_popup_submitted + welcome_popup_hidden"}
            {scope === "guestbook" && "Reset: guestbook_submitted di visitor_ip_log"}
            {scope === "gallery" && "Reset: gallery_guest_registered di visitor_ip_log"}
            {scope === "all" && "Reset semua action types sekaligus"}
          </p>
        </div>

        {/* Include guestbook toggle */}
        {(scope === "guestbook" || scope === "all") && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGuestbook}
              onChange={(e) => setIncludeGuestbook(e.target.checked)}
              className="mt-0.5 accent-rose-500"
            />
            <span className="text-sm text-zinc-300">
              <span className="text-rose-400 font-medium">Hapus juga entry guestbook</span>
              <span className="block text-xs text-zinc-500 mt-0.5">
                Hati-hati: ini menghapus pesan guestbook yang kamu submit saat testing.
                Jangan aktifkan di production.
              </span>
            </span>
          </label>
        )}

        {/* Include gallery guests toggle */}
        {(scope === "gallery" || scope === "all") && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGalleryGuests}
              onChange={(e) => setIncludeGalleryGuests(e.target.checked)}
              className="mt-0.5 accent-rose-500"
            />
            <span className="text-sm text-zinc-300">
              <span className="text-rose-400 font-medium">Hapus juga profil gallery guest</span>
              <span className="block text-xs text-zinc-500 mt-0.5">
                Hati-hati: ini menghapus profil guest beserta album-albumnya dari gallery.
                Foto tetap ada tapi kehilangan referensi ke profil. Jangan aktifkan di production.
              </span>
            </span>
          </label>
        )}

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={loading || !fingerprint}
          className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
        >
          {loading ? "Mereset..." : "Reset Records"}
        </button>

        {/* Result */}
        {result && (
          <div
            className={`rounded-lg p-4 border text-sm space-y-1 ${
              result.success
                ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                : "bg-rose-950 border-rose-800 text-rose-300"
            }`}
          >
            {result.success ? (
              <>
                <p className="font-medium">{result.message}</p>
                {result.deleted && (
                  <p className="text-xs opacity-75">
                    visitor_ip_log: {result.deleted.visitorLogs} row(s) dihapus
                    {result.deleted.guestbookEntries > 0 &&
                      ` · guestbook: ${result.deleted.guestbookEntries} entry dihapus`}
                    {result.deleted.galleryGuestEntries > 0 &&
                      ` · gallery guest: ${result.deleted.galleryGuestEntries} entry dihapus`}
                  </p>
                )}
                <p className="text-xs opacity-75 mt-2">
                  localStorage flags juga sudah di-clear. Reload halaman untuk melihat efeknya.
                </p>
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}

        {/* Divider & instructions */}
        <hr className="border-zinc-800" />
        <div className="space-y-3 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400 text-sm">Cara pakai via curl / fetch:</p>
          <pre className="bg-zinc-900 rounded-lg p-3 text-emerald-400 overflow-x-auto leading-5">{`# Reset semua (via terminal)
curl -X POST http://localhost:3000/api/admin/reset-visitor \\
  -H "Content-Type: application/json" \\
  -H "x-reset-secret: <DEV_RESET_SECRET>" \\
  -d '{"fingerprint":"<fingerprint>","scope":"all"}'`}</pre>
          <p>
            Halaman ini hanya boleh diakses saat development.
            Tambahkan <code className="text-zinc-300">/dev-reset</code> ke{" "}
            <code className="text-zinc-300">.gitignore</code> atau proteksi dengan middleware
            jika deploy ke production.
          </p>
        </div>
      </div>
    </main>
  )
}
