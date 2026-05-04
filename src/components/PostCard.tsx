'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Clock, Users, ArrowRight, MessageCircle, Navigation, MessageSquare, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MiniMap } from '@/components/MiniMap'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/providers/LanguageProvider'
import { useUserStore } from '@/lib/store'

interface PostProps {
  id: string
  title: string
  departure: string
  destination: string
  departureTime: string
  maxPeople: number
  currentPeople: number
  status: string
  isJoined?: boolean
  toss_id?: string
  user_id?: string
  dep_lat?: number
  dep_lng?: number
  gender_condition?: string // 'ANY' | 'SAME'
  campus?: string
}

export function PostCard({ post }: { post: PostProps }) {
  const { t } = useLanguage()
  const profileImageUrl = useUserStore((state) => state.profileImageUrl)
  const myNickname = useUserStore((state) => state.nickname)
  const [isJoined, setIsJoined] = useState(post.isJoined || false)
  const [currentPeople, setCurrentPeople] = useState(post.currentPeople)
  const [status, setStatus] = useState(post.status)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthor, setIsAuthor] = useState(false)
  const router = useRouter()
  
  // 댓글 관련 상태
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [nicknameInput, setNicknameInput] = useState('')
  const [isCommentLoading, setIsCommentLoading] = useState(false)

  // 닉네임 자동 로드
  useEffect(() => {
    const saved = localStorage.getItem('userProfile')
    if (saved) {
      const { nickname } = JSON.parse(saved)
      if (nickname) setNicknameInput(nickname)
    }
  }, [])

  // 댓글 데이터 실시간 로드
  useEffect(() => {
    if (!isChatOpen) return

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      if (data) setComments(data)
    }

    fetchComments()

    // 실시간 구독
    const subscription = supabase
      .channel(`comments_channel_${post.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, (payload) => {
        setComments((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isChatOpen, post.id])

  const handleCommentSubmit = async () => {
    if (!nicknameInput.trim() || !commentInput.trim()) return

    setIsCommentLoading(true)
    const { error } = await supabase.from('comments').insert([
      {
        post_id: post.id,
        nickname: nicknameInput.trim(),
        content: commentInput.trim()
      }
    ])
    setIsCommentLoading(false)

    if (error) {
      alert('댓글 게시에 실패했습니다.')
      console.error(error)
    } else {
      setCommentInput('')

      // 알림 생성 (댓글 작성자가 방장이 아닐 때 방장에게 알림)
      if (post.user_id && !isAuthor) {
        await supabase.from('notifications').insert([
          {
            user_id: post.user_id,
            message: '새 댓글이 달렸습니다! 💬',
            is_read: false
          }
        ])
      }
    }
  }

  // 방장 여부 확인 (MVP 로컬 스토리지 기반)
  useEffect(() => {
    const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]')
    if (myPosts.includes(post.id)) {
      setIsAuthor(true)
      setIsJoined(true) // 방장은 기본으로 참여된 상태
    }
  }, [post.id])

  const isFull = currentPeople >= post.maxPeople || status === '완료' || status === '모집완료'
  const isEarlyDeparted = status === '모집완료' && currentPeople < post.maxPeople

  const handleJoin = async () => {
    if (isFull) return

    setIsLoading(true)

    const newCurrentPeople = currentPeople + 1

    // Supabase DB 업데이트
    const { error } = await supabase
      .from('posts')
      .update({ currentPeople: newCurrentPeople })
      .eq('id', post.id)

    setIsLoading(false)

    if (error) {
      console.error('참여 실패:', error)
      alert(`참여하기에 실패했습니다.\n사유: ${error.message || '알 수 없는 오류'}`)
      return
    }

    // 성공 시 로컬 상태 업데이트
    setCurrentPeople(newCurrentPeople)
    setIsJoined(true)

    // 알림 생성 (작성자에게)
    if (post.user_id) {
      await supabase.from('notifications').insert([
        {
          user_id: post.user_id,
          message: '누군가 합승에 참여했습니다! 🚕',
          is_read: false
        }
      ])
    }

    // 내부 실시간 채팅방 화면으로 이동
    router.push(`/chat/${post.id}`)
  }

  const handleEarlyDeparture = async () => {
    if (currentPeople < 2) return

    if (!confirm('정말로 지금 출발(모집 마감) 하시겠습니까?')) return

    setIsLoading(true)

    // 즉시 모집완료로 상태 업데이트
    const { error } = await supabase
      .from('posts')
      .update({ status: '모집완료' })
      .eq('id', post.id)

    setIsLoading(false)

    if (error) {
      console.error('마감 실패:', error)
      alert('모집 마감에 실패했습니다.')
      return
    }

    setStatus('모집완료')
  }

  const handleKakaoT = () => {
    // 모바일 기기인지 간단히 체크
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      // 카카오 T 딥링크 실행
      window.location.href = 'kakaot://'
    } else {
      alert('모바일 기기에서 탭하여 카카오 T 앱을 실행해 주세요!')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? '오후' : '오전'
    hours = hours % 12
    hours = hours ? hours : 12 // 0시는 12시로 표시
    const hoursStr = hours < 10 ? `0${hours}` : hours.toString()
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString()
    return `${month}월 ${day}일 ${ampm} ${hoursStr}:${minutesStr}`
  }

  // 급구 여부: 시간이 2시간 이내이면 급구 배지
  const isUrgent = (() => {
    if (!post.departureTime) return false
    const diff = new Date(post.departureTime).getTime() - Date.now()
    return diff > 0 && diff < 2 * 60 * 60 * 1000
  })()

  return (
    <div className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* 헤더 영역 */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isAuthor && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">내 글</span>}
              {isUrgent && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold shrink-0 animate-pulse">⚡ 급구</span>}
              {post.gender_condition === 'SAME' && <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold shrink-0">동성만</span>}
              {post.campus && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium shrink-0">{post.campus}</span>}
            </div>
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{post.title}</h3>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
            status === '모집중' && !isFull ? 'bg-[#006341]/10 text-[#006341]' : 'bg-gray-100 text-gray-500'
          }`}>
            {isFull ? '마감' : status}
          </span>
        </div>

        {/* 출발 → 도착 */}
        <div className="flex items-center gap-2 text-sm mb-2">
          <MapPin className="w-4 h-4 text-[#006341] shrink-0" />
          <span className="font-semibold text-gray-900 truncate">{post.departure}</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          <span className="font-semibold text-gray-900 truncate">{post.destination}</span>
        </div>

        {/* 시간 */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span>{formatDate(post.departureTime)} {t('post.time.prefix')}</span>
        </div>
        
        {/* 미니맵 */}
        {post.dep_lat && post.dep_lng && (
          <MiniMap lat={post.dep_lat} lng={post.dep_lng} />
        )}

        {/* 인원 프로그레스 바 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-gray-800">{currentPeople}명</span> / {post.maxPeople}명 모집 중
            </span>
            <span className={`font-semibold text-xs ${
              currentPeople >= post.maxPeople ? 'text-red-500' :
              currentPeople >= post.maxPeople * 0.75 ? 'text-orange-500' : 'text-[#006341]'
            }`}>
              {currentPeople >= post.maxPeople ? '마감' : `${post.maxPeople - currentPeople}자리 남음`}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isEarlyDeparted ? 'bg-orange-400' :
                currentPeople >= post.maxPeople ? 'bg-red-400' : 'bg-[#006341]'
              }`}
              style={{ width: `${Math.min((currentPeople / post.maxPeople) * 100, 100)}%` }}
            />
          </div>
        </div>

        {!isAuthor && isFull && (
          <div className="bg-blue-50 text-blue-700 p-2.5 rounded-xl text-xs font-medium border border-blue-100 text-center">
            모집이 마감되었습니다. 방장이 택시를 호출합니다! 🚕
          </div>
        )}
      </div>
      {/* 액션 버튼 영역 */}
      <div className="px-5 pb-4 pt-1 flex flex-col gap-2">
        {isAuthor ? (
          <div className="w-full">
            {status === '모집중' && !isFull ? (
              <Button
                variant="outline"
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 font-semibold rounded-xl"
                onClick={handleEarlyDeparture}
                disabled={currentPeople < 2 || isLoading}
              >
                {currentPeople < 2 ? '2명 이상 모여야 조기 출발 가능' : '🏃‍♂️ 지금 바로 출발하기'}
              </Button>
            ) : (
              <Button
                className="w-full bg-[#181919] hover:bg-[#181919]/90 text-white font-semibold flex items-center justify-center gap-2 rounded-xl"
                onClick={handleKakaoT}
              >
                <Navigation className="w-4 h-4" />
                🚕 카카오 T로 택시 부르기
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            {isJoined ? (
              <>
                <Button
                  variant="outline"
                  className="w-full bg-[#006341]/10 hover:bg-[#006341]/20 text-[#006341] border-none font-semibold flex items-center justify-center gap-2 rounded-xl"
                  onClick={() => router.push(`/chat/${post.id}`)}
                >
                  <MessageSquare className="w-4 h-4" />
                  채팅방 입장
                </Button>
                {isFull && post.toss_id && (
                  <Button
                    className="w-full bg-[#3182F6] hover:bg-[#1C6CD9] text-white font-semibold flex items-center justify-center gap-2 border-none rounded-xl"
                    onClick={() => window.open(`https://toss.me/${post.toss_id}`, '_blank')}
                  >
                    💸 토스로 정산하기
                  </Button>
                )}
              </>
            ) : (
              <Button
                className={`w-full font-semibold rounded-xl ${
                  isFull ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed' : 'bg-[#006341] hover:bg-[#006341]/90 text-white'
                }`}
                onClick={handleJoin}
                disabled={isFull || isLoading}
              >
                {isLoading ? '처리 중...' : isFull ? '모집이 마감되었습니다' : '합승 참여하기'}
              </Button>
            )}
          </div>
        )}

        {/* 소통하기 버튼 */}
        <div className="border-t border-gray-50 pt-2 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="text-gray-400 hover:text-gray-600 h-8 text-xs font-medium w-full flex gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {isChatOpen ? '소통창 닫기' : '💬 소통하기'}
          </Button>
        </div>
      </div>

      {/* 댓글 창 */}
      {isChatOpen && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 rounded-b-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[240px] overflow-y-auto flex flex-col gap-2.5 pr-1">
            {comments.map((c, i) => {
              const isMe = !!myNickname && c.nickname === myNickname
              return (
                <div key={i} className={`flex w-full items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* 상대방 아바타 */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0 self-end">
                      {c.nickname?.charAt(0)}
                    </div>
                  )}

                  {/* 말풍선 */}
                  <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-[10px] text-gray-500 ml-1 mb-0.5">{c.nickname}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-[13px] leading-snug break-all ${
                      isMe
                        ? 'bg-[#00A651] text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {c.content}
                    </div>
                  </div>

                  {/* 내 아바타 */}
                  {isMe && (
                    profileImageUrl ? (
                      <img src={profileImageUrl} alt="나" className="w-7 h-7 rounded-full object-cover shrink-0 self-end" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#00A651] flex items-center justify-center shrink-0 self-end">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )
                  )}
                </div>
              )
            })}
            {comments.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-6">첫 댓글을 남겨보세요!</div>
            )}
          </div>
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200/60">
            <Input
              placeholder="닉네임"
              className="w-16 sm:w-20 text-xs h-9 bg-white px-2"
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
            />
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="내용을 입력..."
                className="flex-1 text-xs h-9 bg-white px-2"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) handleCommentSubmit()
                }}
              />
              <Button
                className="h-9 px-3 bg-[#006341] hover:bg-[#006341]/90 text-white text-xs shrink-0"
                onClick={handleCommentSubmit}
                disabled={isCommentLoading || !nicknameInput.trim() || !commentInput.trim()}
              >
                전송
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
