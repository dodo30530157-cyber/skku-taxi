'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Car } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Only allow SKKU email
    if (!email.endsWith('@skku.edu')) {
      setError('성균관대학교 이메일(@skku.edu)로만 로그인 가능합니다.')
      setLoading(false)
      return
    }

    // Auth logic goes here (mock for MVP)
    setTimeout(() => {
      setLoading(false)
      window.location.href = '/'
    }, 1000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Car className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">성대택시</h1>
        <p className="text-gray-500 mt-2">안전하고 저렴한 학우들만의 합승</p>
      </div>

      <Card className="w-full max-w-sm border-gray-100 shadow-lg">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>학교 웹메일로 인증해주세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">학교 이메일</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="user@skku.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full text-md h-12" disabled={loading}>
              {loading ? '로그인 중...' : '시작하기'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
