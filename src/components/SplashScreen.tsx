'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    // 개발 테스트를 위해 세션 스토리지 체크 무시.
    // [중요] 실제 상용 배포에서는 sessionStorage.getItem('splash_shown') 로 복구!
    const hasSeenSplash = false 
    
    if (!hasSeenSplash) {
      // 1. 초기 3초 주행 후 배경색 반전(White) 및 텍스트 페이드인 전환
      const p1Timer = setTimeout(() => {
        setPhase(2)
      }, 3000)

      // 2. 4.8초에 전체 스크린 사라지기 시작 (부드럽게 페이드아웃)
      const p2Timer = setTimeout(() => {
        setPhase(3)
      }, 4800)

      // 3. 5초에 무조건 언마운트
      const endTimer = setTimeout(() => {
        setShow(false)
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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center 
        transition-all duration-[1500ms] ease-in-out ${
        phase >= 2 ? 'bg-white' : 'bg-[#006341]'
      } ${
        phase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {/* Phase 1: 얇은 화이트 라인의 은행잎 & 꼬마 택시 주행 (3초 되면 페이드아웃) */}
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
            
            {/* 아주 작고 미니멀한 화이트 실루엣 택시 */}
            {/* animateMotion을 써서 정확히 3초간 은행잎 테두리를 유유히 흐름 */}
            <g fill="#ffffff">
              {/* 차체 */}
              <rect x="-4" y="-2" width="8" height="3" rx="1" />
              {/* 택시 캡(뚜껑) */}
              <path d="M -2 -2 L -1 -3.5 L 2 -3.5 L 3 -2 Z" />
              <circle cx="-2" cy="1" r="1.2" fill="#006341" className={`transition-colors duration-[1500ms] ${phase >= 2 ? 'fill-white' : 'fill-[#006341]'}`} />
              <circle cx="2" cy="1" r="1.2" fill="#006341" className={`transition-colors duration-[1500ms] ${phase >= 2 ? 'fill-white' : 'fill-[#006341]'}`} />
              
              <animateMotion 
                dur="2.9s" 
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

        {/* Phase 2: 스꾸택시 폰트 페이드인 (배경이 하얘질 때 딥그린 글씨로 등장) */}
        <div 
          className={`absolute flex flex-col items-center justify-center transition-all duration-[1200ms] ease-out delay-500 ${
            phase >= 2 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#006341] tracking-widest drop-shadow-sm">
            스꾸택시
          </h1>
        </div>
        
      </div>
    </div>
  )
}
