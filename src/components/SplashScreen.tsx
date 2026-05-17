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
  if (!isReady) return <div className="fixed inset-0 z-[100] bg-sky-50" />

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white 
        transition-opacity duration-[1000ms] ease-in-out ${
        phase === 3 || phase === 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center px-6 pb-10 pt-[env(safe-area-inset-top)]">
        
        {phase === 4 ? (
          /* 간소화된 스피너 (새로고침 시) - 아주 희미하게 */
          <div className="w-6 h-6 border-2 border-blue-500/10 border-t-blue-500/40 rounded-full animate-spin" />
        ) : (
          <div 
            className={`flex flex-col items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* 일러스트 영역 */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-6">
              <img 
                src="/gachita-splash.png" 
                alt="Gachita Illustration" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* 텍스트 영역 */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <h1 className="text-[52px] font-black text-blue-600 tracking-tighter drop-shadow-sm leading-none">
                GACHITA
              </h1>
              <p className="text-sm font-semibold text-sky-600/60 tracking-wide">
                같이가서 가치타
              </p>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
