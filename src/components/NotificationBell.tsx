'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function NotificationBell({ session }: { session: any }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchNotifications = async () => {
      try {
        // 1. 단순 select('*')로 롤백 (JOIN 에러 방지)
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        if (data && data.length > 0) {
          // 2. sender_id 추출 후 한 번의 추가 쿼리로 닉네임 가져오기 (클라이언트 측 매핑)
          const senderIds = Array.from(new Set(data.map(n => n.sender_id).filter(Boolean)))
          
          if (senderIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, nickname')
              .in('id', senderIds)
            
            // 3. 매핑 객체 생성 및 기존 데이터에 병합
            const profileMap = (profilesData || []).reduce((acc: any, p: any) => {
              acc[p.id] = p.nickname
              return acc
            }, {})

            const mappedData = data.map(n => {
              if (n.sender_id && profileMap[n.sender_id]) {
                return { ...n, sender: { nickname: profileMap[n.sender_id] } }
              }
              return n
            })
            
            setNotifications(mappedData)
          } else {
            setNotifications(data)
          }
        }
      } catch (err) {
        console.error('알림 로드 실패 (무시됨):', err)
        // 에러가 나도 앱 구동에 영향을 주지 않도록 조용히 넘김
      }
    }

    fetchNotifications()

    // 실시간 알림 구독
    const subscription = supabase
      .channel(`notifications_channel_${session.user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [session])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleOpen = async () => {
    setIsOpen(!isOpen)
    if (!isOpen && unreadCount > 0) {
      // 화면상 빨간 점 즉각 제거
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      setNotifications(prev => prev.map(n => ({...n, is_read: true})))

      // DB 상태 업데이트
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)
    }
  }

  if (!session) return null

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-1.5 text-gray-600 hover:text-[#0047FF] transition-colors rounded-full"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 mb-1">
            <h3 className="font-bold text-gray-900 text-[13px]">알림</h3>
          </div>
          <div className="max-h-72 overflow-y-auto flex flex-col gap-1 px-1">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                새로운 알림이 없습니다.
              </div>
            ) : (
              notifications.map((noti) => (
                <div 
                  key={noti.id} 
                  onClick={() => {
                    if (noti.post_id) {
                      window.location.href = `/chat/${noti.post_id}`
                    }
                  }}
                  className={`px-3 py-2.5 rounded-lg transition-colors text-[13px] text-gray-700 leading-tight border ${
                    noti.post_id ? 'cursor-pointer hover:bg-gray-50 border-transparent hover:border-gray-100' : 'border-transparent'
                  }`}
                >
                  {noti.sender?.nickname 
                    ? `${noti.sender.nickname}님이 댓글을 남겼습니다! 💬`
                    : noti.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
