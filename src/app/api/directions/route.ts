import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const originLng = searchParams.get('originLng')
    const originLat = searchParams.get('originLat')
    const destLng = searchParams.get('destLng')
    const destLat = searchParams.get('destLat')

    if (!originLng || !originLat || !destLng || !destLat) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
    }

    // 카카오 REST API는 반드시 경도(x), 위도(y) 순서로 넘겨야 함
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${originLng},${originLat}&destination=${destLng},${destLat}`
    
    // 카카오 REST API 키
    const apiKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_APP_KEY

    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`, // 띄어쓰기 필수
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kakao Directions API Error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch directions' }, { status: response.status })
    }

    const data = await response.json()
    console.log("카카오 API 상세 응답:", data)
    
    // API가 에러 코드(200 OK임에도 routes가 없는 등)를 조용히 뱉었을 경우 차단
    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({
        routePath: [
          { lat: Number(originLat), lng: Number(originLng) },
          { lat: Number(destLat), lng: Number(destLng) }
        ],
        kakaoErrorData: data // 프론트엔드 alert 디버깅용으로 원본 데이터 전달
      })
    }

    // 좌표 파싱
    const routePath: { lat: number; lng: number }[] = []
    
    const sections = data.routes[0].sections
    if (sections && sections.length > 0) {
      const roads = sections[0].roads
      roads?.forEach((road: any) => {
          const vertexes = road.vertexes
          if (vertexes && Array.isArray(vertexes)) {
            // vertexes 배열은 [x, y, x, y, ...] 형태 (x = lng, y = lat)
            for (let i = 0; i < vertexes.length; i += 2) {
              routePath.push({
                lng: vertexes[i],     // x (경도)
                lat: vertexes[i + 1]  // y (위도)
              })
            }
          }
        })
    }

    console.log("변환된 경로 좌표 수:", routePath.length)

    // 파싱 결과가 비어있다면 서버 측에서도 직선 폴백 응답
    if (routePath.length === 0) {
      return NextResponse.json({
        routePath: [
          { lat: Number(originLat), lng: Number(originLng) },
          { lat: Number(destLat), lng: Number(destLng) }
        ]
      })
    }

    return NextResponse.json({ routePath, routes: data.routes }) // 유저 요청대로 data.routes 포함
  } catch (error) {
    console.error('Error in directions API route:', error)
    
    // API 호출 실패 시에도 직선 경로로 폴백하여 프론트엔드가 터지지 않게 보호
    const fallbackPath = []
    try {
      const { searchParams } = new URL(request.url)
      const oLng = Number(searchParams.get('originLng'))
      const oLat = Number(searchParams.get('originLat'))
      const dLng = Number(searchParams.get('destLng'))
      const dLat = Number(searchParams.get('destLat'))
      if (!isNaN(oLat) && !isNaN(dLat)) {
        fallbackPath.push({ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng })
      }
    } catch(e) {}

    return NextResponse.json({ error: 'Internal Server Error', routePath: fallbackPath }, { status: 500 })
  }
}
