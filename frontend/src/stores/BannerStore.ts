import { create } from "zustand"
import { safeGetStorageItem, safeSetStorageItem } from "@/lib/safeStorage"

export const BANNER_HEIGHT = 40 // px

interface BannerState {
  visible: boolean
  initialized: boolean
  init: () => void
  dismiss: () => void
}

export const useBannerStore = create<BannerState>((set) => ({
  visible: false,
  initialized: false,

  /**
   * Init: cek localStorage dulu (cepat), lalu cek IP server-side.
   * Jika IP sudah tercatat → sync localStorage dan sembunyikan banner.
   * Ini mencegah bypass dengan menghapus localStorage via DevTools.
   */
  init: async () => {
    if (typeof window === "undefined") return

    // 1. Cek localStorage
    const dismissed = safeGetStorageItem("guestbook_banner_dismissed") === "true"
    const submitted  = safeGetStorageItem("guestbook_submitted") === "true"

    if (dismissed || submitted) {
      set({ visible: false, initialized: true })
      return
    }

    // 2. Cek fingerprint server-side (anti-bypass inspect tools)
    // Fingerprint unik per perangkat/browser — tidak terpengaruh shared IP
    try {
      const { generateFingerprint } = await import("@/lib/fingerprint")
      const fp = await generateFingerprint()

      const [resBanner, resGuestbook] = await Promise.all([
        fetch(`/api/visitor-check?type=banner_dismissed&fp=${fp}`),
        fetch(`/api/visitor-check?type=guestbook_submitted&fp=${fp}`),
      ])
      const [dBanner, dGuestbook] = await Promise.all([
        resBanner.json(),
        resGuestbook.json(),
      ])
      if (dBanner.checked) {
        safeSetStorageItem("guestbook_banner_dismissed", "true")
        set({ visible: false, initialized: true })
        return
      }
      if (dGuestbook.checked) {
        // Tamu sudah mengisi buku tamu → sembunyikan banner
        safeSetStorageItem("guestbook_submitted", "true")
        set({ visible: false, initialized: true })
        return
      }
    } catch {
      // Gagal cek fingerprint → fail-open, tampilkan banner
    }

    set({ visible: true, initialized: true })
  },

  dismiss: () => {
    if (typeof window !== "undefined") {
      safeSetStorageItem("guestbook_banner_dismissed", "true")
    }
    // Catat fingerprint server-side agar tidak bisa bypass dengan hapus localStorage
    import("@/lib/fingerprint")
      .then(({ generateFingerprint }) => generateFingerprint())
      .then((fp) =>
        fetch("/api/visitor-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "banner_dismissed", fingerprint: fp }),
        })
      )
      .catch(() => {})
    set({ visible: false })
  },
}))
