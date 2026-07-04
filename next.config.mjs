/** @type {import('next').NextConfig} */
// 分离 dev 与生产构建目录，避免缓存冲突：
// - 生产构建 (next build)         → ./dist       （供 Lovable dist-check 使用）
// - 开发服务器 (next dev)         → ./.next      （Next.js 默认，不污染 dist）
// 通过 NEXT_DIST_DIR 可显式覆盖。
const isDev = process.env.NODE_ENV === 'development'
const distDir = process.env.NEXT_DIST_DIR ?? (isDev ? '.next' : 'dist')

const nextConfig = {
  distDir,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
    '*.lovableproject.com',
    '*.lovable.app',
    '*.lovable.dev',
  ],
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
