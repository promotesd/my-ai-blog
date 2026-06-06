"use client"

import React, { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { TrendingUp, Users, PieChart as PieChartIcon } from 'lucide-react'

interface VisitorData {
  date: string
  count: number
}

interface ContentData {
  name: string
  count: number
  color: string
}

interface DashboardChartsProps {
  visitorData: VisitorData[]
  contentData: ContentData[]
}

export function VisitorTrendChart({ data }: { data: VisitorData[] }) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      // Return mock data if empty
      return Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        count: Math.floor(Math.random() * 50) + 10
      }))
    }
    return data
  }, [data])

  return (
    <div className="bg-[#0d1a1a] border border-white/[0.06] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accentColor/10 flex items-center justify-center border border-accentColor/20">
            <Users className="text-accentColor" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Visitor Trends</h3>
            <p className="text-xs text-gray-500">Activity for the last 7 days</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-500">
          <TrendingUp size={10} />
          <span>+12.5%</span>
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6B7280' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6B7280' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#070e0e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#22C55E' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#22C55E" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ContentDistributionChart({ data }: { data: ContentData[] }) {
  return (
    <div className="bg-[#0d1a1a] border border-white/[0.06] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <PieChartIcon className="text-blue-500" size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Content Overview</h3>
          <p className="text-xs text-gray-500">Distribution by type</p>
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: -10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              contentStyle={{ 
                backgroundColor: '#070e0e', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
