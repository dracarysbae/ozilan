/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repo = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isProd ? repo : '',
  assetPrefix: isProd && repo ? `${repo}/` : undefined,
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
