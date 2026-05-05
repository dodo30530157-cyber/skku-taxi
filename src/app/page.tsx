'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { Search, PlusCircle, Map as MapIcon, List } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/providers/LanguageProvider'
import { RegisterFlow } from '@/components/RegisterFlow'

function MapLoading() {
  const { t } = useLanguage()
  return <p>{t('main.map.loading')}</p>
}

const KakaoMapViewer = dynamic(() => import('@/components/KakaoMapViewer'), { ssr: false, loading: () => <MapLoading /> });

const QUICK_CHIPS = [
  { id: 'hyehwa', label: '혜화역', icon: '🚉' },
  { id: 'skku', label: '성대정문', icon: '🎓' },
  { id: 'seoul', label: '서울역', icon: '🚆' },
  { id: 'yuljeon', label: '율전캠', icon: '🌉' },
  { id: 'gangnam', label: '강남역', icon: '🏙️' },
  { id: 'sadang', label: '사당역', icon: '🚇' },
  { id: 'suwon', label: '수원역', icon: '🚊' },
]

export default function Home() {
  const { t } = useLanguage()
  const CAMPUS_FILTERS = [t('main.filter.all'), t('main.filter.hyehwa'), t('main.filter.suwon')]
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [campusFilter, setCampusFilter] = useState(CAMPUS_FILTERS[0])
  const [searchQuery, setSearchQuery] = useState('')
  
  // 뷰 모드 및 지도 상태 추가
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedPost, setSelectedPost] = useState<any>(null)

  // 가입 여부 상태 추가
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)

  useEffect(() => {
    // 가입 여부 로컬 스토리지에서 확인
    const registered = localStorage.getItem('isRegistered')
    setIsRegistered(!!registered)

    // 세션 가져오기 및 구독
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session)
        
        // 가입 여부 재확인 (새 기기 로그인 등 대응)
        if (localStorage.getItem('isRegistered') !== 'true') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (profile) {
            localStorage.setItem('isRegistered', 'true')
            localStorage.setItem('userProfile', JSON.stringify({
              id: profile.id,
              nickname: profile.nickname,
              bank_name: profile.bank_name,
              account_number: profile.account_number
            }))
            if (profile.avatar_url) {
              localStorage.setItem('profileImageUrl', profile.avatar_url)
            }
            setIsRegistered(true)
          }
        }
      } else {
        const mock = localStorage.getItem('mockSession')
        if (mock) setSession(JSON.parse(mock))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
      } else {
        const mock = localStorage.getItem('mockSession')
        if (mock) setSession(JSON.parse(mock))
        else setSession(null)
      }
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
      alert(t('main.alert.login_required'))
      router.push('/login')
    }
  }

  const filteredPosts = posts.filter(post => {
    const isAll = campusFilter === t('main.filter.all')
    const matchesCampus = isAll || post.campus === (campusFilter === t('main.filter.hyehwa') ? '인사캠' : '자과캠')
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      post.departure?.toLowerCase().includes(q) ||
      post.destination?.toLowerCase().includes(q) ||
      post.title?.toLowerCase().includes(q)
    return matchesCampus && matchesSearch
  })

  // 성균관대 명륜캠퍼스 중심 좌표
  const mapCenter = { lat: 37.5817849, lng: 126.9975608 }

  // 로컬 스토리지를 확인하기 전엔 깜빡임 방지를 위해 빈 화면 렌더링
  if (isRegistered === null) {
    return null
  }

  // 가입하지 않은 경우 가입 플로우 노출
  if (!isRegistered) {
    return (
      <RegisterFlow 
        onComplete={() => {
          setIsRegistered(true)
          localStorage.setItem('isRegistered', 'true')
        }} 
      />
    )
  }

  // 가입 완료된 경우 기존 메인 화면 렌더링
  return (
    <div className="animate-in fade-in pb-36 mt-2 space-y-4">
      {/* ── 검색 히어로 영역 ── */}
      <div className="space-y-3 relative z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            {t('main.hero.title')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{t('main.hero.subtitle')}</p>
        </div>

        {/* Pill 검색창 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('main.search.placeholder')}
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
      <div className="flex items-center gap-2 relative z-10">
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
            {t('main.count', { count: filteredPosts.length })}
          </span>
        )}
      </div>

      {/* ── 콘텐츠 뷰 (리스트 또는 지도) ── */}
      {viewMode === 'list' ? (
        <div className="space-y-3 relative z-10">
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
                {searchQuery ? t('main.empty.search_title', { query: searchQuery }) : t('main.empty.title')}
              </p>
              <p className="text-sm text-gray-400 mt-1 mb-7">
                {searchQuery ? t('main.empty.search_desc') : t('main.empty.desc')}
              </p>
              <Link href="/create" onClick={handleCreateClick}>
                <button className="px-7 py-3.5 bg-[#006341] text-white font-bold rounded-2xl shadow-md hover:bg-[#006341]/90 transition-all active:scale-95 text-sm">
                  {t('main.btn.create')}
                </button>
              </Link>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      ) : (
        /* ── 지도 뷰 ── */
        <div className="w-full h-[500px] md:h-[calc(100vh-250px)] rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative animate-in fade-in zoom-in-95 duration-200 z-10">
          <KakaoMapViewer 
            filteredPosts={filteredPosts} 
            mapCenter={mapCenter} 
            setSelectedPost={setSelectedPost} 
          />
        </div>
      )}

      {/* ── 플로팅 컨트롤 컨테이너 (토스 스타일 토글 & FAB) ── */}
      <div 
        className={`fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30 transition-opacity duration-300 ${
          selectedPost ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-full max-w-lg px-5 flex justify-between items-end gap-2">
          
          {/* 뷰 토글 */}
          <div className="pointer-events-auto flex bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 relative">
            {/* Sliding Background */}
            <div 
              className={`absolute top-1.5 w-[84px] h-[calc(100%-12px)] bg-gray-900 rounded-full transition-transform duration-300 ease-out shadow-sm ${
                viewMode === 'map' ? 'translate-x-[84px]' : 'translate-x-0'
              }`} 
            />
            
            <button
              onClick={() => { setViewMode('list'); setSelectedPost(null); }}
              className={`relative z-10 flex items-center justify-center gap-1.5 w-[84px] py-2.5 rounded-full text-[13px] font-bold transition-colors duration-200 ${
                viewMode === 'list' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              {t('main.toggle.list')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`relative z-10 flex items-center justify-center gap-1.5 w-[84px] py-2.5 rounded-full text-[13px] font-bold transition-colors duration-200 ${
                viewMode === 'map' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              {t('main.toggle.map')}
            </button>
          </div>

          {/* 기존 FAB 버튼 */}
          <Link href="/create" className="pointer-events-auto" onClick={handleCreateClick}>
            <button className="flex items-center justify-center gap-2 px-5 h-[48px] rounded-full bg-[#006341] text-white font-bold text-[13px] shadow-[0_4px_20px_rgba(0,99,65,0.4)] hover:bg-[#005235] active:scale-95 transition-all">
              <PlusCircle className="w-5 h-5 shrink-0" />
              {t('main.btn.create_fab')}
            </button>
          </Link>
        </div>
      </div>

      {/* ── 바텀 시트 (마커 클릭 시) ── */}
      {viewMode === 'map' && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
              selectedPost ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`} 
            onClick={() => setSelectedPost(null)} 
          />
          {/* BottomSheet Content */}
          <div 
            className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-gray-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 pb-10 ${
              selectedPost ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            {/* Grab Handle */}
            <div className="flex justify-center mb-6 cursor-grab relative z-10 pt-2 pb-4 pointer-events-auto" onClick={() => setSelectedPost(null)}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            {/* Scrollable Content (if needed) */}
            <div className="relative z-20 pointer-events-auto max-h-[80vh] overflow-y-auto scrollbar-hide pb-10">
              {selectedPost && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <PostCard post={selectedPost} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
