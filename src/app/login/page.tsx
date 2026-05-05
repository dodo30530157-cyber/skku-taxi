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
    const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert(`로그인에 실패했습니다: ${error.message}`)
      setLoading(false)
      return
    }

    if (session) {
      // 가입된 프로필이 있는지 확인
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileError && profile) {
        // 기존 유저: 프로필 정보가 있으면 가입 완료 처리
        localStorage.setItem('isRegistered', 'true')
        localStorage.setItem('userProfile', JSON.stringify({
          id: profile.id,
          nickname: profile.nickname,
          bank_name: profile.bank_name,
          account_number: profile.account_number
        }))
        if (profile.avatar_url) {
          localStorage.setItem('profileImageUrl', profile.avatar_url)
        }
        router.push('/')
      } else {
        // 신규 유저 또는 프로필 미완성 유저: 온보딩 유도
        localStorage.setItem('isRegistered', 'false')
        router.push('/')
      }
    } else {
      router.push('/')
    }
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
            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 bg-[#00A651] hover:bg-[#008f46] text-white font-semibold"
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (!window.PublicKeyCredential) {
                      alert("이 기기는 생체 인식을 지원하지 않습니다.");
                      return;
                    }
                    const publicKey = {
                      challenge: new Uint8Array(32),
                      rp: { name: "SKKU Taxi", id: window.location.hostname },
                      user: {
                        id: new Uint8Array(16),
                        name: email || "user@skku.edu",
                        displayName: email.split('@')[0] || "학우님"
                      },
                      pubKeyCredParams: [{ type: "public-key" as const, alg: -7 }],
                      authenticatorSelection: {
                        authenticatorAttachment: "platform" as const,
                        userVerification: "required" as const
                      },
                      timeout: 60000,
                      attestation: "none" as const
                    };
                    const credential = await navigator.credentials.create({ publicKey });
                    if (credential) {
                      localStorage.setItem('useBiometrics', 'true');
                      alert("기기에 Face ID가 등록되었습니다! 이제 로그인해 보세요.");
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Face ID 등록에 실패했습니다. (이미 등록되어 있거나 취소됨)");
                  }
                }}
                className="w-full h-11 bg-gray-900 text-white rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors"
              >
                🔐 Face ID 최초 등록하기 (패스키)
              </button>

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
                    if (credential) {
                      // Face ID 성공 후 세션 확인 및 프로필 동기화
                      const { data: { session } } = await supabase.auth.getSession()
                      if (session) {
                        const { data: profile } = await supabase
                          .from('profiles')
                          .select('*')
                          .eq('id', session.user.id)
                          .single()
                        
                        if (profile) {
                          localStorage.setItem('isRegistered', 'true')
                          localStorage.setItem('userProfile', JSON.stringify({
                            id: profile.id,
                            nickname: profile.nickname,
                            bank_name: profile.bank_name,
                            account_number: profile.account_number
                          }))
                        }
                      }
                      alert("Face ID 인증 성공! (메인으로 이동합니다)");
                      router.push('/')
                    }
                  } catch (error) {
                    alert("등록된 Face ID가 없거나 인증에 실패했습니다.");
                  }
                }}
                className="w-full h-11 border-2 border-[#00A651] text-[#00A651] bg-white rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-[#00A651]/5 transition-colors"
              >
                📱 Face ID로 로그인
              </button>
            </div>
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
