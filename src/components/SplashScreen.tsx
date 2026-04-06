'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    // 테스트용 조건 무시 (실제 배포 전엔 주석 해제)
    const hasSeenSplash = false // sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      // 1. 초기 2.5초 주행 후 라인아트 페이드아웃 및 텍스트 등장
      const p1Timer = setTimeout(() => {
        setPhase(2)
      }, 2500)

      // 2. 4초에 스크린 전체 부드럽게 사라짐 시작 (페이드아웃)
      const p2Timer = setTimeout(() => {
        setPhase(3)
      }, 4000)

      // 3. 5.5초에 완전히 언마운트 (페이드아웃 애니메이션 1.5초를 정확히 기다려줌: Cross-fade 보장)
      const endTimer = setTimeout(() => {
        setShow(false)
        // sessionStorage.setItem('splash_shown', 'true')
      }, 5500)

      return () => {
        clearTimeout(p1Timer)
        clearTimeout(p2Timer)
        clearTimeout(endTimer)
      }
    } else {
      setShow(false)
    }
  }, [])

  if (!show) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006341] 
        transition-opacity duration-[1500ms] ease-in-out ${
        phase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Phase 1: 얇은 화이트 라인의 은행잎 & 택시 주행 (2.5초 이후 부드럽게 사라짐) */}
        <div 
          className={`absolute w-[300px] h-[300px] flex items-center justify-center 
            transition-opacity duration-1000 ease-in-out ${
            phase === 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg viewBox="0 0 100 100" className="w-[180px] h-[180px] overflow-visible">
            {/* 정제된 은행잎 라인아트 윤곽선 */}
            <path 
              id="ginkgoPath" 
              d="M 50 95 
                 C 50 85 50 75 50 75 
                 C 15 70 -5 35 20 15 
                 C 35 5 45 30 50 50 
                 C 55 30 65 5 80 15 
                 C 105 35 85 70 50 75" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.4)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* 꼬마 택시 윤곽 */}
            <g fill="#ffffff">
              <rect x="-4" y="-2" width="8" height="3" rx="1" />
              <path d="M -2 -2 L -1 -3.5 L 2 -3.5 L 3 -2 Z" />
              <circle cx="-2" cy="1" r="1.2" fill="#006341" />
              <circle cx="2" cy="1" r="1.2" fill="#006341" />
              
              <animateMotion 
                dur="2.4s" 
                fill="freeze" 
                keyPoints="0;1" 
                keyTimes="0;1" 
                calcMode="spline" 
                keySplines="0.4 0 0.2 1" 
                rotate="auto"
              >
                <mpath href="#ginkgoPath" />
              </animateMotion>
            </g>
          </svg>
        </div>

        {/* Phase 2: 스꾸택시 폰트 페이드인 (토스/배민 감성의 압도적 깔끔함) */}
        {/* 극강의 쫀득한 ease-out 곡선, 물속에서 떠오르듯 duration-2000ms의 긴 호흡 */}
        <div 
          className={`absolute flex flex-col items-center justify-center 
            transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h1 className="text-[52px] sm:text-6xl font-black text-white tracking-tighter drop-shadow-sm">
            스꾸택시
          </h1>
        </div>
        
      </div>
    </div>
  )
}
