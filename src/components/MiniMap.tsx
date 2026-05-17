'use client'

import { useRef, useEffect, useState } from 'react'
import { Map, MapMarker, ZoomControl, CustomOverlayMap, useKakaoLoader, Polyline } from 'react-kakao-maps-sdk'
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
  destLat?: number
  destLng?: number
  departureName?: string
  destinationName?: string
  /** true일 때만 내 프로필 사진 핀을 표시. 기본값 false (리스트·남의 방 용도) */
  showProfilePin?: boolean
}

export function MiniMap({ lat: rawLat, lng: rawLng, destLat: rawDestLat, destLng: rawDestLng, departureName, destinationName, showProfilePin = false }: MiniMapProps) {
  const lat = Number(rawLat)
  const lng = Number(rawLng)
  const destLat = rawDestLat ? Number(rawDestLat) : undefined
  const destLng = rawDestLng ? Number(rawDestLng) : undefined

  const profileImageUrl = useUserStore((state) => state.profileImageUrl)
  const [loading, error] = useKakaoLoader({
    appkey: 'c7b0bd0edadfdfca171bba47039ba9a7',
    libraries: ['services'],
  })

  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[]>(() => {
    if (destLat && destLng) {
      return [
        { lat, lng },
        { lat: destLat, lng: destLng }
      ]
    }
    return []
  })
  const [apiStatus, setApiStatus] = useState("대기중...")
  const [duration, setDuration] = useState<number | null>(null)
  
  const mapRef = useRef<any>(null)

  // 출발지와 도착지가 모두 있을 경우 자동 줌(Bounds) 조절 및 경로 탐색
  useEffect(() => {
    // 1. 변수명 매핑: MiniMap은 post 통객체가 아니라 lat, lng를 직접 props로 받습니다.
    if (!lat || !destLat) {
      setApiStatus("에러: 출발지/도착지 좌표 없음")
      return
    }

    // 2. mapRef 등 지도 로딩 상태와 무관하게(API는 비동기이므로) 즉각 호출 시작
    const fetchRoute = async () => {
      setApiStatus("카카오 API 로딩중...")
      try {
        const res = await fetch(`/api/directions?originLng=${lng}&originLat=${lat}&destLng=${destLng}&destLat=${destLat}`)
        if (!res.ok) {
          const errText = await res.text()
          setApiStatus(`HTTP 에러(${res.status}): ${errText.slice(0, 50)}`)
          return
        }
        
        const data = await res.json()
        
        if (data.kakaoErrorData || !data.routes || data.routes.length === 0) {
          setApiStatus(`API 거절: ${JSON.stringify(data.kakaoErrorData || data).slice(0, 50)}`)
          return
        }
        
        let newPath: {lat: number, lng: number}[] = []
        data.routes[0].sections[0].roads.forEach((road: any) => {
          for(let i = 0; i < road.vertexes.length; i += 2) {
            newPath.push({ lng: road.vertexes[i], lat: road.vertexes[i+1] })
          }
        })
        
        if (data.routes[0].summary && data.routes[0].summary.duration) {
          setDuration(data.routes[0].summary.duration)
        }
        
        setRoutePath(newPath)
        setApiStatus("성공! 경로 그림 완료")
      } catch (e: any) {
        setApiStatus(`코드 뻗음(Catch): ${e.message}`)
      }
    }

    // 조건 따지지 않고 무조건 API 찌르기 강제 실행
    fetchRoute()
  }, [lat, lng, destLat, destLng])

  // 지도가 로딩되고 나서 Bounds 맞추기 (API 통신과 분리)
  useEffect(() => {
    if (!loading && window.kakao && window.kakao.maps && mapRef.current && destLat && destLng) {
      const bounds = new window.kakao.maps.LatLngBounds()
      bounds.extend(new window.kakao.maps.LatLng(lat, lng))
      bounds.extend(new window.kakao.maps.LatLng(destLat, destLng))
      
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.setBounds(bounds, 30, 30, 30, 30)
        }
      }, 100)
    }
  }, [loading, lat, lng, destLat, destLng, routePath])

  if (!lat || !lng) return null

  // showProfilePin AND 실제 이미지가 있을 때만 커스텀 핀 사용
  const useCustomPin = showProfilePin && !!profileImageUrl

  const formatDuration = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60)
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return `약 ${h}시간 ${m}분`
    }
    return `약 ${minutes}분`
  }

  return (
    <div className="w-full bg-[#e5e5e5] rounded-xl overflow-hidden border border-gray-100 my-3 relative shadow-inner h-[200px]">
      {duration !== null && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap">
          🚕 예상 소요 시간: {formatDuration(duration)}
        </div>
      )}
      {loading ? (
        <div className="w-full h-full flex items-center justify-center text-sm font-medium text-gray-500">
          지도 로딩 중...
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center text-sm font-medium text-red-500">
          지도 로드 실패
        </div>
      ) : (
        <Map
          center={{ lat, lng }}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
          level={4}
          ref={mapRef}
        >
          {useCustomPin ? (
            <CustomOverlayMap position={{ lat, lng }} yAnchor={1.3}>
              <div className="flex flex-col items-center" style={{ transform: 'translateX(-50%)' }}>
                <div className="bg-[#2563EB] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md mb-1 whitespace-nowrap">
                  출발
                </div>
                <div className="w-0.5 h-2 bg-[#2563EB]/60" />
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
            <CustomOverlayMap position={{ lat, lng }} zIndex={5}>
              <div className="absolute -translate-x-1/2 -translate-y-full pb-1">
                <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg shadow-md max-w-[150px] truncate whitespace-nowrap flex items-center gap-1">
                  <span>🚕</span>
                  <span className="text-gray-400 font-normal">출발지:</span>
                  <span className="font-bold truncate">{departureName || "미상"}</span>
                </div>
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-800 absolute -bottom-1 left-1/2 -translate-x-1/2" />
              </div>
            </CustomOverlayMap>
          )}

          {/* 도착지가 있을 경우 Polyline 및 도착지 마커 렌더링 */}
          {destLat && destLng && (
            <>
              <Polyline
                path={routePath}
                strokeWeight={4}
                strokeColor="#2563EB"
                strokeOpacity={1}
                strokeStyle="solid"
              />
              <MapMarker position={{ lat: Number(destLat), lng: Number(destLng) }} />
              <CustomOverlayMap position={{ lat: Number(destLat), lng: Number(destLng) }} zIndex={4}>
                <div className="absolute -translate-x-1/2 -translate-y-full pb-1">
                  <div className="bg-[#2563EB] text-white text-[10px] px-2 py-1 rounded-lg shadow-md max-w-[150px] truncate whitespace-nowrap flex items-center gap-1">
                    <span>🚩</span>
                    <span className="text-blue-200 font-normal">도착지:</span>
                    <span className="font-bold truncate">{destinationName || "미상"}</span>
                  </div>
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#2563EB] absolute -bottom-1 left-1/2 -translate-x-1/2" />
                </div>
              </CustomOverlayMap>
            </>
          )}
          {window.kakao && window.kakao.maps && (
            <ZoomControl position={window.kakao.maps.ControlPosition.RIGHT} />
          )}
        </Map>
      )}
    </div>
  )
}
