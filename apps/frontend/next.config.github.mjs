/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages를 위한 Static Export 설정
  output: 'export',

  // 이미지 최적화 비활성화 (static export에서 필요)
  images: {
    unoptimized: true,
  },

  // Base path (저장소 이름이 포함된 경우)
  // basePath: '/add',  // 필요시 주석 해제

  // 환경 변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },

  // Trailing slash (GitHub Pages 호환성)
  trailingSlash: true,
};

export default nextConfig;
