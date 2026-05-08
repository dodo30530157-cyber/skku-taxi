'use client'

import { useState, useEffect } from 'react'

import { Map as KakaoMap, useKakaoLoader, CustomOverlayMap, Polyline } from 'react-kakao-maps-sdk'
import { useUserStore } from '@/lib/store'

interface KakaoMapViewerProps {
  filteredPosts: any[]
  mapCenter: { lat: number; lng: number }
  selectedPost?: any | null
  setSelectedPost: (post: any) => void
}

export default function KakaoMapViewer({ filteredPosts, mapCenter, selectedPost, setSelectedPost }: KakaoMapViewerProps) {
  const profileImageUrl = useUserStore((state) => state.profileImageUrl)
  const [center, setCenter] = useState(mapCenter)
  
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '',
  })

  // 선택된 방이 변경되면 부드럽게 중심 좌표 이동 (panTo 효과)
  useEffect(() => {
    if (selectedPost && selectedPost.dep_lat && selectedPost.dep_lng) {
      setCenter({ lat: Number(selectedPost.dep_lat), lng: Number(selectedPost.dep_lng) })
    }
  }, [selectedPost])

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
      center={center}
      isPanto={true} 
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }} 
      level={4}
      onClick={() => setSelectedPost(null)}
    >
      {/* 합승 팟 마커 — 방장 프로필 사진 원형 핀 */}
      {filteredPosts.map(post =>
        post.lat && post.lng ? (
          <CustomOverlayMap
            key={post.id}
            position={{ lat: post.lat, lng: post.lng }}
            zIndex={5}
          >
            <div
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPost(post)
              }}
              className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ pointerEvents: 'auto' }}
            >
              {/* 바깥 링 */}
              <div className="absolute inset-0 rounded-full bg-[#00A651] scale-110 opacity-20 group-hover:opacity-40 transition-opacity" />
              {post.profiles?.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.title || '합승 팟'}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border-[3px] border-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#00A651] border-[3px] border-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-xs">🚕</span>
                </div>
              )}
              {/* 출발지 말풍선 라벨 */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm opacity-80">
                {post.departure?.slice(0, 6) || '출발지'}
              </div>
            </div>
          </CustomOverlayMap>
        ) : null
      )}

      {/* 선택된 팟의 출발지-도착지 연결선 (거미줄 방지) */}
      {selectedPost?.dep_lat && selectedPost?.dep_lng && selectedPost?.dest_lat && selectedPost?.dest_lng && (
        (() => {
          const pathArray = [
            { lat: Number(selectedPost.dep_lat), lng: Number(selectedPost.dep_lng) },
            { lat: Number(selectedPost.dest_lat), lng: Number(selectedPost.dest_lng) }
          ]
          console.log("선 긋기 좌표:", pathArray)

          return (
            <>
              <Polyline
                path={pathArray}
                strokeWeight={4}
                strokeColor={"#00A651"}
                strokeOpacity={0.8}
                strokeStyle={"shortdash"}
              />
              {/* 도착지 마커 핀 */}
              <CustomOverlayMap position={pathArray[1]} zIndex={4}>
                <div className="absolute -translate-x-1/2 -translate-y-full pb-1">
                  <div className="bg-[#00A651] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap">
                    🚩 도착지
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#00A651] absolute -bottom-1 left-1/2 -translate-x-1/2" />
                </div>
              </CustomOverlayMap>
            </>
          )
        })()
      )}

      {/* 내 위치 — 현재 지도 중심 */}
      <CustomOverlayMap position={mapCenter} zIndex={10}>
        <div className="relative -translate-y-1/2 -translate-x-1/2">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="My Location" 
              className="w-10 h-10 rounded-full object-cover border-2 border-[#00A651] shadow-[0_4px_12px_rgba(0,166,81,0.25)]"
            />
          ) : (
            <div className="w-5 h-5 bg-blue-500 rounded-full border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] relative">
              <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
            </div>
          )}
        </div>
      </CustomOverlayMap>
    </KakaoMap>
  )
}
