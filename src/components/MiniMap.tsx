'use client'

import { Map, MapMarker, ZoomControl, useKakaoLoader } from 'react-kakao-maps-sdk'

// 전역 window 참조 방어로직
declare global {
  interface Window {
    kakao: any
  }
}

export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const [loading, error] = useKakaoLoader({
    appkey: 'c7b0bd0edadfdfca171bba47039ba9a7',
    libraries: ['services'],
  })

  if (!lat || !lng) return null

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
          <MapMarker position={{ lat, lng }} />
          {window.kakao && window.kakao.maps && (
            <ZoomControl position={window.kakao.maps.ControlPosition.RIGHT} />
          )}
        </Map>
      )}
    </div>
  )
}
