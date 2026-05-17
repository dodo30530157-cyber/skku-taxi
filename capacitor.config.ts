import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.skku.gachita',
  appName: '가치타',
  webDir: 'public',
  server: {
    url: 'https://gachita.vercel.app', // TODO: 실제 Vercel 배포 주소로 변경하세요
  }
};

export default config;
