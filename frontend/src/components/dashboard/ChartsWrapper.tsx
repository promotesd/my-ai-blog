"use client"

import dynamic from "next/dynamic"

export const VisitorTrendChart = dynamic(
  () => import("@/components/dashboard/DashboardCharts").then(mod => mod.VisitorTrendChart),
  { ssr: false }
)

export const ContentDistributionChart = dynamic(
  () => import("@/components/dashboard/DashboardCharts").then(mod => mod.ContentDistributionChart),
  { ssr: false }
)
