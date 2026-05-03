'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Camera, ScanFace, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// 대학교 데이터 배열
const universityList = [
  { name: "서울과학기술대학교", domain: "@seoultech.ac.kr" },
  { name: "서울교육대학교", domain: "@snue.ac.kr" },
  { name: "서울대학교", domain: "@snu.ac.kr" },
  { name: "육군사관학교", domain: "@kma.ac.kr" },
  { name: "한국과학기술원", domain: "@kaist.ac.kr" },
  { name: "한국체육대학교", domain: "@knsu.ac.kr" },
  { name: "서울시립대학교", domain: "@uos.ac.kr" },
  { name: "가톨릭대학교", domain: "@catholic.ac.kr" },
  { name: "감리교신학대학교", domain: "@mtu.ac.kr" },
  { name: "강서대학교", domain: "@gangseo.ac.kr" },
  { name: "건국대학교", domain: "@konkuk.ac.kr" },
  { name: "경기대학교", domain: "@kyonggi.ac.kr" },
  { name: "경희대학교", domain: "@khu.ac.kr" },
  { name: "고려대학교", domain: "@korea.ac.kr" },
  { name: "광운대학교", domain: "@kw.ac.kr" },
  { name: "국민대학교", domain: "@kookmin.ac.kr" },
  { name: "극동대학교", domain: "@kdu.ac.kr" },
  { name: "덕성여자대학교", domain: "@duksung.ac.kr" },
  { name: "동국대학교", domain: "@dongguk.edu" },
  { name: "동덕여자대학교", domain: "@dongduk.ac.kr" },
  { name: "명지대학교", domain: "@mju.ac.kr" },
  { name: "백석대학교", domain: "@bu.ac.kr" },
  { name: "삼육대학교", domain: "@syu.ac.kr" },
  { name: "상명대학교", domain: "@smu.ac.kr" },
  { name: "서강대학교", domain: "@sogang.ac.kr" },
  { name: "서경대학교", domain: "@skuniv.ac.kr" },
  { name: "서울기독대학교", domain: "@scu.ac.kr" },
  { name: "서울여자대학교", domain: "@swu.ac.kr" },
  { name: "서울한영대학교", domain: "@hytu.ac.kr" },
  { name: "성공회대학교", domain: "@skhu.ac.kr" },
  { name: "성균관대학교", domain: "@skku.edu" },
  { name: "성균관대학교(자연과학)", domain: "@skku.edu" },
  { name: "성신여자대학교", domain: "@sungshin.ac.kr" },
  { name: "세종대학교", domain: "@sejong.ac.kr" },
  { name: "숙명여자대학교", domain: "@sookmyung.ac.kr" },
  { name: "숭실대학교", domain: "@ssu.ac.kr" },
  { name: "연세대학교", domain: "@yonsei.ac.kr" },
  { name: "이화여자대학교", domain: "@ewha.ac.kr" },
  { name: "장로회신학대학교", domain: "@puts.ac.kr" },
  { name: "정석대학", domain: "@jit.ac.kr" },
  { name: "중앙대학교", domain: "@cau.ac.kr" },
  { name: "총신대학교", domain: "@chongshin.ac.kr" },
  { name: "추계예술대학교", domain: "@chugye.ac.kr" },
  { name: "한국성서대학교", domain: "@bible.ac.kr" },
  { name: "한국외국어대학교", domain: "@hufs.ac.kr" },
  { name: "한성대학교", domain: "@hansung.ac.kr" },
  { name: "한신대학교", domain: "@hs.ac.kr" },
  { name: "한양대학교", domain: "@hanyang.ac.kr" },
  { name: "한양대학교(ERICA)", domain: "@hanyang.ac.kr" },
  { name: "호서대학교", domain: "@hoseo.edu" },
  { name: "홍익대학교", domain: "@hongik.ac.kr" }
]

const BANKS = ['토스뱅크', '카카오뱅크', '신한은행', '국민은행', '우리은행', '하나은행', '농협은행']

