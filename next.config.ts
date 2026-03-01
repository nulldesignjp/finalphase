import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // これでビルド時に純粋なHTML/JS/CSSが出力されます
  // distDir: 'dist',    // 👈 ここを 'docs' や 'dist' に書き換える
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true, // 静的出力では画像の最適化機能が使えないため、これをtrueにします
  },
  // Sassの設定を明示的に記述（必要に応じて）
  sassOptions: {
    includePaths: ['./styles'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });
    return config;
  },
};

export default nextConfig;
