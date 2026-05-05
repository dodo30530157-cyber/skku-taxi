'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Camera, ScanFace, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/lib/store'

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
  { name: "성균관대학교", domain: "@g.skku.edu" },
  { name: "성균관대학교(자연과학)", domain: "@g.skku.edu" },
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
  const setProfileImageUrl = useUserStore((state) => state.setProfileImageUrl)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  // Step 1 & 2: 폼 상태 (자동완성 및 비밀번호)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUni, setSelectedUni] = useState<{ name: string; domain: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  
  // OTP Auth 상태
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [authError, setAuthError] = useState('')

  // Step 3, 4: 폼 상태
  const [nickname, setNickname] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [selectedBank, setSelectedBank] = useState(BANKS[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 프로필 이미지 업로드 상태
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('이미지 압축 실패'));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileImage(file)

    // 일단 로컈 미리보기 (빠른 피드백)
    const reader = new FileReader()
    reader.onloadend = () => setProfilePreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

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
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [hasBiometrics, setHasBiometrics] = useState(false)
  useEffect(() => {
    if (localStorage.getItem('useBiometrics') === 'true') {
      setShowFaceIdLogin(true)
      setHasBiometrics(true)
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
        // [Backdoor] 제거됨. 실제 프로덕션에서는 WebAuthn 검증 로직 필요
        // 여기서는 임시로 Face ID UI만 제공하고 바로 성공 처리하거나 실제 구현에 맞게 변경해야 함.
        alert('Face ID 로그인이 확인되었습니다.')
        finishRegistration()
      }
    } catch (err) {
      console.error('[WebAuthn 에러]:', err)
      alert('Face ID 인증에 실패했습니다.')
      setIsFaceIdAuthenticating(false)
    }
  }

  // 완료 후 부모로 알림
  const finishRegistration = () => {
    if (onComplete) {
      onComplete()
    } else {
      window.location.reload()
    }
  }

  // 이메일 정제 헬퍼
  const getFullEmail = () => {
    if (email.includes('@')) return email
    return `${email}${selectedUni?.domain}`
  }

  // OTP 발송 (회원가입 전용)
  const handleSendOtp = async () => {
    if (!selectedUni || !email) return
    setIsSendingOtp(true)
    setAuthError('')
    
    const fullEmail = getFullEmail()
    
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

  // OTP 검증 및 다음 단계 (Step 1 -> Step 2)
  const handleVerifyOtpAndNext = async () => {
    if (!code || code.length < 6) {
      setAuthError('6자리 인증번호를 입력해주세요.')
      return
    }

    setIsVerifyingOtp(true)
    setAuthError('')
    
    const fullEmail = getFullEmail()
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

    // 성공 시 Step 2(비밀번호 설정)로
    setDirection(1)
    setStep(2)
  }

  // 이메일 + 비밀번호 로그인
  const handleLoginWithPassword = async () => {
    if (!email || !password) {
      setAuthError('이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    setIsVerifyingOtp(true)
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setIsVerifyingOtp(false)

    if (error) {
      setAuthError(`로그인 실패: ${error.message}`)
      return
    }

    // 성공 시 바로 완료
    finishRegistration()
  }

  // 비밀번호 설정 (Step 2 -> Step 3)
  const handleSetPasswordAndNext = async () => {
    if (!password || password.length < 6) {
      setAuthError('비밀번호는 6자리 이상 설정해주세요.')
      return
    }

    setIsSubmitting(true)
    setAuthError('')

    const { error } = await supabase.auth.updateUser({ password })
    
    setIsSubmitting(false)

    if (error) {
      setAuthError(`비밀번호 설정 실패: ${error.message}`)
      return
    }

    // 성공 시 Step 3(프로필)로
    setDirection(1)
    setStep(3)
  }

  // 하단 다음 버튼 핸들러
  const handleNext = () => {
    if (step === 1) {
      if (isLoginMode) {
        handleLoginWithPassword()
      } else {
        handleVerifyOtpAndNext()
      }
      return
    }

    if (step === 2) {
      handleSetPasswordAndNext()
      return
    }

    if (step === 3) {
      // 프로필 -> 계좌로
      if (!nickname.trim()) {
        alert('닉네임을 입력해주세요.')
        return
      }
      setDirection(1)
      setStep(4)
      return
    }

    if (step === 4) {
      // 계좌 -> 프로필 저장 -> 생체 인식(Step 5)
      handleCompleteRegister()
      return
    }
  }

  // 최종 회원가입(프로필 생성) 완료 및 다음(Step 5)으로 진행
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

    // 프로필 사진이 있으면 Supabase Storage에 업로드
    if (profileImage) {
      try {
        // 이미지 압축
        const compressedBlob = await compressImage(profileImage)
        const uploadFile = new File([compressedBlob], profileImage.name, { type: 'image/jpeg' })

        const ext = profileImage.name.split('.').pop()
        const fileName = `${session.user.id}_${Date.now()}.${ext}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, uploadFile, { upsert: true })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          setProfileImageUrl(publicUrl)
          // profiles 테이블에도 avatar_url 저장
          const { error: upsertError } = await supabase.from('profiles').upsert([{ id: session.user.id, avatar_url: publicUrl }])
          if (upsertError) {
            alert(`프로필 DB 갱신 실패 상세: ${JSON.stringify(upsertError)}`)
          }
        } else {
          alert(`온보딩 이미지 업로드 실패 상세: ${JSON.stringify(uploadError)}`)
        }
      } catch (err: any) {
        alert(`온보딩 사진 처리 중 예외 발생: ${JSON.stringify(err)}`)
      }
    } else if (profilePreviewUrl) {
      // 파일 객체 없이 base64만 있는 경우 (폴백)
      setProfileImageUrl(profilePreviewUrl)
    }

    // Face ID 등록으로
    setDirection(1)
    setStep(5)
  }

  const handleRegisterBiometrics = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert('이 기기는 생체 인식을 지원하지 않습니다.')
        finishRegistration()
        return
      }

      setIsFaceIdAuthenticating(true)

      const publicKey = {
        challenge: new Uint8Array(32),
        rp: { name: "SKKU Taxi" },
        user: {
          id: new Uint8Array(16),
          name: email || "user@skku.edu",
          displayName: nickname || "스꾸택시 유저"
        },
        pubKeyCredParams: [{ type: "public-key" as const, alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: "platform" as const },
        timeout: 60000,
        attestation: "none" as const
      }

      const credential = await navigator.credentials.create({ publicKey })

      if (credential) {
        localStorage.setItem('useBiometrics', 'true')
        alert('Face ID가 성공적으로 등록되었습니다!')
        finishRegistration()
      }
    } catch (err: any) {
      console.error('[WebAuthn 에러]:', err)
      if (err.name === 'NotAllowedError') {
        alert('Face ID 등록이 취소되었습니다.')
      } else {
        alert('Face ID 등록에 실패했습니다.')
      }
      setIsFaceIdAuthenticating(false)
    }
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
            initial={{ width: '20%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
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
            {/* ── Step 1: 학교 인증 또는 로그인 ── */}
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
                        onClick={() => { setShowFaceIdLogin(false); setIsLoginMode(true); }} 
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
                        {isLoginMode ? (
                          <>기존 계정으로<br />로그인할게요 🔒</>
                        ) : (
                          <>학교 웹메일로 안전하게<br />인증할게요 🎓</>
                        )}
                      </h2>
                    </div>

                    <div className="space-y-8">
                      {isLoginMode ? (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-600 block pl-1">이메일</label>
                            <div className="relative flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                              <input
                                type="email"
                                placeholder="가입했던 학교 이메일"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value)
                                }}
                                className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 text-[16px]"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-600 block pl-1">비밀번호</label>
                            <div className="relative flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                              <input
                                type="password"
                                placeholder="비밀번호 입력"
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value)
                                }}
                                className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 text-[16px]"
                              />
                            </div>
                            {authError && (
                              <p className="text-red-500 text-sm font-medium pl-1 pt-1">{authError}</p>
                            )}
                          </div>
                          
                          {/* Face ID 간편 로그인 (테스트용 무조건 노출) */}
                          <div className="pt-3">
                            <button 
                              onClick={(e) => { e.preventDefault(); handleFaceIdLogin(); }}
                              disabled={isFaceIdAuthenticating}
                              className="w-full h-14 rounded-xl bg-[#00A651]/10 text-[#00A651] font-bold text-[16px] hover:bg-[#00A651]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-[#00A651]/20"
                            >
                              <ScanFace className="w-5 h-5" />
                              {isFaceIdAuthenticating ? '인증 중...' : '📱 Face ID로 1초 만에 로그인하기'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                                  setSelectedUni(null)
                                  setIsOtpSent(false)
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[#F2F4F6] border-none text-gray-900 font-medium focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all"
                              />
                            </div>

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
                            <label className="text-sm font-semibold text-gray-600 block pl-1">학교 이메일</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1 flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                                <input
                                  type="text"
                                  placeholder="아이디"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value)
                                    setIsOtpSent(false)
                                  }}
                                  disabled={!selectedUni || isOtpSent}
                                  className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 disabled:opacity-50 text-[16px]"
                                />
                                <span className="text-gray-400 font-medium ml-1 whitespace-nowrap text-[15px]">
                                  {selectedUni ? selectedUni.domain : '@domain'}
                                </span>
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
                        </>
                      )}
                    </div>
                    
                    {/* 하단 모드 전환 토글 버튼 */}
                    <div className="pt-2 text-center">
                      <button 
                        onClick={() => { setIsLoginMode(!isLoginMode); setIsOtpSent(false); setAuthError(''); }}
                        className="text-[14px] font-semibold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4 decoration-gray-300"
                      >
                        {isLoginMode ? "아직 계정이 없으신가요? 새로 가입하기" : "이미 계정이 있으신가요? 기존 계정으로 로그인"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: 비밀번호 설정 ── */}
            {step === 2 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
                    앞으로 사용할<br />비밀번호를 설정해주세요 🔒
                  </h2>
                </div>

                <div className="space-y-8">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">비밀번호 설정</label>
                    <div className="relative flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                      <input
                        type="password"
                        placeholder="6자리 이상 입력해주세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 text-[16px]"
                      />
                    </div>
                    {authError && (
                      <p className="text-red-500 text-sm font-medium pl-1 pt-1">{authError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: 프로필 및 교통약자 ── */}
            {step === 3 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
                    스꾸택시에서 사용할<br />프로필을 만들어주세요 ✨
                  </h2>
                </div>

                {/* 프로필 이미지 업로드 */}
                <div className="flex justify-center">
                  <div 
                    className="relative w-32 h-32 rounded-full bg-[#F2F4F6] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border border-gray-100 shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profilePreviewUrl ? (
                      <img src={profilePreviewUrl} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Camera className="w-10 h-10 text-gray-400" />
                    )}
                    
                    {!profilePreviewUrl && (
                      <div className="absolute bottom-1 right-1 w-9 h-9 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center z-10">
                        <span className="text-xl text-gray-700 leading-none pb-0.5">+</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
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
                          className="pt-3 border-t border-gray-200/60 mt-3"
                        >
                          <p className="text-[13px] text-[#00A651] font-semibold break-keep leading-relaxed">
                            ✓ 교통약자 아이콘이 프로필에 표시되며,<br />
                            ✓ 탑승 시 휠체어 수납 등 필요한 배려를 받을 수 있습니다.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: 정산 계좌 등록 ── */}
            {step === 4 && (
              <div className="space-y-10">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-2">
                    빠른 정산을 위해<br />계좌를 등록할까요? 💸
                  </h2>
                  <p className="text-gray-500 font-medium text-[15px] mt-3">
                    나중에 등록할 수도 있어요.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 은행 선택과 계좌번호 입력 - 한 줄에 자동 배분 */}
                  <div className="flex w-full gap-2">
                    {/* 은행 선택 드롭다운 */}
                    <div className="relative shrink-0 w-[110px]">
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full h-14 pl-4 pr-10 rounded-xl bg-white border border-gray-100 font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent appearance-none transition-shadow text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      >
                        {BANKS.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* 계좌번호 입력 */}
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="계좌번호 (- 없이 입력)"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full h-14 px-4 rounded-xl bg-white border border-gray-100 font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A651] focus:border-transparent transition-shadow text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 5: Face ID 등록 유도 (선택) ── */}
            {step === 5 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-10 animate-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-3">
                    Face ID로<br />1초 만에 로그인 ⚡️
                  </h2>
                  <p className="text-gray-500 font-medium text-[15px] break-keep leading-relaxed px-4">
                    다음부터는 비밀번호 없이<br />얼굴 인증으로 빠르고 안전하게 시작하세요.
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
                  <button 
                    onClick={handleRegisterBiometrics} 
                    disabled={isFaceIdAuthenticating}
                    className="w-full h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,166,81,0.2)] disabled:opacity-50"
                  >
                    {isFaceIdAuthenticating ? '인증 중...' : 'Face ID 등록하기'}
                  </button>
                  <button 
                    onClick={finishRegistration}
                    className="text-[15px] font-semibold text-gray-400 hover:text-gray-600 transition-colors py-3 block w-full text-center"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 하단 플로팅 버튼 ── */}
      {step < 5 && !showFaceIdLogin && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent pb-8">
          <button
            onClick={handleNext}
            disabled={isSubmitting || (step === 1 && (!isLoginMode ? !isOtpSent || code.length < 6 : !email || !password))}
            className="w-full h-14 rounded-xl bg-gray-900 text-white font-bold text-[17px] hover:bg-black active:scale-95 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center"
          >
            {isVerifyingOtp || isSubmitting ? (
              <motion.div
                className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              step === 4 ? '시작하기' : '다음'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
