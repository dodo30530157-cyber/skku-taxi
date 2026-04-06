'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    // 테스트용 조건 무시 (실제 배포 전엔 주석 해제)
    const hasSeenSplash = false // sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      // 1단계 (0~2s): 택시가 산길 올라가기 -> 2초 뒤 2단계로 전환(텍스트 등장 및 길/택시 페이드아웃)
      const p1Timer = setTimeout(() => {
        setPhase(2)
      }, 2000)

      // 3단계 (4.5s): 스플래시 전체 어두워지기 (메인 화면 전환 시작)
      const p2Timer = setTimeout(() => {
        setPhase(3)
      }, 4500)

      // 완전 종료 (5.0s): 컴포넌트 마운트 해제
      const endTimer = setTimeout(() => {
        setShow(false)
        // 정상 서비스 후에는 여기서 setItem 실행
        // sessionStorage.setItem('splash_shown', 'true')
      }, 5000)

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
        transition-opacity duration-500 ease-in-out ${
        phase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Phase 1: 구불길과 미니멀 택시 애니메이션 */}
        <div 
          className={`absolute w-[300px] h-[400px] flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
            phase === 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg viewBox="0 0 300 400" className="w-full h-full overflow-visible">
            {/* 산길 / 구불구불한 얇고 서정적인 오르막길 선 (반투명 화이트) */}
            <path 
              id="windingRoad" 
              d="M 40 320 C 200 320, 80 180, 150 180 C 220 180, 100 40, 260 40" 
              fill="none" 
              stroke="rgba(255,255,255,0.4)" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            
            {/* 미니멀 꼬마 택시 */}
            {/* SVG animateMotion을 사용해 길을 아주 완벽하게 따라가며, rotate="auto"로 방향도 자동 맞춤 */}
            <g fill="#ffffff">
              {/* 차체 */}
              <rect x="-12" y="-6" width="24" height="8" rx="2" />
              {/* 위에 튀어나온 택시 캡 영역 (미니멀) */}
              <path d="M -4 -6 L -1 -10 L 7 -10 L 10 -6 Z" />
              {/* 바퀴 2개 */}
              <circle cx="-6" cy="2" r="3" fill="#006341" />
              <circle cx="6" cy="2" r="3" fill="#006341" />
              
              <animateMotion 
                dur="1.95s" 
                fill="freeze" 
                keyPoints="0;1" 
                keyTimes="0;1" 
                calcMode="spline" 
                keySplines="0.4 0 0.2 1" 
                rotate="auto"
              >
                <mpath href="#windingRoad" />
              </animateMotion>
            </g>
          </svg>
        </div>

        {/* Phase 2: 스꾸택시 폰트 페이드인 (미니멀, 굵게, 군더더기 제로) */}
        <div 
          className={`absolute flex flex-col items-center justify-center transition-all duration-[1500ms] ease-out ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-widest">
            스꾸택시
          </h1>
        </div>
        
      </div>
    </div>
  )
}
