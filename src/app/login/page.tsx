'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { Car, ChevronRight, ChevronLeft, Check } from 'lucide-react'

// 회원가입 총 단계 수
const TOTAL_STEPS = 3

export default function LoginPage() {
  const router = useRouter()

  // 로그인/회원가입 모드
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: 계정 정보
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2: 기본 정보
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<'M' | 'F' | ''>('')

  // Step 3: 계좌 정보
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  // ─── 단계 유효성 검사 ───────────────────────────────────────
  const canProceedStep1 = () => {
    if (!email.endsWith('@skku.edu') && !email.endsWith('@g.skku.edu')) {
      alert('성균관대학교 웹메일(@skku.edu 또는 @g.skku.edu)만 가입 가능합니다.')
      return false
    }
    if (password.length < 6) {
      alert('비밀번호는 최소 6자리 이상이어야 합니다.')
      return false
    }
    return true
  }

  const canProceedStep2 = () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return false
    }
    if (!gender) {
      alert('성별을 선택해주세요.')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !canProceedStep1()) return
    if (step === 2 && !canProceedStep2()) return
    setStep(s => s + 1)
  }

  // ─── 회원가입 최종 제출 ─────────────────────────────────────
  const handleSignup = async () => {
    setLoading(true)

    // 1. auth.signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      alert(`회원가입에 실패했습니다: ${authError?.message}`)
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // 2. profiles 테이블에 프로필 동시 저장
    const { error: profileError } = await supabase.from('profiles').upsert([{
      id: userId,
      nickname: nickname.trim(),
      bank_name: bankName.trim() || null,
      account_number: accountNumber.replace(/-/g, '').trim() || null,
    }])
    if (profileError) console.error('프로필 저장 오류:', profileError)

    // 3. localStorage에도 저장 (앱 전역 사용)
    localStorage.setItem('userProfile', JSON.stringify({
      nickname: nickname.trim(),
      bank_name: bankName.trim() || null,
      account_number: accountNumber.replace(/-/g, '').trim() || null,
    }))

    setLoading(false)
    // 4. 모든 세팅 완료 → 바로 메인으로
    router.push('/')
  }

  // ─── 로그인 ─────────────────────────────────────────────────
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

  // ─── 단계 인디케이터 ─────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            s < step
              ? 'bg-[#006341] text-white'
              : s === step
              ? 'bg-[#006341] text-white ring-4 ring-[#006341]/20'
              : 'bg-gray-100 text-gray-400'
          }`}>
            {s < step ? <Check className="w-4 h-4" /> : s}
          </div>
          {s < TOTAL_STEPS && (
            <div className={`w-8 h-0.5 rounded transition-all duration-500 ${s < step ? 'bg-[#006341]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )

  const stepLabels = ['계정 정보', '기본 정보', '계좌 정보']

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 animate-in fade-in zoom-in-95 duration-300">
      {/* 로고 */}
      <div className="mb-7 flex flex-col items-center">
        <div className="w-14 h-14 bg-[#006341]/10 rounded-full flex items-center justify-center mb-3">
          <Car className="w-7 h-7 text-[#006341]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">성대택시</h1>
        <p className="text-gray-500 mt-1 text-sm">안전하고 저렴한 학우들만의 합승</p>
      </div>

      <Card className="w-full max-w-sm border-gray-100 shadow-sm border-t-4 border-t-[#006341]">
        <CardHeader className="text-center pt-7 pb-4">
          <CardTitle className="text-xl font-bold text-[#006341] tracking-tight">
            {isSignUp ? `회원가입 (${step}/${TOTAL_STEPS})` : '로그인'}
          </CardTitle>
          {isSignUp && (
            <CardDescription className="text-sm mt-1">{stepLabels[step - 1]}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="pb-6">

          {/* ─── 회원가입 플로우 ─── */}
          {isSignUp ? (
            <div className="space-y-5">
              <StepIndicator />

              {/* Step 1: 계정 정보 */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">학교 이메일</Label>
                    <Input
                      type="email"
                      placeholder="gildong@skku.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-gray-400">@skku.edu 또는 @g.skku.edu 만 가능</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">비밀번호 (6자리 이상)</Label>
                    <Input
                      type="password"
                      placeholder="비밀번호"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Button onClick={handleNext} className="w-full h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold">
                    다음 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}

              {/* Step 2: 기본 정보 */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">활동 닉네임</Label>
                    <Input
                      placeholder="예: 성균관다람쥐"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">성별</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGender('M')}
                        className={`h-11 rounded-xl border-2 font-semibold text-sm transition-all ${
                          gender === 'M'
                            ? 'border-[#006341] bg-[#006341]/10 text-[#006341]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >남성</button>
                      <button
                        type="button"
                        onClick={() => setGender('F')}
                        className={`h-11 rounded-xl border-2 font-semibold text-sm transition-all ${
                          gender === 'F'
                            ? 'border-[#006341] bg-[#006341]/10 text-[#006341]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >여성</button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button onClick={handleNext} className="flex-1 h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold">
                      다음 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: 계좌 정보 */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-xs text-[#006341] font-medium">💳 합승 완료 후 팀원들에게 정산받을 계좌입니다. 나중에 프로필에서도 설정 가능해요.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">은행 선택</Label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341]"
                    >
                      <option value="">은행 선택 (선택 사항)</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                      <option value="국민은행">국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="농협은행">농협은행</option>
                      <option value="기업은행">기업은행</option>
                      <option value="케이뱅크">케이뱅크</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 font-semibold">계좌번호 (선택 사항)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="숫자만 입력"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                      className="h-11"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11">
                      <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                    </Button>
                    <Button
                      onClick={handleSignup}
                      disabled={loading}
                      className="flex-1 h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold"
                    >
                      {loading ? '가입 중...' : '🎉 가입 완료!'}
                    </Button>
                  </div>
                </div>
              )}

              {/* 로그인 전환 */}
              <div className="text-center text-sm text-gray-500 pt-1">
                이미 계정이 있으신가요?
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setStep(1) }}
                  className="ml-2 font-semibold text-[#006341] hover:underline"
                >
                  로그인하기
                </button>
              </div>
            </div>

          ) : (
            /* ─── 로그인 플로우 ─── */
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
                className="w-full h-11 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold mt-2"
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-3">
                아직 계정이 없으신가요?
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setStep(1); setPassword('') }}
                  className="ml-2 font-semibold text-[#006341] hover:underline"
                >
                  회원가입하기
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center border-t pt-3 border-gray-100">
                안전한 합승 문화를 위해 성균관대 학우만 이용 가능합니다.
              </p>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
