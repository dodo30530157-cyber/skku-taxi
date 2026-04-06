'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(false)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    // 테스트를 위해 세션 스토리지 체크 임시 무시 (매번 무조건 스플래시 발생)
    const hasSeenSplash = false // sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      setShow(true)
      
      // 2.5초 후 페이드 아웃 시작
      const fadeTimer = setTimeout(() => {
        setFade(true)
      }, 2500)

      // 3초 후 컴포넌트 완전히 언마운트 (자동 전환)
      const hideTimer = setTimeout(() => {
        setShow(false)
        // 나중에 다시 활성화 시 사용: sessionStorage.setItem('splash_shown', 'true')
      }, 3000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [])

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006341] transition-opacity duration-500 ease-out ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-75 fade-in duration-1000 ease-out fill-mode-forwards">
        {/* 미니멀 글리프 (로고) */}
        <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
          <svg viewBox="0 0 24 24" fill="none" className="w-14 h-14" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="10" width="18" height="7" rx="2" stroke="white" strokeWidth="1.6" fill="none"/>
            <path d="M7 10V8.5C7 7.7 7.5 7 8.2 6.7L11 5.5C11.6 5.2 12.4 5.2 13 5.5L15.8 6.7C16.5 7 17 7.7 17 8.5V10" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
            <circle cx="7.5" cy="17" r="2" stroke="white" strokeWidth="1.6" fill="none"/>
            <circle cx="16.5" cy="17" r="2" stroke="white" strokeWidth="1.6" fill="none"/>
            <circle cx="12" cy="9" r="1.5" fill="#FFD200" className="animate-pulse duration-1000" />
          </svg>
        </div>
        
        {/* SKKU TAXI 텍스트 타이포 */}
        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
          SKKU TAXI
        </h1>
        <p className="text-emerald-100/90 font-bold text-sm mt-2 tracking-[0.2em] uppercase">
          성대 택시 합승
        </p>
      </div>
    </div>
  )
}
