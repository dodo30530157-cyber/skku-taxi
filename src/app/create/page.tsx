'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreatePostPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    // Supabase DB에 insert할 데이터
    const newPost = {
      title: formData.get('title') as string,
      departure: formData.get('departure') as string,
      destination: formData.get('destination') as string,
      departureTime: formData.get('time') as string, // DB field name might be departureTime or departure_time
      maxPeople: Number(formData.get('maxPeople')),
      currentPeople: 1, // 방장은 자동으로 참여
      kakaoLink: formData.get('kakao') as string,
      status: '모집중',
      toss_id: formData.get('toss_id') as string || null,
    }

    // Supabase posts 테이블에 저장하고 삽입된 결과(id 포함)를 반환받음
    const { data, error } = await supabase.from('posts').insert([newPost]).select()

    setLoading(false)

    if (error) {
      console.error('글쓰기 실패:', error)
      alert(`글을 등록하는데 실패했습니다.\n사유: ${error.message || error.details || '알 수 없는 에러'}`)
      return
    }

    if (data && data.length > 0) {
      // 내 로컬 스토리지에 내가 만든 글 ID 저장 (MVP 방장 식별용)
      const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]')
      myPosts.push(data[0].id)
      localStorage.setItem('myPosts', JSON.stringify(myPosts))
    }

    // 메인 화면으로 리다이렉트
    router.push('/')
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300 pb-10 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">합승만들기</h1>
        <p className="text-sm text-gray-500 mt-1">새로운 택시 합승 파티를 모집합니다.</p>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title">게시글 제목</Label>
              <Input name="title" id="title" placeholder="예: 사당역에서 학교 같이 가실 분!" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">출발지</Label>
                <Input name="departure" id="departure" placeholder="예: 사당역 4번출구" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">목적지</Label>
                <Input name="destination" id="destination" placeholder="예: 성균관대 자과캠" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">출발 시간</Label>
                <Input name="time" id="time" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPeople">모집 인원 (본인 포함)</Label>
                <select
                  name="maxPeople"
                  id="maxPeople"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#006341] focus:ring-[#006341]"
                  required
                >
                  <option value="2">2명</option>
                  <option value="3">3명</option>
                  <option value="4">4명 (최대)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toss_id">내 토스 아이디 (선택)</Label>
              <Input
                name="toss_id"
                id="toss_id"
                type="text"
                placeholder="toss.me/ 뒤에 오는 아이디 (예: mytossid)"
              />
              <p className="text-xs text-gray-500 mt-1">
                합승 완료 후 정산할 때 사용됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kakao">카카오톡 오픈채팅방 링크</Label>
              <Input
                name="kakao"
                id="kakao"
                type="url"
                placeholder="https://open.kakao.com/o/..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                참여가 수락된 학우에게만 공개됩니다. (현재는 MVP 데모용)
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 rounded-b-xl border-t p-6">
            <div className="flex gap-3 w-full">
              <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                취소
              </Button>
              <Button type="submit" className="flex-1 h-10 bg-[#006341] hover:bg-[#006341]/90 text-white" disabled={loading}>
                {loading ? '등록 중...' : '등록하기'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
