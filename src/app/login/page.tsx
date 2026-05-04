'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Car } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.endsWith('@skku.edu') && !email.endsWith('@g.skku.edu')) {
      alert('성균관대학교 웹메일만 가입 가능합니다.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(`로그인에 실패했습니다: ${error.message}`)
      setLoading(false)
      return
    }
    router.push('/')
  }

  const handleGoToRegister = () => {
    // 로컬 스토리지 초기화로 메인 화면에서 RegisterFlow가 다시 뜨도록 유도
    localStorage.removeItem('isRegistered')
    router.push('/')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-7 flex flex-col items-center">
        <div className="w-14 h-14 bg-[#00A651]/10 rounded-full flex items-center justify-center mb-3">
          <Car className="w-7 h-7 text-[#00A651]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">스꾸택시</h1>
        <p className="text-gray-500 mt-1 text-sm">안전하고 저렴한 학우들만의 합승</p>
      </div>

      <Card className="w-full max-w-sm border-gray-100 shadow-sm border-t-4 border-t-[#00A651]">
        <CardHeader className="text-center pt-7 pb-4">
          <CardTitle className="text-xl font-bold text-[#00A651] tracking-tight">
            로그인
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-xs text-gray-600 font-semibold">학교 이메일 (@skku.edu, @g.skku.edu)</Label>
              <Input
                id="email"
                type="email"
                placeholder="gildong@skku.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-xs text-gray-600 font-semibold">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 bg-[#00A651] hover:bg-[#008f46] text-white font-semibold mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
            {/* 🚀 우리가 찾던 Face ID 깡패 버튼 */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const credential = await navigator.credentials.get({
                    publicKey: {
                      challenge: new Uint8Array(32),
                      timeout: 60000,
                      userVerification: "required"
                    }
                  });
                  if (credential) alert("Face ID 인증 성공! (메인으로 이동합니다)");
                } catch (error) {
                  alert("Face ID 인증에 실패했습니다.");
                }
              }}
              className="w-full h-11 mt-2 border-2 border-[#00A651] text-[#00A651] bg-white rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-[#00A651]/5 transition-colors"
            >
              📱 Face ID로 로그인
            </button>
            <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-3">
              아직 계정이 없으신가요?
              <button
                type="button"
                onClick={handleGoToRegister}
                className="ml-2 font-semibold text-[#00A651] hover:underline"
              >
                회원가입하기
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center border-t pt-3 border-gray-100">
              안전한 합승 문화를 위해 대학생 학우만 이용 가능합니다.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
