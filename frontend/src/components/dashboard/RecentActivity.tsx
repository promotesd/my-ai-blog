import React from 'react'
import { MessageSquare, Calendar, ChevronRight, User } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  name: string
  message: string
  created_at: string
  type: 'guestbook' | 'gallery'
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-[#070e0e] border border-white/[0.06] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <MessageSquare className="text-purple-500" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Interactions</h3>
            <p className="text-xs text-gray-500">Latest guestbook messages</p>
          </div>
        </div>
        <Link 
          href="/dashboard/guestbook" 
          className="text-[11px] font-medium text-accentColor hover:underline flex items-center gap-1"
        >
          View All <ChevronRight size={10} />
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
              <MessageSquare className="text-gray-600" size={20} />
            </div>
            <p className="text-xs text-gray-500">No recent activity found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div 
              key={activity.id} 
              className="group p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center shrink-0">
                  <User className="text-gray-400 group-hover:text-accentColor transition-colors" size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{activity.name}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 shrink-0">
                      <Calendar size={10} />
                      <span>{new Date(activity.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                    "{activity.message}"
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
