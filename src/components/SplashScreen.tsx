'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [fade, setFade] = useState(false)
  const [isDriving, setIsDriving] = useState(false)

  useEffect(() => {
    // 테스트를 위해 당분간 조건 없이 무조건 표시
    // 배포 시 아래 두 줄을 풀고 if (!hasSeenSplash) 로 복구합니다.
    const hasSeenSplash = false // sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      // 0.1초 뒤 택시 주행 시작 애니메이션 트리거
      const driveTimer = setTimeout(() => {
        setIsDriving(true)
      }, 100)

      // 4.5초 후 페이드 아웃 시작
      const fadeTimer = setTimeout(() => {
        setFade(true)
      }, 4500)

      // 5초 후 컴포넌트 완전히 언마운트
      const hideTimer = setTimeout(() => {
        setShow(false)
        // 정상 서비스 후에는 여기서 setItem 실행
        // sessionStorage.setItem('splash_shown', 'true')
      }, 5000)

      return () => {
        clearTimeout(driveTimer)
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    } else {
      setShow(false)
    }
  }, [])

  // SSR 환경에서 null이 뜨는 깜빡임을 막기 위해 show=true 유지
  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006341] transition-opacity duration-500 ease-out ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-90 fade-in duration-1000 ease-out fill-mode-forwards w-full px-8 max-w-sm">
        
        {/* 애니메이션 컴포넌트 영역 */}
        <div className="relative w-full h-16 border-b-2 border-white/30 mb-8">
          {/* 도착지 마커 (학교 로고/아이콘) - 우측 끝 고정 */}
          <div className="absolute right-0 bottom-2 text-4xl drop-shadow-lg pr-1">
            🏛️
          </div>
          
          {/* 달리는 택시 - 좌측에서 우측으로 이동 */}
          {/* translate-x의 거리는 모바일 화면(맥스 width 기준)에 맞춰 조절. w-full 기준 도로폭에서 아이콘 크기를 뺌 */}
          <div 
            className={`absolute bottom-[2px] transition-transform duration-[3500ms] ease-in-out pl-1 ${
              isDriving ? 'translate-x-[calc(100vw-8rem)] sm:translate-x-[18rem]' : 'translate-x-0'
            }`}
          >
            {/* 미니멀 글리프 (로고) */}
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#006341]" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="10" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <path d="M7 10V8.5C7 7.7 7.5 7 8.2 6.7L11 5.5C11.6 5.2 12.4 5.2 13 5.5L15.8 6.7C16.5 7 17 7.7 17 8.5V10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                <circle cx="7.5" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <circle cx="16.5" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <circle cx="12" cy="9" r="1.5" fill="#FFD200" className="animate-pulse duration-1000" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* SKKU TAXI 텍스트 타이포 */}
        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
          SKKU TAXI
        </h1>
        <p className="text-emerald-100/90 font-bold text-sm mt-3 tracking-[0.2em] uppercase">
          성대 택시 합승 플랫폼
        </p>
      </div>
    </div>
  )
}
