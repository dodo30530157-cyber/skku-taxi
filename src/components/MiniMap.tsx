'use client'

import { Map, MapMarker, ZoomControl, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk'
import { useUserStore } from '@/lib/store'

// 전역 window 참조 방어로직
declare global {
  interface Window {
    kakao: any
  }
}

interface MiniMapProps {
  lat: number
  lng: number
  /** true일 때만 내 프로필 사진 핀을 표시. 기본값 false (리스트·남의 방 용도) */
  showProfilePin?: boolean
}

export function MiniMap({ lat, lng, showProfilePin = false }: MiniMapProps) {
  const profileImageUrl = useUserStore((state) => state.profileImageUrl)
  const [loading, error] = useKakaoLoader({
    appkey: 'c7b0bd0edadfdfca171bba47039ba9a7',
    libraries: ['services'],
  })

  if (!lat || !lng) return null

  // showProfilePin AND 실제 이미지가 있을 때만 커스텀 핀 사용
  const useCustomPin = showProfilePin && !!profileImageUrl

  return (
    <div className="w-full bg-[#e5e5e5] rounded-lg overflow-hidden border border-gray-100 my-3 relative shadow-inner">
      {loading ? (
        <div style={{ width: '100%', height: '150px' }} className="flex items-center justify-center text-sm font-medium text-gray-500">
          지도 로딩 중...
        </div>
      ) : error ? (
        <div style={{ width: '100%', height: '150px' }} className="flex items-center justify-center text-sm font-medium text-red-500">
          지도 로드 실패
        </div>
      ) : (
        <Map
          center={{ lat, lng }}
          style={{ width: '100%', height: '150px' }}
          level={3}
        >
          {useCustomPin ? (
            <CustomOverlayMap position={{ lat, lng }} yAnchor={1.3}>
              <div className="flex flex-col items-center" style={{ transform: 'translateX(-50%)' }}>
                <div className="bg-[#00A651] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md mb-1 whitespace-nowrap">
                  출발
                </div>
                <div className="w-0.5 h-2 bg-[#00A651]/60" />
                <img
                  src={profileImageUrl!}
                  alt="내 위치"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-9 h-9 rounded-full object-cover border-[2px] border-white shadow-lg"
                />
              </div>
            </CustomOverlayMap>
          ) : (
            <MapMarker position={{ lat, lng }} />
          )}
          {window.kakao && window.kakao.maps && (
            <ZoomControl position={window.kakao.maps.ControlPosition.RIGHT} />
          )}
        </Map>
      )}
    </div>
  )
}
