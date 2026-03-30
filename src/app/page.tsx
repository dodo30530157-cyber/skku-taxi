'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('id', { ascending: false }) // 최신순 정렬
      
      if (error) {
        console.error('Error fetching posts:', error)
      } else {
        setPosts(data || [])
      }
      setIsLoading(false)
    }

    fetchPosts()
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in pb-20 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">오늘의 합승</h1>
          <p className="text-sm text-gray-500 mt-1">성균관대 학우들과 택시비를 절약해보세요.</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          // 스켈레톤 로딩 UI
          <div className="space-y-4">
            {[1, 2, 3].map((key) => (
              <div key={key} className="w-full h-[220px] rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="mt-4 h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                현재 모집 중인 합승이 없습니다.<br/>
                하단의 버튼을 눌러 직접 합승을 만들어보세요!
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="w-full max-w-md px-4 flex justify-end">
          <Link href="/create" className="pointer-events-auto">
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-[#006341] hover:bg-[#006341]/90 transition-transform hover:scale-105 border-none text-white">
              <PlusCircle className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
