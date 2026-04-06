'use client';

import { useState, useEffect } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { Button } from '@/components/ui/button';
import { X, MapPin } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  title?: string;
}

export function MapModal({ isOpen, onClose, onSelect, title = '지도에서 위치 선택' }: MapModalProps) {
  const [loading, error] = useKakaoLoader({
    appkey: 'c7b0bd0edadfdfca171bba47039ba9a7',
    libraries: ['services'],
  });

  // 지도 중심 좌표 (GPS 위치 반영)
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5882, lng: 126.9936 });
  // 마커의 현재 위치를 관리할 position state(초기값은 center와 동일)
  const [position, setPosition] = useState<{ lat: number; lng: number }>({ lat: 37.5882, lng: 126.9936 });
  // 변환된 주소 텍스트를 담을 address state(초기값은 빈 문자열)
  const [address, setAddress] = useState<string>('');
  // 키워드 검색어 state
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 모달이 열릴 때 GPS 현재 위치로 지도 중심 이동
  useEffect(() => {
    if (!isOpen) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(coord);
        setPosition(coord); // 마커도 현재 위치로 초기화
      },
      () => {
        // 권한 거부 또는 에러 시 기본값(명륜캠퍼스) 유지
      }
    );
  }, [isOpen]);

  // position이 변경될 때마다 Reverse Geocoding 실행
  useEffect(() => {
    if (!window.kakao?.maps?.services) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(position.lng, position.lat, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const addr = result[0].road_address
          ? result[0].road_address.address_name
          : result[0].address.address_name;
        setAddress(addr);
      }
    });
  }, [position]);

  // 지도 클릭 시 마커 위치(position) 업데이트 → useEffect가 지오코딩 자동 실행
  const handleMapClick = (_target: any, mouseEvent: any) => {
    const lat = mouseEvent.latLng.getLat();
    const lng = mouseEvent.latLng.getLng();
    setPosition({ lat, lng });
  };

  // 키워드로 장소 검색 → 지도 중심 + 마커 이동
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim() || !window.kakao?.maps?.services) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const first = result[0];
        const newCoord = { lat: parseFloat(first.y), lng: parseFloat(first.x) };
        setCenter(newCoord);   // 지도 중심 이동
        setPosition(newCoord); // 마커 이동 → useEffect([position])이 자동으로 주소 갱신
      } else {
        alert('검색 결과가 없습니다. 다른 키워드를 입력해 보세요.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#006341]" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 키워드 검색 UI */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-white shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="장소, 도로명, 지역 검색..."
              className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#006341] focus:ring-1 focus:ring-[#006341] transition-colors"
            />
            <button
              type="submit"
              className="h-9 px-4 text-sm font-semibold rounded-lg bg-[#006341] text-white hover:bg-[#006341]/90 transition-colors shrink-0"
            >
              검색
            </button>
          </form>
        </div>

        {/* 지도 영역 */}
        <div className="relative">
          {loading && (
            <div className="w-full h-[400px] flex items-center justify-center bg-gray-100">
              지도를 불러오는 중입니다...
            </div>
          )}
          {error && (
            <div className="w-full h-[400px] flex items-center justify-center bg-red-50 text-red-500">
              지도 로드 에러가 발생했습니다.
            </div>
          )}
          {!loading && !error && (
            <>
              <Map
                center={center}
                style={{ width: '100%', height: '400px' }}
                level={3}
                onClick={handleMapClick}
              >
                {/* 마커는 클릭한 position에 독립적으로 표시 */}
                <MapMarker position={position} />
              </Map>
              {!address && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-100 z-10 text-sm font-bold text-[#006341] pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
                  지도를 클릭해서 위치를 선택하세요
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 선택 주소 + 버튼 */}
        <div className="p-4 shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-0.5 bg-[#006341]/10 p-2 rounded-full shrink-0">
              <MapPin className="w-4 h-4 text-[#006341]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-0.5">선택된 주소</p>
              <p className="text-[15px] font-bold text-gray-900 line-clamp-2 leading-snug">
                {address || '지도를 클릭하여 위치를 선택하세요'}
              </p>
            </div>
          </div>

          <Button
            className="w-full h-12 bg-[#006341] hover:bg-[#006341]/90 text-white font-semibold text-base transition-all rounded-xl"
            onClick={() => {
              if (address) {
                onSelect(address, position.lat, position.lng);
                onClose();
              }
            }}
            disabled={!address}
          >
            선택 완료
          </Button>
        </div>

      </div>
    </div>
  );
}
