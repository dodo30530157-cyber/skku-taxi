'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [fade, setFade] = useState(false)
  const [isDriving, setIsDriving] = useState(false)

  useEffect(() => {
    // 임시 테스트용 조건 무시.
    // [중요] 실제 상용 배포에서는 sessionStorage.getItem('splash_shown') 로 켜줍니다.
    const hasSeenSplash = false 
    
    if (!hasSeenSplash) {
      // 컴포넌트 마운트 아주 직후 애니메이션 큐를 굴리기 위해 50ms 대기
      const driveTimer = setTimeout(() => {
        setIsDriving(true)
      }, 50)

      // 전체 7초 중 6.5초에서 페이드아웃 진입
      const fadeTimer = setTimeout(() => {
        setFade(true)
      }, 6500)

      // 7초(7000ms)에 컴포넌트 폐기 및 본문으로 전환
      const hideTimer = setTimeout(() => {
        setShow(false)
      }, 7000)

      return () => {
        clearTimeout(driveTimer)
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    } else {
      setShow(false)
    }
  }, [])

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#005133] transition-opacity duration-[700ms] ease-out ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-[0.97] fade-in duration-[1200ms] w-full px-8 max-w-[400px]">
        
        {/* 압도적인 타이포그래피 (크기 8xl, 굵기, 금빛 프리미엄 그라데이션, 블러 및 섀도우 극대화) */}
        <h1 
          className="text-8xl font-black tracking-tighter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] mb-20
                     bg-gradient-to-b from-[#FFF2A8] via-[#FFD700] to-[#B8860B] bg-clip-text text-transparent
                     relative"
        >
          {/* 뒤에 은은한 빛 반사(Glow) 효과를 추가 */}
          <span className="absolute inset-0 bg-gradient-to-b from-[#FFF2A8]/30 to-transparent bg-clip-text text-transparent blur-md">스꾸택시</span>
          스꾸택시
        </h1>

        {/* 애니메이션 컴포넌트 영역 (가장 고급스러운 도로 묘사) */}
        <div className="relative w-full h-[80px] border-b-[2px] border-gradient-to-r from-transparent via-white/40 to-transparent mb-8">
          
          {/* 도로 라인 자체에도 은은한 그라데이션 적용 */}
          <div className="absolute bottom-[-2px] inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          {/* 도착지 마커 (황금 은행잎 SVG - 극강의 디테일) */}
          <div className="absolute right-[-10px] bottom-[-20px] flex flex-col items-center z-10 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
            <svg 
              viewBox="0 0 100 100" 
              className="w-[5.5rem] h-[5.5rem]" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="premiumGold" x1="0%" y1="0%" x2="10% " y2="100%">
                  <stop offset="0%" stopColor="#FFF2A8" />
                  <stop offset="40%" stopColor="#FFD700" />
                  <stop offset="80%" stopColor="#DAA520" />
                  <stop offset="100%" stopColor="#A87A00" />
                </linearGradient>
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <g filter="url(#goldGlow)">
                {/* 은행잎 형태의 우아한 베지에 곡선 */}
                <path 
                  d="M 50 95 
                     L 50 70 
                     C 15 65 -5 30 20 10 
                     C 35 -5 45 20 50 45 
                     C 55 20 65 -5 80 10 
                     C 105 30 85 65 50 70" 
                  fill="url(#premiumGold)" 
                  stroke="#FFD700"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
          
          {/* 
            달리는 [프리미엄 블랙 택시] - 주행 애니메이션
            - 딱 5000ms 지속 
            - Tailwind 최고급 감속 ease 곡선: ease-[cubic-bezier(0.1,1,0.3,1)]
            => 초반엔 아주 경쾌하게 치고 나가서, 도착지부터는 깃털이 내려앉듯 아름답게 감속 정차
          */}
          <div 
            className={`absolute bottom-[6px] transition-transform duration-[5000ms] ease-[cubic-bezier(0.1,1,0.3,1)] z-20 origin-bottom ${
              isDriving ? 'translate-x-[calc(100vw-8.5rem)] sm:translate-x-[16.5rem]' : 'translate-x-[-20px]'
            }`}
          >
            {/* 정밀 작화 프리미엄 택시 측면 실루엣 */}
            <div className="relative drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]">
              <svg viewBox="0 0 200 60" className="w-[110px] h-auto" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* 고급 검정 세단 도장면 광택 느낌 */}
                  <linearGradient id="bodyPaint" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="30%" stopColor="#111827" />
                    <stop offset="100%" stopColor="#030712" />
                  </linearGradient>
                  {/* 프라이버시 틴팅 글라스 라인 */}
                  <linearGradient id="windowTint" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#003322" />
                    <stop offset="100%" stopColor="#051009" />
                  </linearGradient>
                  <linearGradient id="goldCap" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2A8" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                </defs>

                {/* 1. 택시 표시등 (루프 캡) */}
                <path d="M 85 4 L 92 0 L 110 0 L 115 4 Z" fill="url(#goldCap)" />
                <rect x="96" y="1" width="10" height="2" fill="#fff" opacity="0.8" />
                
                {/* 2. 유려한 세단 바디 */}
                <path 
                  d="M 10 40 
                     C 5 40 3 35 3 30 
                     C 3 25 10 20 20 20 
                     L 45 18 
                     L 65 7 
                     C 75 3 95 2 120 4 
                     L 155 12 
                     L 175 16 
                     C 185 18 190 20 195 25 
                     C 198 30 196 40 185 41 
                     L 155 41 
                     C 155 30 135 30 135 41 
                     L 75 41 
                     C 75 30 55 30 55 41 
                     L 20 41 Z" 
                  fill="url(#bodyPaint)" 
                />

                {/* 3. 사이드 윈도우 글라스 */}
                <path d="M 70 8 C 80 4 100 3 120 5 L 145 13 L 145 17 L 62 17 Z" fill="url(#windowTint)" />
                <path d="M 68 8 L 62 17" stroke="#374151" strokeWidth="2" />
                {/* B 필러 */}
                <rect x="108" y="4" width="6" height="13" fill="#030712" />

                {/* 4. 헤드램프 / 테일램프 라이트 */}
                {/* 뒤빨간등 */}
                <path d="M 4 23 L 8 23 L 8 27 L 4 28 Z" fill="#EF4444" />
                <path d="M 2 25 L 15 25" stroke="#FCA5A5" strokeWidth="1" filter="blur(2px)" opacity="0.6" />
                {/* 앞흰등 (데이라이트) */}
                <path d="M 188 22 L 195 22 L 193 25 L 188 25 Z" fill="#F3F4F6" />
                <circle cx="195" cy="23" r="5" fill="#ffffff" filter="blur(3px)" opacity="0.5" />

                {/* 5. 프리미엄 스포크 휠 */}
                <circle cx="65" cy="41" r="12" fill="#030712" />
                <circle cx="145" cy="41" r="12" fill="#030712" />
                <circle cx="65" cy="41" r="7" fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
                <circle cx="145" cy="41" r="7" fill="none" stroke="#9CA3AF" strokeWidth="2.5" />
                <circle cx="65" cy="41" r="3" fill="#E5E7EB" />
                <circle cx="145" cy="41" r="3" fill="#E5E7EB" />
              </svg>

              {/* 아주 은은한 속도 잔상 이펙트 */}
              <div 
                className={`absolute top-[45%] right-[95%] w-16 h-[1.5px] bg-gradient-to-l from-white/30 to-transparent blur-[1px] transition-all duration-700 ${
                  isDriving ? 'opacity-100' : 'opacity-0 scale-x-0'
                }`}
                style={{ transformOrigin: 'right' }}
              />
              <div 
                className={`absolute top-[65%] right-[95%] w-24 h-[1px] bg-gradient-to-l from-white/20 to-transparent blur-[1px] transition-all duration-700 delay-150 ${
                  isDriving ? 'opacity-100' : 'opacity-0 scale-x-0'
                }`}
                style={{ transformOrigin: 'right' }}
              />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
