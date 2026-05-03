export const ko = {
  // Common
  'common.loading': '로딩 중...',
  'common.skip': '건너뛰기',
  'common.next': '다음',
  'common.close': '닫기',
  'common.search': '검색',

  // Layout / Header
  'header.title': 'SKKU TAXI',
  'header.subtitle': '성대 택시 합승',

  // SplashScreen
  'splash.title': '스꾸택시',

  // Onboarding
  'onboarding.slide1.title': '혜화역 택시 대기, 이제 끝! 🚕',
  'onboarding.slide1.desc': '성대생들과 합승하면 기다림도 택시비도 절반으로.',
  'onboarding.slide2.title': '안심하고 타는 동성 매칭 🔒',
  'onboarding.slide2.desc': '학우 인증과 동성 필터로 야간에도 안전하게.',
  'onboarding.slide3.title': '내릴 땐 깔끔하게 1/N 정산 💸',
  'onboarding.slide3.desc': '도착 후 어색함 없이 송금 링크로 한 번에 해결.',
  'onboarding.start': '스꾸택시 시작하기',

  // Main Page
  'main.hero.title': '어디로 가시나요? 🚕',
  'main.hero.subtitle': '학우들과 함께 타고 택시비를 절약해요',
  'main.search.placeholder': '출발지 또는 목적지 검색...',
  'main.filter.all': '전체',
  'main.filter.hyehwa': '인사캠',
  'main.filter.suwon': '자과캠',
  'main.count': '{count}개',
  'main.empty.title': '아직 등록된 합승이 없어요',
  'main.empty.search_title': '"{query}" 검색 결과가 없어요',
  'main.empty.desc': '첫 번째 방장이 되어보세요!',
  'main.empty.search_desc': '다른 키워드로 검색해 보거나 새 합승을 만들어보세요!',
  'main.btn.create': '🚀 합승 만들기',
  'main.alert.login_required': '로그인 후 이용할 수 있습니다.',
  'main.toggle.list': '리스트',
  'main.toggle.map': '지도',
  'main.btn.create_fab': '만들기',
  'main.map.loading': '지도 로딩 중...',

  // Post Card
  'post.status.recruiting': '모집중',
  'post.status.full': '모집완료',
  'post.status.departed': '출발함',
  'post.people': '{current}/{max}명',
  'post.time.prefix': '출발',
  'post.btn.join': '합류하기',
  'post.btn.chat': '채팅방',

  // Create Page
  'create.title': '새 합승 만들기',
  'create.departure': '출발지',
  'create.destination': '도착지',
  'create.departure_time': '출발 시간',
  'create.max_people': '최대 인원',
  'create.gender_filter': '동성만 탑승',
  'create.btn.submit': '작성 완료',
  'create.note': '추가 요청사항 (선택)',

  // Chat Page
  'chat.title': '채팅방',
  'chat.departure_time': '출발 시간: {time}',
  'chat.account.title': '💳 방장에게 송금하기',
  'chat.account.copy': '복사',
  'chat.account.copied': '복사됨',
  'chat.account.open_toss': '토스열기',
  'chat.btn.kakaot': '🚕 카카오T로 택시 부르기',
  'chat.welcome.title': '🎉 합승이 시작되었습니다!',
  'chat.welcome.desc': '팀원들과 인사를 나눠보세요',
  'chat.note.prefix': '📌 방장 요청사항: ',
  'chat.empty.title': '아직 메시지가 없습니다',
  'chat.empty.desc': '첫 번째로 인사를 건네보세요!',
  'chat.input.placeholder': '메시지를 입력하세요...',

  // Login Page
  'login.title': '성대생 인증하고 시작하기',
  'login.desc': '@skku.edu 메일로만 가입할 수 있어요',
  'login.btn.google': 'Google로 계속하기',
} as const;

export type TranslationKey = keyof typeof ko;
