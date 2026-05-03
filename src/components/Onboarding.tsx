'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/providers/LanguageProvider'

export function Onboarding() {
  const { t } = useLanguage()
  const [show, setShow] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  const SLIDES = [
    {
      title: t('onboarding.slide1.title'),
      desc: t('onboarding.slide1.desc'),
    },
    {
      title: t('onboarding.slide2.title'),
      desc: t('onboarding.slide2.desc'),
    },
    {
      title: t('onboarding.slide3.title'),
      desc: t('onboarding.slide3.desc'),
    }
  ]

  useEffect(() => {
    setMounted(true)
    const hasSeenOnboarding = localStorage.getItem('onboarding_shown')
    
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setShow(true)
      }, 5500)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!mounted || !show) return null

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleStart = () => {
    localStorage.setItem('onboarding_shown', 'true')
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-[90] bg-white flex flex-col">
      <div className="flex-1 relative overflow-hidden flex flex-col justify-center items-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset }) => {
              const swipe = offset.x
              if (swipe < -50) handleNext()
              else if (swipe > 50) handlePrev()
            }}
          >
            <h2 className="text-[22px] sm:text-2xl font-black text-gray-900 mb-4 tracking-tight leading-snug break-keep">
              {SLIDES[currentIndex].title}
            </h2>
            <p className="text-[15px] sm:text-base text-gray-500 font-medium leading-relaxed break-keep">
              {SLIDES[currentIndex].desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 pb-[env(safe-area-inset-bottom,32px)] pt-4 flex flex-col items-center gap-8 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] relative z-10">
        <div className="flex gap-2">
          {SLIDES.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-[#006341] w-5' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="w-full px-6 h-14 mb-6">
          {currentIndex === SLIDES.length - 1 ? (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleStart}
              className="w-full h-full rounded-2xl bg-[#006341] text-white font-bold text-[15px] shadow-[0_4px_20px_rgba(0,99,65,0.3)] hover:bg-[#005235] active:scale-95 transition-all"
            >
              {t('onboarding.start')}
            </motion.button>
          ) : (
            <div className="w-full h-full flex items-center justify-between px-2">
              <button 
                onClick={handleStart}
                className="text-[15px] font-semibold text-gray-400 p-2 hover:text-gray-600 transition-colors"
              >
                {t('common.skip')}
              </button>
              <button 
                onClick={handleNext}
                className="text-[15px] font-bold text-[#006341] p-2 hover:text-[#005235] transition-colors"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
