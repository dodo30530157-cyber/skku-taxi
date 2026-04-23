import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import Script from 'next/script'
import { AuthNav } from '@/components/AuthNav'
import { SplashScreen } from '@/components/SplashScreen'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SKKU TAXI — 성대 택시 합승',
  description: '성균관대 학우들과 택시비를 절약하는 합승 앱',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <Script 
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=8b939f6f6f9fc5b0d00f7236e76cf0dc&autoload=false"
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <SplashScreen />
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* ── 헤더 ── */}
          <header className="bg-white border-b border-gray-100 sticky top-0 z-30 w-full shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">

              {/* 워드마크 로고 */}
              <Link href="/" className="flex items-center gap-2 select-none group">
                {/* Glyph: 위치핀+자동차 조합 SVG */}
                <div className="w-8 h-8 rounded-xl bg-[#006341] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    {/* 자동차 바디 */}
                    <rect x="3" y="10" width="18" height="7" rx="2" stroke="white" strokeWidth="1.6" fill="none"/>
                    {/* 차 지붕 */}
                    <path d="M7 10V8.5C7 7.7 7.5 7 8.2 6.7L11 5.5C11.6 5.2 12.4 5.2 13 5.5L15.8 6.7C16.5 7 17 7.7 17 8.5V10" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                    {/* 왼쪽 바퀴 */}
                    <circle cx="7.5" cy="17" r="2" stroke="white" strokeWidth="1.6" fill="none"/>
                    {/* 오른쪽 바퀴 */}
                    <circle cx="16.5" cy="17" r="2" stroke="white" strokeWidth="1.6" fill="none"/>
                    {/* 위치 핀 도트 */}
                    <circle cx="12" cy="9" r="1.1" fill="#FFD200"/>
                  </svg>
                </div>
                {/* 타이포 */}
                <div className="flex flex-col leading-none">
                  <span className="text-[15px] font-black tracking-tight text-[#006341]">SKKU TAXI</span>
                  <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase">성대 택시 합승</span>
                </div>
              </Link>

              {/* 우측 내비 */}
              <nav className="flex items-center gap-1">
                <AuthNav />
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-md w-full mx-auto p-4 sm:px-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
