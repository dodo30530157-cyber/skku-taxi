'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Users, ArrowRight, MessageCircle, Navigation } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PostProps {
  id: string
  title: string
  departure: string
  destination: string
  departureTime: string
  maxPeople: number
  currentPeople: number
  kakaoLink: string
  status: string
  isJoined?: boolean
}

export function PostCard({ post }: { post: PostProps }) {
  const [isJoined, setIsJoined] = useState(post.isJoined || false)
  const [currentPeople, setCurrentPeople] = useState(post.currentPeople)
  const [status, setStatus] = useState(post.status)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthor, setIsAuthor] = useState(false)
  
  // 방장 여부 확인 (MVP 로컬 스토리지 기반)
  useEffect(() => {
    const myPosts = JSON.parse(localStorage.getItem('myPosts') || '[]')
    if (myPosts.includes(post.id)) {
      setIsAuthor(true)
      setIsJoined(true) // 방장은 기본으로 참여된 상태
    }
  }, [post.id])

  const isFull = currentPeople >= post.maxPeople || status === '완료' || status === '모집완료'
  const isEarlyDeparted = status === '모집완료' && currentPeople < post.maxPeople

  const handleJoin = async () => {
    if (isFull) return

    setIsLoading(true)

    const newCurrentPeople = currentPeople + 1

    // Supabase DB 업데이트
    const { error } = await supabase
      .from('posts')
      .update({ currentPeople: newCurrentPeople })
      .eq('id', post.id)

    setIsLoading(false)

    if (error) {
      console.error('참여 실패:', error)
      alert(`참여하기에 실패했습니다.\n사유: ${error.message || '알 수 없는 오류'}`)
      return
    }

    // 성공 시 로컬 상태 업데이트
    setCurrentPeople(newCurrentPeople)
    setIsJoined(true)

    // 카카오톡 링크 새 창으로 열기 (방장 연락처)
    window.open(post.kakaoLink, '_blank')
  }

  const handleEarlyDeparture = async () => {
    if (currentPeople < 2) return

    if (!confirm('정말로 지금 출발(모집 마감) 하시겠습니까?')) return

    setIsLoading(true)

    // 즉시 모집완료로 상태 업데이트
    const { error } = await supabase
      .from('posts')
      .update({ status: '모집완료' })
      .eq('id', post.id)

    setIsLoading(false)

    if (error) {
      console.error('마감 실패:', error)
      alert('모집 마감에 실패했습니다.')
      return
    }

    setStatus('모집완료')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? '오후' : '오전'
    hours = hours % 12
    hours = hours ? hours : 12 // 0시는 12시로 표시
    const hoursStr = hours < 10 ? `0${hours}` : hours.toString()
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes.toString()
    return `${month}월 ${day}일 ${ampm} ${hoursStr}:${minutesStr}`
  }

  return (
    <Card className="w-full mb-4 shadow-sm hover:shadow-md transition-shadow border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{post.title}</span>
            {isAuthor && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">내가 쓴 글</span>}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${status === '모집중' && !isFull ? 'bg-green-100 text-[#006341]' : 'bg-gray-100 text-gray-500'}`}>
            {isFull ? '모집완료' : status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#006341]" />
          <span className="font-medium text-gray-900">{post.departure}</span>
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <span className="font-medium text-gray-900">{post.destination}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>{formatDate(post.departureTime)} 출발</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <Users className="w-4 h-4 text-blue-500" />
          <span>{currentPeople} / {post.maxPeople} 명 참여 중</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full ml-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isEarlyDeparted ? 'bg-orange-400' : 'bg-[#006341]'}`}
              style={{ width: `${(currentPeople / post.maxPeople) * 100}%` }}
            />
          </div>
        </div>

        {/* 조기 출발 안내 문구 (참여자에게만) */}
        {!isAuthor && isEarlyDeparted && (
          <div className="bg-blue-50 text-blue-700 p-2.5 rounded-md text-xs font-medium border border-blue-100 mt-2">
            방장에 의해 모집이 조기 마감되었습니다. 지금 출발합니다! 🏃‍♂️
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex flex-col gap-2">
        {/* 방장 전용 버튼 영역 */}
        {isAuthor && (
          <div className="w-full mb-1">
            {status === '모집중' && !isFull ? (
              <Button 
                variant="outline"
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 font-semibold"
                onClick={handleEarlyDeparture}
                disabled={currentPeople < 2 || isLoading}
              >
                {currentPeople < 2 ? '2명 이상 모여야 조기 출발 가능' : '🏃‍♂️ 지금 바로 출발하기'}
              </Button>
            ) : (
              <Button 
                className="w-full bg-[#181919] hover:bg-[#181919]/90 text-white font-semibold flex items-center gap-2"
                onClick={() => window.open('https://t.kakao.com/', '_blank')}
              >
                <Navigation className="w-4 h-4" />
                🚕 카카오 T 열기
              </Button>
            )}
          </div>
        )}

        {/* 일반 참여 버튼 영역 */}
        {(!isAuthor || isJoined) && (
          isJoined ? (
            <Button 
              variant="outline" 
              className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] border-none font-semibold flex items-center gap-2"
              onClick={() => window.open(post.kakaoLink, '_blank')}
            >
              <MessageCircle className="w-4 h-4" />
              카카오톡 오픈채팅방 열기
            </Button>
          ) : (
            <Button 
              className={`w-full font-medium ${isFull ? 'bg-gray-300 text-gray-500 hover:bg-gray-300 cursor-not-allowed' : 'bg-[#006341] hover:bg-[#006341]/90 text-white'}`}
              onClick={handleJoin}
              disabled={isFull || isLoading}
            >
              {isLoading ? '처리 중...' : isFull ? '모집이 마감되었습니다' : '합승 참여하기'}
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  )
}
