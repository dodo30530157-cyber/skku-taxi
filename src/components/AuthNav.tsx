'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ProfileModal } from '@/components/ProfileModal'
import { NotificationBell } from '@/components/NotificationBell'
import { LogOut, LogIn, PlusCircle, UserCircle2 } from 'lucide-react'

export function AuthNav() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault()
      alert('성대인 인증(로그인)이 필요한 서비스입니다.')
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) return <div className="w-20 h-8" />

  return (
    <div className="flex items-center gap-1">
      {/* 알림 벨 — 로그인 시만 */}
      {session && <NotificationBell session={session} />}

      {/* 프로필 아이콘 버튼 — ProfileModal 트리거 */}
      <div className="relative flex items-center">
        <ProfileModal />
      </div>

      {/* 로그인/로그아웃 */}
      {session ? (
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-50 transition-all"
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href="/login"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#006341] hover:bg-[#006341]/10 transition-all"
          title="로그인"
        >
          <LogIn className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
