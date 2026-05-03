'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin, ChevronLeft, LocateFixed, Search } from 'lucide-react'
import { Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import { AnimatePresence, motion } from 'framer-motion'
import { MapModal } from '@/components/MapModal'

export default function CreatePostPage() {
  const router = useRouter()
  
  // 카카오맵 로더
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || 'c7b0bd0edadfdfca171bba47039ba9a7',
    libraries: ['services'],
  })

  // === 공통 상태 ===
  const [step, setStep] = useState(1) // 1: 지도(위치 설정), 2: 상세 옵션(폼)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // === 위치(Step 1) 상태 ===
  const [mapCenter, setMapCenter] = useState({ lat: 37.5882, lng: 126.9936 }) // 기본: 인사캠
  const [isMapDragging, setIsMapDragging] = useState(false)
  const mapRef = useRef<kakao.maps.Map>(null)

  const [depAddress, setDepAddress] = useState('위치를 찾는 중...')
  const [depLandmark, setDepLandmark] = useState('')
  const [depLat, setDepLat] = useState<number | null>(null)
  const [depLng, setDepLng] = useState<number | null>(null)
  const [isDepModalOpen, setIsDepModalOpen] = useState(false)

  const [destAddress, setDestAddress] = useState('')
  const [destLandmark, setDestLandmark] = useState('')
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)
  const [isDestModalOpen, setIsDestModalOpen] = useState(false)

  // === 폼(Step 2) 상태 ===
  const [campus, setCampus] = useState('인사캠')
  const [title, setTitle] = useState('')
  
  const [departureDate, setDepartureDate] = useState<Date | null>(null)
  const [selectedTimeOffset, setSelectedTimeOffset] = useState<number | null>(null)
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false)
  
  const [memberCount, setMemberCount] = useState(2)
  const [genderCondition, setGenderCondition] = useState('ANY')
  const [note, setNote] = useState('')
  const [isNoteFocused, setIsNoteFocused] = useState(false)

  // 계좌 정보
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [useMyAccount, setUseMyAccount] = useState(true)
  const [isEditingAccount, setIsEditingAccount] = useState(false)

  // 1. 초기 로드 (GPS & Profile)
  useEffect(() => {
    const init = async () => {
      // 위치 추적
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            setMapCenter(coord)
            updateAddressFromCoords(coord.lat, coord.lng, 'departure')
          },
          () => {
            updateAddressFromCoords(mapCenter.lat, mapCenter.lng, 'departure')
          }
        )
      } else {
        updateAddressFromCoords(mapCenter.lat, mapCenter.lng, 'departure')
      }

      // 프로필 로드
      const { data: { session } } = await supabase.auth.getSession()
      let currentUser = session?.user
      if (!currentUser) {
        const mock = localStorage.getItem('mockSession')
        if (mock) {
          currentUser = JSON.parse(mock).user
        } else {
          alert('성대인 인증(로그인)이 필요한 서비스입니다.')
          router.replace('/login')
          return
        }
      }

      if (currentUser?.id === 'mock-user-1234') {
        const saved = localStorage.getItem('userProfile')
        if (saved) {
          const profile = JSON.parse(saved)
          if (profile.bank_name) setBankName(profile.bank_name)
          if (profile.account_number) setAccountNumber(profile.account_number)
        }
      } else if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, bank_name, account_number')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          if (profile.bank_name) setBankName(profile.bank_name)
          if (profile.account_number) setAccountNumber(profile.account_number)
          localStorage.setItem('userProfile', JSON.stringify(profile))
        }
      }
      setIsDataLoading(false)
    }

    init()
  }, [])

  // -----------------------------------------------------
  // 대학교 내부 정밀 랜드마크 추출 로직
  // -----------------------------------------------------
  const fetchPreciseLandmark = async (lat: number, lng: number, baseAddress: string): Promise<{ landmark: string, detailAddress: string } | null> => {
    if (!window.kakao?.maps?.services) return null
    const ps = new window.kakao.maps.services.Places()

    // 1. 캠퍼스 및 주변 건물 정밀 검색 (반경 60m 이내)
    const getCampusBuilding = (): Promise<any[]> => {
      return new Promise((resolve) => {
        ps.keywordSearch('대학교', (places: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            resolve(places)
          } else {
            resolve([])
          }
        }, {
          location: new window.kakao.maps.LatLng(lat, lng),
          radius: 60, // 60m 이내로 확 줄여서 현재 건물만 타겟팅
          sort: window.kakao.maps.services.SortBy.DISTANCE
        })
      })
    }

    // 2. 지하철역, 카페 등 다른 주요 카테고리
    const getCategoryLandmark = (code: string): Promise<any[]> => {
      return new Promise((resolve) => {
        ps.categorySearch(code, (places: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            resolve(places)
          } else {
            resolve([])
          }
        }, {
          location: new window.kakao.maps.LatLng(lat, lng),
          radius: 100,
          sort: window.kakao.maps.services.SortBy.DISTANCE
        })
      })
    }

    try {
      const uniPlaces = await getCampusBuilding()
      if (uniPlaces.length > 0) {
        const buildingSuffixes = ['관', '동', '홀', '센터']
        
        for (const place of uniPlaces) {
          // 단순 대학교 이름 쳐내기 (예: "성균관대학교", "성균관대 인문사회과학캠퍼스")
          if (place.place_name.endsWith('대학교') || place.place_name.endsWith('캠퍼스') || place.place_name === '성균관대') {
            continue
          }

          const words = place.place_name.split(' ')
          const lastWord = words[words.length - 1]

          // '관', '동', '홀', '센터'로 끝나거나 '정문' 같은 명칭인지 확인
          const isBuilding = buildingSuffixes.some(k => lastWord.endsWith(k)) || lastWord.includes('정문') || lastWord.includes('후문')
          
          if (isBuilding) {
            // "성균관대학교 인문사회과학캠퍼스 경영관" -> "경영관" / "성균관대학교 인문사회과학캠퍼스 (서울 종로구 ...)"
            const uniName = words.slice(0, -1).join(' ') || '성균관대학교'
            return {
              landmark: lastWord,
              detailAddress: `${uniName} (${baseAddress})`
            }
          }
        }
      }

      // 캠퍼스 건물을 못 찾았을 경우 다른 우선순위 탐색
      const categories = ['SW8', 'CT1', 'PO3', 'CE7', 'CS2'] // 지하철, 문화시설, 공공기관, 카페, 편의점
      for (const code of categories) {
        const places = await getCategoryLandmark(code)
        if (places.length > 0) {
          return {
            landmark: places[0].place_name, // 예: 혜화역 4번출구, 스타벅스 대학로점
            detailAddress: baseAddress
          }
        }
      }

      return null
    } catch (e) {
      return null
    }
  }

  // Geocoder: 좌표 -> 주소 및 랜드마크 추출
  const updateAddressFromCoords = (lat: number, lng: number, type: 'departure' | 'destination') => {
    if (type === 'departure') {
      setDepLat(lat)
      setDepLng(lng)
      setDepLandmark('주소를 분석 중입니다...')
      setDepAddress('')
    }
    
    if (!window.kakao?.maps?.services) return

    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.coord2Address(lng, lat, async (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const road = result[0].road_address
        const addr = result[0].address
        const fullAddress = road ? road.address_name : addr.address_name

        // 정밀 랜드마크 스캔
        const preciseResult = await fetchPreciseLandmark(lat, lng, fullAddress)
        
        let finalLandmark = ''
        let finalDetailAddress = fullAddress

        if (preciseResult) {
          finalLandmark = preciseResult.landmark
          finalDetailAddress = preciseResult.detailAddress
        } else {
          // API에서 정밀 추출 실패 시: 카카오 지오코더의 건물명 사용
          if (road && road.building_name) {
            // 캠퍼스 등 포괄적 명칭 필터링
            if (!road.building_name.endsWith('캠퍼스') && !road.building_name.endsWith('대학교') && road.building_name !== '성균관대') {
              finalLandmark = road.building_name
            }
          }
          
          if (!finalLandmark) {
            // 끝까지 없으면 도로명이나 동 이름 사용
            finalLandmark = road?.road_name ? `${road.road_name} 주변` : (addr.region_3depth_name || '어딘가')
            finalDetailAddress = fullAddress
          }
        }

        if (type === 'departure') {
          setDepLandmark(finalLandmark)
          setDepAddress(finalDetailAddress)
        } else {
          setDestLandmark(finalLandmark)
          setDestAddress(finalDetailAddress)
        }
      } else {
        if (type === 'departure') {
          setDepAddress('상세 주소 없음')
          setDepLandmark('현위치 (알 수 없음)')
        } else {
          setDestLandmark('목적지')
          setDestAddress('상세 주소 없음')
        }
      }
    })
  }

  // 출발지/목적지가 변경될 때마다 자동 제목 갱신
  useEffect(() => {
    if ((depLandmark || depAddress) && (destLandmark || destAddress)) {
      // 제목이 너무 길어지는 것을 방지 (어딘가 주변 -> 어딘가)
      const cleanLandmark = (text: string) => text.replace(' 주변', '').split(' ')[0]
      
      const finalDep = cleanLandmark(depLandmark) || depAddress.split(' ').slice(-1)[0]
      const finalDest = cleanLandmark(destLandmark) || destAddress.split(' ').slice(-1)[0]
      if (finalDep && finalDest) {
        setTitle(`${finalDep} -> ${finalDest} 합승하실 분`)
      }
    }
  }, [depLandmark, depAddress, destLandmark, destAddress])

  const handleDragEnd = (map: kakao.maps.Map) => {
    setIsMapDragging(false)
    const latlng = map.getCenter()
    updateAddressFromCoords(latlng.getLat(), latlng.getLng(), 'departure')
  }

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMapCenter(coord)
        if (mapRef.current) mapRef.current.panTo(new window.kakao.maps.LatLng(coord.lat, coord.lng))
        updateAddressFromCoords(coord.lat, coord.lng, 'departure')
      })
    }
  }

  const setQuickDestination = (name: string, lat: number, lng: number) => {
    // 퀵 칩스는 수동으로 랜드마크 세팅
    setDestAddress('서울특별시 종로구 성균관로 25-2') 
    setDestLandmark(name)
    setDestLat(lat)
    setDestLng(lng)
  }

  // 시간 포맷
  const handleTimeOffset = (minutes: number) => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + minutes)
    setDepartureDate(now)
    setSelectedTimeOffset(minutes)
  }

  const formatDisplayTime = (date: Date | null, offset: number | null) => {
    if (!date) return '시간을 선택해주세요'
    const h = date.getHours().toString().padStart(2, '0')
    const m = date.getMinutes().toString().padStart(2, '0')
    if (offset === 0) return `${h}:${m} (지금 바로)`
    if (offset) return `${h}:${m} (${offset}분 뒤)`
    return `${h}:${m} (직접 선택)`
  }

  // 최종 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!departureDate) {
      alert('출발 시간을 선택해주세요!')
      return
    }

    const savedProfile = localStorage.getItem('userProfile')
    if (!savedProfile) {
      alert('내 프로필을 먼저 설정해 주세요!')
      return
    }

    setIsSubmitting(true)

    const finalBankName = useMyAccount ? bankName : ''
    const finalAccountNumber = useMyAccount ? accountNumber : ''

    const newPost = {
      campus,
      title,
      departure: depAddress,
      destination: destAddress,
      dep_lat: depLat,
      dep_lng: depLng,
      dest_lat: destLat,
      dest_lng: destLng,
      departureTime: departureDate.toISOString(),
      maxPeople: memberCount,
      currentPeople: 1,
      status: '모집중',
      gender_condition: genderCondition,
      note: note || null,
      bank_name: finalBankName || null,
      account_number: finalAccountNumber.replace(/-/g, '') || null,
      user_id: 'mock-user-1234'
    }

    const dummyId = Math.floor(Math.random() * 100000).toString()
    setIsSubmitting(false)
    
    const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]')
    myPosts.push(dummyId)
    localStorage.setItem('myPosts', JSON.stringify(myPosts))

    router.push(`/chat/${dummyId}`)
  }

  const hasAccount = !!(bankName && accountNumber)

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-white">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-[#00A651] rounded-full animate-spin mb-3" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white relative">
      
      {/* =======================
          Step 1: 카카오 T 지도 UI
          ======================= */}
      <AnimatePresence>
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute inset-0 flex flex-col z-10"
          >
            {/* 상단 헤더 */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center p-4 bg-gradient-to-b from-white/80 to-transparent pt-safe pointer-events-none">
              <button 
                onClick={() => router.back()} 
                className="p-2 -ml-2 rounded-full bg-white/90 shadow-sm backdrop-blur pointer-events-auto transition-transform active:scale-95"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
            </div>

            {/* 지도 영역 (60% 높이) */}
            <div className="relative flex-1 bg-gray-100 overflow-hidden">
              {!loading && !error && (
                <Map
                  center={mapCenter}
                  style={{ width: '100%', height: '100%' }}
                  level={2} // 확대를 약간 더 좁혀서(레벨2) 세밀하게
                  onDragStart={() => setIsMapDragging(true)}
                  onDragEnd={handleDragEnd}
                  ref={mapRef}
                />
              )}
              
              {/* 중앙 마커 (고정) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none pb-2">
                <motion.div animate={{ y: isMapDragging ? -15 : 0 }} transition={{ type: 'spring', stiffness: 300 }} className="relative flex flex-col items-center">
                  <div className="bg-gray-900 text-white text-[13px] font-bold px-3.5 py-1.5 rounded-full shadow-lg mb-1 whitespace-nowrap tracking-wide">
                    출발
                  </div>
                  <MapPin className="w-9 h-9 text-gray-900 drop-shadow-md" fill="currentColor" />
                </motion.div>
              </div>

              {/* 현위치 버튼 */}
              <button 
                onClick={handleLocateMe}
                className="absolute bottom-6 right-4 z-10 w-12 h-12 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
              >
                <LocateFixed className="w-5 h-5" />
              </button>
            </div>

            {/* 하단 바텀 시트 주소 카드 */}
            <div className="relative z-20 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe mt-[-20px] px-6 pt-6 pb-6 flex flex-col gap-4">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
              
              <div className="space-y-3 mt-3">
                {/* 출발지 입력창 (이중 주소 표기 지원) */}
                <div className="relative">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-900" />
                  <div className="absolute top-[80%] left-[1.125rem] w-0.5 h-[1.8rem] bg-gray-200" />
                  <button 
                    onClick={() => setIsDepModalOpen(true)}
                    className="w-full h-auto min-h-[4rem] py-3 pl-10 pr-12 rounded-2xl text-left transition-all border-none focus:outline-none flex flex-col justify-center bg-[#F2F4F6] active:bg-gray-200"
                  >
                    <span className="font-bold text-[16px] text-gray-900 line-clamp-1 w-full">
                      {depLandmark || '위치를 찾는 중...'}
                    </span>
                    {depAddress && (
                      <span className="text-[13px] font-medium text-gray-500 line-clamp-1 w-full mt-0.5">
                        {depAddress}
                      </span>
                    )}
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                </div>

                {/* 목적지 입력창 */}
                <div className="relative">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 w-2 h-2 rounded-full bg-[#00A651]" />
                  <button 
                    onClick={() => setIsDestModalOpen(true)}
                    className={`w-full h-auto min-h-[4rem] py-3 pl-10 pr-12 rounded-2xl text-left transition-all border-none focus:outline-none flex flex-col justify-center active:bg-gray-200 ${
                      destLandmark ? 'bg-[#F2F4F6]' : 'bg-[#F2F4F6]'
                    }`}
                  >
                    <span className={`font-bold text-[16px] line-clamp-1 w-full ${destLandmark ? 'text-gray-900' : 'text-gray-400'}`}>
                      {destLandmark || '어디로 갈까요?'}
                    </span>
                    {destAddress && (
                      <span className="text-[13px] font-medium text-gray-500 line-clamp-1 w-full mt-0.5">
                        {destAddress}
                      </span>
                    )}
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                </div>
              </div>

              {/* 퀵 칩스 */}
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-6 px-6 pt-1">
                <button onClick={() => setQuickDestination('인사캠(명륜)', 37.5882, 126.9936)} className="shrink-0 px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-[14px] hover:bg-gray-100 transition-colors shadow-sm">🎓 인사캠</button>
                <button onClick={() => setQuickDestination('자과캠(율전)', 37.2939, 126.9749)} className="shrink-0 px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-[14px] hover:bg-gray-100 transition-colors shadow-sm">🔬 자과캠</button>
                <button onClick={() => setQuickDestination('사당역', 37.4765, 126.9816)} className="shrink-0 px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-bold text-[14px] hover:bg-gray-100 transition-colors shadow-sm">🚇 사당역</button>
              </div>

              <button
                onClick={() => {
                  if (!destLandmark) alert('목적지를 설정해주세요.')
                  else setStep(2)
                }}
                disabled={!destLandmark}
                className="w-full h-16 bg-[#00A651] text-white font-bold text-[18px] rounded-2xl mt-1 shadow-[0_8px_30px_rgba(0,166,81,0.25)] hover:bg-[#008f46] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
              >
                다음
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================
          Step 2: 상세 옵션 폼
          ======================= */}
      <AnimatePresence>
        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="absolute inset-0 bg-white flex flex-col z-20"
          >
            <div className="flex items-center px-4 py-4 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-50 pt-safe">
              <button type="button" onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <h1 className="text-[17px] font-bold text-gray-900 ml-2">상세 옵션 설정</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-32 pt-6">
              <form id="createForm" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 요약된 경로 확인 (이중 주소 표기) */}
                <div className="flex items-stretch gap-4 bg-[#F2F4F6] p-5 rounded-2xl border-none">
                  <div className="flex flex-col items-center justify-between py-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    <div className="w-0.5 h-12 bg-gray-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00A651]" />
                  </div>
                  <div className="flex flex-col justify-between flex-1 gap-4">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[16px] font-bold text-gray-900 truncate">{depLandmark}</p>
                      <p className="text-[13px] font-medium text-gray-500 truncate">{depAddress}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[16px] font-bold text-[#00A651] truncate">{destLandmark}</p>
                      <p className="text-[13px] font-medium text-gray-500 truncate">{destAddress}</p>
                    </div>
                  </div>
                </div>

                {/* 캠퍼스 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">캠퍼스</label>
                  <div className="flex bg-[#F2F4F6] p-1.5 rounded-2xl">
                    <button type="button" onClick={() => setCampus('인사캠')} className={`flex-1 h-12 rounded-xl text-[15px] font-bold transition-all duration-200 ${campus === '인사캠' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>인사캠(명륜)</button>
                    <button type="button" onClick={() => setCampus('자과캠')} className={`flex-1 h-12 rounded-xl text-[15px] font-bold transition-all duration-200 ${campus === '자과캠' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>자과캠(율전)</button>
                  </div>
                </div>

                {/* 제목 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">게시글 제목 <span className="font-normal opacity-60">(자동 완성)</span></label>
                  <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]" />
                </div>

                {/* 시간 및 인원 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-500 ml-1">출발 시간</label>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5 md:mx-0 md:px-0">
                      {[ { label: '지금 바로', value: 0 }, { label: '10분 뒤', value: 10 }, { label: '20분 뒤', value: 20 }, { label: '30분 뒤', value: 30 } ].map(chip => (
                        <button key={chip.value} type="button" onClick={() => handleTimeOffset(chip.value)} className={`shrink-0 px-4 h-10 rounded-full text-[14px] font-bold transition-all duration-200 ${selectedTimeOffset === chip.value ? 'bg-[#00A651] text-white shadow-md shadow-[#00A651]/20' : 'bg-[#F2F4F6] text-gray-600 hover:bg-gray-200'}`}>
                          {chip.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setIsTimeSheetOpen(true)} className="w-full h-14 px-5 rounded-2xl bg-[#F2F4F6] text-left hover:bg-gray-200 active:scale-[0.98] transition-all">
                      <span className={`text-[16px] ${!departureDate ? 'text-gray-400 font-medium' : 'text-gray-900 font-bold'}`}>
                        {formatDisplayTime(departureDate, selectedTimeOffset)}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-500 ml-1">탑승 인원</label>
                    <select value={memberCount} onChange={e => setMemberCount(Number(e.target.value))} className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]">
                      <option value={2}>2명 (본인 포함)</option>
                      <option value={3}>3명 (본인 포함)</option>
                      <option value={4}>4명 (본인 포함)</option>
                    </select>
                  </div>
                </div>

                {/* 성별 조건 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">성별 조건</label>
                  <select value={genderCondition} onChange={e => setGenderCondition(e.target.value)} className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 appearance-none focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]">
                    <option value="ANY">누구나 (성별 무관)</option>
                    <option value="SAME">동성만 탑승</option>
                  </select>
                </div>

                {/* 상세 요청사항 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">상세 요청사항 <span className="font-normal opacity-60">(선택)</span></label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={isNoteFocused || note ? 3 : 1} onFocus={() => setIsNoteFocused(true)} onBlur={() => setIsNoteFocused(false)} placeholder="짐 여부 등 남기고 싶은 말" className="w-full py-4 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] resize-none transition-all duration-300 text-[16px]" />
                </div>

                {/* 정산 계좌 */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">정산 계좌 <span className="font-normal opacity-60">(선택)</span></label>
                  {hasAccount && !isEditingAccount ? (
                    <div className="bg-[#F2F4F6] rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={useMyAccount} onChange={e => setUseMyAccount(e.target.checked)} className="w-5 h-5 accent-[#00A651] rounded cursor-pointer" />
                          <span className="text-gray-900 font-bold text-[16px]">내 계좌로 정산받기</span>
                        </label>
                        {useMyAccount && <p className="text-gray-500 text-sm mt-1 ml-8 font-medium">{bankName} {accountNumber.substring(0, 4)}***</p>}
                      </div>
                      <button type="button" onClick={() => setIsEditingAccount(true)} className="text-[13px] font-bold text-gray-500 bg-white shadow-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">수정</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <select value={bankName} onChange={e => setBankName(e.target.value)} className="h-14 px-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]">
                        <option value="">은행 선택</option>
                        {['토스뱅크', '카카오뱅크', '국민은행', '신한은행', '우리은행', '하나은행', '농협은행'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <input type="text" inputMode="numeric" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))} placeholder="계좌번호" className="h-14 px-4 rounded-xl bg-white border border-gray-200 text-gray-900 font-medium focus:outline-none focus:border-[#00A651] focus:ring-1 focus:ring-[#00A651]" />
                    </div>
                  )}
                </div>

              </form>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent z-30 pb-safe pointer-events-none">
              <button
                form="createForm"
                type="submit"
                className="w-full h-16 rounded-2xl bg-[#00A651] text-white font-bold text-[18px] shadow-[0_8px_30px_rgba(0,166,81,0.25)] hover:bg-[#008f46] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 pointer-events-auto"
                disabled={isSubmitting || !departureDate}
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '합승 만들기'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================
          목적지/출발지 검색 모달
          ======================= */}
      {isDepModalOpen && (
        <MapModal
          isOpen={isDepModalOpen}
          onClose={() => setIsDepModalOpen(false)}
          title="출발지 검색"
          onSelect={(addr, lat, lng) => {
            setMapCenter({ lat, lng })
            if (mapRef.current) mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng))
            updateAddressFromCoords(lat, lng, 'departure')
            setIsDepModalOpen(false)
          }}
        />
      )}

      {isDestModalOpen && (
        <MapModal
          isOpen={isDestModalOpen}
          onClose={() => setIsDestModalOpen(false)}
          title="목적지 검색"
          onSelect={(addr, lat, lng) => {
            setDestAddress(addr)
            updateAddressFromCoords(lat, lng, 'destination')
            setIsDestModalOpen(false)
          }}
        />
      )}

      {/* =======================
          바텀 시트: 커스텀 타임 피커
          ======================= */}
      <AnimatePresence>
        {isTimeSheetOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTimeSheetOpen(false)} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
              <div className="flex justify-center mb-6"><div className="w-12 h-1.5 bg-gray-200 rounded-full" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">직접 시간 입력</h3>
              <div className="px-2 pb-6">
                <input
                  type="time"
                  defaultValue={departureDate ? `${departureDate.getHours().toString().padStart(2,'0')}:${departureDate.getMinutes().toString().padStart(2,'0')}` : ''}
                  onChange={(e) => {
                    if(!e.target.value) return;
                    const [h, m] = e.target.value.split(':')
                    const d = new Date()
                    d.setHours(parseInt(h), parseInt(m), 0, 0)
                    setDepartureDate(d)
                    setSelectedTimeOffset(null)
                  }}
                  className="w-full h-16 bg-[#F2F4F6] rounded-2xl px-5 font-bold text-2xl text-center focus:outline-none focus:ring-2 focus:ring-[#00A651]/50 appearance-none"
                />
              </div>
              <button type="button" onClick={() => setIsTimeSheetOpen(false)} className="w-full h-16 bg-[#00A651] text-white font-bold text-[18px] rounded-2xl active:scale-95 transition-transform shadow-lg shadow-[#00A651]/20 mt-2">
                확인
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
