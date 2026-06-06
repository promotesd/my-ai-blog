"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";
import emailjs from "@emailjs/browser";
import { FaTimes, FaStar, FaPaperPlane, FaEyeSlash } from "react-icons/fa";
import { generateFingerprint } from "@/lib/fingerprint";

/* ─────────────────── Config ─────────────────── */
// Set your EmailJS credentials in .env.local:
//   NEXT_PUBLIC_EMAILJS_SERVICE_ID
//   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
const EMAILJS_SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID  ?? "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY  ?? "YOUR_PUBLIC_KEY";

const LS_KEY = "hideWelcomeForm";

/* ─────────────────── Toast ─────────────────── */
type ToastType = "success" | "error";

function Toast({ message, type, onDone }: { message: string; type: ToastType; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
    const t = setTimeout(() => {
      gsap.to(ref.current, { y: 40, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: onDone });
    }, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      ref={ref}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold pointer-events-none select-none ${
        type === "success" ? "bg-accentColor" : "bg-red-500"
      }`}
    >
      <span>{type === "success" ? "✅" : "❌"}</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────── Star Rating ─────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Rating bintang">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          aria-label={`Beri ${star} bintang`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform duration-150 hover:scale-110 focus:outline-none"
        >
          <FaStar
            size={28}
            className={`transition-colors duration-150 ${
              star <= (hover || value) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export default function WelcomePopup() {
  const [visible, setVisible]   = useState(false);
  const [toast, setToast]       = useState<{ message: string; type: ToastType } | null>(null);
  const [status, setStatus]     = useState<"idle" | "sending" | "sent">("idle");

  const overlayRef       = useRef<HTMLDivElement>(null);
  const modalRef         = useRef<HTMLDivElement>(null);
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef     = useRef(false);
  // Dedicated guard — true only on the very first run of the [pathname] effect.
  // isMountedRef cannot be used for this because the mount effect (runs first)
  // sets it to true synchronously BEFORE the navigation effect checks it.
  const isFirstNavEffect = useRef(true);
  const pathname         = usePathname();
  const router           = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "",
    rating: 0,
    source: "",
    message: "",
  });

  /* ── Show / hide logic ── */
  const animateIn = useCallback(() => {
    if (!overlayRef.current || !modalRef.current) return;
    gsap.set(overlayRef.current, { display: "flex" });
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
    gsap.fromTo(
      modalRef.current,
      { y: 60, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)", delay: 0.05 }
    );
  }, []);

  const animateOut = useCallback((onComplete?: () => void) => {
    if (!overlayRef.current || !modalRef.current) return;
    gsap.to(modalRef.current, { y: 30, opacity: 0, scale: 0.97, duration: 0.3, ease: "power2.in" });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      delay: 0.05,
      onComplete: () => {
        gsap.set(overlayRef.current, { display: "none" });
        setVisible(false);
        onComplete?.();
      },
    });
  }, []);

  /* ── Shared helper: schedule popup ── */
  // initialDelay: 4500ms so hero text animation finishes first.
  // navDelay    : 3000ms on client-side navigation (no hero animation).
  const showWithDelay = useCallback((delay = 3000) => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LS_KEY) === "true") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    // Re-check localStorage inside the callback: initCheck() may have set it
    // after the timer was scheduled but before it fires (async race condition).
    timerRef.current = setTimeout(() => {
      if (localStorage.getItem(LS_KEY) === "true") return;
      setVisible(true);
    }, delay);
  }, []);

  /* ── Initial mount — cek IP dulu, baru jadwalkan popup ── */
  useEffect(() => {
    isMountedRef.current = true;

    // Cek fingerprint server-side: jika sudah pernah submit atau hide →
    // set localStorage dan jangan tampilkan popup (anti-bypass inspect tools).
    const initCheck = async () => {
      try {
        const fp = await generateFingerprint();
        const [r1, r2] = await Promise.all([
          fetch(`/api/visitor-check?type=welcome_popup_submitted&fp=${fp}`),
          fetch(`/api/visitor-check?type=welcome_popup_hidden&fp=${fp}`),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        if (d1.checked || d2.checked) {
          localStorage.setItem(LS_KEY, "true");
          return; // Fingerprint sudah tercatat → jangan tampilkan
        }
      } catch {
        // Gagal cek → tetap lanjut (fail-open), andalkan localStorage
      }
      showWithDelay(4500);
    };

    initCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-trigger on every client-side navigation (3 s) ── */
  useEffect(() => {
    // Skip the very first render (already handled by mount effect above).
    // NOTE: isMountedRef cannot guard this because the mount effect runs
    // before this effect in the same pass and sets it to true synchronously.
    if (isFirstNavEffect.current) {
      isFirstNavEffect.current = false;
      return;
    }
    if (typeof window === "undefined") return;
    if (localStorage.getItem(LS_KEY) === "true") return;

    if (visible) {
      // If currently open, close it first then schedule reopen
      animateOut(() => showWithDelay(3000));
    } else {
      showWithDelay(3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ── Animate in when visible becomes true ── */
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => animateIn());
    }
  }, [visible, animateIn]);

  /* ── Close handlers ── */
  const handleClose = () => animateOut();

  const handleNeverShow = () =>
    animateOut(async () => {
      localStorage.setItem(LS_KEY, "true");
      // Catat fingerprint server-side agar tidak bisa bypass dengan hapus localStorage
      const fp = await generateFingerprint().catch(() => "");
      fetch("/api/visitor-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "welcome_popup_hidden", fingerprint: fp }),
      }).catch(() => {});
    });

  /* ── Backdrop click → plain close ── */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  /* ── Form field helpers ── */
  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rating) {
      setToast({ message: "Pilih rating bintang terlebih dahulu.", type: "error" });
      return;
    }
    setStatus("sending");

    const stars = "⭐".repeat(form.rating) + " " + `(${form.rating}/5)`;
    const templateParams = {
      from_name   : form.name,
      from_email  : form.email,
      phone       : form.phone || "-",
      purpose     : form.purpose,
      rating      : stars,
      source      : form.source || "-",
      message     : form.message,
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setStatus("sent");
      setToast({ message: "Terima kasih! Mengalihkan ke Buku Tamu... 🙏", type: "success" });
      setForm({ name: "", email: "", phone: "", purpose: "", rating: 0, source: "", message: "" });
      localStorage.setItem(LS_KEY, "true");
      // Catat fingerprint server-side agar tidak bisa bypass dengan hapus localStorage
      generateFingerprint().then((fp) => {
        fetch("/api/visitor-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome_popup_submitted", fingerprint: fp }),
        }).catch(() => {});
      }).catch(() => {});
      setTimeout(() => animateOut(() => router.push("/guestbook")), 1800);
    } catch {
      setStatus("idle");
      setToast({ message: "Gagal mengirim, coba lagi.", type: "error" });
    }
  };

  /* ── Input + select shared classes ── */
  const inputCls =
    "w-full bg-gray-50 dark:bg-[#1c2426] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-accentColor focus:ring-1 focus:ring-accentColor transition-all duration-200";
  // Extra classes for <select> so native <option> elements also get a solid bg in dark mode
  const selectExtraCls = "[&>option]:bg-white [&>option]:text-gray-800 dark:[&>option]:bg-[#1c2426] dark:[&>option]:text-white";

  /* ── Render ── */
  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onMouseDown={handleBackdropClick}
        className="fixed inset-0 z-[200] hidden items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#161D1F] border border-gray-100 dark:border-white/10 shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Coloured top bar ── */}
          <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-accentColor via-emerald-400 to-accentColor bg-[length:200%_100%] animate-[gradient_3s_linear_infinite]" />

          {/* ── Header ── */}
          <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold dark:text-white text-gray-900 leading-snug">
                Hei, Saya AGUNG, Selamat Datang! 👋
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Terima kasih sudah mengunjungi website saya! Saya ingin mendengar pengalaman dan pesan dari Anda.{" "}
                <span className="text-accentColor font-medium">Tidak ada yang dipublikasikan.</span>
              </p>
            </div>
            {/* ── Quick-action buttons — visible di atas sebelum form ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium transition-all duration-200 whitespace-nowrap"
              >
                <FaTimes size={10} />
                Tutup
              </button>
              <button
                type="button"
                onClick={handleNeverShow}
                className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg border border-red-200 dark:border-red-500/20 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium transition-all duration-200 whitespace-nowrap"
              >
                <FaEyeSlash size={10} />
                Jangan Tampilkan Lagi
              </button>
            </div>
          </div>

          {/* ── Form body ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nama Lengkap <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                No. WhatsApp / HP{" "}
                <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">(opsional)</span>
              </label>
              <input
                type="tel"
                placeholder="+62 812 3456 7890"
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            {/* Purpose dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Keperluan / Tujuan <span className="text-red-400">*</span>
              </label>
              <select
                required
                className={`${inputCls} ${selectExtraCls} cursor-pointer`}
                value={form.purpose}
                onChange={(e) => set("purpose", e.target.value)}
              >
                <option value="" disabled>Pilih keperluan Anda...</option>
                <option value="Sekadar Mampir &amp; Memberi Feedback">Sekadar Mampir &amp; Memberi Feedback</option>
                <option value="Project Collaboration">Project Collaboration</option>
                <option value="Freelance / Hire Me">Freelance / Hire Me</option>
                <option value="General Question">General Question</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Star rating */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rating Pengalaman Website <span className="text-red-400">*</span>
              </label>
              <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
              {form.rating > 0 && (
                <p className="text-xs text-accentColor font-medium">
                  {["", "Perlu banyak perbaikan 😅", "Cukup, tapi bisa lebih baik 🤔", "Lumayan bagus! 😊", "Bagus sekali! 😄", "Luar biasa! ⭐🔥"][form.rating]}
                </p>
              )}
            </div>

            {/* Source dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Dari mana tahu website ini?{" "}
                <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">(opsional)</span>
              </label>
              <select
                className={`${inputCls} ${selectExtraCls} cursor-pointer`}
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              >
                <option value="">Pilih sumber...</option>
                <option value="Google Search">Google Search</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Referral / Teman">Referral / Teman</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Pesan / Kesan &amp; Saran <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tuliskan pesan, kesan, atau saran Anda di sini..."
                className={`${inputCls} resize-none`}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
              />
            </div>

            {/* ── Action buttons ── */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={status === "sending" || status === "sent"}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-accentColor text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accentColor/25"
              >
                {status === "sending" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : status === "sent" ? (
                  "✅ Terkirim!"
                ) : (
                  <>
                    <FaPaperPlane size={13} />
                    Kirim Pesan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {/* CSS for gradient animation via tailwind arbitrary */}
      <style>{`
        @keyframes gradient {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
}
