'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/lib/store'
import { User, Camera } from 'lucide-react'

export function ProfileModal() {
  const profileImageUrl = useUserStore((state) => state.profileImageUrl)
  const setProfileImageUrl = useUserStore((state) => state.setProfileImageUrl)
  const profileImageInputRef = useRef<HTMLInputElement>(null)

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImageUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
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
      
      let activeSession = currentSession
      if (!activeSession) {
        const mock = localStorage.getItem('mockSession')
        if (mock) activeSession = JSON.parse(mock)
      }
      
      setSession(activeSession)

      if (activeSession && isOpen) {
        setIsFetching(true)
        
        // Mock User인 경우 로컬 스토리지 데이터 사용
        if (activeSession.user.id === 'mock-user-1234') {
          const saved = localStorage.getItem('userProfile')
          if (saved) {
            const profile = JSON.parse(saved)
            setNickname(profile.nickname || '')
            setBankName(profile.bank_name || '')
            setAccountNumber(profile.account_number || '')
          }
          setIsFetching(false)
          return
        }

        // 실제 유저인 경우 Supabase 데이터 패치
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nickname, bank_name, account_number')
          .eq('id', activeSession.user.id)
          .single()

        if (error) {
          console.error('[ProfileModal] 데이터 페칭 에러:', error)
        } else if (profile) {
          setNickname(profile.nickname || '')
          setBankName(profile.bank_name || '')
          setAccountNumber(profile.account_number || '')
        }
        setIsFetching(false)
      } else if (!activeSession) {
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
  }, [isOpen])

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
      id: session.user.id,
      nickname: nickname.trim(),
      bank_name: bankName.trim() || null,
      account_number: accountNumber.replace(/-/g, '').trim() || null,
    }

    if (session.user.id !== 'mock-user-1234') {
      const { error } = await supabase.from('profiles').upsert([profileData])
      if (error) {
        console.error('[ProfileModal] 프로필 저장 오류:', error)
        alert(`저장에 실패했습니다. ${error.message}`)
        setLoading(false)
        return
      }
    }

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
        className="flex items-center gap-2 transition-all group"
      >
        {profileImageUrl ? (
          <>
            <img
              src={profileImageUrl}
              alt="내 프로필"
              className="w-8 h-8 rounded-full object-cover border-2 border-white ring-1 ring-gray-200 shadow-sm group-hover:ring-[#00A651] transition-all"
            />
            <span className="text-[14px] font-bold text-gray-600 group-hover:text-[#00A651] transition-colors">내 활동</span>
          </>
        ) : (
          <span className="text-gray-600 hover:text-[#00A651] transition-colors text-[15px] font-bold">내 활동</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* 로그인 안 된 경우 오버레이 */}
            {!session && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center p-8 text-center rounded-[2rem]">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span className="text-4xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">성대인 인증이 필요해요</h3>
                <p className="text-[15px] text-gray-500 mb-8 font-medium leading-relaxed">
                  나의 활동 기록을 확인하고<br/>합승 계좌를 설정하려면 로그인해주세요.
                </p>
                <button 
                  onClick={() => { setIsOpen(false); router.push('/login'); }}
                  className="w-full h-14 bg-[#00A651] active:bg-[#008f46] transition-colors text-white font-bold text-[17px] rounded-2xl shadow-[0_8px_20px_rgba(0,166,81,0.25)]"
                >
                  3초 만에 시작하기
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 h-12 text-gray-400 font-bold text-[15px] active:text-gray-600 transition-colors"
                >
                  다음에 할게요
                </button>
              </div>
            )}

            {/* 헤더 부분 */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between z-20 bg-white sticky top-0">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">내 활동</h2>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors font-bold text-lg">
                ✕
              </button>
            </div>

            <div className={`overflow-y-auto px-6 pb-8 custom-scrollbar ${!session ? 'opacity-20 pointer-events-none select-none blur-[2px]' : ''}`}>
              
              {/* 로딩 표시 */}
              {isFetching && (
                <div className="absolute inset-0 bg-white/70 z-20 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-gray-100 border-t-[#00A651] rounded-full animate-spin"></div>
                </div>
              )}

              <div className="space-y-8 mt-2">
                
                {/* 1. 상단 활동 요약 (Achievement Dashboard) */}
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-50">
                  <div className="flex items-center gap-4 mb-6 px-1">
                    {/* 프로필 이미지 + 편집 뱃지 */}
                    <div
                      className="relative cursor-pointer group"
                      onClick={() => profileImageInputRef.current?.click()}
                    >
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-gray-100" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center shadow-inner border border-gray-100">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {/* 카메라 뱃지 */}
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00A651] rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:bg-[#008f46] transition-colors">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={profileImageInputRef}
                        onChange={handleProfileImageChange}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{nickname || '스꾸러'}님</h3>
                      <p className="text-xs font-semibold text-gray-500">지구를 지키는 그린 라이더</p>
                      <p className="text-[11px] text-[#00A651] font-medium mt-0.5">사진을 눌러 변경하기</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center bg-[#F2F4F6] rounded-2xl py-4 transition-transform active:scale-95 cursor-default">
                      <span className="text-[11px] text-gray-500 font-bold mb-1">합승 횟수</span>
                      <span className="text-xl font-extrabold text-gray-900">12<span className="text-sm font-semibold text-gray-600 ml-0.5">회</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-[#F2F4F6] rounded-2xl py-4 transition-transform active:scale-95 cursor-default">
                      <span className="text-[11px] text-gray-500 font-bold mb-1">절약한 돈</span>
                      <span className="text-xl font-extrabold text-[#00A651]">8.5<span className="text-sm font-semibold text-[#00A651]/70 ml-0.5">만</span></span>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-[#F2F4F6] rounded-2xl py-4 transition-transform active:scale-95 cursor-default relative overflow-hidden">
                      <div className="absolute -right-2 -bottom-2 opacity-10 text-4xl">🌱</div>
                      <span className="text-[11px] text-gray-500 font-bold mb-1 flex items-center gap-0.5">절감한 탄소</span>
                      <span className="text-xl font-extrabold text-gray-900">12<span className="text-sm font-semibold text-gray-600 ml-0.5">kg</span></span>
                    </div>
                  </div>
                </div>

                {/* 2. 프로필 설정 섹션 (Settings Group) */}
                <div className="bg-[#F2F4F6] rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h3 className="text-[15px] font-bold text-gray-900">기본 정보 설정</h3>
                  </div>

                  <div className="space-y-4">
                    {/* 닉네임 */}
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-gray-500 ml-1">활동 닉네임</label>
                      <input
                        placeholder="예: 성균관다람쥐"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full h-14 bg-white rounded-2xl px-4 font-bold text-[16px] text-gray-900 border-none focus:ring-2 focus:ring-[#00A651]/20 transition-all placeholder:text-gray-300"
                      />
                    </div>

                    {/* 정산 계좌 */}
                    <div className="space-y-2 pt-2">
                      <label className="text-[13px] font-bold text-gray-500 ml-1">정산받을 계좌</label>
                      <div className="flex w-full gap-2">
                        <select
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                          className="w-[110px] shrink-0 h-14 bg-white rounded-xl border border-gray-100 px-2 font-bold text-[15px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 transition-all appearance-none text-center cursor-pointer"
                        >
                          <option value="">은행 선택</option>
                          <option value="토스뱅크">토스뱅크</option>
                          <option value="카카오뱅크">카카오뱅크</option>
                          <option value="국민은행">국민은행</option>
                          <option value="신한은행">신한은행</option>
                          <option value="우리은행">우리은행</option>
                          <option value="하나은행">하나은행</option>
                          <option value="농협은행">농협은행</option>
                        </select>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="계좌번호 (숫자만)"
                          value={accountNumber}
                          onChange={e => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                          className="flex-1 min-w-0 overflow-hidden h-14 bg-white rounded-xl border border-gray-100 px-4 font-bold text-[16px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/20 transition-all placeholder:text-gray-300 tracking-wide"
                        />
                      </div>
                      <p className="text-[12px] font-medium text-gray-400 ml-1 mt-1.5">이 계좌는 합승 만들기 시 자동으로 입력됩니다.</p>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* 3. 하단 저장 버튼 */}
              <div className="mt-8">
                <button
                  type="button"
                  className="w-full h-16 bg-[#00A651] hover:bg-[#008f46] active:scale-[0.98] transition-all text-white font-bold text-[18px] rounded-2xl shadow-[0_8px_24px_rgba(0,166,81,0.3)] flex items-center justify-center"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    '내 정보 저장하기'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
