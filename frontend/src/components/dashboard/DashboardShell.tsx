"use client"

import { Navigate } from "react-router-dom"
import { SidebarProvider, useSidebar } from "./SidebarContext"
import DashboardSidebar from "./DashboardSidebar"
import DashboardChineseBoundary from "./DashboardChineseBoundary"

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar()
  return (
    <div className="dark flex h-screen bg-[#070e0e] text-gray-100">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <DashboardSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 overflow-y-auto min-w-0 scrollbar-none">
          <DashboardChineseBoundary>{children}</DashboardChineseBoundary>
        </main>
      </div>
    </div>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  if (!localStorage.getItem("portfolio-admin-token")) {
    return <Navigate to="/xhub" replace />
  }
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  )
}
