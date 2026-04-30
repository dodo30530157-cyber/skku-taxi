'use client'

import { Map as KakaoMap, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk'

interface KakaoMapViewerProps {
  filteredPosts: any[]
  mapCenter: { lat: number; lng: number }
  setSelectedPost: (post: any) => void
}

export default function KakaoMapViewer({ filteredPosts, mapCenter, setSelectedPost }: KakaoMapViewerProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '',
  })

  if (!process.env.NEXT_PUBLIC_KAKAO_APP_KEY) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
        <span className="text-4xl mb-3">⚠️</span>
        <span className="text-red-500 font-bold text-sm">카카오맵 API 키가 설정되지 않았습니다.</span>
        <span className="text-gray-400 text-xs mt-1">.env.local 파일에 NEXT_PUBLIC_KAKAO_APP_KEY를 등록해주세요.</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#006341] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
        <span className="text-4xl mb-3">🚨</span>
        <span className="text-red-500 font-bold text-sm">지도 로드 중 오류가 발생했습니다.</span>
      </div>
    )
  }

  return (
    <KakaoMap 
      center={mapCenter} 
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }} 
      level={4}
      onClick={() => setSelectedPost(null)}
    >
      {filteredPosts.map(post => (
        post.lat && post.lng && (
          <MapMarker 
            key={post.id}
            position={{ lat: post.lat, lng: post.lng }}
            onClick={() => setSelectedPost(post)}
          />
        )
      ))}
    </KakaoMap>
  )
}
