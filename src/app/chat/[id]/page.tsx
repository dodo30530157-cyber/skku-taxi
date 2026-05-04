'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/lib/store'
import { ArrowLeft, Send, Users, MapPin, Clock, Copy, Check, User } from 'lucide-react'

interface Message {
  id: string
  post_id: string
  nickname: string
  content: string
  created_at: string
}

interface Post {
  id: string
  title: string
  departure: string
  destination: string
  departureTime: string
  maxPeople: number
  currentPeople: number
  status: string
  note?: string
  bank_name?: string
  account_number?: string
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const profileImageUrl = useUserStore((state) => state.profileImageUrl)

  const [post, setPost] = useState<Post | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [nickname, setNickname] = useState('익명')
  const [showWelcome, setShowWelcome] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 초기 세팅
  useEffect(() => {
    const profile = localStorage.getItem('userProfile')
    if (profile) {
      const parsed = JSON.parse(profile)
      if (parsed.nickname) setNickname(parsed.nickname)
    }
    const timer = setTimeout(() => setShowWelcome(false), 4000)
    return () => clearTimeout(timer)
  }, [])

  // 게시글 정보 로드
  useEffect(() => {
    if (!postId) return
    supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
      .then(({ data }) => {
        if (data) setPost(data)
      })
  }, [postId])

  // 기존 댓글 로드
  useEffect(() => {
    if (!postId) return
    supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[])
      })
  }, [postId])

  // 실시간 구독
  useEffect(() => {
    if (!postId) return
    const channel = supabase
      .channel(`chat-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [postId])

  // 스크롤 하단 유지
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    await supabase.from('comments').insert([{
      post_id: postId,
      nickname,
      content: input.trim(),
    }])
    setInput('')
    setSending(false)
  }

  const handleCopyAccount = async () => {
    if (!post?.account_number) return
    try {
      await navigator.clipboard.writeText(post.account_number)
      setCopied(true)
      setCopyMsg('계좌번호가 복사되었습니다! 은행 앱을 열어 송금해 주세요.')
      setTimeout(() => { setCopied(false); setCopyMsg('') }, 3000)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = post.account_number
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setCopyMsg('계좌번호가 복사되었습니다! 은행 앱을 열어 송금해 주세요.')
      setTimeout(() => { setCopied(false); setCopyMsg('') }, 3000)
    }
  }

  const handleKakaoT = () => {
    window.location.href = 'kakaot://'
    setTimeout(() => {
      // 앱이 실행되지 않아 현재 창에 남아있을 경우 Fallback
      window.open('https://t.kakao.com/', '_blank')
    }, 1500)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const hasAccount = post?.bank_name && post?.account_number

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 text-base truncate">{post?.title || '채팅방'}</h1>
          {post && (
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.departure} → {post.destination}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {post.currentPeople}/{post.maxPeople}명
              </span>
            </div>
          )}
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
          post?.status === '모집중'
            ? 'bg-[#006341]/10 text-[#006341]'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {post?.status || '모집중'}
        </span>
      </div>

      {/* 출발 시간 띠 */}
      {post?.departureTime && (
        <div className="bg-[#006341]/5 border-b border-[#006341]/10 px-4 py-2 flex items-center gap-2 shrink-0">
          <Clock className="w-3.5 h-3.5 text-[#006341]" />
          <span className="text-xs text-[#006341] font-medium">
            출발 시간: {new Date(post.departureTime).toLocaleString('ko-KR', {
              month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
      )}

      {/* 계좌 정산 배너 */}
      {hasAccount && (
        <div className="shrink-0 mx-4 mt-3 bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#006341]/5 px-4 py-2 border-b border-emerald-100">
            <p className="text-xs font-bold text-[#006341]">💳 방장에게 송금하기</p>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{post.bank_name}</p>
              <p className="text-lg font-bold text-gray-900 tracking-wider">{post.account_number}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleCopyAccount}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#006341] text-white hover:bg-[#006341]/90 active:scale-95'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </button>
              <button
                onClick={() => window.open('toss://', '_blank')}
                className="flex items-center justify-center px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all"
              >
                토스열기
              </button>
            </div>
          </div>
          {copyMsg && (
            <div className="px-4 pb-3">
              <p className="text-xs text-emerald-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                ✅ {copyMsg}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 카카오T 딥링크 버튼 */}
      <div className="shrink-0 mx-4 mt-3">
        <button
          onClick={handleKakaoT}
          className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-[#FEE500] text-[#000000] font-bold text-sm shadow-[0_2px_10px_rgba(254,229,0,0.3)] hover:bg-[#FDD800] active:scale-95 transition-all"
        >
          <span className="text-base">🚕</span> 카카오T로 택시 부르기
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* 환영 메시지 */}
        {showWelcome && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-[#006341] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg text-center max-w-xs">
              🎉 합승이 시작되었습니다!<br />
              <span className="text-white/80 font-normal text-xs">팀원들과 인사를 나눠보세요</span>
            </div>
          </div>
        )}

        {/* note(상세 요청사항) */}
        {post?.note && (
          <div className="flex justify-center">
            <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs px-4 py-2.5 rounded-xl max-w-xs text-center leading-relaxed">
              📌 방장 요청사항: {post.note}
            </div>
          </div>
        )}

        {/* 메시지 없을 때 */}
        {messages.length === 0 && !showWelcome && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm font-medium">아직 메시지가 없습니다</p>
            <p className="text-xs mt-1">첫 번째로 인사를 건네보세요!</p>
          </div>
        )}

        {/* 채팅 메시지 목록 */}
        {messages.map((msg) => {
          const isMine = msg.nickname === nickname
          return (
            <div key={msg.id} className={`flex w-full items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {/* 상대방 아바타 (왼쪽) */}
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold shrink-0 self-end">
                  {msg.nickname.charAt(0)}
                </div>
              )}

              {/* 말풍선 영역 */}
              <div className={`flex flex-col gap-1 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-xs text-gray-500 px-1">{msg.nickname}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-[#00A651] text-white rounded-br-sm'
                    : 'bg-[#F2F4F6] text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
              </div>

              {/* 내 아바타 (오른쪽) */}
              {isMine && (
                profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="나"
                    className="w-8 h-8 rounded-full object-cover shrink-0 self-end shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#00A651] flex items-center justify-center shrink-0 self-end">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="메시지를 입력하세요..."
          className="flex-1 h-10 px-4 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341] transition-colors bg-gray-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-[#006341] flex items-center justify-center text-white shrink-0 disabled:opacity-40 hover:bg-[#006341]/90 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
