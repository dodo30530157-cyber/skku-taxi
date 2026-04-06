'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { MapModal } from '@/components/MapModal'

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const router = useRouter()

  const [depAddress, setDepAddress] = useState('')
  const [depLat, setDepLat] = useState<number | null>(null)
  const [depLng, setDepLng] = useState<number | null>(null)
  
  const [destAddress, setDestAddress] = useState('')
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)

  const [departureTime, setDepartureTime] = useState('')
  const [memberCount, setMemberCount] = useState(2)
  const [genderCondition, setGenderCondition] = useState('ANY')
  const [note, setNote] = useState('')

  const [mapTarget, setMapTarget] = useState<'departure' | 'destination' | null>(null)

  useEffect(() => {
    const loadProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('성대인 인증(로그인)이 필요한 서비스입니다.')
        router.replace('/login')
        return
      }

      // DB에서 방장의 계좌 및 프로필 정보 로드
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nickname, bank_name, account_number')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('프로필 데이터 로드 오류:', error)
      } else if (profile) {
        if (profile.bank_name) setBankName(profile.bank_name)
        if (profile.account_number) setAccountNumber(profile.account_number)

        // localStorage 동기화 (handleSubmit 검증 등 다른 곳에서 사용 가능하도록 로컬 최신화)
        localStorage.setItem('userProfile', JSON.stringify({
          nickname: profile.nickname,
          bank_name: profile.bank_name,
          account_number: profile.account_number
        }))
      }
      
      setIsDataLoading(false)
    }

    loadProfileData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const savedProfile = localStorage.getItem('userProfile')
    if (!savedProfile) {
      alert('내 프로필(닉네임 등)을 먼저 설정해 주세요!')
      return
    }
    const { nickname } = JSON.parse(savedProfile)
    if (!nickname) {
      alert('내 프로필에서 닉네임 정보를 입력해 주세요!')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Supabase DB에 insert할 데이터
    const newPost = {
      campus: formData.get('campus') as string,
      title: formData.get('title') as string,
      departure: formData.get('departure') as string,
      destination: formData.get('destination') as string,
      dep_lat: depLat,
      dep_lng: depLng,
      dest_lat: destLat,
      dest_lng: destLng,
      departureTime: formData.get('time') as string,
      maxPeople: memberCount,
      currentPeople: 1, // 방장은 자동으로 참여
      status: '모집중',
      gender_condition: genderCondition,
      note: note || null,
      bank_name: bankName || null,
      account_number: accountNumber.replace(/-/g, '') || null,
      user_id: (await supabase.auth.getSession()).data.session?.user.id || null
    }

    // Supabase posts 테이블에 저장하고 삽입된 결과(id 포함)를 반환받음
    const { data, error } = await supabase.from('posts').insert([newPost]).select()

    setLoading(false)

    if (error) {
      console.error('글쓰기 실패:', error)
      alert(`글을 등록하는데 실패했습니다.\n사유: ${error.message || error.details || '알 수 없는 에러'}`)
      return
    }

    if (data && data.length > 0) {
      // 내 로컨 스토리지에 내가 만든 글 ID 저장 (MVP 방장 식별용)
      const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]')
      myPosts.push(data[0].id)
      localStorage.setItem('myPosts', JSON.stringify(myPosts))

      // 합승 전용 실시간 채팅방으로 즐시 이동
      router.push(`/chat/${data[0].id}`)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300 pb-10 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">합승만들기</h1>
        <p className="text-sm text-gray-500 mt-1">새로운 택시 합승 파티를 모집합니다.</p>
      </div>

      <Card className="border-gray-100 shadow-sm relative overflow-hidden">
        {isDataLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#006341] rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-bold text-gray-700">계좌 및 유저 정보를 로드 중입니다...</p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">게시글 제목</Label>
              <Input name="title" id="title" placeholder="예: 사당역에서 학교 같이 가실 분!" required />
            </div>

            <div className="space-y-3">
              <Label>캠퍼스</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="campus" value="인사캠" className="accent-[#006341] w-4 h-4 cursor-pointer" required />
                  <span className="text-sm font-medium">인사캠(명륜)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="campus" value="자과캠" className="accent-[#006341] w-4 h-4 cursor-pointer" required />
                  <span className="text-sm font-medium">자과캠(율전)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">출발지</Label>
                <div className="flex gap-2">
                  <Input name="departure" id="departure" placeholder="예: 사당역 4번출구" value={depAddress} onChange={e => setDepAddress(e.target.value)} required />
                  <Button type="button" variant="outline" className="px-3 shrink-0 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5" onClick={() => setMapTarget('departure')}>
                    <MapPin className="w-4 h-4 text-[#006341]" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">목적지</Label>
                <div className="flex gap-2">
                  <Input name="destination" id="destination" placeholder="예: 성균관대 자과캠" value={destAddress} onChange={e => setDestAddress(e.target.value)} required />
                  <Button type="button" variant="outline" className="px-3 shrink-0 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5" onClick={() => setMapTarget('destination')}>
                    <MapPin className="w-4 h-4 text-[#006341]" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">출발 시간</Label>
                <Input
                  name="time"
                  id="time"
                  type="datetime-local"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberCount">총 탑승 인원 (본인 포함)</Label>
                <select
                  id="memberCount"
                  value={memberCount}
                  onChange={e => setMemberCount(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341]"
                >
                  <option value={2}>2명</option>
                  <option value={3}>3명</option>
                  <option value={4}>4명</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genderCondition">성별 조건</Label>
              <select
                id="genderCondition"
                value={genderCondition}
                onChange={e => setGenderCondition(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341]"
              >
                <option value="ANY">성별 무관</option>
                <option value="SAME">동성만</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">상세 요청사항 <span className="text-gray-400 font-normal">(선택)</span></Label>
              <textarea
                id="note"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="짐가방 유무, 경유 여부 등 팀원들이 알아야 할 내용을 적어주세요."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341] resize-none transition-colors"
              />
            </div>

            <div className="space-y-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <p className="text-sm font-bold text-[#006341] flex items-center gap-1.5">
                💳 정산 받을 계좌 정보 <span className="text-gray-400 font-normal">(선택)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName" className="text-xs">은행 선택</Label>
                  <select
                    id="bankName"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341]"
                  >
                    <option value="">은행 선택</option>
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                    <option value="국민은행">국민은행</option>
                    <option value="신한은행">신한은행</option>
                    <option value="우리은행">우리은행</option>
                    <option value="하나은행">하나은행</option>
                    <option value="농협은행">농협은행</option>
                    <option value="기업은행">기업은행</option>
                    <option value="케이뱅크">케이뱅크</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-xs">계좌번호</Label>
                  <Input
                    id="accountNumber"
                    type="text"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                    placeholder="숫자만 입력"
                    className="bg-white"
                  />
                </div>
              </div>
              {bankName && accountNumber ? (
                <p className="text-xs text-[#006341] font-medium flex items-center gap-1">
                  ✅ 프로필에서 자동으로 불러온 계좌 정보입니다.
                </p>
              ) : (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  💡 상단 [내 프로필]에서 기본 계좌를 설정하면 다음부터 자동으로 채워집니다.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 rounded-b-xl border-t p-6">
            <div className="flex gap-3 w-full">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                취소
              </Button>
              <Button
                type="submit"
                className="flex-2 h-12 w-full bg-[#006341] hover:bg-[#006341]/90 text-white text-base font-semibold rounded-xl transition-all"
                disabled={loading}
              >
                {loading ? '등록 중...' : '🚕 합승 만들기'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      {mapTarget && (
        <MapModal
          isOpen={true}
          onClose={() => setMapTarget(null)}
          title={mapTarget === 'departure' ? '출발지 선택' : '목적지 선택'}
          onSelect={(addr, lat, lng) => {
            if (mapTarget === 'departure') {
              setDepAddress(addr)
              setDepLat(lat)
              setDepLng(lng)
            } else {
              setDestAddress(addr)
              setDestLat(lat)
              setDestLng(lng)
            }
          }}
        />
      )}
    </div>
  )
}
