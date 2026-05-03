import { TranslationKey } from './ko';

export const en: Record<TranslationKey, string> = {
  // Common
  'common.loading': 'Loading...',
  'common.skip': 'Skip',
  'common.next': 'Next',
  'common.close': 'Close',
  'common.search': 'Search',

  // Layout / Header
  'header.title': 'SKKU TAXI',
  'header.subtitle': 'Carpooling App',

  // SplashScreen
  'splash.title': 'SKKU TAXI',

  // Onboarding
  'onboarding.slide1.title': 'No more waiting for taxis! 🚕',
  'onboarding.slide1.desc': 'Share a ride with SKKU students and split the fare.',
  'onboarding.slide2.title': 'Safe Same-Gender Matching 🔒',
  'onboarding.slide2.desc': 'Verified students & gender filters for safe night rides.',
  'onboarding.slide3.title': 'Easy Split Payments 💸',
  'onboarding.slide3.desc': 'Settle the fare easily with an integrated bank link.',
  'onboarding.start': 'Start SKKU Taxi',

  // Main Page
  'main.hero.title': 'Where are you going? 🚕',
  'main.hero.subtitle': 'Ride together and save taxi fares',
  'main.search.placeholder': 'Search departure or destination...',
  'main.filter.all': 'All',
  'main.filter.hyehwa': 'Hyehwa',
  'main.filter.suwon': 'Suwon',
  'main.count': '{count} rides',
  'main.empty.title': 'No rides available yet',
  'main.empty.search_title': 'No results for "{query}"',
  'main.empty.desc': 'Be the first to create a ride!',
  'main.empty.search_desc': 'Try a different keyword or create a new ride!',
  'main.btn.create': '🚀 Create a Ride',
  'main.alert.login_required': 'Please login to use this feature.',
  'main.toggle.list': 'List',
  'main.toggle.map': 'Map',
  'main.btn.create_fab': 'Create',
  'main.map.loading': 'Loading map...',

  // Post Card
  'post.status.recruiting': 'Recruiting',
  'post.status.full': 'Full',
  'post.status.departed': 'Departed',
  'post.people': '{current}/{max}',
  'post.time.prefix': 'Departs',
  'post.btn.join': 'Join',
  'post.btn.chat': 'Chat',

  // Create Page
  'create.title': 'Create New Ride',
  'create.departure': 'Departure',
  'create.destination': 'Destination',
  'create.departure_time': 'Departure Time',
  'create.max_people': 'Max People',
  'create.gender_filter': 'Same gender only',
  'create.btn.submit': 'Create Ride',
  'create.note': 'Additional Note (Optional)',

  // Chat Page
  'chat.title': 'Chat Room',
  'chat.departure_time': 'Departure: {time}',
  'chat.account.title': '💳 Transfer to Host',
  'chat.account.copy': 'Copy',
  'chat.account.copied': 'Copied',
  'chat.account.open_toss': 'Open Toss',
  'chat.btn.kakaot': '🚕 Call KakaoT Taxi',
  'chat.welcome.title': '🎉 The ride has started!',
  'chat.welcome.desc': 'Say hi to your ride mates',
  'chat.note.prefix': '📌 Host Note: ',
  'chat.empty.title': 'No messages yet',
  'chat.empty.desc': 'Be the first to say hello!',
  'chat.input.placeholder': 'Type a message...',

  // Login Page
  'login.title': 'Verify SKKU Email',
  'login.desc': 'You can only sign up with an @skku.edu email.',
  'login.btn.google': 'Continue with Google',
};
