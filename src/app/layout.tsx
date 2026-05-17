import type { Metadata, Viewport } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { AuthNav } from '@/components/AuthNav'
import { SplashScreen } from '@/components/SplashScreen'
import { Onboarding } from '@/components/Onboarding'
import { LanguageProvider } from '@/providers/LanguageProvider'
import { LanguageToggle } from '@/components/LanguageToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '가치타',
  description: '성균관대 학우들과 택시비를 절약하는 합승 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '가치타',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head />
      <body className={inter.className}>
        <LanguageProvider>
          <SplashScreen />
          <Onboarding />
          <div className="min-h-screen bg-gray-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
            {/* ── 헤더 ── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 w-full shadow-[0_1px_12px_rgba(0,0,0,0.06)] pt-[env(safe-area-inset-top)]">
              <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">

                {/* 워드마크 로고 */}
                <Link href="/" className="flex items-center gap-2 select-none group">
                  {/* 타이포 */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[17px] font-black tracking-tighter text-blue-600">GACHITA</span>
                  </div>
                </Link>

                {/* 우측 내비 */}
                <nav className="flex items-center gap-2">
                  <LanguageToggle />
                  <AuthNav />
                </nav>
              </div>
            </header>

            <main className="flex-1 max-w-md w-full mx-auto p-4 sm:px-0">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
