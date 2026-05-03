'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Camera, ScanFace, Search } from 'lucide-react'

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

  // Step 3, 4: 폼 상태
  const [nickname, setNickname] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [selectedBank, setSelectedBank] = useState(BANKS[0])
  const [accountNumber, setAccountNumber] = useState('')

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

  const handleNext = () => {
    if (step < 4) {
      setDirection(1)
      setStep(prev => prev + 1)
    } else {
      // 4단계 완료 시 더미(Mock) 유저 데이터 저장
      const mockUser = {
        id: 'mock-user-1234',
        email: email || 'test@univ.edu',
        isLoggedIn: true
      }
      const userProfile = {
        nickname: nickname || '성대멋쟁이',
        bank_name: selectedBank || '',
        account_number: accountNumber || ''
      }
      
      localStorage.setItem('mockSession', JSON.stringify({ user: mockUser }))
      localStorage.setItem('userProfile', JSON.stringify(userProfile))

      if (onComplete) {
        onComplete()
      } else {
        alert('가입이 완료되었습니다!')
      }
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setDirection(-1)
      setStep(prev => prev - 1)
    }
  }

  const filteredUniversities = universityList.filter(u => u.name.includes(searchQuery))

  const handleSelectUni = (uni: { name: string; domain: string }) => {
    setSelectedUni(uni)
    setSearchQuery(uni.name)
    setIsDropdownOpen(false)
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
                    <label className="text-sm font-semibold text-gray-600 block pl-1">학교 이메일</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1 flex items-center h-14 rounded-2xl bg-[#F2F4F6] px-4 focus-within:ring-1 focus-within:ring-[#00A651] transition-all overflow-hidden">
                        <input
                          type="text"
                          placeholder="아이디"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!selectedUni}
                          className="w-full bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 disabled:opacity-50 text-[16px]"
                        />
                        <span className="text-gray-400 font-medium ml-1 whitespace-nowrap text-[15px]">
                          {selectedUni ? selectedUni.domain : '@domain'}
                        </span>
                      </div>
                      <button 
                        disabled={!selectedUni || !email}
                        className="shrink-0 h-14 px-5 rounded-lg bg-gray-200 text-gray-700 font-bold text-[15px] hover:bg-gray-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        인증번호 발송
                      </button>
                    </div>
                  </div>

                  {/* 인증번호 입력 */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-600 block pl-1">인증번호</label>
                    <input
                      type="text"
                      placeholder="6자리 숫자 입력"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full h-14 px-4 rounded-2xl bg-[#F2F4F6] border-none font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00A651] transition-all tracking-[0.2em] text-lg text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Face ID 등록 ── */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10 animate-in zoom-in-95 duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight leading-snug mb-3">
                    다음부터는 1초 만에<br />로그인하세요 📱
                  </h2>
                  <p className="text-gray-500 font-medium text-[16px] leading-relaxed break-keep">
                    비밀번호 없이 생체 인식으로<br />안전하고 빠르게 스꾸택시를 이용하세요.
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
                  <button onClick={handleNext} className="w-full h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all">
                    Face ID 등록하기
                  </button>
                  <button onClick={handleNext} className="text-[15px] font-semibold text-gray-400 hover:text-gray-600 transition-colors py-3 block w-full text-center">
                    나중에 하기
                  </button>
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
                      {/* Toggle Switch */}
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

            {/* ── Step 4: 정산 계좌 등록 ── */}
            {step === 4 && (
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
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 하단 고정 버튼 영역 (Step 2는 자체 버튼 사용) ── */}
      {step !== 2 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-30">
          <div className="max-w-md mx-auto pointer-events-auto flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="h-14 px-5 rounded-xl bg-gray-200 text-gray-700 font-bold text-[17px] hover:bg-gray-300 active:scale-95 transition-all shrink-0"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 h-14 rounded-xl bg-[#00A651] text-white font-bold text-[17px] hover:bg-[#008f46] active:scale-95 transition-all"
            >
              {step === 4 ? '스꾸택시 시작하기' : '다음'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
