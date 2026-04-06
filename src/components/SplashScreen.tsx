'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [fade, setFade] = useState(false)
  const [isDriving, setIsDriving] = useState(false)

  useEffect(() => {
    // 배포 시 항상 동작하도록 강제 제어된 로직 (이후 한 번만 보이게 하려면 session storage 활용)
    const hasSeenSplash = false 
    
    if (!hasSeenSplash) {
      // 0.1초 뒤 택시 주행 시작 애니메이션 트리거
      const driveTimer = setTimeout(() => {
        setIsDriving(true)
      }, 100)

      // 4.5초(4500ms) 후 페이드 아웃 시작
      const fadeTimer = setTimeout(() => {
        setFade(true)
      }, 4500)

      // 5초(5000ms) 후 컴포넌트 완전히 언마운트
      const hideTimer = setTimeout(() => {
        setShow(false)
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

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006341] transition-opacity duration-500 ease-out ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-90 fade-in duration-1000 ease-out fill-mode-forwards w-full px-8 max-w-sm">
        
        {/* 중앙 워드마크 */}
        <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-md mb-2">
          스꾸택시
        </h1>
        <p className="text-emerald-100/90 font-bold text-sm tracking-[0.2em] uppercase mb-16">
          성대 택시 합승 플랫폼
        </p>

        {/* 애니메이션 컴포넌트 영역 (도로) */}
        <div className="relative w-full h-16 border-b-[3px] border-white/20 mb-8 overflow-visible">
          {/* 도착지 마커 (황금색 은행잎 SVG) - 우측 끝 고정 */}
          <div className="absolute right-0 bottom-1 flex flex-col items-center">
            {/* 성균관대 상징 황금 은행잎 */}
            <svg 
              viewBox="0 0 100 100" 
              className="w-12 h-12 text-[#FFD200] drop-shadow-lg" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M50 15 C 10 10, -5 50, 15 80 C 25 95, 45 92, 48 85 L 50 100 L 52 85 C 55 92, 75 95, 85 80 C 105 50, 90 10, 50 15 Z M 50 30 C 65 30, 75 50, 65 65 C 60 55, 50 50, 50 70 C 50 50, 40 55, 35 65 C 25 50, 35 30, 50 30 Z" />
            </svg>
            <div className="text-[10px] text-[#FFD200] font-bold mt-1 tracking-widest">SKKU</div>
          </div>
          
          {/* 달리는 택시 - 좌측에서 우측으로 이동 */}
          {/* translate-x 속도: 4000ms duration, ease-in-out으로 웅크렸다가 자연스럽게 가속 및 감속 */}
          <div 
            className={`absolute bottom-[3px] transition-transform duration-[4000ms] ease-in-out pl-1 ${
              isDriving ? 'translate-x-[calc(100vw-9rem)] sm:translate-x-[18rem]' : 'translate-x-[0px]'
            }`}
          >
            {/* 택시 SVG 로고 */}
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-white/10 border-b-4 border-[#e0e0e0]">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#006341]" xmlns="http://www.w3.org/2000/svg">
                {/* 택시 상단 구조 */}
                <path d="M6 10L8 6H16L18 10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                {/* 본체 */}
                <rect x="3" y="10" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                {/* 바퀴 */}
                <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                {/* 표시등 펄스 */}
                <circle cx="12" cy="5" r="1.5" fill="#FFD200" className="animate-pulse duration-1000" />
              </svg>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
