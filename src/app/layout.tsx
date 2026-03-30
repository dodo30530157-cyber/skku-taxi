import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Car } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '성대택시',
  description: '성균관대 택시 합승 앱 MVP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b sticky top-0 z-10 w-full">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-primary font-bold text-lg">
                <Car className="w-5 h-5" />
                성대택시
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium">
                <Link href="/login" className="text-gray-600 hover:text-primary transition-colors">로그인</Link>
                <Link href="/create" className="text-primary hover:underline">합승만들기</Link>
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
