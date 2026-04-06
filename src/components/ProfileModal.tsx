'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

export function ProfileModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const initModal = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)

      if (currentSession && isOpen) {
        setIsFetching(true)
        // 모달 열릴 때마다 Supabase에서 최신 데이터 패치
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nickname, bank_name, account_number')
          .eq('id', currentSession.user.id)
          .single()

        if (error) {
          console.error('[ProfileModal] 데이터 페칭 에러:', error)
        } else if (profile) {
          setNickname(profile.nickname || '')
          setBankName(profile.bank_name || '')
          setAccountNumber(profile.account_number || '')
        }
        setIsFetching(false)
      } else if (!currentSession) {
        // 비로그인 상태일 땐 로컬(오래된 캐시) 방어 코드
        setNickname('')
        setBankName('')
        setAccountNumber('')
      }
    }

    initModal()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [isOpen]) // 모달 열릴 때마다 최신값 로드

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    setLoading(true)

    if (!session) {
      alert('로그인이 만료되었습니다.')
      setLoading(false)
      return
    }

    const profileData = {
      id: session.user.id, // 반드시 auth.user.id를 사용
      nickname: nickname.trim(),
      bank_name: bankName.trim() || null,
      account_number: accountNumber.replace(/-/g, '').trim() || null,
    }

    // Supabase profiles 테이블에 upsert
    const { error } = await supabase.from('profiles').upsert([profileData])
    if (error) {
      console.error('[ProfileModal] 프로필 저장 및 업서트 오류:', error)
      alert(`저장에 실패했습니다. ${error.message}`)
      setLoading(false)
      return
    }

    // localStorage에 저장 (앱 전역에서 사용)
    localStorage.setItem('userProfile', JSON.stringify({
      nickname: profileData.nickname,
      bank_name: profileData.bank_name,
      account_number: profileData.account_number,
    }))

    setLoading(false)
    alert('프로필이 성공적으로 저장되었습니다!')
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-600 hover:text-[#006341] transition-colors text-sm font-medium"
      >
        내 프로필
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* 로그인 안 된 경우 오버레이 */}
            {!session && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-[#006341]/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h3>
                <p className="text-sm text-gray-600 mb-6 font-medium">
                  프로필과 계좌를 설정하려면<br/>성대인 인증을 먼저 진행해주세요.
                </p>
                <Button 
                  onClick={() => { setIsOpen(false); router.push('/login'); }}
                  className="w-full h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-bold rounded-xl shadow-sm"
                >
                  로그인하러 가기
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-2 text-gray-500 font-semibold"
                >
                  닫기
                </Button>
              </div>
            )}

            {/* 페칭 로딩 오버레이 */}
            {isFetching && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#006341] rounded-full animate-spin mb-3"></div>
                <p className="text-sm font-bold text-gray-700">프로필 정보를 불러오는 중...</p>
              </div>
            )}

            <div className={`space-y-6 ${!session || isFetching ? 'opacity-30 pointer-events-none select-none' : ''}`}>
              <div>
                <h2 className="text-xl font-bold text-gray-900">내 프로필 설정</h2>
                <p className="text-sm text-gray-500 mt-1">
                  저장한 계좌 정보는 합승 만들기 시 자동으로 연동됩니다.
                </p>
              </div>

            <div className="space-y-4">
              {/* 닉네임 */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">활동 닉네임</label>
                <Input
                  placeholder="예: 성균관다람쥐"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* 계좌 정보 섹션 */}
              <div className="space-y-3 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <p className="text-sm font-bold text-[#006341]">💳 기본 정산 계좌</p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600">은행 선택</label>
                  <select
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600">계좌번호</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="숫자만 입력"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                    className="h-10 bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500">합승 만들기 시 이 정보가 자동으로 채워집니다.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 font-semibold border-gray-200"
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="flex-1 h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? '저장 중...' : '저장하기'}
              </Button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
