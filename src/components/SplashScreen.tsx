'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/providers/LanguageProvider'

export function SplashScreen() {
  const { t } = useLanguage()
  const [show, setShow] = useState(true)
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splash_shown')
    
    if (!hasSeenSplash) {
      setIsReady(true)
      
      const p1Timer = setTimeout(() => {
        setPhase(2)
      }, 2500)

      const p2Timer = setTimeout(() => {
        setPhase(3)
      }, 4000)

      const endTimer = setTimeout(() => {
        setShow(false)
        sessionStorage.setItem('splash_shown', 'true')
      }, 5500)

      return () => {
        clearTimeout(p1Timer)
        clearTimeout(p2Timer)
        clearTimeout(endTimer)
      }
    } else {
      // 이미 봤다면 짧은 간소화 스피너 보여주고 바로 메인으로
      setPhase(4)
      setIsReady(true)
      
      const endTimer = setTimeout(() => {
        setShow(false)
      }, 400)

      return () => clearTimeout(endTimer)
    }
  }, [])

  if (!show) return null
  if (!isReady) return <div className="fixed inset-0 z-[100] bg-[#006341]" />

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#006341] 
        transition-opacity duration-[1500ms] ease-in-out ${
        phase === 3 || phase === 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        
        {phase === 4 ? (
          /* 간소화된 스피너 (새로고침 시) */
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {/* Phase 1: 얇은 화이트 라인의 은행잎 & 택시 주행 */}
            <div 
              className={`absolute w-[300px] h-[300px] flex items-center justify-center 
                transition-opacity duration-1000 ease-in-out ${
                phase === 1 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <svg viewBox="0 0 100 100" className="w-[180px] h-[180px] overflow-visible">
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

            {/* Phase 2: 스꾸택시 폰트 페이드인 */}
            <div 
              className={`absolute flex flex-col items-center justify-center 
                transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                phase >= 2 && phase < 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <h1 className="text-[52px] sm:text-6xl font-black text-white tracking-tighter drop-shadow-sm">
                {t('splash.title')}
              </h1>
            </div>
          </>
        )}
        
      </div>
    </div>
  )
}
