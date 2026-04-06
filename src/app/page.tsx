'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { Search, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const QUICK_CHIPS = [
  { label: '혜화역', icon: '🚉' },
  { label: '성대정문', icon: '🎓' },
  { label: '서울역', icon: '🚆' },
  { label: '율전캠', icon: '🌉' },
  { label: '강남역', icon: '🏙️' },
  { label: '사당역', icon: '🚇' },
  { label: '수원역', icon: '🚊' },
]

const CAMPUS_FILTERS = ['전체', '인사캠', '자과캠']

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [campusFilter, setCampusFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // 세션 가져오기 및 구독
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    const fetchPosts = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false })
      if (error) console.error('Error fetching posts:', error)
      else setPosts(data || [])
      setIsLoading(false)
    }
    fetchPosts()

    return () => subscription.unsubscribe()
  }, [])

  const handleCreateClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault()
      alert('로그인 후 합승을 만들 수 있습니다. 로그인 페이지로 이동합니다.')
      router.push('/login')
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesCampus = campusFilter === '전체' || post.campus === campusFilter
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      post.departure?.toLowerCase().includes(q) ||
      post.destination?.toLowerCase().includes(q) ||
      post.title?.toLowerCase().includes(q)
    return matchesCampus && matchesSearch
  })

  return (
    <div className="animate-in fade-in pb-36 mt-2 space-y-4">

      {/* ── 검색 히어로 영역 ── */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            어디로 가시나요?{' '}
            <span className="inline-block animate-bounce">🚕</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">학우들과 함께 타고 택시비를 절약해요</p>
        </div>

        {/* Pill 검색창 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="출발지 또는 목적지 검색..."
            className="w-full h-13 pl-11 pr-5 rounded-full border border-gray-200 bg-white text-sm shadow-md shadow-gray-100 focus:outline-none focus:border-[#006341] focus:ring-2 focus:ring-[#006341]/15 transition-all placeholder:text-gray-400 font-medium"
            style={{ height: '52px' }}
          />
        </div>

        {/* 퀵 칩 — 가로 스크롤 */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-hide">
          {QUICK_CHIPS.map(chip => {
            const active = searchQuery === chip.label
            return (
              <button
                key={chip.label}
                onClick={() => setSearchQuery(active ? '' : chip.label)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                  active
                    ? 'bg-[#006341] text-white border-[#006341] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#006341]/40 hover:text-[#006341]'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 캠퍼스 필터 & 카운트 ── */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 flex-1">
          {CAMPUS_FILTERS.map(c => (
            <button
              key={c}
              onClick={() => setCampusFilter(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                campusFilter === c
                  ? 'bg-[#006341] text-white border-[#006341] shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {!isLoading && (
          <span className="text-xs text-gray-400 font-medium shrink-0">
            {filteredPosts.length}개
          </span>
        )}
      </div>

      {/* ── 합승 목록 ── */}
      <div className="space-y-3">
        {isLoading ? (
          /* 스켈레톤 */
          [1, 2, 3].map(key => (
            <div key={key} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded-full" />
                  <div className="h-5 w-44 bg-gray-200 rounded" />
                </div>
                <div className="h-6 w-12 bg-gray-100 rounded-full" />
              </div>
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
              <div className="h-2 w-full bg-gray-100 rounded-full" />
              <div className="h-10 w-full bg-gray-100 rounded-xl" />
            </div>
          ))
        ) : filteredPosts.length === 0 ? (
          /* ── 빈 상태 ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-[#006341]/5 rounded-full flex items-center justify-center mb-5">
              <span className="text-5xl">🚕</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {searchQuery ? `"${searchQuery}" 검색 결과가 없어요` : '아직 등록된 합승이 없어요'}
            </p>
            <p className="text-sm text-gray-400 mt-1 mb-7">
              {searchQuery ? '다른 키워드로 검색해 보거나 새 합승을 만들어보세요!' : '첫 번째 방장이 되어보세요!'}
            </p>
            <Link href="/create" onClick={handleCreateClick}>
              <button className="px-7 py-3.5 bg-[#006341] text-white font-bold rounded-2xl shadow-md hover:bg-[#006341]/90 transition-all active:scale-95 text-sm">
                🚀 합승 만들기
              </button>
            </Link>
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* ── FAB: 플로팅 합승 만들기 버튼 ── */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-40">
        <div className="w-full max-w-md px-4 flex justify-end">
          <Link href="/create" className="pointer-events-auto" onClick={handleCreateClick}>
            <button className="flex items-center gap-2.5 px-6 h-14 rounded-full bg-[#006341] text-white font-bold text-base shadow-xl hover:bg-[#005235] active:scale-95 transition-all duration-150">
              <PlusCircle className="w-5 h-5 shrink-0" />
              합승방 만들기
            </button>
          </Link>
        </div>
      </div>

    </div>
  )
}
