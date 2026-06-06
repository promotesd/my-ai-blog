"use client"

import { useState } from "react"
import Image from "next/image"
import {
  X,
  Download,
  Award,
  Clock,
  FileX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Certificate } from "@/types/certificate"

interface PdfViewerProps {
  certificate: Certificate
  onClose: () => void
}

const STATUS_CONFIG = {
  Valid:    { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Valid" },
  Expired:  { bg: "bg-red-100 dark:bg-red-900/40",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500",     label: "Expired" },
  Lifetime: { bg: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500",    label: "Lifetime" },
}

const ID_MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getUTCDate()} ${ID_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function PdfViewer({ certificate, onClose }: PdfViewerProps) {
  const [thumbError, setThumbError] = useState(false)
  const statusCfg = STATUS_CONFIG[certificate.status]

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
          aria-label="Tutup"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-950">
          
          {/* Header Mobile Only (Optional) */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0 z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pratinjau Sertifikat</span>
          </div>

          {/* Preview content using Native Browser PDF Viewer */}
          <div className="flex-1 w-full h-full flex items-center justify-center">
            {certificate.pdf_url ? (
              <iframe 
                src={`${certificate.pdf_url}#view=FitH`} 
                className="w-full h-full border-0"
                title={`Sertifikat ${certificate.title}`}
                loading="lazy"
              />
            ) : certificate.thumbnail_url && !thumbError ? (
              /* Show thumbnail preview if PDF doesn't exist */
              <div className="relative w-full max-w-2xl p-6">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800">
                  <Image
                    src={certificate.thumbnail_url}
                    alt={certificate.title}
                    fill
                    className="object-contain"
                    onError={() => setThumbError(true)}
                  />
                  {/* Notice Badge */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700/50 shadow-md backdrop-blur-sm whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      Hanya Menampilkan Gambar Pratinjau
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Full placeholder when no thumbnail or pdf exists */
              <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <FileX className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">Pratinjau tidak tersedia</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                    File PDF untuk sertifikat ini belum diunggah atau sedang diproses.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Panel (Sidebar) */}
        <div className="w-full md:w-80 flex flex-col shrink-0 bg-white dark:bg-gray-900 overflow-y-auto">
          {/* Certificate info */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            {/* Status badge */}
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-4", statusCfg.bg, statusCfg.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
              {statusCfg.label}
            </span>

            {/* Category badge */}
            <span className="ml-2 inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-full bg-accentColor/10 text-accentColor">
              {certificate.category}
            </span>

            <h2 className="mt-4 font-bold text-xl text-gray-900 dark:text-white leading-snug">
              {certificate.title}
            </h2>

            <div className="mt-3 flex items-center gap-2">
              {certificate.issuer_logo && (
                <img
                  src={certificate.issuer_logo}
                  alt={certificate.issuer_name}
                  className="w-6 h-6 rounded bg-white p-0.5 object-contain border border-gray-100 dark:border-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              )}
              <p className="text-sm font-semibold text-accentColor">{certificate.issuer_name}</p>
            </div>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {certificate.description && (
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold mb-2">Deskripsi</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{certificate.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium">Tanggal Terbit</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatDate(certificate.issue_date)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 font-medium">Berlaku Hingga</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {certificate.expiry_date ? formatDate(certificate.expiry_date) : "Seumur Hidup"}
                </p>
              </div>
            </div>
          </div>

          {/* Download button */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900/50">
            {certificate.pdf_url ? (
              <a
                href={certificate.pdf_url}
                download={`${certificate.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-accentColor text-white font-semibold text-sm hover:bg-accentColor/90 hover:shadow-lg hover:shadow-accentColor/20 active:scale-[0.98] transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Unduh Sertifikat PDF
              </a>
            ) : (
              <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-semibold text-sm cursor-not-allowed select-none border border-gray-200 dark:border-gray-700">
                <Award className="w-4 h-4" />
                File PDF Tidak Tersedia
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