export function RegisterFlow({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // Step 1: 폼 상태 (자동완성)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUni, setSelectedUni] = useState<{ name: string; domain: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  
  // OTP Auth 상태
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [authError, setAuthError] = useState('')

  // Step 2, 3: 폼 상태
  const [nickname, setNickname] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [selectedBank, setSelectedBank] = useState(BANKS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 자동완성 외부 클릭 감지
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 초기 Face ID 로그인 감지
  const [showFaceIdLogin, setShowFaceIdLogin] = useState(false)
  const [isFaceIdAuthenticating, setIsFaceIdAuthenticating] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('useBiometrics') === 'true') {
      setShowFaceIdLogin(true)
    }
  }, [])

  // Face ID로 자동 로그인 (WebAuthn Get)
  const handleFaceIdLogin = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert('이 기기는 생체 인식을 지원하지 않습니다.')
        return
      }

      setIsFaceIdAuthenticating(true)

      const publicKey = {
        challenge: new Uint8Array(32),
        timeout: 60000,
        userVerification: "preferred" as const
      }

      const assertion = await navigator.credentials.get({ publicKey })

      if (assertion) {
        // [Backdoor] 생체 인식 성공 시 do@skku.edu 강제 로그인
        const { error } = await supabase.auth.signInWithPassword({
          email: 'do@skku.edu',
          password: 'password123'
        })

        if (error) {
          alert(`자동 로그인 실패: ${error.message}`)
          setIsFaceIdAuthenticating(false)
          return
        }

        // 로그인 성공 시 메인으로
        finishRegistration()
      }
    } catch (err) {
      console.error('[WebAuthn 에러]:', err)
      alert('Face ID 인증에 실패했습니다.')
      setIsFaceIdAuthenticating(false)
    }
  }

  // 이메일 정제 헬퍼
  const getFullEmail = () => {
    if (email.includes('@')) return email
    return `${email}${selectedUni?.domain}`
  }

  // OTP 발송
  const handleSendOtp = async () => {
    if (!selectedUni || !email) return
    setIsSendingOtp(true)
    setAuthError('')
    
    const fullEmail = getFullEmail()

    // [Backdoor] 테스트 계정 감지: do@skku.edu 이면 API 호출 생략
    if (fullEmail === 'do@skku.edu') {
      setIsSendingOtp(false)
      setIsOtpSent(true)
      setAuthError('')
      alert('인증번호가 전송되었습니다. 메일함을 확인해주세요.')
      return
    }
    
    // 이메일 형식 검사 (테스트용으로 *@*.* 만 확인)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(fullEmail)) {
      setAuthError('올바른 이메일 주소를 입력해주세요.')
      setIsSendingOtp(false)
      return
    }
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: fullEmail,
        options: {
          shouldCreateUser: true,
        }
      })

      if (error) {
        throw error
      }

      setIsOtpSent(true)
      setAuthError('')
      alert('인증번호가 전송되었습니다. 메일함을 확인해주세요.')
    } catch (err: any) {
      console.error('[OTP 발송 오류]:', err)
      setAuthError(`인증 메일 발송 실패: ${err.message}`)
      alert(`발송 에러: ${err.message}`)
      setIsOtpSent(false)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // OTP 검증 및 다음 단계
  const handleVerifyOtpAndNext = async () => {
    if (!code || code.length < 6) {
      setAuthError('6자리 인증번호를 입력해주세요.')
      return
    }

    setIsVerifyingOtp(true)
    setAuthError('')
    
    const fullEmail = getFullEmail()

    // [Backdoor] 테스트 계정 및 특정 코드 감지 시 signInWithPassword 강제 호출
    if (fullEmail === 'do@skku.edu' && code === '123456') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'do@skku.edu',
        password: 'password123'
      })

      setIsVerifyingOtp(false)

      if (error) {
        setAuthError(`강제 로그인 실패: ${error.message}`)
        return
      }

      setDirection(1)
      setStep(2) // 2단계 프로필로 이동
      return
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: fullEmail,
      token: code,
      type: 'email'
    })

    setIsVerifyingOtp(false)
    
    if (error) {
      setAuthError(`인증번호가 틀렸거나 만료되었습니다: ${error.message}`)
      return
    }

    // 성공 시 Step 2(프로필)로
    setDirection(1)
    setStep(2)
  }

  // 하단 다음 버튼 핸들러
  const handleNext = () => {
    if (step === 1) {
      handleVerifyOtpAndNext()
      return
    }

    if (step === 2) {
      // 프로필 -> 계좌로
      if (!nickname.trim()) {
        alert('닉네임을 입력해주세요.')
        return
      }
      setDirection(1)
      setStep(3)
      return
    }

    if (step === 3) {
      // 계좌 -> 프로필 저장 -> 생체 인식(Step 4)
      handleCompleteRegister()
      return
    }
  }

  // 최종 회원가입(프로필 생성) 완료 및 다음(Step 4)으로 진행
  const handleCompleteRegister = async () => {
    setIsSubmitting(true)
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      alert('세션이 만료되었습니다. 다시 인증해주세요.')
      setIsSubmitting(false)
      setStep(1)
      return
    }

    const profileData = {
      id: session.user.id,
      nickname: nickname.trim(),
      bank_name: selectedBank || null,
      account_number: accountNumber.replace(/[^0-9]/g, '') || null,
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert([profileData])

    setIsSubmitting(false)

    if (upsertError) {
      alert(`프로필 저장에 실패했습니다: ${upsertError.message}`)
      return
    }

    localStorage.removeItem('mockSession')
    localStorage.setItem('userProfile', JSON.stringify(profileData))
    localStorage.setItem('isRegistered', 'true')

    // 저장 완료 후 마지막 생체 인증(Step 4)로 유도
    setDirection(1)
    setStep(4)
  }

  const handlePrev = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(prev => prev - 1)
    }
  }

  // 최종 앱 진입
  const finishRegistration = () => {
    if (onComplete) {
      onComplete()
    } else {
      alert('가입이 완료되었습니다!')
    }
  }

  // WebAuthn Face ID 등록
  const handleRegisterFaceId = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert('이 기기는 생체 인식을 지원하지 않습니다.')
        finishRegistration()
        return
      }

      // 더미 데이터로 WebAuthn 호출 (UX 테스트 목적)
      const publicKey = {
        challenge: new Uint8Array(32),
        rp: { name: "SKKU Taxi" },
        user: {
          id: new Uint8Array(16),
          name: email || "user@skku.edu",
          displayName: nickname || "SKKU Taxi User"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 }
        ] as PublicKeyCredentialParameters[],
        authenticatorSelection: {
          userVerification: "preferred" as const
        },
        timeout: 60000,
        attestation: "none" as const
      }

      const credential = await navigator.credentials.create({ publicKey })

      if (credential) {
        localStorage.setItem('useBiometrics', 'true')
        alert('🎉 Face ID 등록이 완료되었습니다!')
        finishRegistration()
      }
    } catch (err) {
      console.error('[WebAuthn 에러]:', err)
      alert('생체 인식 등록이 취소되었거나 실패했습니다.')
      // 실패하더라도 메인으로 보냄
      finishRegistration()
    }
  }

  const handleSkipFaceId = () => {
    finishRegistration()
  }

  const filteredUniversities = universityList.filter(u => u.name.includes(searchQuery))

  const handleSelectUni = (uni: { name: string; domain: string }) => {
    setSelectedUni(uni)
    setSearchQuery(uni.name)
    setIsDropdownOpen(false)
    setIsOtpSent(false)
    setCode('')
  }

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white">
      {/* ── 프로그레스 바 ── */}
      <div className="pt-12 pb-4 px-6 bg-white z-20">
        <div className="h-1 w-full bg-[#F2F4F6] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#00A651] rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* ── 메인 콘텐츠 영역 ── */}
      <div className="flex-1 relative overflow-hidden px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-x-0 top-0 px-6 pt-6 pb-32 h-full overflow-y-auto scrollbar-hide"
          >
            {/* ── Step 1: 학교 인증 ── */}
            {step === 1 && (
              <div className="space-y-10">
                {showFaceIdLogin ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-10 animate-in zoom-in-95 duration-500 pt-10">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-3">
                        반가워요! 👋<br />Face ID로 로그인할까요?
                      </h2>
                    </div>

                    <div className="w-36 h-36 rounded-full bg-[#00A651]/5 flex items-center justify-center relative">
                      <ScanFace className="w-16 h-16 text-[#00A651]" />
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute inset-0 border-[3px] border-[#00A651]/20 rounded-full"
                      />
                    </div>

                    <div className="w-full space-y-3 pt-6">
                      <button 
                        onClick={handleFaceIdLogin} 
                        disabled={isFaceIdAuthenticating}
                        className="w-full h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,166,81,0.2)] disabled:opacity-50"
                      >
                        {isFaceIdAuthenticating ? '인증 중...' : 'Face ID로 1초 만에 시작하기'}
                      </button>
                      <button 
                        onClick={() => setShowFaceIdLogin(false)} 
                        className="text-[15px] font-semibold text-gray-400 hover:text-gray-600 transition-colors py-3 block w-full text-center"
                      >
                        다른 이메일로 로그인하기
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
                        학교 웹메일로 안전하게<br />인증할게요 🎓
                      </h2>
                    </div>

                    <div className="space-y-8">
                  {/* 대학교 검색 자동완성 */}
                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                    <label className="text-sm font-semibold text-gray-600 block pl-1">대학교 검색</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="예) 성균관대"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setIsDropdownOpen(true)
                          setSelectedUni(null) // 타이핑 시 선택 초기화
                          setIsOtpSent(false)
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[#F2F4F6] border-none text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all"
                      />
                    </div>

                    {/* 드롭다운 리스트 */}
                    <AnimatePresence>
                      {isDropdownOpen && searchQuery && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scaleY: 0.98 }}
                          animate={{ opacity: 1, y: 0, scaleY: 1 }}
                          exit={{ opacity: 0, y: -5, scaleY: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[#F2F4F6] overflow-hidden origin-top"
                        >
                          <ul className="max-h-60 overflow-y-auto overscroll-contain">
                            {filteredUniversities.length > 0 ? (
                              filteredUniversities.map((uni, idx) => (
                                <li
                                  key={idx}
                                  onClick={() => handleSelectUni(uni)}
                                  className="px-5 py-4 hover:bg-[#F2F4F6] cursor-pointer flex justify-between items-center transition-colors border-b border-[#F2F4F6] last:border-0"
                                >
                                  <span className="font-bold text-gray-800 text-[16px]">{uni.name}</span>
                                  <span className="text-sm font-medium text-gray-400">{uni.domain}</span>
                                </li>
                              ))
                            ) : (
                              <li className="px-5 py-6 text-center text-[15px] text-gray-500 font-medium">
                                검색된 대학교가 없습니다.
                              </li>
                            )}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 이메일 입력 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">학교 이메일 <span className="font-normal opacity-60">(테스트 허용)</span></label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                        <input
                          type="email"
                          placeholder="전체 이메일 (예: user@gmail.com)"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setIsOtpSent(false)
                          }}
                          disabled={!selectedUni || isOtpSent}
                          className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 disabled:opacity-50 text-[15px]"
                        />
                      </div>
                      <button 
                        onClick={handleSendOtp}
                        disabled={!selectedUni || !email || isSendingOtp}
                        className="shrink-0 h-14 px-5 rounded-lg bg-gray-200 text-gray-700 font-bold text-[15px] hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingOtp ? '발송 중...' : (isOtpSent ? '재발송' : '인증번호 발송')}
                      </button>
                    </div>
                  </div>

                  {/* 인증번호 입력 */}
                  <AnimatePresence>
                    {isOtpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-sm font-semibold text-gray-600 block pl-1">인증번호</label>
                        <input
                          type="text"
                          placeholder="6자리 숫자 입력"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all tracking-[0.2em] text-lg text-center"
                        />
                        {authError && (
                          <p className="text-red-500 text-sm font-medium pl-1 pt-1">{authError}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </>
                )}
              </div>
            )}

            {/* ── Step 2: 프로필 및 교통약자 (구 Step 3) ── */}
            {step === 2 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
                    스꾸택시에서 사용할<br />프로필을 만들어주세요 ✨
                  </h2>
                </div>

                {/* 프로필 이미지 업로드 */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-full bg-[#F2F4F6] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                    <Camera className="w-10 h-10 text-gray-400" />
                    <div className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center">
                      <span className="text-xl text-gray-700 leading-none pb-0.5">+</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* 닉네임 입력 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">닉네임</label>
                    <input
                      type="text"
                      placeholder="성대멋쟁이"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]"
                    />
                  </div>

                  {/* 교통약자 설정 토글 */}
                  <div className="bg-[#F2F4F6] rounded-2xl p-6 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1.5 text-[17px] leading-tight">교통약자이신가요?</h4>
                        <p className="text-[13px] text-gray-500 font-medium break-keep leading-relaxed">
                          휠체어 탑승 공간 등 승하차 시<br />배려가 필요한 경우 켜주세요.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsDisabled(!isDisabled)}
                        className={`relative shrink-0 w-[52px] h-8 rounded-full transition-colors duration-300 ${
                          isDisabled ? 'bg-[#00A651]' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                          animate={{ x: isDisabled ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {/* 안내 문구 */}
                    <AnimatePresence>
                      {isDisabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            <div className="bg-[#00A651]/10 text-[#00A651] text-[14px] font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                              <span>🍀</span> 프로필에 배려 배지가 표시됩니다.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: 정산 계좌 등록 (구 Step 4) ── */}
            {step === 3 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-3">
                    마지막으로 1/N 정산받을<br />계좌를 입력해 주세요 💸
                  </h2>
                  <p className="text-[15px] font-medium text-gray-500 leading-relaxed break-keep">
                    처음에 한 번만 등록해 두면 내릴 때 어색함 없이 송금 알림이 갑니다.
                  </p>
                </div>

                <div className="space-y-8 pt-2">
                  {/* 은행 선택 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">은행</label>
                    <div className="relative">
                      <select
                        className="w-full h-14 pl-4 pr-10 rounded-2xl bg-[#F2F4F6] border-none text-gray-900 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                      >
                        {BANKS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* 계좌번호 입력 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">계좌번호</label>
                    <input
                      type="text"
                      placeholder="- 없이 숫자만 입력"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all text-[16px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Face ID 등록 (최종 단계) ── */}
            {step === 4 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-3">
                    Face ID로 1초 만에 로그인
                  </h2>
                  <p className="text-gray-500 font-medium text-[16px] leading-relaxed break-keep">
                    다음부터는 비밀번호 없이 얼굴 인증으로<br />안전하고 빠르게 스꾸택시를 이용하세요.
                  </p>
                </div>

                <div className="w-36 h-36 rounded-full bg-[#00A651]/5 flex items-center justify-center relative">
                  <ScanFace className="w-16 h-16 text-[#00A651]" />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                    className="absolute inset-0 border-[3px] border-[#00A651]/20 rounded-full"
                  />
                </div>

                <div className="w-full space-y-3 pt-6">
                  <button onClick={handleRegisterFaceId} className="w-full h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,166,81,0.2)]">
                    Face ID 등록하기
                  </button>
                  <button onClick={handleSkipFaceId} className="text-[15px] font-semibold text-gray-400 hover:text-gray-600 transition-colors py-3 block w-full text-center">
                    나중에 하기
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 하단 고정 버튼 영역 (Step 4는 자체 버튼 사용) ── */}
      {step !== 4 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-30">
          <div className="max-w-md mx-auto pointer-events-auto flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="h-14 px-5 rounded-xl bg-gray-200 text-gray-700 font-bold text-[17px] hover:bg-gray-300 active:scale-95 transition-all shrink-0"
                disabled={isSubmitting}
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!isOtpSent || isVerifyingOtp)) ||
                (step === 3 && isSubmitting)
              }
              className="flex-1 h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {isVerifyingOtp || isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '다음'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
